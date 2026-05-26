/**
 * Drug-drug interaction detection using the NLM RxNav interaction API.
 * RxNav provides free access to interaction data from several sources
 * (DrugBank, ONCHigh, NDF-RT) based on RxCUI identifiers already available
 * from the existing ATC drug search (lib/who-atc.ts).
 *
 * IMPORTANT: the rxcuis parameter must contain numeric RxNorm CUI values
 * (e.g. "41493"), NOT ATC codes (e.g. "A10BA02"). The rxcui is returned
 * by the /api/drugs/search endpoint alongside the ATC code.
 */

import type { DrugInteractionPair } from "@/types";

export interface DrugInteractionResult {
  hasCritical: boolean;
  interactions: DrugInteractionPair[];
}

const RXNAV_BASE_URL = "https://rxnav.nlm.nih.gov/REST";

interface RxNormInteractionResponse {
  fullInteractionTypeGroup?: Array<{
    sourceDisclaimer: string;
    sourceName: string;
    fullInteractionType: Array<{
      comment?: string;
      minConcept: Array<{ rxcui: string; name: string; tty: string }>;
      interactionPair: Array<{
        interactionConcept: Array<{
          minConceptItem: { rxcui: string; name: string; tty: string };
          sourceConceptItem: { id: string; name: string; url: string; dictionaryTitle: string };
        }>;
        severity: string;
        description: string;
      }>;
    }>;
  }>;
}

function normalizeSeverity(raw: string): DrugInteractionPair["severity"] {
  const lowered = raw.toLowerCase();
  if (lowered.includes("high") || lowered.includes("major")) return "high";
  if (lowered.includes("moderate")) return "moderate";
  return "low";
}

export async function checkDrugInteractions(
  rxcuis: string[]
): Promise<DrugInteractionResult> {
  const validRxcuis = rxcuis.filter((id) => id && id.trim() !== "" && /^\d+$/.test(id));
  if (validRxcuis.length < 2) {
    return { hasCritical: false, interactions: [] };
  }

  try {
    const url = `${RXNAV_BASE_URL}/interaction/list.json?rxcuis=${validRxcuis.join("+")}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return { hasCritical: false, interactions: [] };
    }

    const data: RxNormInteractionResponse = await response.json();
    const seen = new Set<string>();
    const interactions: DrugInteractionPair[] = [];

    for (const group of data.fullInteractionTypeGroup ?? []) {
      for (const interactionType of group.fullInteractionType ?? []) {
        for (const pair of interactionType.interactionPair ?? []) {
          const drug1 = pair.interactionConcept[0]?.minConceptItem.name ?? "";
          const drug2 = pair.interactionConcept[1]?.minConceptItem.name ?? "";
          const severity = normalizeSeverity(pair.severity ?? "low");

          // Deduplicate pairs regardless of order
          const pairKey = [drug1, drug2].sort().join("|");
          if (seen.has(pairKey)) continue;
          seen.add(pairKey);

          interactions.push({
            drug1Name: drug1,
            drug2Name: drug2,
            severity,
            description: pair.description,
            source: group.sourceName,
          });
        }
      }
    }

    const hasCritical = interactions.some((i) => i.severity === "high");
    return { hasCritical, interactions };
  } catch {
    return { hasCritical: false, interactions: [] };
  }
}
