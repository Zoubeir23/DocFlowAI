import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDiagnosisById } from "@/lib/who-icd";

const VALID_ICD_ID_PATTERN = /^[a-zA-Z0-9\-_.]+$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const language = request.nextUrl.searchParams.get("lang") ?? "fr";

  if (!id || !VALID_ICD_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    const entity = await getDiagnosisById(id, language);
    return NextResponse.json(entity);
  } catch (error) {
    console.error("[ICD Entity] Erreur:", error);
    return NextResponse.json(
      { error: "Entité ICD introuvable" },
      { status: 404 }
    );
  }
}
