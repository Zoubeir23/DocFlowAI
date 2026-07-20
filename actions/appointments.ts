"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { appointmentSchema } from "@/lib/validations";
import { sendNotification } from "@/lib/notifications";
import { checkAppointmentQuota } from "@/lib/subscription/quota";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import type { ApiResponse, AppointmentWithRelations, PaginatedResult } from "@/types";
import type { z } from "zod";

type AppointmentInput = z.infer<typeof appointmentSchema>;

const OVERLAP_CONSTRAINT_MESSAGE = "Ce créneau chevauche un autre rendez-vous actif de la clinique.";

function isOverlapConstraintViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23P01" || (error.message ?? "").includes("appointments_no_overlap");
}

async function getDB() {
  return (await createClient()) as any;
}

export async function getAppointments(
  page = 1,
  pageSize = 20,
  status = "all"
): Promise<PaginatedResult<AppointmentWithRelations>> {
  const db = await getDB();

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { data: [], total: 0, page, pageSize, totalPages: 0 };

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData?.clinic_id) return { data: [], total: 0, page, pageSize, totalPages: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("appointments")
    .select("*, patient:patients(*), service:services(*), practitioner:users(id,full_name,email)", { count: "exact" })
    .eq("clinic_id", userData.clinic_id)
    .order("start_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);

  const { data, count } = await query.range(from, to);

  return {
    data: (data || []) as AppointmentWithRelations[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function createAppointment(
  data: AppointmentInput
): Promise<ApiResponse<{ id: string }>> {
  const db = await getDB();

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Not authenticated" };

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData) return { success: false, error: "User not found" };

  const quota = await checkAppointmentQuota(userData.clinic_id, db);
  if (!quota.allowed) {
    return { success: false, error: quota.reason ?? "Quota de rendez-vous atteint." };
  }

  const validated = appointmentSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  if (validated.data.practitioner_id) {
    const { data: practitionerCheck } = await db
      .from("users")
      .select("id")
      .eq("id", validated.data.practitioner_id)
      .eq("clinic_id", userData.clinic_id)
      .maybeSingle();
    if (!practitionerCheck) {
      return { success: false, error: "Praticien invalide ou n'appartient pas à cette clinique." };
    }
  }

  const { data: appt, error } = await db
    .from("appointments")
    .insert({ ...validated.data, clinic_id: userData.clinic_id })
    .select()
    .maybeSingle();

  if (error) {
    if (isOverlapConstraintViolation(error)) {
      return { success: false, error: OVERLAP_CONSTRAINT_MESSAGE };
    }
    return { success: false, error: error.message };
  }

  const { data: fullAppt } = await db
    .from("appointments")
    .select("*, patient:patients(*), service:services(*)")
    .eq("id", appt.id)
    .maybeSingle();

  if (fullAppt) {
    const apptData = fullAppt as AppointmentWithRelations;
    const { data: clinic } = await db
      .from("clinics")
      .select("name")
      .eq("id", userData.clinic_id)
      .maybeSingle();

    await sendNotification({
      type: "appointment_confirmation",
      appointmentId: appt.id,
      patientName: apptData.patient.full_name,
      patientPhone: apptData.patient.phone,
      patientEmail: apptData.patient.email || undefined,
      clinicName: clinic?.name || "Clinic",
      serviceName: apptData.service.name,
      startAt: appt.start_at,
    });

    dispatchWebhookEvent(userData.clinic_id, "appointment.created", {
      id: appt.id,
      start_at: appt.start_at,
      end_at: appt.end_at,
      status: appt.status,
      patient_name: apptData.patient.full_name,
      patient_phone: apptData.patient.phone,
      service_name: apptData.service.name,
    }).catch(() => {});
  }

  return { success: true, data: { id: appt.id } };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show"
): Promise<ApiResponse> {
  const db = await getDB();
  // M1 fix: resolve clinic_id from session before updating
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Not authenticated" };
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).maybeSingle();
  if (!userData) return { success: false, error: "User not found" };

  const { error } = await db
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id);
  if (error) return { success: false, error: "Erreur lors de la mise à jour." };

  const webhookEvent = status === "cancelled"
    ? "appointment.cancelled"
    : status === "completed"
      ? "appointment.completed"
      : "appointment.updated";

  dispatchWebhookEvent(userData.clinic_id, webhookEvent, {
    id: appointmentId,
    status,
  }).catch(() => {});

  return { success: true };
}

export async function updateAppointmentTime(
  appointmentId: string,
  startAt: string,
  endAt: string
): Promise<ApiResponse> {
  const db = await getDB();
  // M1 fix: resolve clinic_id from session before updating
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Not authenticated" };
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).maybeSingle();
  if (!userData) return { success: false, error: "User not found" };

  const { error } = await db
    .from("appointments")
    .update({ start_at: startAt, end_at: endAt })
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id);
  if (error) {
    if (isOverlapConstraintViolation(error)) {
      return { success: false, error: OVERLAP_CONSTRAINT_MESSAGE };
    }
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
  return { success: true };
}

export async function cancelAppointment(appointmentId: string): Promise<ApiResponse> {
  const db = await getDB();

  // M2 fix: auth check before fetching data
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Not authenticated" };
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).maybeSingle();
  if (!userData) return { success: false, error: "User not found" };

  const { data: appt } = await db
    .from("appointments")
    .select("*, patient:patients(*), service:services(*), clinic:clinics(*)")
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id)
    .maybeSingle();

  const { error } = await db
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id);

  if (error) return { success: false, error: error.message };

  if (appt) {
    const apptData = appt as AppointmentWithRelations & { clinic: { name: string } };
    await sendNotification({
      type: "appointment_cancellation",
      appointmentId,
      patientName: apptData.patient.full_name,
      patientPhone: apptData.patient.phone,
      patientEmail: apptData.patient.email || undefined,
      clinicName: apptData.clinic.name,
      serviceName: apptData.service.name,
      startAt: apptData.start_at,
    });

    dispatchWebhookEvent(userData.clinic_id, "appointment.cancelled", {
      id: appointmentId,
      status: "cancelled",
      patient_name: apptData.patient.full_name,
      service_name: apptData.service.name,
      start_at: apptData.start_at,
    }).catch(() => {});
  }

  return { success: true };
}

export async function cancelAppointmentByToken(token: string): Promise<ApiResponse> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const db = (await createAdminClient()) as any;

  const { data: appt, error: fetchError } = await db
    .from("appointments")
    .select("id, status, start_at, clinic_id, patient:patients(full_name, phone, email), service:services(name), clinic:clinics(name)")
    .eq("cancel_token", token)
    .maybeSingle();

  if (fetchError || !appt) return { success: false, error: "Rendez-vous introuvable." };
  if (appt.status === "cancelled") return { success: false, error: "Déjà annulé." };
  if (new Date(appt.start_at) < new Date()) return { success: false, error: "Rendez-vous passé." };

  const { error } = await db
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("cancel_token", token);

  if (error) return { success: false, error: "Erreur lors de l'annulation." };

  dispatchWebhookEvent(appt.clinic_id, "appointment.cancelled", {
    id: appt.id,
    status: "cancelled",
    patient_name: appt.patient?.full_name,
    service_name: appt.service?.name,
    start_at: appt.start_at,
  }).catch(() => {});

  return { success: true };
}

export async function updateAppointmentMedicalNotes(
  appointmentId: string,
  medicalNotes: string
): Promise<ApiResponse> {
  const db = await getDB();

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Not authenticated" };

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData) return { success: false, error: "User not found" };

  const { error } = await db
    .from("appointments")
    .update({ medical_notes: medicalNotes })
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id);

  if (error) return { success: false, error: "Erreur lors de la mise à jour des notes médicales." };

  return { success: true };
}

export async function getDashboardStats(clinicId: string) {
  const db = await getDB();
  // M3 fix: verify the caller owns this clinicId
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) throw new Error("Not authenticated");
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).maybeSingle();
  if (!userData || userData.clinic_id !== clinicId) throw new Error("Unauthorized");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split("T")[0];

  const [todayAppts, upcomingAppts, pendingCancellations, totalPatients, completedAppts, noShowAppts] =
    await Promise.all([
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId)
        .gte("start_at", `${todayStr}T00:00:00`).lt("start_at", `${tomorrowStr}T00:00:00`).neq("status", "cancelled"),
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId)
        .gte("start_at", new Date().toISOString()).in("status", ["booked", "confirmed"]),
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId).eq("status", "cancelled"),
      db.from("patients").select("id", { count: "exact" }).eq("clinic_id", clinicId),
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId).eq("status", "completed"),
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId).eq("status", "no_show"),
    ]);

  const totalFinished = (completedAppts.count || 0) + (noShowAppts.count || 0);

  return {
    todayAppointments: todayAppts.count || 0,
    upcomingAppointments: upcomingAppts.count || 0,
    pendingCancellations: pendingCancellations.count || 0,
    totalPatients: totalPatients.count || 0,
    completionRate: totalFinished > 0 ? Math.round(((completedAppts.count || 0) / totalFinished) * 100) : 0,
    noShowRate: totalFinished > 0 ? Math.round(((noShowAppts.count || 0) / totalFinished) * 100) : 0,
  };
}
