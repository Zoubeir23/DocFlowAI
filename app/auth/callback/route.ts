import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// N'autorise qu'un chemin relatif interne (ex: "/app/dashboard", "/onboarding").
// Rejette les URLs absolues, les chemins protocol-relative ("//evil.com") et
// tout caractère permettant une redirection hors origine (ex: "@evil.com"
// injecté dans le userinfo d'une URL une fois concaténé à `origin`).
function sanitizeRedirectPath(next: string | null): string {
  const fallback = "/app/dashboard";
  if (!next) return fallback;
  if (!/^\/(?!\/)[a-zA-Z0-9\-_/]*$/.test(next)) return fallback;
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
