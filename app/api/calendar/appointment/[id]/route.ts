import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildICalCalendar } from "@/lib/ical";

export const dynamic = "force-dynamic";

interface AppointmentRow {
  id: string;
  patient_id: string;
  clinic_id: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  patients: { full_name: string; email: string | null } | null;
  services: { name: string } | null;
  clinics: { name: string } | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check before any DB fetch
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const db = supabase as any;

  const { data: appt, error } = await db
    .from("appointments")
    .select("id, patient_id, clinic_id, start_at, end_at, notes, patients(full_name, email), services(name), clinics(name)")
    .eq("id", id)
    .single() as { data: AppointmentRow | null; error: { message: string } | null };

  if (error || !appt) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }

  // Autorisé : staff de la clinique OU patient propriétaire du RDV
  const { data: staffCheck } = await db
    .from("users")
    .select("id")
    .eq("id", user.id)
    .eq("clinic_id", appt.clinic_id)
    .single() as { data: { id: string } | null };

  if (!staffCheck) {
    const { data: patientCheck } = await db
      .from("patients")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("id", appt.patient_id)
      .single() as { data: { id: string } | null };

    if (!patientCheck) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  const clinicName = appt.clinics?.name ?? "DocFlow";
  const serviceName = appt.services?.name ?? "Consultation";
  const patientName = appt.patients?.full_name ?? "Patient";
  const safeSlug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const ical = buildICalCalendar(clinicName, [
    {
      uid: `appt-${appt.id}@docflow.ai`,
      summary: `${serviceName} — ${clinicName}`,
      description: appt.notes ?? undefined,
      location: clinicName,
      startAt: new Date(appt.start_at),
      endAt: new Date(appt.end_at),
      attendeeName: patientName,
      attendeeEmail: appt.patients?.email ?? undefined,
    },
  ]);

  return new NextResponse(ical, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rdv-${safeSlug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
