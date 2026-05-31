const RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST";

export interface AtcDrugResult {
  rxcui: string;
  name: string;
  atcCode: string | null;
  atcName: string | null;
}

export async function searchDrugsWithAtc(query: string, limit = 8): Promise<AtcDrugResult[]> {
  if (!query || query.length < 2) return [];

  const searchResponse = await fetch(
    `${RXNAV_BASE}/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=${limit}`,
    { next: { revalidate: 3600 } }
  );

  if (!searchResponse.ok) return [];

  const searchData = (await searchResponse.json()) as {
    approximateGroup?: {
      candidate?: Array<{ rxcui: string; name?: string; score?: string }>;
    };
  };

  const candidates = searchData.approximateGroup?.candidate ?? [];
  if (candidates.length === 0) return [];

  const uniqueByName = new Map<string, string>();
  for (const c of candidates) {
    if (c.name && !uniqueByName.has(c.name.toLowerCase())) {
      uniqueByName.set(c.name.toLowerCase(), c.rxcui);
    }
  }

  const results: AtcDrugResult[] = await Promise.all(
    Array.from(uniqueByName.entries()).slice(0, limit).map(async ([name, rxcui]) => {
      try {
        const atcResponse = await fetch(
          `${RXNAV_BASE}/rxclass/class/byRxcui.json?rxcui=${rxcui}&relaSource=ATC`,
          { next: { revalidate: 3600 } }
        );
        if (!atcResponse.ok) return { rxcui, name, atcCode: null, atcName: null };

        const atcData = (await atcResponse.json()) as {
          rxclassDrugInfoList?: {
            rxclassDrugInfo?: Array<{
              rxclassMinConceptItem?: { classId?: string; className?: string };
            }>;
          };
        };

        const atcInfo = atcData.rxclassDrugInfoList?.rxclassDrugInfo?.find(
          (item) => item.rxclassMinConceptItem?.classId?.match(/^[A-Z]\d{2}[A-Z]{2}\d{2}$/)
        );

        return {
          rxcui,
          name: candidates.find((c) => c.rxcui === rxcui)?.name ?? name,
          atcCode: atcInfo?.rxclassMinConceptItem?.classId ?? null,
          atcName: atcInfo?.rxclassMinConceptItem?.className ?? null,
        };
      } catch {
        return { rxcui, name, atcCode: null, atcName: null };
      }
    })
  );

  return results;
}
