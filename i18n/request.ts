import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { routing, type SupportedLocale } from "./routing";

export default getRequestConfig(async () => {
  // Empêche tout cache — force la relecture du cookie à chaque requête
  noStore();

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const locale: SupportedLocale =
    rawLocale && (routing.locales as readonly string[]).includes(rawLocale)
      ? (rawLocale as SupportedLocale)
      : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
