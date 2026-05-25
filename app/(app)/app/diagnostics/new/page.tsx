"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, CheckCircle2 } from "lucide-react";
import { PatientProfileStep } from "@/components/diagnostics/patient-profile-step";
import { SymptomsVitalsStep } from "@/components/diagnostics/symptoms-vitals-step";
import { IcdAnalysisStep } from "@/components/diagnostics/icd-analysis-step";
import { DoctorValidationStep } from "@/components/diagnostics/doctor-validation-step";
import { PrescriptionBuilderStep } from "@/components/diagnostics/prescription-builder-step";
import {
  createDiagnosticDraft,
  updateDiagnosticSymptoms,
  updateDiagnosticAnalysis,
  validateDiagnostic,
  updateDiagnosticPrescription,
} from "@/actions/diagnostics";
import type {
  PatientProfileInput,
  SymptomsInput,
  IcdCandidate,
  PrescriptionInput,
} from "@/types";

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEPS: { step: WizardStep; label: string; description: string }[] = [
  { step: 1, label: "Patient", description: "Profil & antécédents" },
  { step: 2, label: "Symptômes", description: "Signes vitaux & plaintes" },
  { step: 3, label: "ICD-11", description: "Analyse diagnostique" },
  { step: 4, label: "Validation", description: "Validation médecin" },
  { step: 5, label: "Ordonnance", description: "Prescription" },
];

export default function NewDiagnosticPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
  const [validatedDiagnosisName, setValidatedDiagnosisName] = useState("");

  // Accumulated data across steps
  const [patientProfile, setPatientProfile] = useState<PatientProfileInput | null>(null);
  const [symptomsData, setSymptomsData] = useState<SymptomsInput | null>(null);
  const [candidates, setCandidates] = useState<IcdCandidate[]>([]);
  const [additionalTests, setAdditionalTests] = useState<string[]>([]);

  async function handlePatientProfileSubmit(data: PatientProfileInput) {
    setIsSubmitting(true);
    try {
      const result = await createDiagnosticDraft(data);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erreur de création");
        return;
      }
      setDiagnosticId(result.data.id);
      setPatientProfile(data);
      setCurrentStep(2);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSymptomsSubmit(data: SymptomsInput) {
    if (!diagnosticId) return;
    setIsSubmitting(true);
    try {
      const result = await updateDiagnosticSymptoms(diagnosticId, data);
      if (!result.success) {
        toast.error(result.error ?? "Erreur de sauvegarde");
        return;
      }
      setSymptomsData(data);
      setCurrentStep(3);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalysisSubmit(
    ranked: IcdCandidate[],
    tests: string[],
    clinicalNotes: string
  ) {
    if (!diagnosticId) return;
    setIsSubmitting(true);
    try {
      const result = await updateDiagnosticAnalysis(diagnosticId, ranked, tests, clinicalNotes);
      if (!result.success) {
        toast.error(result.error ?? "Erreur de sauvegarde");
        return;
      }
      setCandidates(ranked);
      setAdditionalTests(tests);
      setCurrentStep(4);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleValidation(
    code: string,
    name: string,
    validatedBy: string,
    status: "validated" | "rejected",
    rejectionReason?: string
  ) {
    if (!diagnosticId) return;
    setIsSubmitting(true);
    try {
      const result = await validateDiagnostic(
        diagnosticId,
        code,
        name,
        validatedBy,
        status,
        rejectionReason
      );
      if (!result.success) {
        toast.error(result.error ?? "Erreur de validation");
        return;
      }
      if (status === "rejected") {
        toast.info("Diagnostic rejeté — retour à l'analyse");
        setCurrentStep(3);
      } else {
        setValidatedDiagnosisName(name);
        toast.success("Diagnostic validé");
        setCurrentStep(5);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePrescriptionSubmit(data: PrescriptionInput) {
    if (!diagnosticId) return;
    setIsSubmitting(true);
    try {
      const result = await updateDiagnosticPrescription(diagnosticId, data);
      if (!result.success) {
        toast.error(result.error ?? "Erreur de sauvegarde");
        return;
      }
      toast.success("Ordonnance générée avec succès");
      router.push(`/app/diagnostics/${diagnosticId}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-8 md:px-6 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Nouveau diagnostic</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Système de diagnostic médical
          </h1>
          <p className="text-muted-foreground mt-2">
            Collecte → Analyse ICD-11 → Validation médecin → Ordonnance
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto">
          {STEPS.map(({ step, label, description }, index) => {
            const isCompleted = currentStep > step;
            const isActive = currentStep === step;
            return (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step}
                  </div>
                  <p className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">{description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 md:w-12 flex-shrink-0 ${currentStep > step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          {currentStep === 1 && (
            <PatientProfileStep onNext={handlePatientProfileSubmit} />
          )}

          {currentStep === 2 && (
            <SymptomsVitalsStep
              onNext={handleSymptomsSubmit}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && patientProfile && symptomsData && (
            <IcdAnalysisStep
              patientProfile={patientProfile}
              symptomsData={symptomsData}
              onNext={handleAnalysisSubmit}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && patientProfile && symptomsData && (
            <DoctorValidationStep
              patientProfile={patientProfile}
              symptomsData={symptomsData}
              candidates={candidates}
              additionalTests={additionalTests}
              onValidate={handleValidation}
              onBack={() => setCurrentStep(3)}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 5 && patientProfile && (
            <PrescriptionBuilderStep
              validatedDiagnosisName={validatedDiagnosisName}
              patientAllergies={patientProfile.allergies}
              onSubmit={handlePrescriptionSubmit}
              onBack={() => setCurrentStep(4)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
