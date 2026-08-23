"use server";

import { createClient } from "@/lib/supabase/server";
import { computeDocumentSeal } from "@/lib/document-seal";
import { detectAllergyConflict } from "@/lib/allergy-conflicts";
import { checkDrugInteractions } from "@/lib/who-drug-interactions";
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
  userId: string;
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
  return { userId: user.id, clinicId: row.clinic_id, role: row.role };
}

async function resolveClinicId(): Promise<string | null> {
  const context = await resolveUserContext();
  return context?.clinicId ?? null;
}

interface DiagnosticState {
  current_step: number | null;
  validation_status: DiagnosticValidationStatus;
}

async function getDiagnosticState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  diagnosticId: string,
  clinicId: string
): Promise<DiagnosticState | null> {
  const { data } = await (supabase as any)
    .from("diagnostics")
    .select("current_step, validation_status")
    .eq("id", diagnosticId)
    .eq("clinic_id", clinicId)
    .maybeSingle();
  return (data as DiagnosticState | null) ?? null;
}

// current_step ne doit jamais reculer : sinon revenir en arrière puis
// ré-enregistrer une étape antérieure masque la progression réelle déjà
// atteinte au prochain chargement de /edit sans ?step= explicite.
function nextStep(existing: number | null, target: number): number {
  return Math.max(existing ?? 0, target);
}

// ── Step 1: Create draft with patient profile ─────────────────────────────────

export async function createDiagnosticDraft(
  profile: PatientProfileInput
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  // C1 fix: patient_id vient du client — vérifier qu'il appartient bien à la
  // clinique de l'appelant avant insertion, sinon le trigger auto_link_diagnostic_carnet
  // (SECURITY DEFINER, sans filtre de clinique) rattacherait le diagnostic au
  // carnet partagé d'un patient d'une autre clinique.
  if (profile.patient_id) {
    const { data: patientCheck } = await (supabase as any)
      .from("patients")
      .select("id")
      .eq("id", profile.patient_id)
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (!patientCheck) {
      return { success: false, error: "Patient introuvable ou n'appartient pas à cette clinique." };
    }
  }

  const { data, error } = await (supabase as any)
    .from("diagnostics")
    .insert({
      clinic_id: clinicId,
      patient_id: profile.patient_id ?? null,
      patient_full_name: profile.patient_full_name,
      patient_age_years: profile.patient_age_years ?? null,
      patient_age_group: profile.patient_age_group ?? null,
      patient_sex: profile.patient_sex ?? null,
      patient_weight_kg: profile.patient_weight_kg ?? null,
      patient_height_cm: profile.patient_height_cm ?? null,
      patient_blood_group: profile.patient_blood_group || "unknown",
      chronic_conditions: profile.chronic_conditions ?? [],
      allergies: profile.allergies ?? [],
      current_medications: profile.current_medications ?? [],
      surgical_history: profile.surgical_history ?? [],
      family_history: profile.family_history ?? [],
      chief_complaint: null,
      validation_status: "draft",
      current_step: 2,
    })
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: (data as { id: string }).id } };
}

// ── Step 1 (reprise) : mettre à jour le profil patient d'un brouillon existant ─

export async function updateDiagnosticPatientProfile(
  diagnosticId: string,
  profile: PatientProfileInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  if (profile.patient_id) {
    const { data: patientCheck } = await (supabase as any)
      .from("patients")
      .select("id")
      .eq("id", profile.patient_id)
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (!patientCheck) {
      return { success: false, error: "Patient introuvable ou n'appartient pas à cette clinique." };
    }
  }

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      patient_id: profile.patient_id ?? null,
      patient_full_name: profile.patient_full_name,
      patient_age_years: profile.patient_age_years ?? null,
      patient_age_group: profile.patient_age_group ?? null,
      patient_sex: profile.patient_sex ?? null,
      patient_weight_kg: profile.patient_weight_kg ?? null,
      patient_height_cm: profile.patient_height_cm ?? null,
      patient_blood_group: profile.patient_blood_group || "unknown",
      chronic_conditions: profile.chronic_conditions ?? [],
      allergies: profile.allergies ?? [],
      current_medications: profile.current_medications ?? [],
      surgical_history: profile.surgical_history ?? [],
      family_history: profile.family_history ?? [],
    })
    .eq("id", diagnosticId)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Step 2: Save symptoms + vitals ────────────────────────────────────────────

export async function updateDiagnosticSymptoms(
  diagnosticId: string,
  symptoms: SymptomsInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return { success: false, error: "Non autorisé" };

  const state = await getDiagnosticState(supabase, diagnosticId, clinicId);
  if (!state) return { success: false, error: "Diagnostic introuvable" };

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      chief_complaint: symptoms.chief_complaint ?? null,
      symptoms: symptoms.symptoms ?? [],
      symptom_duration: symptoms.symptom_duration ?? null,
      symptom_intensity: symptoms.symptom_intensity ?? null,
      aggravating_factors: symptoms.aggravating_factors ?? [],
      relieving_factors: symptoms.relieving_factors ?? [],
      vital_temperature: symptoms.vital_temperature ?? null,
      vital_blood_pressure_systolic: symptoms.vital_blood_pressure_systolic ?? null,
      vital_blood_pressure_diastolic: symptoms.vital_blood_pressure_diastolic ?? null,
      vital_heart_rate: symptoms.vital_heart_rate ?? null,
      vital_respiratory_rate: symptoms.vital_respiratory_rate ?? null,
      vital_oxygen_saturation: symptoms.vital_oxygen_saturation ?? null,
      current_step: nextStep(state.current_step, 3),
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

  const state = await getDiagnosticState(supabase, diagnosticId, clinicId);
  if (!state) return { success: false, error: "Diagnostic introuvable" };

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      icd_candidates: candidates,
      additional_tests_required: additionalTests,
      clinical_notes: clinicalNotes,
      validation_status: "pending_validation",
      current_step: nextStep(state.current_step, 4),
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

  const { userId, clinicId, role } = context;
  // C2 fix: 'doctor'/'admin' n'existent pas dans l'enum user_role
  // (owner|receptionist|assistant|super_admin) — seul owner/super_admin peut
  // en pratique valider un diagnostic aujourd'hui.
  const ALLOWED_VALIDATION_ROLES = ["owner", "super_admin"];
  if (!ALLOWED_VALIDATION_ROLES.includes(role)) {
    return { success: false, error: "Seul un médecin peut valider un diagnostic" };
  }

  const state = await getDiagnosticState(supabase, diagnosticId, clinicId);
  if (!state) return { success: false, error: "Diagnostic introuvable" };
  // Empêche de valider/rejeter un diagnostic qui n'a pas encore été soumis
  // pour validation (ex: navigation manuelle vers ?step=4 sur un brouillon) —
  // seule l'analyse ICD (étape 3) fait passer le statut à pending_validation.
  if (state.validation_status !== "pending_validation") {
    return { success: false, error: "Ce diagnostic n'est pas en attente de validation." };
  }

  const { error } = await (supabase as any)
    .from("diagnostics")
    .update({
      validation_status: status,
      validated_diagnosis_code: validatedCode,
      validated_diagnosis_name: validatedName,
      validated_by: validatedBy,
      // C2 fix: le libellé texte reste affiché sur le document, mais chaque
      // validation est désormais imputable à un compte réel et vérifiable.
      validated_by_user_id: userId,
      validated_at: new Date().toISOString(),
      rejection_reason: rejectionReason ?? null,
      // Sans ceci, un rechargement de /edit sans ?step= dans l'URL retombe sur
      // record.current_step resté à 4, même quand la validation est déjà faite.
      // Le rejet est une régression volontaire du workflow (retour à l'analyse
      // ICD) — elle n'est donc pas soumise à la règle "current_step ne recule
      // jamais", qui ne vise qu'à empêcher une régression accidentelle côté
      // client.
      current_step: status === "rejected" ? 3 : nextStep(state.current_step, 5),
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
  const context = await resolveUserContext();
  if (!context) return { success: false, error: "Non autorisé" };
  const { userId, clinicId } = context;

  const state = await getDiagnosticState(supabase, diagnosticId, clinicId);
  if (!state) return { success: false, error: "Diagnostic introuvable" };
  // Empêche de générer une ordonnance/document en sautant la validation
  // médecin (ex: navigation manuelle vers ?step=5 sur un diagnostic encore
  // en attente ou rejeté).
  if (state.validation_status !== "validated") {
    return { success: false, error: "Le diagnostic doit d'abord être validé par un médecin." };
  }

  // Un seul cast pour les deux requêtes de cette fonction, plutôt qu'un par appel.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Champs du document qui ne figurent pas dans le formulaire de prescription :
  // ils entrent pourtant dans l'empreinte, puisqu'ils sont imprimés.
  const { data: existing } = await db
    .from("diagnostics")
    .select(
      "patient_full_name, patient_age_years, patient_sex, patient_weight_kg, patient_blood_group, validated_diagnosis_code, validated_diagnosis_name, chief_complaint, clinical_notes, validated_by, validated_by_user_id, validated_at, document_seal, allergies"
    )
    .eq("id", diagnosticId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (!existing) return { success: false, error: "Diagnostic introuvable" };

  // Une fois scellé, le document ne se réenregistre plus par ce chemin : sans
  // ce garde-fou, rouvrir l'étape 5 recalculait un nouveau sceau en silence —
  // masquant une modification post-signature au lieu de la signaler comme
  // altération (tasks/audit-2026-08-23-full-codebase.md, C3). Une future
  // fonctionnalité d'avenant devra créer un nouveau document plutôt que de
  // réécrire celui-ci.
  if (existing.document_seal) {
    return {
      success: false,
      error: "Ce document a déjà été généré et scellé. Il ne peut plus être modifié par cette voie.",
    };
  }

  // Contrôle serveur des allergies : le blocage côté client est une aide à la
  // saisie, pas une garantie — un appel direct à cette action le contournerait
  // entièrement (tasks/audit-2026-08-23-full-codebase.md, C4).
  const patientAllergies: string[] = Array.isArray(existing.allergies) ? existing.allergies : [];
  for (const treatment of prescription.treatments) {
    const conflict = detectAllergyConflict(treatment.drug_name, treatment.atc_code, patientAllergies);
    if (conflict) {
      return {
        success: false,
        error: `Conflit d'allergie détecté : ${treatment.drug_name} (allergie connue : ${conflict.allergy}). Retirez ce traitement ou corrigez l'allergie enregistrée.`,
      };
    }
  }

  // Contrôle serveur des interactions : le client affiche déjà ce résultat,
  // mais rien n'empêchait jusqu'ici la soumission en cas d'échec ou
  // d'interaction trouvée, et rien n'en gardait trace
  // (tasks/audit-2026-08-23-full-codebase.md, H2). Le résultat est recalculé
  // ici — jamais accepté tel quel depuis le client — et persisté.
  const rxcuisForInteractionCheck = prescription.treatments
    .map((treatment) => treatment.rxcui)
    .filter((code): code is string => Boolean(code) && /^\d+$/.test(code));

  let interactionCheckStatus: "not_applicable" | "checked_clear" | "checked_found" | "unavailable" =
    "not_applicable";
  if (rxcuisForInteractionCheck.length >= 2) {
    const interactionResult = await checkDrugInteractions(rxcuisForInteractionCheck);
    interactionCheckStatus =
      interactionResult.status === "unavailable"
        ? "unavailable"
        : interactionResult.interactions.length > 0
          ? "checked_found"
          : "checked_clear";
  }

  const interactionRequiresAcknowledgement =
    interactionCheckStatus === "unavailable" || interactionCheckStatus === "checked_found";
  if (interactionRequiresAcknowledgement && prescription.interaction_check_acknowledged !== true) {
    return {
      success: false,
      error:
        interactionCheckStatus === "unavailable"
          ? "Le contrôle d'interactions médicamenteuses est indisponible. Confirmez avoir vérifié les interactions avant de continuer."
          : "Une interaction médicamenteuse a été détectée. Confirmez l'avoir prise en compte avant de continuer.",
    };
  }

  // Le sceau est calculé sur le contenu tel qu'il sera enregistré, jamais sur ce
  // que le client prétend avoir produit : une empreinte fournie par l'appelant
  // ne prouverait rien.
  const documentSeal = computeDocumentSeal({
    ...existing,
    document_type: prescription.document_type,
    treatments: prescription.treatments,
    recommendations: prescription.recommendations,
    follow_up_delay_days: prescription.follow_up_delay_days,
    follow_up_tests: prescription.follow_up_tests,
    practitioner_name: prescription.practitioner_name,
    practitioner_title: prescription.practitioner_title,
    practitioner_rpps: prescription.practitioner_rpps,
  });

  const { error } = await db
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
      // C2 fix: le libellé reste modifiable, mais la prescription est
      // désormais imputable à un compte réel et vérifiable.
      prescribed_by_user_id: userId,
      icf_codes: prescription.icf_codes ?? [],
      document_seal: documentSeal,
      document_sealed_at: new Date().toISOString(),
      document_sealed_by_user_id: userId,
      interaction_check_status: interactionCheckStatus,
      interaction_check_acknowledged_at: interactionRequiresAcknowledgement ? new Date().toISOString() : null,
      interaction_check_acknowledged_by_user_id: interactionRequiresAcknowledgement ? userId : null,
      current_step: nextStep(state.current_step, 6),
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

export async function getPatientLastDiagnosticProfile(patientId: string): Promise<Partial<PatientProfileInput> | null> {
  const supabase = await createClient();
  const clinicId = await resolveClinicId();
  if (!clinicId) return null;

  const { data } = await (supabase as any)
    .from("diagnostics")
    .select("patient_full_name, patient_age_years, patient_age_group, patient_sex, patient_weight_kg, patient_height_cm, patient_blood_group, chronic_conditions, allergies, current_medications, surgical_history, family_history")
    .eq("patient_id", patientId)
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return data as Partial<PatientProfileInput>;
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
