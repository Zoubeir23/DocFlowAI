/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["booked", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  notes: z.string().optional().nullable(),
});

async function getAuthenticatedClinicId(db: any): Promise<string | null> {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle();
  return userData?.clinic_id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = (await createClient()) as any;

  // C6 fix: resolve clinic_id from session — never trust caller
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  // C6 fix: filter by clinic_id to prevent IDOR
  const { error } = await db
    .from("appointments")
    .update(parsed.data)
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = (await createClient()) as any;

  // C6 fix: resolve clinic_id from session — never trust caller
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // C6 fix: filter by clinic_id to prevent IDOR
  const { error } = await db
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) return NextResponse.json({ error: "Erreur lors de l'annulation." }, { status: 400 });
  return NextResponse.json({ success: true });
}
