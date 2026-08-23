import { describe, it, expect, vi, afterEach } from "vitest";
import { searchDrugsWithAtc } from "@/lib/who-atc";

function mockRxNavResponses(atcClasses: Array<{ classId: string; className: string }>) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes("approximateTerm.json")) {
      return {
        ok: true,
        json: async () => ({
          approximateGroup: {
            candidate: [{ rxcui: "1191", name: "Amoxicilline", score: "100" }],
          },
        }),
      } as Response;
    }
    return {
      ok: true,
      json: async () => ({
        rxclassDrugInfoList: {
          rxclassDrugInfo: atcClasses.map((rxclassMinConceptItem) => ({ rxclassMinConceptItem })),
        },
      }),
    } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("searchDrugsWithAtc", () => {
  it("accepte un code ATC de niveau 4 (5 caractères), le format le plus souvent renvoyé par RxNav", async () => {
    // Avant le correctif, seul le niveau 5 (7 caractères) était accepté : ce
    // format n'étant presque jamais renvoyé par RxNav, atcCode restait
    // toujours null en pratique (voir tasks/audit-2026-08-23-full-codebase.md, H1).
    mockRxNavResponses([{ classId: "J01CA", className: "Penicillins with extended spectrum" }]);

    const [result] = await searchDrugsWithAtc("amoxicilline");

    expect(result.atcCode).toBe("J01CA");
  });

  it("accepte un code ATC de niveau 3 (4 caractères)", async () => {
    mockRxNavResponses([{ classId: "J01C", className: "Beta-lactam antibacterials" }]);

    const [result] = await searchDrugsWithAtc("amoxicilline");

    expect(result.atcCode).toBe("J01C");
  });

  it("retient le code le plus spécifique quand plusieurs niveaux sont renvoyés", async () => {
    mockRxNavResponses([
      { classId: "J01C", className: "Beta-lactam antibacterials" },
      { classId: "J01CA04", className: "Amoxicillin" },
      { classId: "J01CA", className: "Penicillins with extended spectrum" },
    ]);

    const [result] = await searchDrugsWithAtc("amoxicilline");

    expect(result.atcCode).toBe("J01CA04");
  });

  it("rejette les identifiants de classe qui ne sont pas des codes ATC valides", async () => {
    mockRxNavResponses([{ classId: "N0000175", className: "Autre système de classification" }]);

    const [result] = await searchDrugsWithAtc("amoxicilline");

    expect(result.atcCode).toBeNull();
  });

  it("renvoie un code ATC nul quand aucune classe n'est disponible", async () => {
    mockRxNavResponses([]);

    const [result] = await searchDrugsWithAtc("amoxicilline");

    expect(result.atcCode).toBeNull();
    expect(result.atcName).toBeNull();
  });
});
