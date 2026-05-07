import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "never",
});

export type SupportedLocale = (typeof routing.locales)[number];
