import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchPatientEducationDocuments } from "@/lib/who-iris";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.length < 2) return NextResponse.json([]);

  try {
    const results = await searchPatientEducationDocuments(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
