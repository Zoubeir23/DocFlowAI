"use client";

import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PricingPlanCta } from "@/components/pricing/pricing-plan-cta";
import { useInView } from "@/lib/hooks/use-in-view";

interface PricingPlanCardProps {
  name: string;
  description: string;
  /** Prix mensuel en euros. `0` affiche le libellé « gratuit ». */
  monthlyPrice: number;
  freeLabel: string;
  periodLabel: string;
  trialNote?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  plan: string;
  isPopular: boolean;
  popularLabel: string;
  /** Position dans la grille : donne le délai d'apparition. */
  index: number;
}

/**
 * Carte tarifaire de la landing.
 *
 * La carte mise en avant est surélevée et les autres légèrement reculées pour
 * créer de la profondeur ; l'effet ne s'applique qu'à partir du grand écran, où
 * les colonnes sont côte à côte.
 */
export function PricingPlanCard({
  name,
  description,
  monthlyPrice,
  freeLabel,
  periodLabel,
  trialNote,
  features,
  ctaLabel,
  ctaHref,
  plan,
  isPopular,
  popularLabel,
  index,
}: PricingPlanCardProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border bg-card p-8 transition-all duration-700 ease-out",
        isPopular
          ? "border-primary shadow-xl shadow-primary/10 z-10 lg:-translate-y-4"
          : "border-border hover:border-primary/30 lg:scale-[0.97]",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      )}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 flex items-center gap-1.5 rounded-bl-2xl rounded-tr-3xl bg-primary px-3 py-1.5">
          <Star className="w-3.5 h-3.5 fill-current text-primary-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground">
            {popularLabel}
          </span>
        </div>
      )}

      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{name}</p>

      <div className="mt-5 flex items-end gap-2">
        <span className="font-cormorant text-5xl leading-none text-foreground">
          {monthlyPrice === 0 ? freeLabel : `${monthlyPrice}€`}
        </span>
        <span className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          /{periodLabel}
        </span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
      {trialNote && <p className="mt-2 text-xs text-primary">{trialNote}</p>}

      <ul className="flex-1 mt-7 pt-6 border-t border-border space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PricingPlanCta plan={plan} href={ctaHref} label={ctaLabel} highlighted={isPopular} />
      </div>
    </div>
  );
}
