import { describe, it, expect, vi, afterEach } from "vitest";
import { checkDrugInteractions } from "@/lib/who-drug-interactions";

function buildRxNavResponse(severity: string) {
  return {
    fullInteractionTypeGroup: [
      {
        sourceDisclaimer: "",
        sourceName: "DrugBank",
        fullInteractionType: [
          {
            minConcept: [],
            interactionPair: [
              {
                interactionConcept: [
                  {
                    minConceptItem: { rxcui: "41493", name: "Warfarine", tty: "IN" },
                    sourceConceptItem: { id: "", name: "", url: "", dictionaryTitle: "" },
                  },
                  {
                    minConceptItem: { rxcui: "1191", name: "Aspirine", tty: "IN" },
                    sourceConceptItem: { id: "", name: "", url: "", dictionaryTitle: "" },
                  },
                ],
                severity,
                description: "Risque hémorragique accru.",
              },
            ],
          },
        ],
      },
    ],
  };
}

function mockFetchResolving(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("checkDrugInteractions", () => {
  it("signale le service indisponible quand RxNav répond en erreur", async () => {
    mockFetchResolving({ ok: false, status: 503 });

    const result = await checkDrugInteractions(["41493", "1191"]);

    // Le point critique : une panne ne doit jamais ressembler à « aucune
    // interaction », sinon le prescripteur lit une confirmation infondée.
    expect(result.status).toBe("unavailable");
    expect(result.interactions).toEqual([]);
  });

  it("signale le service indisponible quand la requête échoue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau injoignable")));

    const result = await checkDrugInteractions(["41493", "1191"]);

    expect(result.status).toBe("unavailable");
  });

  it("distingue une absence réelle d'interaction d'une indisponibilité", async () => {
    mockFetchResolving({ ok: true, json: async () => ({}) });

    const result = await checkDrugInteractions(["41493", "1191"]);

    expect(result.status).toBe("checked");
    expect(result.interactions).toEqual([]);
    expect(result.hasCritical).toBe(false);
  });

  it("ne contacte pas RxNav avec moins de deux codes valides", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkDrugInteractions(["41493", "pas-un-code", ""]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.status).toBe("checked");
    expect(result.interactions).toEqual([]);
  });

  it("remonte les interactions et marque les sévérités hautes", async () => {
    mockFetchResolving({ ok: true, json: async () => buildRxNavResponse("major") });

    const result = await checkDrugInteractions(["41493", "1191"]);

    expect(result.status).toBe("checked");
    expect(result.interactions).toHaveLength(1);
    expect(result.interactions[0]).toMatchObject({
      drug1Name: "Warfarine",
      drug2Name: "Aspirine",
      severity: "high",
      source: "DrugBank",
    });
    expect(result.hasCritical).toBe(true);
  });

  it("ne remonte qu'une fois une paire dupliquée dans deux sources", async () => {
    const duplicated = buildRxNavResponse("moderate");
    duplicated.fullInteractionTypeGroup.push({
      ...duplicated.fullInteractionTypeGroup[0],
      sourceName: "ONCHigh",
    });
    mockFetchResolving({ ok: true, json: async () => duplicated });

    const result = await checkDrugInteractions(["41493", "1191"]);

    expect(result.interactions).toHaveLength(1);
    expect(result.hasCritical).toBe(false);
  });
});
