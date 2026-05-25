import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";

interface AppointmentWithRelations {
  id: string;
  start_at: string;
  patients: { full_name: string; email: string | null; phone: string } | null;
  services: { name: string } | null;
  clinics: { name: string } | null;
}

const REMINDER_WINDOW_START_HOURS = 23;
const REMINDER_WINDOW_END_HOURS = 25;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const windowStart = new Date(
    Date.now() + REMINDER_WINDOW_START_HOURS * 60 * 60 * 1000
  ).toISOString();
  const windowEnd = new Date(
    Date.now() + REMINDER_WINDOW_END_HOURS * 60 * 60 * 1000
  ).toISOString();

  const supabaseAny = supabase as any;
  const { data: appointments, error } = await supabaseAny
    .from("appointments")
    .select(`
      id,
      start_at,
      patients ( full_name, email, phone ),
      services ( name ),
      clinics ( name )
    `)
    .gte("start_at", windowStart)
    .lte("start_at", windowEnd)
    .in("status", ["booked", "confirmed"])
    .is("reminder_sent_at", null) as { data: AppointmentWithRelations[] | null; error: { message: string } | null };

  if (error) {
    console.error("[Cron] Failed to fetch appointments:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({ sent: 0, message: "No reminders to send" });
  }

  let sentCount = 0;
  const failures: string[] = [];

  for (const appointment of appointments) {
    const patient = appointment.patients;
    const service = appointment.services;
    const clinic = appointment.clinics;

    if (!patient?.email || !service || !clinic) {
      continue;
    }

    try {
      const results = await sendNotification({
        type: "appointment_reminder",
        appointmentId: appointment.id,
        patientName: patient.full_name,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        clinicName: clinic.name,
        serviceName: service.name,
        startAt: appointment.start_at,
      });

      const allSucceeded = results.every((r) => r.success);

      if (allSucceeded) {
        await supabaseAny
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", appointment.id);

        sentCount++;
      } else {
        const errorMessages = results.filter((r) => !r.success).map((r) => r.error ?? "unknown");
        failures.push(`${appointment.id}: ${errorMessages.join(", ")}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      failures.push(`${appointment.id}: ${message}`);
    }
  }

  console.log(`[Cron] Reminders sent: ${sentCount}, failures: ${failures.length}`);

  return NextResponse.json({
    sent: sentCount,
    failures: failures.length > 0 ? failures : undefined,
  });
}
