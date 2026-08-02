import { PLAN_LIMITS, type PlanName } from "@/lib/subscription/quota";

/** Ordre d'affichage des plans, partagé par la landing et la page /pricing. */
export const PRICING_PLAN_KEYS = Object.keys(PLAN_LIMITS) as readonly PlanName[];

/** Prix mensuel en euros. Doit rester aligné sur les prix Stripe configurés. */
export const PRICING_PLAN_MONTHLY_PRICES: Record<PlanName, number> = {
  free: 0,
  starter: 49,
  professional: 99,
  enterprise: 299,
};

/** Plan mis en avant visuellement dans les grilles tarifaires. */
export const PRICING_PLAN_HIGHLIGHTED: Record<PlanName, boolean> = {
  free: false,
  starter: false,
  professional: true,
  enterprise: false,
};

/** Destination du CTA. Le plan Entreprise ouvre une modale de contact commercial. */
export const PRICING_PLAN_SIGNUP_HREFS: Record<PlanName, string> = {
  free: "/signup",
  starter: "/signup?plan=starter",
  professional: "/signup?plan=professional",
  enterprise: "/signup",
};

/** Plans proposant les 14 jours d'essai gratuit. */
export const PRICING_PLANS_WITH_TRIAL: readonly PlanName[] = ["starter", "professional"];
