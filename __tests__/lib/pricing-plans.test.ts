import { describe, it, expect } from "vitest";
import {
  PRICING_PLAN_KEYS,
  PRICING_PLAN_MONTHLY_PRICES,
  PRICING_PLAN_HIGHLIGHTED,
  PRICING_PLAN_SIGNUP_HREFS,
  PRICING_PLANS_WITH_TRIAL,
} from "@/lib/subscription/pricing-plans";
import { PLAN_LIMITS } from "@/lib/subscription/quota";
import frenchMessages from "@/messages/fr.json";
import englishMessages from "@/messages/en.json";

describe("configuration des plans tarifaires", () => {
  it("expose les plans dans l'ordre du moins cher au plus cher", () => {
    const prices = PRICING_PLAN_KEYS.map((plan) => PRICING_PLAN_MONTHLY_PRICES[plan]);
    const sortedPrices = [...prices].sort((first, second) => first - second);

    expect(prices).toEqual(sortedPrices);
  });

  it("couvre exactement les plans connus du moteur de quotas", () => {
    expect([...PRICING_PLAN_KEYS].sort()).toEqual(Object.keys(PLAN_LIMITS).sort());
  });

  it("met un seul plan en avant", () => {
    const highlighted = PRICING_PLAN_KEYS.filter((plan) => PRICING_PLAN_HIGHLIGHTED[plan]);

    expect(highlighted).toEqual(["professional"]);
  });

  it("ne propose l'essai gratuit que sur des plans payants", () => {
    for (const plan of PRICING_PLANS_WITH_TRIAL) {
      expect(PRICING_PLAN_MONTHLY_PRICES[plan]).toBeGreaterThan(0);
    }
  });

  it("pointe chaque CTA vers une route d'inscription", () => {
    for (const plan of PRICING_PLAN_KEYS) {
      expect(PRICING_PLAN_SIGNUP_HREFS[plan]).toMatch(/^\/signup/);
    }
  });

  it("dispose des traductions de chaque plan en français et en anglais", () => {
    for (const plan of PRICING_PLAN_KEYS) {
      for (const messages of [frenchMessages, englishMessages]) {
        const translatedPlan = (messages.pricing.plans as Record<string, unknown>)[plan] as {
          name: string;
          description: string;
          cta: string;
          features: string[];
        };

        expect(translatedPlan.name.length).toBeGreaterThan(0);
        expect(translatedPlan.description.length).toBeGreaterThan(0);
        expect(translatedPlan.cta.length).toBeGreaterThan(0);
        expect(translatedPlan.features.length).toBeGreaterThanOrEqual(4);
      }
    }
  });
});
