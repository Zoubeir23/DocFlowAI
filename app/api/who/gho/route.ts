import { NextResponse } from "next/server";
import { computeGhoPrevalenceMultiplier, getGhoPrevalenceForIndicator } from "@/lib/who-gho";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const icdCode = searchParams.get("icdCode");
  const indicatorCode = searchParams.get("indicator");
  const countryCode = searchParams.get("country") ?? "GLOBAL";

  if (indicatorCode) {
    const entries = await getGhoPrevalenceForIndicator(indicatorCode, countryCode);
    return NextResponse.json({ entries });
  }

  if (icdCode) {
    const multiplier = await computeGhoPrevalenceMultiplier(icdCode);
    return NextResponse.json({ icdCode, multiplier });
  }

  return NextResponse.json({ error: "Provide icdCode or indicator param" }, { status: 400 });
}
