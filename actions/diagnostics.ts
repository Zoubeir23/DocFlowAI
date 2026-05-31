"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  DiagnosticRecord,
  PatientProfileInput,
  SymptomsInput,
  IcdCandidate,
  PrescriptionInput,
  DiagnosticValidationStatus,
} from "@/types";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UserContext {
  clinicId: string;
  role: string;
}

async function resolveUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("clinic_id, role")
    .eq("id", user.id)
    .maybeSingle();
  const row = data as { clinic_id: string; role: string } | null;
  if (!row?.clinic_id) return null;
  return { clinicId: row.clinic_id, role: row.role };
}

async function resolveClinicId(): Promise<string | null> {
  const context = await resolveUserContext();
  return context?.clinicId ?? null;
}

// ── Step 1: Create draft with patient profile ─────────────────────────────────

export async function createDiagnosticDraft(
  profile: PatientProfileInput
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  const { data, error } = await (supabase as any)
    .from("diagnostics")
    .insert({
      clinic_id: clinicId,
      patient_full_name: profile.patient_full_name,
      patient_age_years: profile.patient_age_years,
      patient_age_group: profile.patient_age_group,
      patient_sex: profile.patient_sex,
      patient_weight_kg: profile.patient_weight_kg,
      patient_height_cm: profile.patient_height_cm,
      patient_blood_group: profile.patient_blood_group || "unknown",
      chronic_conditions: profile.chronic_conditions,
      allergies: profile.allergies,
      current_medications: profile.current_medications,
      surgical_history: profile.surgical_history,
      family_history: profile.family_history,
      chief_complaint: "",
      validation_status: "draft",
    })
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: (data as { id: string }).id } };
}

// ── Step 2: Save symptoms + vitals ────────────────────────────────────────────

export async function updateDiagnosticSymptoms(
  diagnosticId: string,
  symptoms: SymptomsInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      chief_complaint: symptoms.chief_complaint,
      symptoms: symptoms.symptoms,
      symptom_duration: symptoms.symptom_duration,
      symptom_intensity: symptoms.symptom_intensity,
      aggravating_factors: symptoms.aggravating_factors,
      relieving_factors: symptoms.relieving_factors,
      vital_temperature: symptoms.vital_temperature,
      vital_blood_pressure_systolic: symptoms.vital_blood_pressure_systolic,
      vital_blood_pressure_diastolic: symptoms.vital_blood_pressure_diastolic,
      vital_heart_rate: symptoms.vital_heart_rate,
      vital_respiratory_rate: symptoms.vital_respiratory_rate,
      vital_oxygen_saturation: symptoms.vital_oxygen_saturation,
    })
    .eq("id", diagnosticId)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Step 3: Save ICD analysis results ────────────────────────────────────────

export async function updateDiagnosticAnalysis(
  diagnosticId: string,
  candidates: IcdCandidate[],
  additionalTests: string[],
  clinicalNotes: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      icd_candidates: candidates,
      additional_tests_required: additionalTests,
      clinical_notes: clinicalNotes,
      validation_status: "pending_validation",
    })
    .eq("id", diagnosticId)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Step 4: Doctor validation ─────────────────────────────────────────────────

export async function validateDiagnostic(
  diagnosticId: string,
  validatedCode: string,
  validatedName: string,
  validatedBy: string,
  status: "validated" | "rejected",
  rejectionReason?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const context = await resolveUserContext();
  if (!context) return { success: false, error: "Non autorisé" };

  const { clinicId, role } = context;
  const ALLOWED_VALIDATION_ROLES = ["owner", "doctor", "admin"];
  if (!ALLOWED_VALIDATION_ROLES.includes(role)) {
    return { success: false, error: "Seul un médecin peut valider un diagnostic" };
  }

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      validation_status: status,
      validated_diagnosis_code: validatedCode,
      validated_diagnosis_name: validatedName,
      validated_by: validatedBy,
      validated_at: new Date().toISOString(),
      rejection_reason: rejectionReason ?? null,
    })
    .eq("id", diagnosticId)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Step 5: Save prescription ─────────────────────────────────────────────────

export async function updateDiagnosticPrescription(
  diagnosticId: string,
  prescription: PrescriptionInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      document_type: prescription.document_type,
      treatments: prescription.treatments,
      recommendations: prescription.recommendations,
      follow_up_delay_days: prescription.follow_up_delay_days,
      follow_up_tests: prescription.follow_up_tests,
      practitioner_name: prescription.practitioner_name,
      practitioner_title: prescription.practitioner_title,
      practitioner_rpps: prescription.practitioner_rpps,
      icf_codes: prescription.icf_codes ?? [],
    })
    .eq("id", diagnosticId)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getDiagnostics(
  page: number,
  pageSize: number,
  statusFilter?: DiagnosticValidationStatus | "all",
  search?: string
): Promise<{ data: DiagnosticRecord[]; total: number; totalPages: number }> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { data: [], total: 0, totalPages: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = (supabase as any)
    .from("diagnostics")
    .select("*", { count: "exact" })
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("validation_status", statusFilter);
  }

  if (search && search.trim().length > 0) {
    query = query.ilike("patient_full_name", `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) return { data: [], total: 0, totalPages: 0 };

  const total = count ?? 0;
  return {
    data: (data ?? []) as DiagnosticRecord[],
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getDiagnosticById(
  id: string
): Promise<DiagnosticRecord | null> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return null;

  const { data, error } = await (supabase as any)
    .from("diagnostics")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) return null;
  return data as DiagnosticRecord;
}

export async function deleteDiagnostic(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  const { error } = await (supabase as any)
    .from("diagnostics")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
