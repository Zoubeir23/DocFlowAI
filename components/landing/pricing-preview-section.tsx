import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";
import { PricingPlanCard } from "@/components/landing/pricing-plan-card";
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
    <section id="pricing" className="scroll-mt-32 py-28 lg:py-32 border-y border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <SectionLabel>{t("label")}</SectionLabel>
          <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium text-foreground leading-[1.1]">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch lg:items-center">
          {PRICING_PLAN_KEYS.map((planKey, index) => {
            const monthlyPrice = PRICING_PLAN_MONTHLY_PRICES[planKey];

            return (
              <PricingPlanCard
                key={planKey}
                plan={planKey}
                index={index}
                columnCount={PRICING_PLAN_KEYS.length}
                name={tPricing(`plans.${planKey}.name`)}
                description={tPricing(`plans.${planKey}.description`)}
                monthlyPrice={monthlyPrice}
                freeLabel={tPricing("free")}
                periodLabel={monthlyPrice === 0 ? tPricing("forever") : tPricing("perMonth")}
                trialNote={
                  PRICING_PLANS_WITH_TRIAL.includes(planKey) ? tPricing("trialNote") : undefined
                }
                features={(tPricing.raw(`plans.${planKey}.features`) as string[]).slice(
                  0,
                  PREVIEW_FEATURE_COUNT,
                )}
                ctaLabel={tPricing(`plans.${planKey}.cta`)}
                ctaHref={PRICING_PLAN_SIGNUP_HREFS[planKey]}
                isPopular={PRICING_PLAN_HIGHLIGHTED[planKey]}
                popularLabel={tPricing("mostPopular")}
              />
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
