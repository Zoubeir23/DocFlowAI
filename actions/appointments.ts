"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { appointmentSchema } from "@/lib/validations";
import { sendNotification } from "@/lib/notifications";
import type { ApiResponse, AppointmentWithRelations } from "@/types";
import type { z } from "zod";

type AppointmentInput = z.infer<typeof appointmentSchema>;

async function getDB() {
  return (await createClient()) as any;
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
    .single();

  if (!userData) return { success: false, error: "User not found" };

  const validated = appointmentSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { data: appt, error } = await db
    .from("appointments")
    .insert({ ...validated.data, clinic_id: userData.clinic_id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const { data: fullAppt } = await db
    .from("appointments")
    .select("*, patient:patients(*), service:services(*)")
    .eq("id", appt.id)
    .single();

  if (fullAppt) {
    const apptData = fullAppt as AppointmentWithRelations;
    const { data: clinic } = await db
      .from("clinics")
      .select("name")
      .eq("id", userData.clinic_id)
      .single();

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
  }

  return { success: true, data: { id: appt.id } };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show"
): Promise<ApiResponse> {
  const db = await getDB();
  const { error } = await db.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateAppointmentTime(
  appointmentId: string,
  startAt: string,
  endAt: string
): Promise<ApiResponse> {
  const db = await getDB();
  const { error } = await db
    .from("appointments")
    .update({ start_at: startAt, end_at: endAt })
    .eq("id", appointmentId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function cancelAppointment(appointmentId: string): Promise<ApiResponse> {
  const db = await getDB();

  const { data: appt } = await db
    .from("appointments")
    .select("*, patient:patients(*), service:services(*), clinic:clinics(*)")
    .eq("id", appointmentId)
    .single();

  const { error } = await db
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

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
  }

  return { success: true };
}

export async function getDashboardStats(clinicId: string) {
  const db = await getDB();
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
