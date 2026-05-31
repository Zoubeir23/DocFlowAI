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

function formatDateFr(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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
    .maybeSingle();

  if (!userData?.clinic_id) {
    return NextResponse.json({ error: "Clinique introuvable" }, { status: 403 });
  }

  const { data: patients, error } = await supabase
    .from("patients")
    .select("full_name, phone, email, date_of_birth, notes, created_at")
    .eq("clinic_id", userData.clinic_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 });
  }

  const header = "Nom,Téléphone,Email,Date de naissance,Notes,Date d'inscription";

  const rows = (patients ?? []).map((patient: any) => {
    const fields = [
      patient.full_name ?? "",
      patient.phone ?? "",
      patient.email ?? "",
      formatDateFr(patient.date_of_birth),
      patient.notes ?? "",
      formatDateFr(patient.created_at),
    ];
    return fields.map(escapeCsvField).join(",");
  });

  const csvContent = [header, ...rows].join("\n");
  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="patients-${dateStr}.csv"`,
    },
  });
}
