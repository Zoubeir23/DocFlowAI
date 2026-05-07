import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeServerClient(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return stripeInstance;
}

export const STRIPE_PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER ?? "",
  professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL ?? "",
  enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE ?? "",
};
