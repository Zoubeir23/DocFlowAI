import { getTranslations } from "next-intl/server";

/**
 * Bandeau des standards techniques et médicaux : ligne de wordmarks
 * typographiques, sans logo importé, pour rester net en clair comme en sombre.
 */
export async function TechStackBand() {
  const t = await getTranslations("landing.techStack");
  const items = t.raw("items") as string[];

  return (
    <section className="border-y border-border bg-muted/20 py-12" aria-label={t("label")}>
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-8">
          {t("label")}
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {items.map((item) => (
            <li
              key={item}
              className="font-cormorant text-2xl text-foreground/60 hover:text-primary transition-colors"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
