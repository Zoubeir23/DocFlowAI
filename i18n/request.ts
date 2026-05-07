import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { routing, type SupportedLocale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Locale passée par createIntlMiddleware via headers
  const requested = await requestLocale;

  let locale: SupportedLocale;

  if (hasLocale(routing.locales, requested)) {
    locale = requested as SupportedLocale;
  } else {
    // Fallback cookie (pages hors middleware, ex. widget embed)
    const cookieStore = await cookies();
    const raw = cookieStore.get("NEXT_LOCALE")?.value;
    locale =
      raw && (routing.locales as readonly string[]).includes(raw)
        ? (raw as SupportedLocale)
        : routing.defaultLocale;
  }

  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
