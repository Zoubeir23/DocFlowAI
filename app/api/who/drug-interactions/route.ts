import { NextResponse } from "next/server";
import { checkDrugInteractions } from "@/lib/who-drug-interactions";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { rxcuis } = body as { rxcuis?: unknown };

  if (!Array.isArray(rxcuis) || rxcuis.length < 2) {
    return NextResponse.json({ error: "At least 2 rxcuis required" }, { status: 400 });
  }

  const validRxcuis = rxcuis.filter((id) => typeof id === "string" && id.trim() !== "");
  const result = await checkDrugInteractions(validRxcuis);
  return NextResponse.json(result);
}
