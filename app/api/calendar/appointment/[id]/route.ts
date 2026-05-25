import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildICalCalendar } from "@/lib/ical";

export const dynamic = "force-dynamic";

interface AppointmentRow {
  id: string;
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
  const { data: { user } } = await supabase.auth.getUser();

  const db = supabase as any;

  // Autorisé : staff de la clinique OU patient propriétaire du RDV
  const { data: appt, error } = await db
    .from("appointments")
    .select("id, start_at, end_at, notes, patients(full_name, email), services(name), clinics(name)")
    .eq("id", id)
    .single() as { data: AppointmentRow | null; error: { message: string } | null };

  if (error || !appt) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }

  // Vérification d'accès : staff ou patient lié
  if (user) {
    const { data: staffCheck } = await db
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single() as { data: { id: string } | null };

    if (!staffCheck) {
      const { data: patientCheck } = await db
        .from("patients")
        .select("id")
        .eq("auth_user_id", user.id)
        .eq("id", appt.patients ? (appt as any).patient_id : null)
        .single() as { data: { id: string } | null };

      if (!patientCheck) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }
  } else {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const clinicName = appt.clinics?.name ?? "DocFlow";
  const serviceName = appt.services?.name ?? "Consultation";
  const patientName = appt.patients?.full_name ?? "Patient";

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

  const slug = serviceName.toLowerCase().replace(/\s+/g, "-");

  return new NextResponse(ical, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rdv-${slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
