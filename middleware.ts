import { NextResponse, NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. next-intl résout la locale depuis le cookie NEXT_LOCALE et injecte les headers nécessaires
  const intlResponse = intlMiddleware(request);

  // 2. Si next-intl redirige (ne devrait pas avec localePrefix: "never"), on l'honore
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  // 3. Enrichir la request avec les headers intl pour que getRequestConfig les lise via requestLocale
  const requestWithLocale = new NextRequest(request.url, {
    method: request.method,
    headers: (() => {
      const headers = new Headers(request.headers);
      intlResponse.headers.forEach((value, key) => {
        headers.set(key, value);
      });
      return headers;
    })(),
    body: request.body,
  });

  // 4. Auth Supabase sur la request enrichie
  const supabaseResponse = await updateSession(requestWithLocale);

  // 5. Fusionner les headers intl dans la réponse finale
  intlResponse.headers.forEach((value, key) => {
    if (!supabaseResponse.headers.has(key)) {
      supabaseResponse.headers.set(key, value);
    }
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|widget).*)",
  ],
};
