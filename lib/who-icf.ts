/**
 * WHO ICF (International Classification of Functioning, Disability and Health) client.
 * Uses the same WHO ICD API OAuth2 token infrastructure as lib/who-icd.ts.
 * ICF codes describe functional limitations for sick leave / disability certificates.
 * API docs: https://icd.who.int/icdapi
 */

const WHO_TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token";
const WHO_API_BASE = "https://id.who.int/icd";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getWhoAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.WHO_ICD_CLIENT_ID;
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("WHO_ICD_CLIENT_ID or WHO_ICD_CLIENT_SECRET not configured");
  }

  const response = await fetch(WHO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "icdapi_access",
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`WHO token fetch failed: ${response.status}`);
  }

  const json: { access_token: string; expires_in: number } = await response.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

function buildWhoHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Accept-Language": "en",
    "API-Version": "v2",
  };
}

export interface IcfCode {
  id: string;
  code: string;
  title: string;
  definition?: string;
}

interface WhoSearchResult {
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
    const token = await getWhoAccessToken();
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

    const url = `${WHO_API_BASE}/release/11/2024-01/icf/search?${params}`;
    const response = await fetch(url, {
      headers: buildWhoHeaders(token),
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const data: WhoSearchResult = await response.json();
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
