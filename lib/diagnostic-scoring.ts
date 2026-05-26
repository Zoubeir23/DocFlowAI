import type { IcdCandidate, VitalSigns } from "@/types";
import { computeGhoPrevalenceMultiplier } from "./who-gho";

interface ScoringInput {
  symptoms: string[];
  ageYears: number;
  sex: "male" | "female";
  vitals: VitalSigns;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
}

interface IcdSearchResult {
  id: string;
  code: string;
  title: string;
  score?: number;
}

const SERIOUS_CONDITION_KEYWORDS = [
  "infarctus", "sepsis", "méningite", "embolie", "choc", "cancer",
  "leucémie", "stroke", "AVC", "anévrisme", "défaillance", "coma",
  "infarction", "failure", "carcinoma", "malignant", "septic",
];

const PEDIATRIC_PRIORITY_KEYWORDS = [
  "otite", "bronchiolite", "varicelle", "rougeole", "scarlatine",
  "coqueluche", "laryngite", "gastroentérite", "méningite",
];

const ADULT_PRIORITY_KEYWORDS = [
  "hypertension", "diabète", "coronaropathie", "infarctus", "BPCO",
  "arthrose", "dépression", "anxiété",
];

function computeAgeGroupMultiplier(
  candidateTitle: string,
  ageYears: number
): number {
  const title = candidateTitle.toLowerCase();
  const isPediatric = PEDIATRIC_PRIORITY_KEYWORDS.some((keyword) =>
    title.includes(keyword.toLowerCase())
  );
  const isAdult = ADULT_PRIORITY_KEYWORDS.some((keyword) =>
    title.includes(keyword.toLowerCase())
  );

  if (isPediatric && ageYears < 18) return 1.4;
  if (isPediatric && ageYears >= 18) return 0.5;
  if (isAdult && ageYears >= 18) return 1.2;
  return 1.0;
}

function computeVitalSeverityBonus(vitals: VitalSigns): number {
  let bonus = 0;
  if (vitals.temperature !== null && vitals.temperature >= 39.5) bonus += 0.15;
  if (vitals.oxygen_saturation !== null && vitals.oxygen_saturation < 92) bonus += 0.25;
  if (
    vitals.blood_pressure_systolic !== null &&
    (vitals.blood_pressure_systolic > 180 || vitals.blood_pressure_systolic < 80)
  ) bonus += 0.2;
  if (vitals.heart_rate !== null && (vitals.heart_rate > 130 || vitals.heart_rate < 40))
    bonus += 0.2;
  return bonus;
}

function isSeriousCondition(title: string): boolean {
  const lower = title.toLowerCase();
  return SERIOUS_CONDITION_KEYWORDS.some((keyword) =>
    lower.includes(keyword.toLowerCase())
  );
}

function computeContraIndicationPenalty(
  candidateTitle: string,
  allergies: string[]
): number {
  if (allergies.length === 0) return 0;
  const title = candidateTitle.toLowerCase();
  const hasAllergy = allergies.some((allergy) =>
    title.includes(allergy.toLowerCase())
  );
  return hasAllergy ? 0.3 : 0;
}

export function scoreAndRankCandidates(
  searchResults: IcdSearchResult[],
  input: ScoringInput
): IcdCandidate[] {
  const vitalBonus = computeVitalSeverityBonus(input.vitals);

  const scored = searchResults.map((result): IcdCandidate => {
    const baseScore = result.score ?? 0.5;
    const ageMultiplier = computeAgeGroupMultiplier(result.title, input.ageYears);
    const contraPenalty = computeContraIndicationPenalty(result.title, input.allergies);
    const serious = isSeriousCondition(result.title);

    // Serious conditions get a bonus so they appear early for exclusion
    const seriousnessBonus = serious ? 0.1 : 0;

    const rawScore =
      (baseScore * ageMultiplier + vitalBonus + seriousnessBonus - contraPenalty);

    const clampedScore = Math.min(Math.max(rawScore, 0), 1);

    // Convert score to probability (softmax-like normalization happens after)
    return {
      id: result.id,
      code: result.code ?? "",
      title: result.title,
      score: clampedScore,
      probability: clampedScore,
      is_serious: serious,
    };
  });

  // Normalize to probabilities
  const totalScore = scored.reduce((sum, candidate) => sum + candidate.score, 0);
  const normalized = scored.map((candidate) => ({
    ...candidate,
    probability:
      totalScore > 0
        ? Math.round((candidate.score / totalScore) * 100)
        : 0,
  }));

  // Sort: serious first for early exclusion, then by score desc
  return normalized.sort((firstCandidate, secondCandidate) => {
    if (secondCandidate.is_serious !== firstCandidate.is_serious) {
      return secondCandidate.is_serious ? 1 : -1;
    }
    return secondCandidate.score - firstCandidate.score;
  });
}

export function detectRequiredTests(
  topCandidates: IcdCandidate[],
  vitals: VitalSigns
): string[] {
  const tests: Set<string> = new Set();

  const topCandidate = topCandidates[0];
  if (!topCandidate || topCandidate.probability < 30) {
    tests.add("Numération formule sanguine (NFS)");
    tests.add("CRP / Bilan inflammatoire");
  }

  if (vitals.temperature !== null && vitals.temperature >= 38.5) {
    tests.add("Hémocultures");
    tests.add("ECBU (analyse urine)");
  }

  if (vitals.oxygen_saturation !== null && vitals.oxygen_saturation < 94) {
    tests.add("Radiographie pulmonaire");
    tests.add("Gaz du sang (gazométrie)");
  }

  if (
    vitals.blood_pressure_systolic !== null &&
    vitals.blood_pressure_systolic > 160
  ) {
    tests.add("ECG (électrocardiogramme)");
    tests.add("Bilan rénal (créatinine, urée)");
  }

  const hasSeriousCandidate = topCandidates.slice(0, 3).some((c) => c.is_serious);
  if (hasSeriousCandidate) {
    tests.add("Bilan biologique complet");
    tests.add("Imagerie (scanner ou IRM selon indication)");
  }

  return Array.from(tests);
}

export function checkAllergyConflicts(
  drugName: string,
  allergies: string[]
): boolean {
  const drug = drugName.toLowerCase();
  return allergies.some((allergy) => drug.includes(allergy.toLowerCase()));
}

/**
 * Re-weight ICD-11 candidates using GHO disease prevalence data.
 * Called after the initial scoring to adjust probabilities based on
 * real-world epidemiological data from the WHO Global Health Observatory.
 */
export async function applyGhoPrevalenceWeighting(
  candidates: IcdCandidate[]
): Promise<IcdCandidate[]> {
  const weighted = await Promise.all(
    candidates.map(async (candidate) => {
      const multiplier = await computeGhoPrevalenceMultiplier(candidate.code);
      return {
        ...candidate,
        score: Math.min(candidate.score * multiplier, 1),
      };
    })
  );

  // Re-normalize probabilities after weighting
  const totalScore = weighted.reduce((sum, candidate) => sum + candidate.score, 0);
  return weighted
    .map((candidate) => ({
      ...candidate,
      probability:
        totalScore > 0
          ? Math.round((candidate.score / totalScore) * 100)
          : 0,
    }))
    .sort((firstCandidate, secondCandidate) => {
      if (secondCandidate.is_serious !== firstCandidate.is_serious) {
        return secondCandidate.is_serious ? 1 : -1;
      }
      return secondCandidate.score - firstCandidate.score;
    });
}
