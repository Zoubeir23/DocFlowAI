import { NextResponse, NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Supabase auth (protège /app, redirige si non authentifié)
  const supabaseResponse = await updateSession(request);

  // Si Supabase redirige (auth required / already logged in), on l'honore sans modification
  if (supabaseResponse.status === 302 || supabaseResponse.status === 307 || supabaseResponse.status === 308) {
    return supabaseResponse;
  }

  // 2. next-intl résout la locale depuis le cookie NEXT_LOCALE
  const intlResponse = intlMiddleware(request);

  // 3. Copier les headers intl (x-middleware-*) dans la réponse finale
  // Ces headers permettent à getRequestConfig de lire requestLocale
  intlResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value);
  });

  // 4. Copier les cookies intl si présents
  intlResponse.cookies.getAll().forEach((cookie) => {
    supabaseResponse.cookies.set(cookie);
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|widget).*)",
  ],
};
