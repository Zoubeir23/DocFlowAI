"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/actions/admin-shared";

export interface AdminApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  clinic_id: string;
  clinic_name: string;
  owner_email: string;
}

export interface AdminWebhookRow {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_status_code: number | null;
  failure_count: number;
  clinic_id: string;
  clinic_name: string;
  owner_email: string;
}

export async function listAllApiKeys(): Promise<AdminApiKeyRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;

  const { data: keys } = await db
    .from("api_keys")
    .select("id, name, key_prefix, is_active, created_at, last_used_at, clinic_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!keys?.length) return [];

  const clinicIds = [...new Set(keys.map((k: any) => k.clinic_id).filter(Boolean))];
  const [clinicsResult, ownersResult] = await Promise.all([
    db.from("clinics").select("id, name").in("id", clinicIds),
    db.from("users").select("clinic_id, email").eq("role", "owner").in("clinic_id", clinicIds),
  ]);

  const clinicById = Object.fromEntries((clinicsResult.data ?? []).map((c: any) => [c.id, c.name]));
  const ownerByClinic = Object.fromEntries((ownersResult.data ?? []).map((u: any) => [u.clinic_id, u.email]));

  return keys.map((k: any) => ({
    ...k,
    clinic_name: clinicById[k.clinic_id] ?? "—",
    owner_email: ownerByClinic[k.clinic_id] ?? "—",
  }));
}

export async function listAllWebhooks(): Promise<AdminWebhookRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;

  const { data: hooks } = await db
    .from("webhooks")
    .select("id, name, url, events, is_active, created_at, last_triggered_at, last_status_code, failure_count, clinic_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!hooks?.length) return [];

  const clinicIds = [...new Set(hooks.map((h: any) => h.clinic_id).filter(Boolean))];
  const [clinicsResult, ownersResult] = await Promise.all([
    db.from("clinics").select("id, name").in("id", clinicIds),
    db.from("users").select("clinic_id, email").eq("role", "owner").in("clinic_id", clinicIds),
  ]);

  const clinicById = Object.fromEntries((clinicsResult.data ?? []).map((c: any) => [c.id, c.name]));
  const ownerByClinic = Object.fromEntries((ownersResult.data ?? []).map((u: any) => [u.clinic_id, u.email]));

  return hooks.map((h: any) => ({
    ...h,
    clinic_name: clinicById[h.clinic_id] ?? "—",
    owner_email: ownerByClinic[h.clinic_id] ?? "—",
  }));
}
