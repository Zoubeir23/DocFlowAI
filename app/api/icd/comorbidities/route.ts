import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRelatedConditions } from "@/lib/who-icd";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!code) return NextResponse.json([]);

  try {
    const results = await getRelatedConditions(code);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
