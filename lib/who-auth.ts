/**
 * Shared WHO ICD API OAuth2 token client.
 * Used by lib/who-icd.ts and lib/who-icf.ts to avoid duplicating
 * token cache state and refresh logic.
 */

const WHO_TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token";
export const WHO_API_BASE = "https://id.who.int/icd";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function fetchWhoAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.WHO_ICD_CLIENT_ID;
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("WHO_ICD_CLIENT_ID et WHO_ICD_CLIENT_SECRET sont requis");
  }

  const response = await fetch(WHO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "icdapi_access",
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Échec auth WHO ICD: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

export function buildWhoApiHeaders(token: string, language = "en"): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Accept-Language": language,
    "API-Version": "v2",
    Accept: "application/json",
  };
}

// Les endpoints de recherche par linéarisation (mms, icf...) exigent un
// releaseId explicite dans l'URL (ex. /release/11/2024-01/mms/search) — l'API
// OMS ne reconnaît pas de mot-clé "latest" (vérifié : 404). Coder ce releaseId
// en dur casse l'intégration à chaque publication d'une nouvelle release OMS
// (constaté le 2026-07-23 : "2024-01" retourne 500 sur /icf/search alors que
// la release courante de la Fondation est "2026-01"). On la découvre donc
// dynamiquement depuis la racine /icd/entity, qui l'expose toujours à jour.
let releaseIdCache: { value: string; fetchedAt: number } | null = null;
const RELEASE_ID_CACHE_TTL_MS = 60 * 60 * 1000;

export async function getCurrentIcdReleaseId(token: string): Promise<string> {
  if (releaseIdCache && Date.now() - releaseIdCache.fetchedAt < RELEASE_ID_CACHE_TTL_MS) {
    return releaseIdCache.value;
  }

  const response = await fetch(`${WHO_API_BASE}/entity`, {
    headers: buildWhoApiHeaders(token, "en"),
  });
  if (!response.ok) {
    throw new Error(`Impossible de résoudre la release ICD courante: ${response.status}`);
  }

  const data = (await response.json()) as { releaseId?: string };
  if (!data.releaseId) {
    throw new Error("Réponse OMS inattendue : releaseId absent de /icd/entity");
  }

  releaseIdCache = { value: data.releaseId, fetchedAt: Date.now() };
  return data.releaseId;
}
