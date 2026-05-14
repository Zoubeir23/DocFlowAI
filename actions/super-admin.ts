"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireSuperAdmin(): Promise<{ userId: string } | null> {
  const db = (await createClient()) as any;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const { data: userData } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "super_admin") return null;
  return { userId: user.id };
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  clinic_id: string;
  clinic_name: string;
  plan: string;
}

export interface PlatformStats {
  total_clinics: number;
  active_clinics: number;
  total_users: number;
  total_appointments: number;
  plans: Record<string, number>;
}

// ── Queries ───────────────────────────────────────────────────────────────────

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
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  const { data: clinics } = await db
    .from("clinics")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

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

  if (options?.search) {
    const q = options.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.owner_email.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q)
    );
  }
  if (options?.plan) rows = rows.filter((r) => r.plan === options.plan);
  if (options?.activeOnly) rows = rows.filter((r) => r.is_active);

  return rows;
}

export async function listAllUsers(options?: {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminUserRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  const { data: users } = await db
    .from("users")
    .select("id, full_name, email, role, is_active, created_at, clinic_id, clinic:clinics(name)")
    .not("role", "eq", "super_admin")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!users?.length) return [];

  const clinicIds = [...new Set(users.map((u: any) => u.clinic_id).filter(Boolean))];
  const { data: subs } = await db
    .from("subscriptions")
    .select("clinic_id, plan")
    .in("clinic_id", clinicIds);

  const planByClinic = Object.fromEntries(
    (subs ?? []).map((s: any) => [s.clinic_id, s.plan])
  );

  let rows: AdminUserRow[] = users.map((u: any) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
    clinic_id: u.clinic_id,
    clinic_name: u.clinic?.name ?? "",
    plan: planByClinic[u.clinic_id] ?? "free",
  }));

  if (options?.search) {
    const q = options.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.clinic_name.toLowerCase().includes(q)
    );
  }
  if (options?.role) rows = rows.filter((r) => r.role === options.role);

  return rows;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function toggleUserActive(userId: string): Promise<ApiResponse<{ is_active: boolean }>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: user } = await db
    .from("users").select("is_active, role").eq("id", userId).single();

  if (!user) return { success: false, error: "Utilisateur introuvable" };
  if (user.role === "super_admin") return { success: false, error: "Impossible de désactiver un super admin" };

  const newValue = !user.is_active;
  const { error } = await db.from("users").update({ is_active: newValue }).eq("id", userId);
  if (error) return { success: false, error: "Erreur lors de la mise à jour" };

  return { success: true, data: { is_active: newValue } };
}

export async function toggleClinicActive(clinicId: string): Promise<ApiResponse<{ is_active: boolean }>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics").select("is_active").eq("id", clinicId).single();

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

  const { error } = await db
    .from("subscriptions")
    .update({ plan, status: "active" })
    .eq("clinic_id", clinicId);

  if (error) {
    // No subscription row yet — insert
    const { error: insertError } = await db
      .from("subscriptions")
      .insert({ clinic_id: clinicId, plan, status: "active" });

    if (insertError) return { success: false, error: "Erreur lors de la mise à jour du plan" };
  }

  return { success: true };
}
