import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchDiagnoses } from "@/lib/who-icd";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  const language = request.nextUrl.searchParams.get("lang") ?? "fr";
  const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Le paramètre 'q' doit contenir au moins 2 caractères" },
      { status: 400 }
    );
  }

  try {
    const results = await searchDiagnoses(query.trim(), { language, limit });
    return NextResponse.json({ results, query, total: results.length });
  } catch (error) {
    console.error("[ICD Search] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche ICD" },
      { status: 500 }
    );
  }
}
