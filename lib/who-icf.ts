/**
 * WHO ICF (International Classification of Functioning, Disability and Health) client.
 * Uses the shared WHO OAuth2 token from lib/who-auth.ts.
 * ICF codes describe functional limitations for sick leave / disability certificates.
 * API docs: https://icd.who.int/icdapi
 */

import { fetchWhoAccessToken, buildWhoApiHeaders, getCurrentIcdReleaseId, WHO_API_BASE } from "./who-auth";
import type { IcfCode } from "@/types";

interface WhoIcfSearchResponse {
  destinationEntities?: Array<{
    id: string;
    theCode: string;
    title: string;
    definition?: string;
  }>;
}

/**
 * Search ICF codes for functional limitation descriptions.
 * Useful for sick leave / disability certificates to document
 * what the patient cannot do (e.g., "b730 Muscle power functions").
 */
export async function searchIcfCodes(query: string, limit = 8): Promise<IcfCode[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const token = await fetchWhoAccessToken();
    const releaseId = await getCurrentIcdReleaseId(token);
    const params = new URLSearchParams({
      q: query,
      subtreesFilter: "",
      chapterFilter: "",
      includeKeywordResult: "false",
      useFlexisearch: "false",
      flatResults: "true",
      highlightingEnabled: "false",
      medicalCodingMode: "false",
    });

    // "2024-01" en dur retournait HTTP 500 (release retirée) — releaseId est
    // désormais découvert dynamiquement, cf. lib/who-auth.ts. Vérifié en
    // direct contre l'API OMS le 2026-07-23.
    const url = `${WHO_API_BASE}/release/11/${releaseId}/icf/search?${params}`;
    const response = await fetch(url, {
      headers: buildWhoApiHeaders(token),
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const data: WhoIcfSearchResponse = await response.json();
    const entities = data.destinationEntities ?? [];

    return entities.slice(0, limit).map((entity) => ({
      id: entity.id,
      code: entity.theCode ?? "",
      title: entity.title,
      definition: entity.definition,
    }));
  } catch {
    return [];
  }
}
