"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

export interface DoctorSignature {
  id: string;
  user_id: string;
  clinic_id: string;
  signature_data_url: string;
  updated_at: string;
}

const signatureDataUrlSchema = z
  .string()
  .min(1)
  .max(200_000)
  .refine((value) => value.startsWith("data:image/png;base64,"), {
    message: "Format invalide — PNG base64 attendu",
  });

export async function getDoctorSignature(): Promise<DoctorSignature | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await (supabase as any)
    .from("doctor_signatures")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle() as { data: DoctorSignature | null };

  return data;
}

export async function saveDoctorSignature(
  rawDataUrl: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = signatureDataUrlSchema.safeParse(rawDataUrl);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: userData } = await (supabase as any)
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle() as { data: { clinic_id: string } | null };

  if (!userData) return { success: false, error: "Utilisateur introuvable" };

  const { error } = await (supabase as any)
    .from("doctor_signatures")
    .upsert(
      {
        user_id: user.id,
        clinic_id: userData.clinic_id,
        signature_data_url: parsed.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteDoctorSignature(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { error } = await (supabase as any)
    .from("doctor_signatures")
    .delete()
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Signature à apposer sur le document d'un diagnostic validé.
 *
 * Le validateur est résolu côté serveur à partir du diagnostic : aucune Server
 * Action ne prend d'identifiant d'utilisateur libre, ce qui évite qu'un membre
 * de la clinique puisse récupérer l'image de signature d'un confrère sans
 * passer par un document réel. Tant que le diagnostic n'est pas validé, aucune
 * signature n'est renvoyée.
 *
 * Depuis la migration 013, plus aucune policy n'autorise un compte à lire la
 * signature d'un confrère : la lecture finale passe donc par le client
 * d'administration, une fois la clinique de l'appelant et le statut du
 * diagnostic vérifiés ici — c'est cette fonction, et non une policy trop large,
 * qui porte la décision d'autorisation.
 */
export async function getSignatureForValidatedDiagnostic(
  diagnosticId: string
): Promise<DoctorSignature | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Les tables métier ne figurent pas dans les types générés : un seul cast
  // local plutôt qu'un par requête.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: callerData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle() as { data: { clinic_id: string } | null };

  if (!callerData) return null;

  // Le diagnostic est lu dans la clinique de l'appelant : un identifiant
  // appartenant à une autre clinique ne remonte rien.
  const { data: diagnostic } = await db
    .from("diagnostics")
    .select("validated_by_user_id, validation_status")
    .eq("id", diagnosticId)
    .eq("clinic_id", callerData.clinic_id)
    .maybeSingle() as {
      data: { validated_by_user_id: string | null; validation_status: string } | null;
    };

  if (!diagnostic?.validated_by_user_id || diagnostic.validation_status !== "validated") {
    return null;
  }

  // Le filtre sur clinic_id reste indispensable : le client d'administration
  // ignore la RLS, c'est donc cette contrainte qui garantit qu'on ne lit pas la
  // signature d'un praticien extérieur à la clinique de l'appelant.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = (await createAdminClient()) as any;

  const { data } = await adminDb
    .from("doctor_signatures")
    .select("*")
    .eq("user_id", diagnostic.validated_by_user_id)
    .eq("clinic_id", callerData.clinic_id)
    .maybeSingle() as { data: DoctorSignature | null };

  return data;
}
