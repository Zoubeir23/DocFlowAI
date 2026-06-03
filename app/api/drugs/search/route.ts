import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchDrugsWithAtc } from "@/lib/who-atc";
import type { AtcDrugOption } from "@/components/diagnostics/atc-drug-search";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.length < 2) return NextResponse.json([]);

  const { data: userData } = await supabase
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle() as { data: { clinic_id: string } | null };

  const [apiResults, customResults] = await Promise.all([
    searchDrugsWithAtc(query).catch(() => [] as AtcDrugOption[]),
    userData?.clinic_id
      ? supabase
          .from("custom_drugs" as never)
          .select("id, name, atc_code, atc_name")
          .eq("clinic_id", userData.clinic_id)
          .ilike("name", `%${query}%`)
          .limit(5)
          .then(({ data }) => (data ?? []) as { id: string; name: string; atc_code: string | null; atc_name: string | null }[])
      : Promise.resolve([]),
  ]);

  const customMapped: AtcDrugOption[] = customResults.map((d) => ({
    rxcui: `custom_${d.id}`,
    name: d.name,
    atcCode: d.atc_code,
    atcName: d.atc_name ? `${d.atc_name} (personnalisé)` : "Médicament personnalisé",
  }));

  const combined = [
    ...customMapped,
    ...(apiResults as AtcDrugOption[]).filter(
      (r) => !customMapped.some((c) => c.name.toLowerCase() === r.name.toLowerCase())
    ),
  ];

  return NextResponse.json(combined);
}
