const TOKEN_URL =
  "https://icdaccessmanagement.who.int/connect/token";
const API_BASE = "https://id.who.int/icd";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function fetchAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.WHO_ICD_CLIENT_ID;
  const clientSecret = process.env.WHO_ICD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("WHO_ICD_CLIENT_ID et WHO_ICD_CLIENT_SECRET sont requis");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "icdapi_access",
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Échec auth WHO ICD: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

function buildHeaders(token: string, language = "fr"): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Accept-Language": language,
    "API-Version": "v2",
    Accept: "application/json",
  };
}

export interface IcdSearchResult {
  id: string;
  title: string;
  theCode?: string;
  score?: number;
  chapter?: string;
}

export interface IcdEntity {
  id: string;
  title: string;
  definition?: string;
  longDefinition?: string;
  theCode?: string;
  child?: string[];
  parent?: string[];
  browserUrl?: string;
}

export async function searchDiagnoses(
  query: string,
  options: { language?: string; limit?: number } = {}
): Promise<IcdSearchResult[]> {
  const { language = "fr", limit = 20 } = options;
  const token = await fetchAccessToken();

  const params = new URLSearchParams({
    q: query,
    subtreeFilterUsage: "includeSelf",
    includeKeywordResult: "false",
    useFlexisearch: "false",
    flatResults: "true",
    highlightingEnabled: "false",
    medicalCodingMode: "true",
  });

  const response = await fetch(
    `${API_BASE}/entity/search?${params.toString()}`,
    { headers: buildHeaders(token, language) }
  );

  if (!response.ok) {
    throw new Error(`Erreur recherche ICD: ${response.status}`);
  }

  const data = (await response.json()) as {
    destinationEntities?: Array<{
      id: string;
      title: { value: string };
      theCode?: string;
      score?: number;
      chapter?: string;
    }>;
  };

  return (data.destinationEntities ?? []).slice(0, limit).map((entity) => ({
    id: entity.id,
    title: entity.title.value,
    theCode: entity.theCode,
    score: entity.score,
    chapter: entity.chapter,
  }));
}

export async function getDiagnosisById(
  entityId: string,
  language = "fr"
): Promise<IcdEntity> {
  const token = await fetchAccessToken();

  const response = await fetch(`${API_BASE}/entity/${entityId}`, {
    headers: buildHeaders(token, language),
  });

  if (!response.ok) {
    throw new Error(`Entité ICD introuvable: ${response.status}`);
  }

  const data = (await response.json()) as {
    "@id": string;
    title: { value: string };
    definition?: { value: string };
    longDefinition?: { value: string };
    code?: string;
    child?: string[];
    parent?: string[];
    browserUrl?: string;
  };

  return {
    id: data["@id"],
    title: data.title.value,
    definition: data.definition?.value,
    longDefinition: data.longDefinition?.value,
    theCode: data.code,
    child: data.child,
    parent: data.parent,
    browserUrl: data.browserUrl,
  };
}

// ── ICHI — International Classification of Health Interventions ────────────────

export interface IchiSearchResult {
  id: string;
  title: string;
  theCode?: string;
  score?: number;
}

export async function searchIchiProcedures(
  query: string,
  options: { language?: string; limit?: number } = {}
): Promise<IchiSearchResult[]> {
  const { language = "fr", limit = 10 } = options;
  const token = await fetchAccessToken();

  const params = new URLSearchParams({
    q: query,
    flatResults: "true",
    highlightingEnabled: "false",
    medicalCodingMode: "true",
  });

  const response = await fetch(
    `${API_BASE}/release/11/2024-01/ichi/entity/search?${params.toString()}`,
    { headers: buildHeaders(token, language) }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as {
    destinationEntities?: Array<{
      id: string;
      title: { value: string };
      theCode?: string;
      score?: number;
    }>;
  };

  return (data.destinationEntities ?? []).slice(0, limit).map((entity) => ({
    id: entity.id,
    title: entity.title.value,
    theCode: entity.theCode,
    score: entity.score,
  }));
}

// ── Comorbidités — conditions liées à un code ICD-11 ──────────────────────────

export interface ComorbidityResult {
  id: string;
  title: string;
  theCode?: string;
}

export async function getRelatedConditions(
  icdCode: string,
  language = "fr"
): Promise<ComorbidityResult[]> {
  const token = await fetchAccessToken();

  // Cherche l'entité par code
  const codeResponse = await fetch(
    `${API_BASE}/release/11/2024-01/mms/codeInfo/${encodeURIComponent(icdCode)}`,
    { headers: buildHeaders(token, language) }
  );

  if (!codeResponse.ok) return [];

  const codeData = (await codeResponse.json()) as {
    stemId?: string;
    parent?: string[];
  };

  const parentUrl = codeData.parent?.[0];
  if (!parentUrl) return [];

  // Récupère les enfants du parent (conditions sœurs = comorbidités potentielles)
  const parentId = parentUrl.split("/").pop();
  const siblingResponse = await fetch(
    `${API_BASE}/entity/${parentId}`,
    { headers: buildHeaders(token, language) }
  );

  if (!siblingResponse.ok) return [];

  const parentData = (await siblingResponse.json()) as {
    child?: string[];
    title?: { value: string };
  };

  const childUrls = (parentData.child ?? []).slice(0, 10);

  const siblings = await Promise.all(
    childUrls.map(async (url): Promise<ComorbidityResult | null> => {
      try {
        const childId = url.split("/").pop();
        const childResp = await fetch(`${API_BASE}/entity/${childId}`, {
          headers: buildHeaders(token, language),
        });
        if (!childResp.ok) return null;
        const child = (await childResp.json()) as {
          "@id": string;
          title: { value: string };
          code?: string;
        };
        if (child.code === icdCode) return null;
        return { id: child["@id"], title: child.title.value, theCode: child.code };
      } catch {
        return null;
      }
    })
  );

  return siblings.filter((s): s is ComorbidityResult => s !== null);
}
