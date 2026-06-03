import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: userData } = await (supabase as any)
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle() as { data: { clinic_id: string } | null };

  if (!userData?.clinic_id) return NextResponse.json({ error: "Clinique introuvable" }, { status: 403 });

  const body = await request.json() as { name: string; atc_code?: string; atc_name?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const db = supabase as any;
  const { data, error } = await db
    .from("custom_drugs")
    .upsert(
      { clinic_id: userData.clinic_id, name: body.name.trim(), atc_code: body.atc_code ?? null, atc_name: body.atc_name ?? null },
      { onConflict: "clinic_id,name" }
    )
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
