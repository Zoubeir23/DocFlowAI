/**
 * WHO Global Health Observatory (GHO) API client.
 * Used to fetch disease prevalence data to weight ICD-11 candidate scores.
 * Public OData API — no authentication required.
 * Docs: https://www.who.int/data/gho/info/gho-odata-api
 */

export interface GhoPrevalenceEntry {
  icdCode: string;
  indicatorCode: string;
  countryCode: string;
  year: number;
  prevalencePerHundredThousand: number;
}

const GHO_BASE_URL = "https://ghoapi.azureedge.net/api";

/**
 * Maps ICD-11 chapter root codes to relevant GHO indicator codes.
 * These are WHO-maintained indicators for major disease groups.
 */
const ICD_CHAPTER_TO_GHO_INDICATORS: Record<string, string> = {
  // Infectious & parasitic diseases
  "1": "MORT_COMM_CAUSE",
  // Neoplasms
  "2": "NCD_NCD_MORT_30_70",
  // Blood diseases
  "3": "NCD_ANAEMIA_TOTAL",
  // Endocrine / diabetes
  "5": "NCD_GLUC_04",
  // Mental disorders
  "6": "MH_12",
  // Nervous system
  "8": "SA_0000001462",
  // Circulatory system
  "11": "NCD_HYP_PREVALENCE_A",
  // Respiratory
  "12": "SA_0000001462",
  // Digestive
  "13": "MORT_COMM_CAUSE",
  // Musculoskeletal
  "15": "NCD_BMI_30A",
};

const prevalenceCache = new Map<string, { data: GhoPrevalenceEntry[]; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getGhoPrevalenceForIndicator(
  indicatorCode: string,
  countryCode = "GLOBAL"
): Promise<GhoPrevalenceEntry[]> {
  const cacheKey = `${indicatorCode}:${countryCode}`;
  const cached = prevalenceCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const filter = countryCode === "GLOBAL"
      ? `$filter=TimeDim ge 2018&$orderby=TimeDim desc&$top=5`
      : `$filter=SpatialDim eq '${countryCode}' and TimeDim ge 2018&$orderby=TimeDim desc&$top=3`;

    const url = `${GHO_BASE_URL}/${indicatorCode}?${filter}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return [];

    const json: { value: Array<{ SpatialDim: string; TimeDim: number; NumericValue: number | null }> } =
      await response.json();

    const entries: GhoPrevalenceEntry[] = (json.value ?? [])
      .filter((row) => row.NumericValue !== null)
      .map((row) => ({
        icdCode: "",
        indicatorCode,
        countryCode: row.SpatialDim,
        year: row.TimeDim,
        prevalencePerHundredThousand: row.NumericValue ?? 0,
      }));

    prevalenceCache.set(cacheKey, { data: entries, fetchedAt: Date.now() });
    return entries;
  } catch {
    return [];
  }
}

/**
 * Returns a prevalence multiplier (0.8–1.5) for an ICD-11 candidate
 * based on GHO data. Higher prevalence = higher multiplier.
 * Used to re-weight scores in lib/diagnostic-scoring.ts.
 */
export async function computeGhoPrevalenceMultiplier(
  icdCode: string
): Promise<number> {
  // Use the first character of the ICD code to map to a GHO indicator
  const chapterKey = icdCode.charAt(0).toUpperCase();
  const numericChapter = parseInt(chapterKey, 10);

  let indicatorCode: string | undefined;
  if (!isNaN(numericChapter)) {
    indicatorCode = ICD_CHAPTER_TO_GHO_INDICATORS[String(numericChapter)];
  }

  if (!indicatorCode) return 1.0;

  const entries = await getGhoPrevalenceForIndicator(indicatorCode);
  if (entries.length === 0) return 1.0;

  // Use the most recent global value
  const latest = entries[0];
  const prevalence = latest.prevalencePerHundredThousand;

  // Normalize: >5000/100k = high prevalence → 1.3x, <100/100k = rare → 0.85x
  if (prevalence > 5000) return 1.3;
  if (prevalence > 1000) return 1.15;
  if (prevalence > 100) return 1.0;
  if (prevalence > 10) return 0.9;
  return 0.85;
}
