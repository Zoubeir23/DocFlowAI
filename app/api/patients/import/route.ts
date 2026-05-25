import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePatientsCSV } from "@/lib/csv/parse-patients-csv";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 200;

export interface ImportPatientsResult {
  inserted: number;
  updated: number;
  errors: { line: number; message: string }[];
}

async function fetchExistingPhonesBatched(
  db: any,
  clinicId: string,
  phones: string[]
): Promise<Set<string>> {
  const existing = new Set<string>();
  for (let i = 0; i < phones.length; i += BATCH_SIZE) {
    const batch = phones.slice(i, i + BATCH_SIZE);
    const { data } = await db
      .from("patients")
      .select("phone")
      .eq("clinic_id", clinicId)
      .in("phone", batch) as { data: { phone: string }[] | null };
    for (const row of data ?? []) existing.add(row.phone);
  }
  return existing;
}

async function upsertPatientsBatched(
  db: any,
  records: { clinic_id: string; full_name: string; phone: string; email?: string; notes?: string }[]
): Promise<string | null> {
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await db
      .from("patients")
      .upsert(batch, { onConflict: "clinic_id,phone", ignoreDuplicates: false });
    if (error) return error.message;
  }
  return null;
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
    return NextResponse.json({ error: "Accès refusé — aucune clinique associée" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Fichier CSV manquant" }, { status: 400 });
  }

  const csvText = await (file as File).text();
  const { rows, errors: parseErrors } = parsePatientsCSV(csvText);

  if (rows.length === 0) {
    return NextResponse.json<ImportPatientsResult>({ inserted: 0, updated: 0, errors: parseErrors });
  }

  const phones = rows.map((r) => r.phone);
  const existingPhones = await fetchExistingPhonesBatched(db, userData.clinic_id, phones);

  const toUpsert = rows.map((row) => ({
    clinic_id: userData.clinic_id,
    full_name: row.full_name,
    phone: row.phone,
    ...(row.email ? { email: row.email } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
  }));

  const upsertError = await upsertPatientsBatched(db, toUpsert);
  if (upsertError) {
    return NextResponse.json({ error: upsertError }, { status: 500 });
  }

  const inserted = rows.filter((r) => !existingPhones.has(r.phone)).length;
  const updated = rows.filter((r) => existingPhones.has(r.phone)).length;

  return NextResponse.json<ImportPatientsResult>({ inserted, updated, errors: parseErrors });
}
