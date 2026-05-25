"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PatientMessage {
  id: string;
  clinic_id: string;
  patient_id: string;
  sender_role: "doctor" | "patient";
  content: string;
  read_at: string | null;
  created_at: string;
}

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function getPatientMessages(patientId: string): Promise<PatientMessage[]> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("patient_messages")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true }) as { data: PatientMessage[] | null };

  return data ?? [];
}

export async function sendMessageAsDoctor(
  patientId: string,
  rawContent: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = messageSchema.safeParse({ content: rawContent });
  if (!parsed.success) return { success: false, error: "Message invalide" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: staffUser } = await (supabase as any)
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string } | null };

  if (!staffUser) return { success: false, error: "Accès non autorisé" };

  const { error } = await (supabase as any)
    .from("patient_messages")
    .insert({
      clinic_id: staffUser.clinic_id,
      patient_id: patientId,
      sender_role: "doctor",
      content: parsed.data.content,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/app/patients/${patientId}`);
  return { success: true };
}

export async function sendMessageAsPatient(
  rawContent: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = messageSchema.safeParse({ content: rawContent });
  if (!parsed.success) return { success: false, error: "Message invalide" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id, clinic_id")
    .eq("auth_user_id", user.id)
    .single() as { data: { id: string; clinic_id: string } | null };

  if (!patient) return { success: false, error: "Dossier patient introuvable" };

  const { error } = await (supabase as any)
    .from("patient_messages")
    .insert({
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      sender_role: "patient",
      content: parsed.data.content,
    });

  if (error) return { success: false, error: error.message };

  revalidatePath("/portail/dashboard");
  return { success: true };
}

export async function markMessagesAsRead(
  patientId: string,
  readerRole: "doctor" | "patient"
): Promise<void> {
  const supabase = await createClient();
  const senderToMark = readerRole === "doctor" ? "patient" : "doctor";

  await (supabase as any)
    .from("patient_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("patient_id", patientId)
    .eq("sender_role", senderToMark)
    .is("read_at", null);
}

export async function getUnreadCountForDoctor(patientId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await (supabase as any)
    .from("patient_messages")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .eq("sender_role", "patient")
    .is("read_at", null) as { count: number | null };

  return count ?? 0;
}
