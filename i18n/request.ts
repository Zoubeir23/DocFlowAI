import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing, type SupportedLocale } from "./routing";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const locale: SupportedLocale =
    rawLocale && (routing.locales as readonly string[]).includes(rawLocale)
      ? (rawLocale as SupportedLocale)
      : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
