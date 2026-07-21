/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { checkAppointmentQuota } from "@/lib/subscription/quota";
import { widgetCorsResponse, withWidgetCors } from "@/lib/cors";
import { checkWidgetBookRateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
  return widgetCorsResponse();
}

const bookingSchema = z.object({
  clinicSlug: z.string(),
  serviceId: z.string().uuid(),
  startAt: z.string(),
  endAt: z.string(),
  patientName: z.string().min(1).max(200),
  patientPhone: z.string().min(1).max(30),
  patientEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!(await checkWidgetBookRateLimit(ip))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { clinicSlug, serviceId, startAt, endAt, patientName, patientPhone, patientEmail } = parsed.data;

  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics")
    .select("id, name, owner_id")
    .eq("slug", clinicSlug)
    .maybeSingle() as { data: { id: string; name: string; owner_id: string } | null };

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const { data: service } = await db
    .from("services")
    .select("id, name, duration_minutes")
    .eq("id", serviceId)
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .maybeSingle() as { data: { id: string; name: string; duration_minutes: number } | null };

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const quota = await checkAppointmentQuota(clinic.id, db);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason ?? "Quota de rendez-vous atteint." }, { status: 429 });
  }

  const { data: result, error } = await db.rpc("create_booking_from_widget", {
    p_clinic_id: clinic.id,
    p_patient_name: patientName,
    p_patient_phone: patientPhone,
    p_patient_email: patientEmail || null,
    p_service_id: service.id,
    p_start_at: startAt,
    p_end_at: endAt,
    p_notes: null,
  });

  if (error) {
    // H3 fix: never expose raw DB error messages to clients
    console.error("[book] rpc error:", error);
    return NextResponse.json({ error: "Erreur lors de la réservation. Veuillez réessayer." }, { status: 400 });
  }

  const resultData = result as { appointment_id: string; patient_id: string };

  const [{ data: ownerUser }, { data: appointmentData }] = await Promise.all([
    db.from("users").select("email").eq("id", clinic.owner_id).maybeSingle() as Promise<{ data: { email: string } | null }>,
    db.from("appointments").select("cancel_token").eq("id", resultData.appointment_id).maybeSingle() as Promise<{ data: { cancel_token: string } | null }>,
  ]);

  await sendNotification({
    type: "appointment_confirmation",
    appointmentId: resultData.appointment_id,
    cancelToken: appointmentData?.cancel_token,
    patientName,
    patientPhone,
    patientEmail: patientEmail || undefined,
    clinicName: clinic.name,
    serviceName: service.name,
    startAt,
    doctorEmail: ownerUser?.email || undefined,
  });

  dispatchWebhookEvent(clinic.id, "appointment.created", {
    id: resultData.appointment_id,
    start_at: startAt,
    end_at: endAt,
    status: "booked",
    patient_name: patientName,
    patient_phone: patientPhone,
    service_name: service.name,
  }).catch(() => {});

  return withWidgetCors(NextResponse.json({
    success: true,
    appointmentId: resultData.appointment_id,
    patientId: resultData.patient_id,
  }));
}
