"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { OnboardingInput } from "@/lib/validations";
import type { ApiResponse, Clinic } from "@/types";

async function getDB() {
  return (await createClient()) as any;
}

export async function createOnboarding(
  data: OnboardingInput
): Promise<ApiResponse<{ clinicId: string }>> {
  // Use regular client only to verify the authenticated user
  const authDb = await getDB();
  const { data: authData, error: authError } = await authDb.auth.getUser();

  if (authError || !authData.user) {
    return { success: false, error: "Not authenticated" };
  }

  const user = authData.user;

  // Défense en profondeur : la case CGU/politique de confidentialité côté
  // client ne fait que bloquer le bouton — un appel direct à supabase.auth.signUp()
  // la contourne. On exige donc ici la présence de l'horodatage de consentement
  // écrit dans user_metadata lors du signUp (voir app/(auth)/signup/page.tsx),
  // ce qui empêche la création d'une clinique (donc l'accès effectif à
  // l'application) pour un compte n'ayant jamais accepté les conditions.
  if (!user.user_metadata?.terms_accepted_at) {
    return { success: false, error: "Vous devez accepter les CGU et la politique de confidentialité avant de continuer." };
  }

  // Use admin client (service role) to bypass RLS for all inserts during onboarding
  const db = (await createAdminClient()) as any;

  // C1 fix + HIGH fix: l'onboarding entier (clinique, profil, réglages,
  // abonnement, services, horaires) s'exécute dans une seule transaction
  // Postgres (RPC create_clinic_onboarding) — soit tout réussit, soit rien
  // n'est créé. La RPC vérifie aussi elle-même qu'aucune clinique n'est déjà
  // rattachée à l'utilisateur (défense en profondeur contre la race
  // condition d'un double-clic sur le formulaire d'onboarding).
  const { data: result, error } = await db.rpc("create_clinic_onboarding", {
    p_user_id: user.id,
    p_clinic_name: data.clinicName,
    p_slug: data.slug,
    p_timezone: data.timezone,
    p_full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Doctor",
    p_email: user.email!,
  });

  if (error) {
    if (error.message?.includes("already_onboarded")) {
      return { success: false, error: "Vous avez déjà une clinique. Utilisez la création de clinique multiple depuis les paramètres." };
    }
    if (error.code === "23505") {
      return { success: false, error: "This clinic URL is already taken. Please choose another." };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: { clinicId: (result as { clinic_id: string }).clinic_id } };
}

export async function getCurrentClinic() {
  const db = await getDB();

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData) return null;

  const { data: clinic } = await db
    .from("clinics")
    .select("*")
    .eq("id", userData.clinic_id)
    .maybeSingle();

  return clinic ? { ...(clinic as Clinic), userRole: userData.role } : null;
}

export async function updateClinic(
  clinicId: string,
  updates: { name?: string; timezone?: string; logo_url?: string }
): Promise<ApiResponse> {
  const db = await getDB();
  // C1 fix: auth guard + ownership check before update
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Not authenticated" };

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData || userData.clinic_id !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await db.from("clinics").update(updates).eq("id", clinicId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
