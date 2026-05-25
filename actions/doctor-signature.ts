"use server";

import { createClient } from "@/lib/supabase/server";
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
    .single() as { data: DoctorSignature | null };

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
    .single() as { data: { clinic_id: string } | null };

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

export async function getDoctorSignatureByUserId(
  userId: string
): Promise<DoctorSignature | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: callerData } = await (supabase as any)
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string } | null };

  if (!callerData) return null;

  const { data } = await (supabase as any)
    .from("doctor_signatures")
    .select("*")
    .eq("user_id", userId)
    .eq("clinic_id", callerData.clinic_id)
    .single() as { data: DoctorSignature | null };

  return data;
}
