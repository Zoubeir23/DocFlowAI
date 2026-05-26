/**
 * WHO Global Health Observatory (GHO) API client.
 * Used to fetch disease prevalence data to weight ICD-11 candidate scores.
 * Public OData API — no authentication required.
 * Docs: https://www.who.int/data/gho/info/gho-odata-api
 */

export interface GhoPrevalenceEntry {
  indicatorCode: string;
  countryCode: string;
  year: number;
  prevalencePerHundredThousand: number;
}

const GHO_BASE_URL = "https://ghoapi.azureedge.net/api";

/**
 * Maps ICD-11 chapter first-character to relevant GHO indicator codes.
 * ICD-11 codes: chapters 1-9 start with "1"-"9"; chapters 10+ start with letters
 * (A=10 Ear, B=11 Circulatory, C=12 Respiratory, D=13 Digestive, F=15 Musculoskeletal, etc.)
 */
const ICD_CHAPTER_TO_GHO_INDICATOR: Record<string, string> = {
  "1": "MORT_COMM_CAUSE",       // Chapter 1: Infectious & parasitic diseases
  "2": "NCD_NCD_MORT_30_70",    // Chapter 2: Neoplasms
  "3": "NCD_ANAEMIA_TOTAL",     // Chapter 3: Blood diseases
  "5": "NCD_GLUC_04",           // Chapter 5: Endocrine / diabetes
  "6": "MH_12",                 // Chapter 6: Mental disorders
  "8": "SA_0000001462",         // Chapter 8: Nervous system
  "B": "NCD_HYP_PREVALENCE_A",  // Chapter 11: Circulatory
  "C": "SA_0000001462",          // Chapter 12: Respiratory
  "D": "MORT_COMM_CAUSE",        // Chapter 13: Digestive
  "F": "NCD_BMI_30A",            // Chapter 15: Musculoskeletal
};

const prevalenceCache = new Map<string, { data: GhoPrevalenceEntry[]; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getGhoPrevalenceForIndicator(
  indicatorCode: string,
  countryCode?: string
): Promise<GhoPrevalenceEntry[]> {
  const cacheKey = `${indicatorCode}:${countryCode ?? "ALL"}`;
  const cached = prevalenceCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // When a specific country is requested, filter spatially.
    // For global context (default), fetch without spatial filter and take recent data.
    const spatialFilter = countryCode
      ? ` and SpatialDim eq '${countryCode}'`
      : "";
    const filter = `$filter=TimeDim ge 2018${spatialFilter}&$orderby=TimeDim desc&$top=20`;
    const url = `${GHO_BASE_URL}/${indicatorCode}?${filter}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return [];

    const json: {
      value: Array<{ SpatialDim: string; TimeDim: number; NumericValue: number | null }>;
    } = await response.json();

    const entries: GhoPrevalenceEntry[] = (json.value ?? [])
      .filter((row) => row.NumericValue !== null && row.NumericValue > 0)
      .map((row) => ({
        indicatorCode,
        countryCode: row.SpatialDim,
        year: row.TimeDim,
        prevalencePerHundredThousand: row.NumericValue!,
      }));

    prevalenceCache.set(cacheKey, { data: entries, fetchedAt: Date.now() });
    return entries;
  } catch {
    return [];
  }
}

/**
 * Returns a prevalence multiplier (0.85–1.3) for an ICD-11 candidate
 * based on GHO data. Higher prevalence = higher multiplier.
 * Used in lib/diagnostic-scoring.ts applyGhoPrevalenceWeighting().
 */
export async function computeGhoPrevalenceMultiplier(
  icdCode: string
): Promise<number> {
  if (!icdCode) return 1.0;

  // ICD-11 chapter is determined by the first character of the code
  const chapterKey = icdCode.charAt(0).toUpperCase();
  const indicatorCode = ICD_CHAPTER_TO_GHO_INDICATOR[chapterKey];
  if (!indicatorCode) return 1.0;

  const entries = await getGhoPrevalenceForIndicator(indicatorCode);
  if (entries.length === 0) return 1.0;

  // Compute mean of all returned entries (mix of countries/regions = global proxy)
  const mean =
    entries.reduce((sum, entry) => sum + entry.prevalencePerHundredThousand, 0) /
    entries.length;

  // Coarse buckets: order of magnitude determines the multiplier
  if (mean > 5000) return 1.3;
  if (mean > 1000) return 1.15;
  if (mean > 100) return 1.0;
  if (mean > 10) return 0.9;
  return 0.85;
}
