"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function invitePatientToPortal(patientId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autorisé" };

  const { data: patient } = await supabase
    .from("patients")
    .select("id, email, full_name, clinic_id")
    .eq("id", patientId)
    .maybeSingle() as { data: { id: string; email: string | null; full_name: string; clinic_id: string } | null; error: unknown };

  if (!patient) return { success: false, error: "Patient introuvable" };
  if (!patient.email) return { success: false, error: "Ce patient n'a pas d'email enregistré" };

  const adminSupabase = await createAdminClient();

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/portail/callback`;

  const { error } = await (adminSupabase.auth.admin as any).generateLink({
    type: "magiclink",
    email: patient.email,
    options: { redirectTo },
  });

  if (error) return { success: false, error: error.message };

  await (supabase as any)
    .from("patients")
    .update({ portal_invited_at: new Date().toISOString() })
    .eq("id", patientId);

  revalidatePath(`/app/patients/${patientId}`);
  return { success: true };
}

export async function linkPatientToAuth(): Promise<{ success: boolean; patientId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Non authentifié" };

  // Déjà lié ?
  const { data: existing } = await (supabase as any)
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single() as { data: { id: string } | null };

  if (existing) return { success: true, patientId: existing.id };

  // Lier par email
  const adminSupabase = await createAdminClient();
  const { data: patient, error } = await (adminSupabase as any)
    .from("patients")
    .update({ auth_user_id: user.id })
    .eq("email", user.email)
    .select("id")
    .single() as { data: { id: string } | null; error: unknown };

  if (error || !patient) {
    return { success: false, error: "Aucun dossier patient trouvé pour cet email" };
  }

  return { success: true, patientId: patient.id };
}

export interface PortalPatient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  clinic_id: string;
  clinics: { name: string; slug: string } | null;
}

export interface PortalAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  cancel_token: string | null;
  services: { name: string; duration_minutes: number; price: number | null } | null;
}

export async function getPatientPortalData(): Promise<{ patient: PortalPatient; appointments: PortalAppointment[] } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id, full_name, phone, email, clinic_id, clinics(name, slug)")
    .eq("auth_user_id", user.id)
    .single() as { data: PortalPatient | null };

  if (!patient) return null;

  const { data: appointments } = await (supabase as any)
    .from("appointments")
    .select("id, start_at, end_at, status, notes, cancel_token, services(name, duration_minutes, price)")
    .eq("patient_id", patient.id)
    .order("start_at", { ascending: false }) as { data: PortalAppointment[] | null };

  return {
    patient,
    appointments: appointments ?? [],
  };
}

export async function cancelAppointmentAsPatient(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single() as { data: { id: string } | null };

  if (!patient) return { success: false, error: "Patient introuvable" };

  const { error } = await (supabase as any)
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .in("status", ["booked", "confirmed"]);

  if (error) return { success: false, error: error.message };

  revalidatePath("/portail/dashboard");
  return { success: true };
}
