/**
 * Pharmacovigilance signal lookup via OpenFDA Drug Adverse Events API.
 * WHO VigiAccess does not have a public programmatic API.
 * OpenFDA provides similar adverse event data from FAERS (FDA Adverse Event Reporting System).
 * Reference: https://open.fda.gov/apis/drug/event/
 *
 * Set OPENFDA_API_KEY env var to raise the rate limit from 40 to 240 req/min.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PharmacovigilanceSignal } from "@/types";

const OPENFDA_BASE_URL = "https://api.fda.gov/drug/event.json";

function buildOpenFdaUrl(base: string, params: Record<string, string>): string {
  const apiKey = process.env.OPENFDA_API_KEY;
  const searchParams = new URLSearchParams(params);
  if (apiKey) searchParams.set("api_key", apiKey);
  return `${base}?${searchParams}`;
}

async function fetchAdverseEventSignals(
  rxcui: string,
  drugName: string
): Promise<PharmacovigilanceSignal | null> {
  try {
    const reactionUrl = buildOpenFdaUrl(OPENFDA_BASE_URL, {
      search: `patient.drug.openfda.rxcui:"${rxcui}"`,
      count: "patient.reaction.reactionmeddrapt.exact",
      limit: "5",
    });

    const response = await fetch(reactionUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const json: {
      meta?: { results?: { total?: number } };
      results?: Array<{ term: string; count: number }>;
    } = await response.json();

    const topReactions = (json.results ?? []).slice(0, 5).map((r) => r.term);
    const totalReports = json.meta?.results?.total ?? 0;

    if (totalReports === 0) return null;

    const seriousUrl = buildOpenFdaUrl(OPENFDA_BASE_URL, {
      search: `patient.drug.openfda.rxcui:"${rxcui}" AND serious:1`,
      limit: "1",
    });

    const seriousResponse = await fetch(seriousUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    let seriousReports = 0;
    if (seriousResponse.ok) {
      const seriousJson: { meta?: { results?: { total?: number } } } =
        await seriousResponse.json();
      seriousReports = seriousJson.meta?.results?.total ?? 0;
    }

    const seriousnessRate =
      totalReports > 0 ? Math.round((seriousReports / totalReports) * 100) : 0;

    return {
      drugName,
      rxcui,
      totalReports,
      seriousReports,
      seriousnessRate,
      topReactions,
      source: "FDA FAERS",
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rxcui = searchParams.get("rxcui");
  const drugName = searchParams.get("drugName") ?? "";

  if (!rxcui || !/^\d+$/.test(rxcui)) {
    return NextResponse.json(
      { error: "rxcui param must be a numeric RxNorm CUI" },
      { status: 400 }
    );
  }

  const signal = await fetchAdverseEventSignals(rxcui, drugName);
  return NextResponse.json({ signal });
}
