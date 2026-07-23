import { fetchWhoAccessToken, buildWhoApiHeaders, getCurrentIcdReleaseId, WHO_API_BASE } from "./who-auth";

// L'API OMS renvoie ses URLs de hiérarchie (stemId/parent/child) en http://,
// jamais https://. `fetch` suit la redirection http→https mais retire
// l'en-tête Authorization au passage (changement de protocole = comportement
// standard de retrait des en-têtes sensibles sur redirection) — chaque appel
// échouait silencieusement en 401. Vérifié en direct contre l'API OMS le
// 2026-07-23.
function ensureHttps(url: string): string {
  return url.replace(/^http:\/\//, "https://");
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
  const token = await fetchWhoAccessToken();
  const releaseId = await getCurrentIcdReleaseId(token);

  const params = new URLSearchParams({
    q: query,
    subtreeFilterUsage: "includeSelf",
    includeKeywordResult: "false",
    useFlexisearch: "false",
    flatResults: "true",
    highlightingEnabled: "false",
    medicalCodingMode: "true",
  });

  // /entity/search interroge le "foundation" de l'ICD-11, qui ne porte jamais
  // de code clinique (theCode toujours null, même sur une entité feuille) —
  // les codes n'existent que sur une linéarisation (ex. MMS, la classification
  // clinique/de morbidité). Vérifié en direct contre l'API OMS le 2026-07-23 :
  // "Diabète sucré de type 2" ne renvoie un code (5A11) que via
  // /release/11/{releaseId}/mms/search, jamais via /entity/search.
  const response = await fetch(
    `${WHO_API_BASE}/release/11/${releaseId}/mms/search?${params.toString()}`,
    { headers: buildWhoApiHeaders(token, language) }
  );

  if (!response.ok) {
    throw new Error(`Erreur recherche ICD: ${response.status}`);
  }

  const data = (await response.json()) as {
    // /entity/search?flatResults=true renvoie title en chaîne simple, PAS en
    // objet JSON-LD {value} — contrairement à /entity/{id} (voir plus bas).
    // Vérifié en direct contre l'API OMS le 2026-07-23.
    destinationEntities?: Array<{
      id: string;
      title: string;
      theCode?: string;
      score?: number;
      chapter?: string;
    }>;
  };

  return (data.destinationEntities ?? []).slice(0, limit).map((entity) => ({
    id: entity.id,
    title: entity.title,
    theCode: entity.theCode,
    score: entity.score,
    chapter: entity.chapter,
  }));
}

export async function getDiagnosisById(
  entityId: string,
  language = "fr"
): Promise<IcdEntity> {
  const token = await fetchWhoAccessToken();

  const response = await fetch(`${WHO_API_BASE}/entity/${entityId}`, {
    headers: buildWhoApiHeaders(token, language),
  });

  if (!response.ok) {
    throw new Error(`Entité ICD introuvable: ${response.status}`);
  }

  const data = (await response.json()) as {
    // /entity/{id} renvoie du JSON-LD : les libellés sont des objets
    // {"@language": ..., "@value": ...}, PAS {value} — contrairement à
    // /entity/search?flatResults=true (voir searchDiagnoses ci-dessus).
    // Vérifié en direct contre l'API OMS le 2026-07-23.
    "@id": string;
    title: { "@value": string };
    definition?: { "@value": string };
    longDefinition?: { "@value": string };
    code?: string;
    child?: string[];
    parent?: string[];
    browserUrl?: string;
  };

  return {
    id: data["@id"],
    title: data.title["@value"],
    definition: data.definition?.["@value"],
    longDefinition: data.longDefinition?.["@value"],
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

// ⚠️ NON FONCTIONNEL — vérifié en direct contre l'API OMS le 2026-07-23 :
// `/release/11/{releaseId}/ichi/entity/search` renvoie HTTP 404 quel que soit
// le releaseId testé (2024-01, 2026-01), contrairement à mms/icf qui
// fonctionnent avec le même schéma d'URL. "ichi" n'est probablement pas un
// nom de linéarisation valide pour ce endpoint, ou nécessite un accès/produit
// WHO distinct non couvert par ce client OAuth2 (scope icdapi_access). Le
// endpoint exact n'est pas documenté dans le swagger public
// (id.who.int/swagger/v2/swagger.json ne liste que /release/11/{releaseId}/
// {linearizationname}/search en générique). Cette fonction retourne donc
// toujours un tableau vide en pratique — à corriger une fois le bon endpoint
// confirmé auprès du support WHO ICD-API (https://icd.who.int/icdapi).
export async function searchIchiProcedures(
  query: string,
  options: { language?: string; limit?: number } = {}
): Promise<IchiSearchResult[]> {
  const { language = "fr", limit = 10 } = options;
  const token = await fetchWhoAccessToken();

  const params = new URLSearchParams({
    q: query,
    flatResults: "true",
    highlightingEnabled: "false",
    medicalCodingMode: "true",
  });

  const response = await fetch(
    `${WHO_API_BASE}/release/11/2024-01/ichi/entity/search?${params.toString()}`,
    { headers: buildWhoApiHeaders(token, language) }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as {
    // flatResults=true : title en chaîne simple, cf. searchDiagnoses ci-dessus.
    destinationEntities?: Array<{
      id: string;
      title: string;
      theCode?: string;
      score?: number;
    }>;
  };

  return (data.destinationEntities ?? []).slice(0, limit).map((entity) => ({
    id: entity.id,
    title: entity.title,
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
  const token = await fetchWhoAccessToken();
  const releaseId = await getCurrentIcdReleaseId(token);

  const codeResponse = await fetch(
    `${WHO_API_BASE}/release/11/${releaseId}/mms/codeInfo/${encodeURIComponent(icdCode)}`,
    { headers: buildWhoApiHeaders(token, language) }
  );

  if (!codeResponse.ok) return [];

  // codeInfo ne porte PAS de champ "parent" (uniquement code/stemId) — il faut
  // d'abord résoudre stemId pour obtenir la hiérarchie. stemId/parent/child
  // sont déjà des URLs complètes de la linéarisation MMS (contrairement à
  // /entity/{id}, qui renvoie la vue "foundation" sans code clinique) : on les
  // suit telles quelles au lieu de reconstruire une URL /entity/{id}.
  // Vérifié en direct contre l'API OMS le 2026-07-23.
  const codeData = (await codeResponse.json()) as { stemId?: string };
  if (!codeData.stemId) return [];

  const stemResponse = await fetch(ensureHttps(codeData.stemId), {
    headers: buildWhoApiHeaders(token, language),
  });
  if (!stemResponse.ok) return [];

  const stemData = (await stemResponse.json()) as { parent?: string[] };
  const parentUrl = stemData.parent?.[0];
  if (!parentUrl) return [];

  const siblingResponse = await fetch(ensureHttps(parentUrl), {
    headers: buildWhoApiHeaders(token, language),
  });

  if (!siblingResponse.ok) return [];

  const parentData = (await siblingResponse.json()) as {
    child?: string[];
    title?: { "@value": string };
  };

  const childUrls = (parentData.child ?? []).slice(0, 10);

  const siblings = await Promise.all(
    childUrls.map(async (url): Promise<ComorbidityResult | null> => {
      try {
        const childResp = await fetch(ensureHttps(url), {
          headers: buildWhoApiHeaders(token, language),
        });
        if (!childResp.ok) return null;
        const child = (await childResp.json()) as {
          "@id": string;
          title: { "@value": string };
          code?: string;
        };
        if (child.code === icdCode) return null;
        return { id: child["@id"], title: child.title["@value"], theCode: child.code };
      } catch {
        return null;
      }
    })
  );

  return siblings.filter((s): s is ComorbidityResult => s !== null);
}
