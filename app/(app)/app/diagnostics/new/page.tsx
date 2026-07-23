"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Stethoscope, CheckCircle2, Users, Search, ChevronDown, X, Loader2 } from "lucide-react";
import { PatientProfileStep } from "@/components/diagnostics/patient-profile-step";
import {
  createDiagnosticDraft,
  updateDiagnosticPatientProfile,
  getPatientLastDiagnosticProfile,
  getDiagnosticById,
} from "@/actions/diagnostics";
import { getPatients } from "@/actions/patients";
import { createClient } from "@/lib/supabase/client";
import { buildPatientProfileFromRecord } from "@/lib/diagnostics/build-profile-from-record";
import type { PatientProfileInput } from "@/types";

const STEPS = [
  { step: 1, label: "Patient", description: "Profil & antécédents" },
  { step: 2, label: "Symptômes", description: "Signes vitaux & plaintes" },
  { step: 3, label: "ICD-11", description: "Analyse diagnostique" },
  { step: 4, label: "Validation", description: "Validation médecin" },
  { step: 5, label: "Ordonnance", description: "Prescription" },
];

async function fetchClinicId() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).maybeSingle();
  return data?.clinic_id || null;
}

export default function NewDiagnosticPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedPatientId = searchParams.get("patientId");
  const linkedPatientName = searchParams.get("patientName");
  // Présent quand on revient depuis l'étape 2 (edit/page.tsx) pour corriger le
  // profil patient d'un brouillon déjà créé — cf. audit fonctionnalité
  // diagnostic 2026-07-23 : ce paramètre n'était auparavant jamais lu, ce qui
  // faisait perdre le brouillon en cours et créait un doublon en base.
  const resumeId = searchParams.get("resumeId");

  const [isLoadingResume, setIsLoadingResume] = useState(!!resumeId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Patient selector state
  const [patientSearch, setPatientSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(linkedPatientId);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(linkedPatientName);
  const [prefillData, setPrefillData] = useState<Partial<PatientProfileInput> | null>(null);
  const [isFetchingPrefill, setIsFetchingPrefill] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: clinicId } = useQuery({ queryKey: ["clinicId"], queryFn: fetchClinicId });

  const { data: patientsResult } = useQuery({
    queryKey: ["patients", clinicId, patientSearch],
    queryFn: () => getPatients(clinicId!, 1, 20, patientSearch),
    enabled: !!clinicId,
  });

  const patients = patientsResult?.data ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!resumeId) return;
    let cancelled = false;
    async function loadResumeRecord() {
      const record = await getDiagnosticById(resumeId!);
      if (cancelled) return;
      if (!record) {
        toast.error("Diagnostic introuvable");
        router.push("/app/diagnostics");
        return;
      }
      setSelectedPatientId(record.patient_id ?? null);
      setSelectedPatientName(record.patient_full_name);
      setPrefillData(buildPatientProfileFromRecord(record));
      setFormKey((k) => k + 1);
      setIsLoadingResume(false);
    }
    loadResumeRecord();
    return () => { cancelled = true; };
  }, [resumeId, router]);

  async function handleSelectPatient(patient: { id: string; full_name: string }) {
    setSelectedPatientId(patient.id);
    setSelectedPatientName(patient.full_name);
    setDropdownOpen(false);
    setPatientSearch("");
    setIsFetchingPrefill(true);
    try {
      const lastProfile = await getPatientLastDiagnosticProfile(patient.id);
      setPrefillData(lastProfile ? { ...lastProfile, patient_full_name: patient.full_name } : { patient_full_name: patient.full_name });
    } finally {
      setIsFetchingPrefill(false);
      setFormKey((k) => k + 1);
    }
  }

  function handleClearPatient() {
    setSelectedPatientId(null);
    setSelectedPatientName(null);
    setPrefillData(null);
    setFormKey((k) => k + 1);
  }

  async function handlePatientProfileSubmit(data: PatientProfileInput) {
    setIsSubmitting(true);
    try {
      const profile = { ...data, patient_id: selectedPatientId ?? data.patient_id ?? null };

      if (resumeId) {
        const result = await updateDiagnosticPatientProfile(resumeId, profile);
        if (!result.success) {
          toast.error(result.error ?? "Erreur de mise à jour");
          return;
        }
        router.push(`/app/diagnostics/${resumeId}/edit?step=2`);
        return;
      }

      const result = await createDiagnosticDraft(profile);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erreur de création");
        return;
      }
      router.push(`/app/diagnostics/${result.data.id}/edit?step=2`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingResume) {
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
        {/* Step indicator — cette page ne gère que l'étape 1 ; les étapes
            suivantes vivent dans [id]/edit/page.tsx (cf. redirection après
            soumission ci-dessous). */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto">
          {STEPS.map(({ step, label, description }, index) => {
            const isActive = step === 1;
            return (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"
                  }`}>
                    {isActive ? step : <CheckCircle2 className="w-5 h-5 opacity-0" />}
                  </div>
                  <p className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">{description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="h-0.5 w-8 md:w-12 flex-shrink-0 bg-border" />
                )}
              </div>
            );
          })}
        </div>

        {/* Patient selector */}
        <div className="mb-4 relative" ref={dropdownRef}>
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
              selectedPatientName
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
            onClick={() => !selectedPatientName && setDropdownOpen((o) => !o)}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>

            {selectedPatientName ? (
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Patient sélectionné</p>
                  <p className="text-sm font-semibold text-foreground">{selectedPatientName}</p>
                </div>
                {isFetchingPrefill ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClearPatient(); }}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between" onClick={() => setDropdownOpen((o) => !o)}>
                <p className="text-sm text-muted-foreground">Sélectionner un patient enregistré (optionnel)</p>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </div>
            )}
          </div>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    autoFocus
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Rechercher par nom ou téléphone..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 rounded-lg border-0 outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {patients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun patient trouvé</p>
                ) : (
                  patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {patient.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{patient.full_name}</p>
                        <p className="text-xs text-muted-foreground">{patient.phone}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <PatientProfileStep
            key={formKey}
            onNext={handlePatientProfileSubmit}
            defaultPatientName={prefillData?.patient_full_name ?? linkedPatientName ?? undefined}
            defaultValues={prefillData ?? undefined}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
