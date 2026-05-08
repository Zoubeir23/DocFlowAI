"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check, Loader2 } from "lucide-react";
import { routing, type SupportedLocale } from "@/i18n/routing";

const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
};

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  fr: "Français",
  en: "English",
};

export function LanguageSwitcher() {
  const currentLocale = useLocale() as SupportedLocale;
  const [isPending, setIsPending] = useState(false);

  const handleLocaleChange = (nextLocale: SupportedLocale) => {
    if (nextLocale === currentLocale || isPending) return;

    setIsPending(true);
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-foreground/60 hover:text-foreground hover:bg-foreground/5 border border-transparent hover:border-foreground/10 transition-all duration-200 text-sm font-medium disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{LOCALE_FLAGS[currentLocale]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-none border-foreground/10 shadow-none p-1 bg-background"
      >
        {(routing.locales as readonly SupportedLocale[]).map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className="rounded-none text-sm text-foreground/80 focus:text-foreground focus:bg-foreground/5 cursor-pointer flex items-center gap-2"
          >
            <span>{LOCALE_FLAGS[locale]}</span>
            <span>{LOCALE_LABELS[locale]}</span>
            {locale === currentLocale && (
              <Check className="w-3.5 h-3.5 text-teal-500 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
