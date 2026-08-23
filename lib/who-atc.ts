import { z } from "zod";

const RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST";

/** Code ATC de niveau 3 (4 car.), 4 (5 car.) ou 5 (7 car.) — ex: J01C, J01CA, J01CA04. */
const ATC_CLASS_ID_PATTERN = /^[A-Z]\d{2}[A-Z]([A-Z]\d{2}|[A-Z])?$/;

// La réponse RxNav est une source externe non fiable : classId est déjà filtré
// par ATC_CLASS_ID_PATTERN plus bas, mais className n'était que typé (`as`),
// jamais vérifié — une valeur non textuelle aurait pu atteindre le rendu
// (atc-drug-search.tsx) et faire planter la recherche.
const rxClassResponseSchema = z.object({
  rxclassDrugInfoList: z
    .object({
      rxclassDrugInfo: z
        .array(
          z.object({
            rxclassMinConceptItem: z
              .object({
                classId: z.string().optional(),
                className: z.string().optional(),
              })
              .optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

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

        const parsedAtcData = rxClassResponseSchema.safeParse(await atcResponse.json());
        if (!parsedAtcData.success) return { rxcui, name, atcCode: null, atcName: null };

        // RxNav ne renvoie quasiment jamais le code ATC de niveau 5 (7 caractères,
        // ex: "J01CA04") : "byRxcui" retourne le plus souvent le sous-groupe
        // pharmacologique (niveau 3, 4 caractères, "J01C") ou chimique (niveau 4,
        // 5 caractères, "J01CA"). Exiger le niveau 5 laissait atcCode toujours
        // null, rendant la détection d'allergie par classe thérapeutique inopérante
        // (voir tasks/audit-2026-08-23-full-codebase.md, H1). On accepte donc les
        // niveaux 3 à 5 et on retient le plus spécifique disponible.
        const atcCandidates = (parsedAtcData.data.rxclassDrugInfoList?.rxclassDrugInfo ?? [])
          .map((item) => item.rxclassMinConceptItem)
          .filter(
            (concept): concept is { classId: string; className?: string } =>
              Boolean(concept?.classId && ATC_CLASS_ID_PATTERN.test(concept.classId))
          )
          .sort((a, b) => b.classId.length - a.classId.length);
        const atcInfo = atcCandidates[0];

        return {
          rxcui,
          name: candidates.find((c) => c.rxcui === rxcui)?.name ?? name,
          atcCode: atcInfo?.classId ?? null,
          atcName: atcInfo?.className ?? null,
        };
      } catch {
        return { rxcui, name, atcCode: null, atcName: null };
      }
    })
  );

  return results;
}
