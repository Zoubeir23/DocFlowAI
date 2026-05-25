"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PreconsultationFormData {
  reason: string;
  symptoms: string;
  medications: string;
  allergies: string;
  pain_level: number;
}

export async function submitPreconsultationForm(
  appointmentId: string,
  formData: PreconsultationFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single() as { data: { id: string } | null };

  if (!patient) return { success: false, error: "Dossier patient introuvable" };

  const { error } = await (supabase as any)
    .from("appointments")
    .update({
      preconsultation_form: formData,
      preconsultation_submitted_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .in("status", ["booked", "confirmed"]);

  if (error) return { success: false, error: error.message };

  revalidatePath("/portail/dashboard");
  return { success: true };
}
