import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { searchParams } = new URL(req.url);
  const redirectTo = searchParams.get("from") === "portail" ? "/portail/login" : "/login";
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
