import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

/**
 * Bandeau d'annonce en tête de landing : voile teal sur le fond du thème, donc
 * blanc/vert en thème clair et profond/vert en thème sombre.
 */
export async function AnnouncementBar() {
  const t = await getTranslations("landing.announcement");

  return (
    <div className="bg-primary/10 text-foreground border-b border-primary/15">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="flex items-center gap-2.5 font-sans text-[13px]">
          <span className="pulse-dot shrink-0" aria-hidden="true" />
          {t("text")}
        </span>
        <Link
          href="#features"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary hover:text-foreground transition-colors"
        >
          {t("cta")}
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
