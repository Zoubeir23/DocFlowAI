"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/actions/admin-shared";
import type { ApiResponse } from "@/types";

export interface AdminClinicRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  plan: string;
  subscription_status: string;
  user_count: number;
  appointment_count: number;
  owner_email: string;
  owner_name: string;
}

export interface PlatformStats {
  total_clinics: number;
  active_clinics: number;
  total_users: number;
  total_appointments: number;
  plans: Record<string, number>;
}

export async function getPlatformStats(): Promise<PlatformStats | null> {
  const auth = await requireSuperAdmin();
  if (!auth) return null;

  const db = (await createAdminClient()) as any;

  const [clinicsResult, activeResult, usersResult, appointmentsResult, subsResult] =
    await Promise.all([
      db.from("clinics").select("id", { count: "exact", head: true }),
      db.from("clinics").select("id", { count: "exact", head: true }).eq("is_active", true),
      db.from("users").select("id", { count: "exact", head: true }),
      db.from("appointments").select("id", { count: "exact", head: true }),
      db.from("subscriptions").select("plan"),
    ]);

  const planCounts: Record<string, number> = {};
  for (const sub of subsResult.data ?? []) {
    planCounts[sub.plan] = (planCounts[sub.plan] ?? 0) + 1;
  }

  return {
    total_clinics: clinicsResult.count ?? 0,
    active_clinics: activeResult.count ?? 0,
    total_users: usersResult.count ?? 0,
    total_appointments: appointmentsResult.count ?? 0,
    plans: planCounts,
  };
}

export async function listAllClinics(options?: {
  search?: string;
  plan?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AdminClinicRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;
  const pageLimit = Math.min(options?.limit ?? 50, 100);
  const pageOffset = options?.offset ?? 0;
  const hasFilters = !!(options?.search || options?.plan || options?.activeOnly);

  // Build clinic query with DB-level filters to reduce data transfer
  let clinicsQuery = db
    .from("clinics")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false });

  if (options?.activeOnly) clinicsQuery = clinicsQuery.eq("is_active", true);
  if (options?.search) clinicsQuery = clinicsQuery.ilike("name", `%${options.search}%`);

  // When filtering by plan or doing owner search, fetch up to 1000 to allow in-memory pagination
  if (!hasFilters) {
    clinicsQuery = clinicsQuery.range(pageOffset, pageOffset + pageLimit - 1);
  } else {
    clinicsQuery = clinicsQuery.limit(1000);
  }

  const { data: clinics } = await clinicsQuery;
  if (!clinics?.length) return [];

  const clinicIds = clinics.map((c: any) => c.id);

  const [subsResult, ownersResult, userCountsResult, apptCountsResult] = await Promise.all([
    db.from("subscriptions").select("clinic_id, plan, status").in("clinic_id", clinicIds),
    db.from("users").select("clinic_id, full_name, email").eq("role", "owner").in("clinic_id", clinicIds),
    db.from("users").select("clinic_id").in("clinic_id", clinicIds),
    db.from("appointments").select("clinic_id").in("clinic_id", clinicIds),
  ]);

  const subsByClinic = Object.fromEntries(
    (subsResult.data ?? []).map((s: any) => [s.clinic_id, s])
  );
  const ownersByClinic = Object.fromEntries(
    (ownersResult.data ?? []).map((u: any) => [u.clinic_id, u])
  );
  const userCountByClinic: Record<string, number> = {};
  for (const u of userCountsResult.data ?? []) {
    userCountByClinic[u.clinic_id] = (userCountByClinic[u.clinic_id] ?? 0) + 1;
  }
  const apptCountByClinic: Record<string, number> = {};
  for (const a of apptCountsResult.data ?? []) {
    apptCountByClinic[a.clinic_id] = (apptCountByClinic[a.clinic_id] ?? 0) + 1;
  }

  let rows: AdminClinicRow[] = clinics.map((clinic: any) => ({
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    is_active: clinic.is_active,
    created_at: clinic.created_at,
    plan: subsByClinic[clinic.id]?.plan ?? "free",
    subscription_status: subsByClinic[clinic.id]?.status ?? "active",
    user_count: userCountByClinic[clinic.id] ?? 0,
    appointment_count: apptCountByClinic[clinic.id] ?? 0,
    owner_email: ownersByClinic[clinic.id]?.email ?? "",
    owner_name: ownersByClinic[clinic.id]?.full_name ?? "",
  }));

  // Apply remaining filters that couldn't be pushed to DB
  if (options?.search) {
    const searchQuery = options.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery) ||
        r.owner_email.toLowerCase().includes(searchQuery) ||
        r.owner_name.toLowerCase().includes(searchQuery)
    );
  }
  if (options?.plan) rows = rows.filter((r) => r.plan === options.plan);

  // Apply pagination after filtering when filters are active
  if (hasFilters) {
    rows = rows.slice(pageOffset, pageOffset + pageLimit);
  }

  return rows;
}

export async function toggleClinicActive(clinicId: string): Promise<ApiResponse<{ is_active: boolean }>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics").select("is_active").eq("id", clinicId).maybeSingle();

  if (!clinic) return { success: false, error: "Clinique introuvable" };

  const newValue = !clinic.is_active;
  const { error } = await db.from("clinics").update({ is_active: newValue }).eq("id", clinicId);
  if (error) return { success: false, error: "Erreur lors de la mise à jour" };

  return { success: true, data: { is_active: newValue } };
}

export async function updateClinicPlan(
  clinicId: string,
  plan: "free" | "starter" | "professional" | "enterprise"
): Promise<ApiResponse> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await db
    .from("subscriptions")
    .update({
      plan,
      status: "active",
      current_period_start: periodStart,
      current_period_end: periodEnd,
    })
    .eq("clinic_id", clinicId);

  if (error) {
    const { error: insertError } = await db
      .from("subscriptions")
      .insert({
        clinic_id: clinicId,
        plan,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
      });

    if (insertError) return { success: false, error: "Erreur lors de la mise à jour du plan" };
  }

  return { success: true };
}
