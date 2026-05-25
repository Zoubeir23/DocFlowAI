import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePatientsCSV } from "@/lib/csv/parse-patients-csv";

export const dynamic = "force-dynamic";

export interface ImportPatientsResult {
  inserted: number;
  updated: number;
  errors: { line: number; message: string }[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const db = supabase as any;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string } | null };

  if (!userData?.clinic_id) {
    return NextResponse.json({ error: "Clinique introuvable" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Fichier CSV manquant" }, { status: 400 });
  }

  const csvText = await (file as File).text();
  const { rows, errors: parseErrors } = parsePatientsCSV(csvText);

  if (rows.length === 0) {
    return NextResponse.json<ImportPatientsResult>({
      inserted: 0,
      updated: 0,
      errors: parseErrors,
    });
  }

  // Fetch existing phones to distinguish inserts from updates
  const phones = rows.map((r) => r.phone);
  const { data: existing } = await db
    .from("patients")
    .select("phone")
    .eq("clinic_id", userData.clinic_id)
    .in("phone", phones) as { data: { phone: string }[] | null };

  const existingPhones = new Set((existing ?? []).map((p) => p.phone));

  const toUpsert = rows.map((row) => ({
    clinic_id: userData.clinic_id,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
  }));

  const { error: upsertError } = await db
    .from("patients")
    .upsert(toUpsert, {
      onConflict: "clinic_id,phone",
      ignoreDuplicates: false,
    });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const inserted = rows.filter((r) => !existingPhones.has(r.phone)).length;
  const updated = rows.filter((r) => existingPhones.has(r.phone)).length;

  return NextResponse.json<ImportPatientsResult>({
    inserted,
    updated,
    errors: parseErrors,
  });
}
