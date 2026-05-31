import { NextResponse } from "next/server";
import { searchIcfCodes } from "@/lib/who-icf";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8", 10), 20);

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchIcfCodes(query, limit);
  return NextResponse.json({ results });
}
