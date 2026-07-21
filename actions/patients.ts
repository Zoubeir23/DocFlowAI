"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { patientSchema } from "@/lib/validations";
import { sanitizePostgrestSearchTerm } from "@/lib/security/sanitize-postgrest-search";
import type { ApiResponse, PaginatedResult, Patient } from "@/types";
import type { z } from "zod";

type PatientInput = z.infer<typeof patientSchema>;

async function getDB() {
  return (await createClient()) as any;
}

async function getAuthenticatedClinicId(db: any): Promise<string | null> {
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).maybeSingle();
  return userData?.clinic_id ?? null;
}

// H3 fix: le carnet médical partagé (diagnostics, prescriptions,
// traitements) contient des données de santé sensibles — seul le rôle owner
// (seul rôle assimilable à du personnel médical dans l'enum actuel) doit
// pouvoir le lier ou le consulter, pas receptionist/assistant.
async function getAuthenticatedClinicIdForMedicalRole(db: any): Promise<string | null> {
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;
  const { data: userData } = await db.from("users").select("clinic_id, role").eq("id", authData.user.id).maybeSingle();
  if (!userData || !["owner", "super_admin"].includes(userData.role)) return null;
  return userData.clinic_id ?? null;
}

export async function getPatients(
  clinicId: string,
  page = 1,
  pageSize = 20,
  search = ""
): Promise<PaginatedResult<Patient>> {
  const db = await getDB();
  // C5 fix: verify caller owns this clinic
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("patients")
    .select("*", { count: "exact" })
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (search) {
    const safeSearch = sanitizePostgrestSearchTerm(search);
    if (safeSearch) {
      query = query.or(`full_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
    }
  }

  const { data, count, error } = await query.range(from, to);

  return {
    data: (data || []) as Patient[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getPatient(patientId: string) {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return null;
  const { data } = await db
    .from("patients")
    .select("*, carnet:patient_carnets(public_code)")
    .eq("id", patientId)
    .eq("clinic_id", clinicId)
    .maybeSingle();
  return data as (Patient & { carnet: { public_code: string } | null }) | null;
}

export async function getPatientAppointments(patientId: string) {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return [];
  const { data } = await db
    .from("appointments")
    .select("*, service:services(*)")
    .eq("patient_id", patientId)
    .eq("clinic_id", clinicId)
    .order("start_at", { ascending: false });
  return data || [];
}

export async function createPatient(
  clinicId: string,
  data: PatientInput
): Promise<ApiResponse<{ id: string }>> {
  const db = await getDB();
  // C5 fix: ownership check
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }
  const validated = patientSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { data: patient, error } = await db
    .from("patients")
    .insert({ ...validated.data, clinic_id: clinicId, email: validated.data.email || null })
    .select()
    .maybeSingle();

  if (error || !patient) return { success: false, error: error?.message ?? "Patient creation failed" };
  return { success: true, data: { id: patient.id } };
}

export async function updatePatient(
  patientId: string,
  data: Partial<PatientInput>
): Promise<ApiResponse> {
  const db = await getDB();
  // C5 fix: scope update to caller's clinic
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId) return { success: false, error: "Not authenticated" };

  // patientSchema n'accepte que full_name/phone/email/notes : Zod élimine
  // silencieusement toute autre clé (dont clinic_id), donc aucun champ hors
  // schéma ne peut atteindre l'update.
  const validated = patientSchema.partial().safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { error } = await db.from("patients").update(validated.data).eq("id", patientId).eq("clinic_id", userClinicId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function importPatientCarnet(
  clinicId: string,
  publicCode: string,
  data: PatientInput
): Promise<ApiResponse<{ id: string }>> {
  const db = await getDB();
  const userClinicId = await getAuthenticatedClinicIdForMedicalRole(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Find the carnet by public code. To bypass RLS (since they don't have a patient linked yet),
  // we could just try to insert with a subquery, or we use a service role client.
  // Actually, wait: our RLS policy says "staff can SELECT patient_carnets if they have a patient linked to it".
  // Which means the staff CANNOT SELECT a carnet they are not linked to yet!
  // So we MUST use the admin client (service role) to lookup the carnet!
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminDb = (await createAdminClient()) as any;
  
  const { data: carnet } = await adminDb
    .from("patient_carnets")
    .select("id")
    .eq("public_code", publicCode)
    .maybeSingle();

  if (!carnet) {
    return { success: false, error: "Code Carnet invalide ou introuvable." };
  }

  // 2. Create the local patient linked to this carnet_id
  const validated = patientSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { data: patient, error } = await db
    .from("patients")
    .insert({ 
      ...validated.data, 
      clinic_id: clinicId, 
      email: validated.data.email || null,
      carnet_id: carnet.id
    })
    .select()
    .maybeSingle();

  if (error || !patient) return { success: false, error: error?.message ?? "Erreur lors de la création du patient" };
  
  return { success: true, data: { id: patient.id } };
}

export async function getPatientCarnetHistory(patientId: string) {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicIdForMedicalRole(db);
  if (!clinicId) return [];

  // First, verify the patient belongs to the caller's clinic and get their carnet_id
  const { data: patient } = await db
    .from("patients")
    .select("carnet_id")
    .eq("id", patientId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (!patient || !patient.carnet_id) return [];

  // Now, fetch all diagnostics across all clinics that share this carnet_id.
  // Our RLS policy 'diagnostics_select_shared_carnet' allows this!
  const { data } = await db
    .from("diagnostics")
    .select("*, clinic:clinics(name, logo_url)")
    .eq("carnet_id", patient.carnet_id)
    .eq("validation_status", "validated")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getPatientsWithCarnets() {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return [];

  const { data } = await db
    .from("patients")
    .select("id, full_name, phone, email, created_at, carnet_id, carnet:patient_carnets(public_code)")
    .eq("clinic_id", clinicId)
    .not("carnet_id", "is", null)
    .order("created_at", { ascending: false });

  return (data || []) as Array<{
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    created_at: string;
    carnet_id: string;
    carnet: { public_code: string } | null;
  }>;
}

export async function generateCarnetSummary(patientId: string): Promise<ApiResponse<string>> {
  try {
    const diagnostics = await getPatientCarnetHistory(patientId);
    
    if (!diagnostics || diagnostics.length === 0) {
      return { success: false, error: "Aucun historique disponible pour ce patient." };
    }

    // Format the diagnostics into a readable text block
    const historyText = diagnostics.map((d: any) => {
      let text = `Date: ${new Date(d.created_at).toLocaleDateString()} (Clinique: ${d.clinic?.name || "Inconnue"})\n`;
      text += `Motif: ${d.chief_complaint}\n`;
      text += `Symptômes: ${d.symptoms?.join(", ")}\n`;
      if (d.validated_diagnosis_name) text += `Diagnostic retenu: ${d.validated_diagnosis_name}\n`;
      if (d.treatments && d.treatments.length > 0) {
        const treatmentsStr = d.treatments.map((t: any) => `${t.drug_name} (${t.dosage_mg})`).join(", ");
        text += `Traitements prescrits: ${treatmentsStr}\n`;
      }
      return text;
    }).join("\n---\n");

    const { summarizeCarnet } = await import("@/lib/ai/gemini");
    const summary = await summarizeCarnet(historyText);

    return { success: true, data: summary };
  } catch (error: any) {
    return { success: false, error: error.message || "Erreur lors de la génération du résumé." };
  }
}
