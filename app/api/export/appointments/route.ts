import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatDateFr(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTimeFr(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABELS: Record<string, string> = {
  booked: "Réservé",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
};

export async function GET() {
  const supabase = (await createClient()) as any;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .single();

  if (!userData?.clinic_id) {
    return NextResponse.json({ error: "Clinique introuvable" }, { status: 403 });
  }

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("start_at, end_at, status, notes, patient:patients(full_name, phone, email), service:services(name)")
    .eq("clinic_id", userData.clinic_id)
    .order("start_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 });
  }

  const header = "Date,Heure,Patient,Téléphone,Email,Service,Statut,Notes";

  const rows = (appointments ?? []).map((appt: any) => {
    const fields = [
      formatDateFr(appt.start_at),
      formatTimeFr(appt.start_at),
      appt.patient?.full_name ?? "",
      appt.patient?.phone ?? "",
      appt.patient?.email ?? "",
      appt.service?.name ?? "",
      STATUS_LABELS[appt.status] ?? appt.status,
      appt.notes ?? "",
    ];
    return fields.map(escapeCsvField).join(",");
  });

  const csvContent = [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rendez-vous-${dateStr}.csv"`,
    },
  });
}
