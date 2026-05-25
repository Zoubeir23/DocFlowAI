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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const db = supabase as any;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, full_name, email")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string; full_name: string; email: string } | null };

  if (!userData) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const { data: appointments, error } = await db
    .from("appointments")
    .select("id, start_at, end_at, notes, patients(full_name, email), services(name), clinics(name)")
    .eq("clinic_id", userData.clinic_id)
    .not("status", "in", '("cancelled","no_show")')
    .order("start_at", { ascending: true }) as { data: AppointmentRow[] | null; error: { message: string } | null };

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const clinicName = appointments?.[0]?.clinics?.name ?? "DocFlow";
  const safeClinicSlug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const events = (appointments ?? []).map((appt) => ({
    uid: `appt-${appt.id}@docflow.ai`,
    summary: `${appt.services?.name ?? "Consultation"} — ${appt.patients?.full_name ?? "Patient"}`,
    description: appt.notes ?? undefined,
    startAt: new Date(appt.start_at),
    endAt: new Date(appt.end_at),
    organizerName: userData.full_name,
    organizerEmail: userData.email,
    attendeeEmail: appt.patients?.email ?? undefined,
    attendeeName: appt.patients?.full_name ?? undefined,
  }));

  const ical = buildICalCalendar(`${clinicName} — Agenda`, events);

  return new NextResponse(ical, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="agenda-${safeClinicSlug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
