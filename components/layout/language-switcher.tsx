"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { routing, type SupportedLocale } from "@/i18n/routing";

const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
};

export function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const currentLocale = useLocale() as SupportedLocale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: SupportedLocale) => {
    if (nextLocale === currentLocale) return;

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 border border-transparent hover:border-slate-200 transition-all duration-200 text-sm font-medium disabled:opacity-50"
          disabled={isPending}
          title={t("label")}
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{LOCALE_FLAGS[currentLocale]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-xl border-slate-100 shadow-lg shadow-slate-200/50 p-1"
      >
        {(routing.locales as readonly SupportedLocale[]).map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className="rounded-lg text-sm text-slate-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer flex items-center gap-2"
          >
            <span>{LOCALE_FLAGS[locale]}</span>
            <span>{t(locale)}</span>
            {locale === currentLocale && (
              <Check className="w-3.5 h-3.5 text-teal-500 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
