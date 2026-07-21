"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/types";

export interface ClinicAccessEntry {
  clinic_id: string;
  role: string;
  joined_at: string;
  clinic: {
    id: string;
    name: string;
    slug: string;
  };
  is_active: boolean;
}

async function getAuthenticatedUser() {
  const db = (await createClient()) as any;
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  return { db, user };
}

export async function listUserClinics(): Promise<ClinicAccessEntry[]> {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const { db, user } = auth;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle();

  const activeclinicId = userData?.clinic_id;

  const { data: access } = await db
    .from("user_clinic_access")
    .select("clinic_id, role, joined_at, clinic:clinics(id, name, slug)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (!access) return [];

  return access.map((entry: any) => ({
    ...entry,
    is_active: entry.clinic_id === activeclinicId,
  }));
}

export async function switchActiveClinic(
  clinicId: string
): Promise<ApiResponse<void>> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const { db, user } = auth;

  const { data: accessEntry } = await db
    .from("user_clinic_access")
    .select("clinic_id, role")
    .eq("user_id", user.id)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (!accessEntry) {
    return { success: false, error: "Accès non autorisé à cette clinique" };
  }

  // M fix: un rôle inattendu en base doit faire échouer explicitement
  // l'opération plutôt que retomber silencieusement sur "receptionist", qui
  // masquerait une incohérence de données au lieu de la signaler.
  const allowedRoles = ["owner", "receptionist", "assistant"] as const;
  type AllowedRole = (typeof allowedRoles)[number];
  if (!allowedRoles.includes(accessEntry.role as AllowedRole)) {
    console.error("[switchActiveClinic] unexpected role in user_clinic_access:", accessEntry.role);
    return { success: false, error: "Rôle d'accès invalide pour cette clinique." };
  }
  const sanitizedRole: AllowedRole = accessEntry.role as AllowedRole;

  const adminDb = (await createAdminClient()) as any;
  const { error } = await adminDb
    .from("users")
    .update({ clinic_id: clinicId, role: sanitizedRole })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/app", "layout");
  return { success: true };
}

const CLINIC_NAME_MAX_LENGTH = 100;

export async function createNewClinic(
  clinicName: string
): Promise<ApiResponse<{ clinicId: string; slug: string }>> {
  const auth = await getAuthenticatedUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  // Input validation
  const trimmedName = clinicName?.trim() ?? "";
  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: "Le nom doit contenir au moins 2 caractères" };
  }
  if (trimmedName.length > CLINIC_NAME_MAX_LENGTH) {
    return { success: false, error: `Le nom ne peut pas dépasser ${CLINIC_NAME_MAX_LENGTH} caractères` };
  }

  const { db, user } = auth;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData?.clinic_id) {
    return { success: false, error: "Clinique principale introuvable" };
  }

  if (userData.role !== "owner" && userData.role !== "super_admin") {
    return { success: false, error: "Seul le propriétaire peut créer de nouvelles cliniques" };
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan")
    .eq("clinic_id", userData.clinic_id)
    .maybeSingle();

  if (sub?.plan !== "enterprise") {
    return {
      success: false,
      error: "La création de cliniques multiples est réservée au plan Entreprise",
    };
  }

  const slug = trimmedName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);

  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

  const adminDb = (await createAdminClient()) as any;

  // M fix: quota de 5 cliniques + création (clinics, clinic_settings,
  // subscriptions, user_clinic_access) exécutés dans une seule transaction
  // verrouillée par utilisateur — élimine la race condition d'un double-clic
  // et garantit qu'aucun état partiel n'est créé en cas d'échec.
  const { data: result, error } = await adminDb.rpc("create_enterprise_clinic", {
    p_user_id: user.id,
    p_name: trimmedName,
    p_slug: uniqueSlug,
  });

  if (error) {
    if (error.message?.includes("clinic_quota_exceeded")) {
      return { success: false, error: "Maximum 5 cliniques par compte Entreprise" };
    }
    console.error("[createNewClinic] rpc error:", error.code ?? error.message);
    return { success: false, error: "Erreur lors de la création de la clinique" };
  }

  const { clinic_id: clinicId } = result as { clinic_id: string; slug: string };

  revalidatePath("/app/clinics");
  return { success: true, data: { clinicId, slug: uniqueSlug } };
}
