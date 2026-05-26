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
