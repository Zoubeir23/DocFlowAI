import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check, Star, ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";
import { PricingPlanCta } from "@/components/pricing/pricing-plan-cta";
import {
  PRICING_PLAN_KEYS,
  PRICING_PLAN_MONTHLY_PRICES,
  PRICING_PLAN_HIGHLIGHTED,
  PRICING_PLAN_SIGNUP_HREFS,
  PRICING_PLANS_WITH_TRIAL,
} from "@/lib/subscription/pricing-plans";

/** Nombre de lignes de fonctionnalités affichées sur la landing avant le lien /pricing. */
const PREVIEW_FEATURE_COUNT = 4;

/**
 * Aperçu tarifaire sur la landing : mêmes plans, mêmes prix et même CTA que
 * la page /pricing, en version condensée.
 */
export async function PricingPreviewSection() {
  const t = await getTranslations("landing.pricingPreview");
  const tPricing = await getTranslations("pricing");

  return (
    <section id="pricing" className="py-28 lg:py-32 border-y border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <SectionLabel>{t("label")}</SectionLabel>
          <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium text-foreground leading-[1.1]">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {PRICING_PLAN_KEYS.map((planKey, index) => {
            const isHighlighted = PRICING_PLAN_HIGHLIGHTED[planKey];
            const monthlyPrice = PRICING_PLAN_MONTHLY_PRICES[planKey];
            const period = monthlyPrice === 0 ? tPricing("forever") : tPricing("perMonth");
            const features = (tPricing.raw(`plans.${planKey}.features`) as string[]).slice(
              0,
              PREVIEW_FEATURE_COUNT,
            );

            return (
              <article
                key={planKey}
                className={`relative flex flex-col rounded-3xl border p-8 bg-card fade-in-up transition-colors ${
                  isHighlighted
                    ? "border-primary/40 shadow-xl shadow-primary/5"
                    : "border-border hover:border-primary/25"
                }`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground">
                    <Star className="w-3 h-3 fill-current" />
                    {tPricing("mostPopular")}
                  </span>
                )}

                <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  {tPricing(`plans.${planKey}.name`)}
                </h3>

                <div className="mt-5 flex items-end gap-2">
                  <span className="font-cormorant text-5xl leading-none text-foreground">
                    {monthlyPrice === 0 ? tPricing("free") : `${monthlyPrice}€`}
                  </span>
                  <span className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    /{period}
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                  {tPricing(`plans.${planKey}.description`)}
                </p>

                {PRICING_PLANS_WITH_TRIAL.includes(planKey) && (
                  <p className="mt-2 text-xs text-primary">{tPricing("trialNote")}</p>
                )}

                <ul className="flex-1 mt-7 pt-6 border-t border-border space-y-3">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <PricingPlanCta
                    plan={planKey}
                    href={PRICING_PLAN_SIGNUP_HREFS[planKey]}
                    label={tPricing(`plans.${planKey}.cta`)}
                    highlighted={isHighlighted}
                  />
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t("note")}</p>
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary hover:text-foreground transition-colors"
          >
            {t("seeAll")}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
