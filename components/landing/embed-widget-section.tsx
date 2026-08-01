import { getTranslations } from "next-intl/server";
import { Check, CalendarCheck } from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";
import { CopyEmbedCodeButton } from "@/components/landing/copy-embed-code-button";

const DEMO_CLINIC_SLUG = "cabinet-dr-martin";

function buildEmbedCode(appUrl: string): string {
  return `<iframe src="${appUrl}/widget/${DEMO_CLINIC_SLUG}" width="100%" height="600" frameborder="0"></iframe>`;
}

/**
 * Section « Widget IA » : bandeau profond présentant l'intégration iframe de
 * l'agent de réservation sur un site existant.
 */
export async function EmbedWidgetSection() {
  const t = await getTranslations("landing.widget");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";
  const embedCode = buildEmbedCode(appUrl);
  const bullets = [t("bulletRateLimit"), t("bulletBilingual"), t("bulletBranding")];

  return (
    <section
      id="widget"
      className="py-28 lg:py-32 bg-[hsl(222_47%_8%)] text-white relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-7">
            <SectionLabel>{t("label")}</SectionLabel>
            <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium leading-[1.1]">
              {t("title")}
            </h2>
            <p className="mt-5 text-lg text-white/60 leading-relaxed max-w-2xl">{t("subtitle")}</p>

            <div className="mt-9 rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
              <pre className="p-5 overflow-x-auto font-mono text-[12px] leading-relaxed text-primary/90">
                <code>{embedCode}</code>
              </pre>
              <div className="border-t border-white/10 px-5 py-3">
                <CopyEmbedCodeButton
                  code={embedCode}
                  copyLabel={t("copy")}
                  copiedLabel={t("copied")}
                />
              </div>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-sm text-white/60">
                  <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="mx-auto w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 bg-card text-card-foreground shadow-2xl">
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
