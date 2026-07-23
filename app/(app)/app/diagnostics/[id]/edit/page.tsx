"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, CheckCircle2, Save } from "lucide-react";
import { SymptomsVitalsStep } from "@/components/diagnostics/symptoms-vitals-step";
import { IcdAnalysisStep } from "@/components/diagnostics/icd-analysis-step";
import { DoctorValidationStep } from "@/components/diagnostics/doctor-validation-step";
import { PrescriptionBuilderStep } from "@/components/diagnostics/prescription-builder-step";
import {
  getDiagnosticById,
  updateDiagnosticSymptoms,
  updateDiagnosticAnalysis,
  validateDiagnostic,
  updateDiagnosticPrescription,
} from "@/actions/diagnostics";
import { buildPatientProfileFromRecord, buildSymptomsFromRecord } from "@/lib/diagnostics/build-profile-from-record";
import type {
  DiagnosticRecord,
  PatientProfileInput,
  SymptomsInput,
  IcdCandidate,
  PrescriptionInput,
} from "@/types";

type WizardStep = 2 | 3 | 4 | 5;

const STEPS = [
  { step: 1, label: "Patient", description: "Profil & antécédents" },
  { step: 2, label: "Symptômes", description: "Signes vitaux & plaintes" },
  { step: 3, label: "ICD-11", description: "Analyse diagnostique" },
  { step: 4, label: "Validation", description: "Validation médecin" },
  { step: 5, label: "Ordonnance", description: "Prescription" },
];

export default function DiagnosticEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const diagnosticId = params.id;
  // null (pas de ?step= dans l'URL) doit rester distinct de "step=2 fourni
  // explicitement", sinon la reprise via current_step (cf. plus bas) est
  // masquée en permanence par ce fallback et on retombe toujours à l'étape 2.
  const stepParamRaw = searchParams.get("step");
  const stepParam = stepParamRaw !== null ? (parseInt(stepParamRaw, 10) as WizardStep) : null;
  const hasExplicitStepParam = stepParam !== null && stepParam >= 2 && stepParam <= 5;

  const [currentStep, setCurrentStep] = useState<WizardStep>(
    hasExplicitStepParam ? (stepParam as WizardStep) : 2
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnostic, setDiagnostic] = useState<DiagnosticRecord | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfileInput | null>(null);
  const [symptomsData, setSymptomsData] = useState<SymptomsInput | null>(null);
  const [candidates, setCandidates] = useState<IcdCandidate[]>([]);
  const [additionalTests, setAdditionalTests] = useState<string[]>([]);
  const [validatedDiagnosisName, setValidatedDiagnosisName] = useState("");

  useEffect(() => {
    async function loadDiagnostic() {
      const record = await getDiagnosticById(diagnosticId);
      if (!record) {
        toast.error("Diagnostic introuvable");
        router.push("/app/diagnostics");
        return;
      }
      setDiagnostic(record);
      setPatientProfile(buildPatientProfileFromRecord(record));
      if (record.chief_complaint) {
        setSymptomsData(buildSymptomsFromRecord(record));
      }
      if (record.icd_candidates?.length > 0) {
        setCandidates(record.icd_candidates as IcdCandidate[]);
        setAdditionalTests(record.additional_tests_required ?? []);
      }
      if (record.validated_diagnosis_name) {
        setValidatedDiagnosisName(record.validated_diagnosis_name);
      }

      const savedStep = record.current_step ?? 2;
      const resolvedStep = Math.max(2, Math.min(5, savedStep)) as WizardStep;
      setCurrentStep(hasExplicitStepParam ? (stepParam as WizardStep) : resolvedStep);
      setIsLoading(false);
    }
    loadDiagnostic();
  }, [diagnosticId, hasExplicitStepParam, stepParam, router]);

  function updateStepInUrl(step: WizardStep) {
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(step));
    window.history.replaceState(null, "", url.toString());
    setCurrentStep(step);
  }

  async function handleSymptomsSubmit(data: SymptomsInput) {
    setIsSubmitting(true);
    try {
      const result = await updateDiagnosticSymptoms(diagnosticId, data);
      if (!result.success) { toast.error(result.error ?? "Erreur de sauvegarde"); return; }
      setSymptomsData(data);
      updateStepInUrl(3);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalysisSubmit(ranked: IcdCandidate[], tests: string[], clinicalNotes: string) {
    setIsSubmitting(true);
    try {
      const result = await updateDiagnosticAnalysis(diagnosticId, ranked, tests, clinicalNotes);
      if (!result.success) { toast.error(result.error ?? "Erreur de sauvegarde"); return; }
      setCandidates(ranked);
      setAdditionalTests(tests);
      updateStepInUrl(4);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleValidation(code: string, name: string, validatedBy: string, status: "validated" | "rejected", rejectionReason?: string) {
    setIsSubmitting(true);
    try {
      const result = await validateDiagnostic(diagnosticId, code, name, validatedBy, status, rejectionReason);
      if (!result.success) { toast.error(result.error ?? "Erreur de validation"); return; }
      if (status === "rejected") {
        toast.info("Diagnostic rejeté — retour à l'analyse");
        updateStepInUrl(3);
      } else {
        setValidatedDiagnosisName(name);
        toast.success("Diagnostic validé");
        updateStepInUrl(5);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePrescriptionSubmit(data: PrescriptionInput) {
    setIsSubmitting(true);
    try {
      const result = await updateDiagnosticPrescription(diagnosticId, data);
      if (!result.success) { toast.error(result.error ?? "Erreur de sauvegarde"); return; }
      toast.success("Ordonnance générée avec succès");
      router.push(`/app/diagnostics/${diagnosticId}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Chargement du diagnostic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-widest">Diagnostic en cours</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {diagnostic?.patient_full_name}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Reprendre à l&apos;étape {currentStep} sur 5
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
              <Save className="w-3.5 h-3.5" />
              Sauvegardé automatiquement
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto">
          {STEPS.map(({ step, label, description }, index) => {
            const isCompleted = currentStep > step;
            const isActive = currentStep === step;
            const isPast = step === 1;
            return (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isPast ? "bg-primary text-primary-foreground" :
                    isCompleted ? "bg-primary text-primary-foreground" :
                    isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isPast || isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step}
                  </div>
                  <p className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">{description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 md:w-12 flex-shrink-0 ${isPast || isCompleted ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          {currentStep === 2 && (
            <SymptomsVitalsStep
              onNext={handleSymptomsSubmit}
              onBack={() => router.push(`/app/diagnostics/new?resumeId=${diagnosticId}`)}
              defaultValues={symptomsData ?? undefined}
            />
          )}

          {currentStep === 3 && patientProfile && symptomsData && (
            <IcdAnalysisStep
              patientProfile={patientProfile}
              symptomsData={symptomsData}
              onNext={handleAnalysisSubmit}
              onBack={() => updateStepInUrl(2)}
              defaultCandidates={candidates}
              defaultAdditionalTests={additionalTests}
              defaultClinicalNotes={diagnostic?.clinical_notes ?? undefined}
            />
          )}

          {currentStep === 3 && (!patientProfile || !symptomsData) && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Veuillez compléter les étapes précédentes d&apos;abord.</p>
              <button onClick={() => updateStepInUrl(2)} className="mt-3 text-primary text-sm underline">Retour aux symptômes</button>
            </div>
          )}

          {currentStep === 4 && patientProfile && symptomsData && (
            <DoctorValidationStep
              patientProfile={patientProfile}
              symptomsData={symptomsData}
              candidates={candidates}
              additionalTests={additionalTests}
              onValidate={handleValidation}
              onBack={() => updateStepInUrl(3)}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 5 && patientProfile && (
            <PrescriptionBuilderStep
              validatedDiagnosisName={validatedDiagnosisName}
              patientAllergies={patientProfile.allergies ?? []}
              onSubmit={handlePrescriptionSubmit}
              onBack={() => updateStepInUrl(4)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
