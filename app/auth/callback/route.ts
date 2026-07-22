import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
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
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirectPath(searchParams.get("next"));

  const supabase = await createClient();

  // Confirmation d'inscription / magic link / reset password : Supabase envoie
  // ces liens avec token_hash + type (pas ?code=), consommés via verifyOtp.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("[auth/callback] verifyOtp error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Flux OAuth (Google, etc.) et flux PKCE : arrive avec ?code=.
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
