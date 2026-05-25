"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/actions/admin-shared";
import type { ApiResponse } from "@/types";

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

export async function listAllUsers(options?: {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminUserRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;
  const pageLimit = Math.min(options?.limit ?? 50, 100);
  const pageOffset = options?.offset ?? 0;
  const hasFilters = !!(options?.search || options?.role);

  let usersQuery = db
    .from("users")
    .select("id, full_name, email, role, is_active, created_at, clinic_id, clinic:clinics(name)")
    .order("created_at", { ascending: false });

  if (options?.role) usersQuery = usersQuery.eq("role", options.role);

  if (!hasFilters) {
    usersQuery = usersQuery.range(pageOffset, pageOffset + pageLimit - 1);
  } else {
    usersQuery = usersQuery.limit(1000);
  }

  const { data: users } = await usersQuery;
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
    const searchQuery = options.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(searchQuery) ||
        r.email.toLowerCase().includes(searchQuery) ||
        r.clinic_name.toLowerCase().includes(searchQuery)
    );
  }

  if (hasFilters) {
    rows = rows.slice(pageOffset, pageOffset + pageLimit);
  }

  return rows;
}

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

export async function updateUserRole(
  userId: string,
  role: "owner" | "receptionist" | "assistant" | "super_admin"
): Promise<ApiResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: target } = await db.from("users").select("role").eq("id", userId).single();
  if (!target) return { success: false, error: "Utilisateur introuvable" };

  if (target.role === "super_admin" && auth.userId !== userId) {
    return { success: false, error: "Impossible de modifier le rôle d'un super admin" };
  }

  const { error } = await db.from("users").update({ role }).eq("id", userId);
  if (error) return { success: false, error: "Erreur lors de la mise à jour du rôle" };

  return { success: true };
}
