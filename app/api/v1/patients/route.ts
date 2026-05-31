/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Provide a valid API key via Authorization: Bearer <key> or x-api-key header." },
    { status: 401 }
  );
}

// GET /api/v1/patients
export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(extractApiKey(req));
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const db = (await createAdminClient()) as any;

  let query = db
    .from("patients")
    .select("id, full_name, phone, email, notes, created_at", { count: "exact" })
    .eq("clinic_id", ctx.clinicId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, limit, offset },
  });
}
