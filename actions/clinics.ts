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

  const allowedRoles = ["owner", "receptionist", "assistant"] as const;
  type AllowedRole = (typeof allowedRoles)[number];
  const sanitizedRole: AllowedRole = allowedRoles.includes(accessEntry.role as AllowedRole)
    ? (accessEntry.role as AllowedRole)
    : "receptionist";

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

  const { count: existingCount } = await db
    .from("user_clinic_access")
    .select("clinic_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((existingCount ?? 0) >= 5) {
    return {
      success: false,
      error: "Maximum 5 cliniques par compte Entreprise",
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

  const { data: clinic, error: clinicError } = await adminDb
    .from("clinics")
    .insert({
      name: trimmedName,
      slug: uniqueSlug,
      timezone: "UTC",
      owner_id: user.id,
    })
    .select()
    .maybeSingle();

  if (clinicError) {
    console.error("[createNewClinic] insert error:", clinicError.code);
    return { success: false, error: "Erreur lors de la création de la clinique" };
  }

  await adminDb.from("clinic_settings").insert({
    clinic_id: clinic.id,
    widget_color: "#2563eb",
    welcome_message: `Bienvenue à ${clinicName} ! Je suis votre assistant de réservation IA. Comment puis-je vous aider ?`,
    faq: [],
    slot_duration_minutes: 15,
    tone: "professionnel et amical",
    booking_behavior: "Guide les patients vers le rendez-vous le plus proche disponible.",
  });

  await adminDb.from("subscriptions").insert({
    clinic_id: clinic.id,
    plan: "enterprise",
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await adminDb.from("user_clinic_access").insert({
    user_id: user.id,
    clinic_id: clinic.id,
    role: "owner",
  });

  revalidatePath("/app/clinics");
  return { success: true, data: { clinicId: clinic.id, slug: uniqueSlug } };
}
