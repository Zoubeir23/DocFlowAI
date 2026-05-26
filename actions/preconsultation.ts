"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const preconsultationSchema = z.object({
  reason: z.string().min(1, "La raison est requise").max(1000),
  symptoms: z.string().max(1000),
  medications: z.string().max(500),
  allergies: z.string().max(500),
  pain_level: z.number().int().min(0).max(10),
});

export type PreconsultationFormData = z.infer<typeof preconsultationSchema>;

export async function submitPreconsultationForm(
  appointmentId: string,
  rawData: PreconsultationFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = preconsultationSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle() as { data: { id: string } | null };

  if (!patient) return { success: false, error: "Dossier patient introuvable" };

  const { error } = await (supabase as any)
    .from("appointments")
    .update({
      preconsultation_form: parsed.data,
      preconsultation_submitted_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .in("status", ["booked", "confirmed"])
    .is("preconsultation_submitted_at", null); // idempotency — une seule soumission

  if (error) return { success: false, error: error.message };

  revalidatePath("/portail/dashboard");
  return { success: true };
}
