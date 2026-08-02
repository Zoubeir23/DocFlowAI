import { getTranslations } from "next-intl/server";
import { Check, CalendarCheck } from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";
import { CopyEmbedCodeButton } from "@/components/landing/copy-embed-code-button";

const DEMO_CLINIC_SLUG = "cabinet-dr-martin";

/**
 * Construit le snippet d'intégration copié par le praticien sur son propre site.
 *
 * L'URL est normalisée : `NEXT_PUBLIC_APP_URL` peut finir par une barre oblique
 * et produirait alors `https://exemple.fr//widget/…`. L'attribut `frameborder`
 * ayant disparu du standard HTML, la bordure est retirée en CSS.
 */
function buildEmbedCode(appUrl: string): string {
  const normalizedAppUrl = appUrl.replace(/\/+$/, "");

  return `<iframe src="${normalizedAppUrl}/widget/${DEMO_CLINIC_SLUG}" width="100%" height="600" style="border:0"></iframe>`;
}

/**
 * Section « Widget IA » : intégration iframe de l'agent de réservation sur un
 * site existant. Fond teal très clair en thème clair, profond en thème sombre.
 */
export async function EmbedWidgetSection() {
  const t = await getTranslations("landing.widget");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";
  const embedCode = buildEmbedCode(appUrl);
  const bullets = [t("bulletRateLimit"), t("bulletBilingual"), t("bulletBranding")];

  return (
    <section
      id="widget"
      className="scroll-mt-32 py-28 lg:py-32 bg-primary/[0.06] border-y border-primary/15 relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-7">
            <SectionLabel>{t("label")}</SectionLabel>
            <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium text-foreground leading-[1.1]">
              {t("title")}
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {t("subtitle")}
            </p>

            <div className="mt-9 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <pre className="p-5 font-mono text-[12px] leading-relaxed text-primary whitespace-pre-wrap break-all">
                <code>{embedCode}</code>
              </pre>
              <div className="border-t border-border px-5 py-3">
                <CopyEmbedCodeButton
                  code={embedCode}
                  copyLabel={t("copy")}
                  copiedLabel={t("copied")}
                />
              </div>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="mx-auto w-full max-w-sm rounded-3xl overflow-hidden border border-border bg-card shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  /widget/{DEMO_CLINIC_SLUG}
                </span>
              </div>

              <div className="p-8 text-center space-y-5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CalendarCheck className="w-7 h-7" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-cormorant text-2xl text-foreground">{t("mock.title")}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t("mock.desc")}
                  </p>
                </div>
                <div className="w-full rounded-xl bg-primary py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground">
                  {t("mock.cta")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
