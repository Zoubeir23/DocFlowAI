import { describe, it, expect } from "vitest";
import frenchMessages from "@/messages/fr.json";
import englishMessages from "@/messages/en.json";

type TranslationTree = Record<string, unknown>;

function collectTranslationKeys(tree: TranslationTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = `${prefix}${key}`;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return collectTranslationKeys(value as TranslationTree, `${path}.`);
    }

    return [path];
  });
}

const frenchLandingKeys = collectTranslationKeys(frenchMessages.landing as TranslationTree);
const englishLandingKeys = collectTranslationKeys(englishMessages.landing as TranslationTree);

const REQUIRED_SECTION_KEYS = [
  "announcement.text",
  "techStack.label",
  "features.teleconsultationTitle",
  "features.websiteBuilderTitle",
  "features.paymentsTitle",
  "features.bullets.aiWidget",
  "medicalRecord.title",
  "medicalRecord.mock.diagnosisValue",
  "widget.title",
  "widget.copy",
  "pricingPreview.title",
  "security.rlsTitle",
  "footer.portalCta",
  "nav.medicalRecord",
  "nav.widget",
  "nav.security",
];

describe("traductions de la landing", () => {
  it("expose les mêmes clés en français et en anglais", () => {
    expect([...frenchLandingKeys].sort()).toEqual([...englishLandingKeys].sort());
  });

  it("contient les clés des sections widget, dossier, tarifs et sécurité", () => {
    for (const key of REQUIRED_SECTION_KEYS) {
      expect(frenchLandingKeys).toContain(key);
    }
  });

  it("ne laisse aucune traduction vide", () => {
    const flatten = (tree: TranslationTree): string[] =>
      Object.values(tree).flatMap((value) => {
        if (typeof value === "string") return [value];
        if (Array.isArray(value)) return value as string[];
        return flatten(value as TranslationTree);
      });

    for (const messages of [frenchMessages, englishMessages]) {
      for (const value of flatten(messages.landing as TranslationTree)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
