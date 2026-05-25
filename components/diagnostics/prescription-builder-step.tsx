"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, AlertTriangle, Pill, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checkAllergyConflicts } from "@/lib/diagnostic-scoring";
import type { PrescriptionInput, PrescriptionTreatment, DiagnosticDocumentType } from "@/types";

const prescriptionSchema = z.object({
  document_type: z.enum(["consultation", "prescription", "receipt", "medical_report", "sick_leave"]),
  recommendations: z.array(z.string()),
  follow_up_delay_days: z.coerce.number().nullable(),
  follow_up_tests: z.array(z.string()),
  practitioner_name: z.string().min(2, "Nom du praticien requis"),
  practitioner_title: z.string(),
  practitioner_rpps: z.string(),
  treatments: z.array(z.object({
    drug_name: z.string().min(1),
    dosage_mg: z.string(),
    frequency: z.string(),
    duration_days: z.coerce.number().min(1),
    route: z.enum(["oral", "iv", "im", "topical", "inhaled", "sublingual"]),
    precautions: z.string(),
    is_generic: z.boolean(),
  })),
});

const DOCUMENT_TYPES: { value: DiagnosticDocumentType; label: string; emoji: string }[] = [
  { value: "consultation", label: "Compte rendu", emoji: "📋" },
  { value: "prescription", label: "Ordonnance", emoji: "💊" },
  { value: "receipt", label: "Reçu médical", emoji: "🧾" },
  { value: "medical_report", label: "Rapport médical", emoji: "📄" },
  { value: "sick_leave", label: "Certificat médical", emoji: "🏥" },
];

const ROUTES: { value: PrescriptionTreatment["route"]; label: string }[] = [
  { value: "oral", label: "Voie orale (per os)" },
  { value: "iv", label: "Intraveineuse (IV)" },
  { value: "im", label: "Intramusculaire (IM)" },
  { value: "topical", label: "Application locale" },
  { value: "inhaled", label: "Inhalation" },
  { value: "sublingual", label: "Sublinguale" },
];

const COMMON_RECOMMENDATIONS: string[] = [
  "Repos au lit", "Hydratation abondante (2L/jour)", "Alimentation légère",
  "Éviter l'alcool", "Éviter l'effort physique", "Surveiller la fièvre",
  "Consulter en urgence si aggravation", "Arrêt du tabac",
  "Régime sans sel", "Régime diabétique",
];

const EMPTY_TREATMENT: PrescriptionTreatment = {
  drug_name: "",
  dosage_mg: "",
  frequency: "1 fois par jour",
  duration_days: 7,
  route: "oral",
  precautions: "",
  is_generic: false,
};

interface PrescriptionBuilderStepProps {
  validatedDiagnosisName: string;
  patientAllergies: string[];
  onSubmit: (data: PrescriptionInput) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function PrescriptionBuilderStep({
  validatedDiagnosisName,
  patientAllergies,
  onSubmit,
  onBack,
  isSubmitting,
}: PrescriptionBuilderStepProps) {
  const [treatments, setTreatments] = useState<PrescriptionTreatment[]>([{ ...EMPTY_TREATMENT }]);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [customRecommendation, setCustomRecommendation] = useState("");
  const [followUpTests, setFollowUpTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState("");
  const [allergyWarnings, setAllergyWarnings] = useState<Set<number>>(new Set());

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<Omit<PrescriptionInput, "treatments" | "recommendations" | "follow_up_tests">>({
    resolver: zodResolver(prescriptionSchema.omit({ treatments: true, recommendations: true, follow_up_tests: true })),
    defaultValues: {
      document_type: "prescription",
      follow_up_delay_days: 7,
      practitioner_title: "Dr.",
    },
  });

  const selectedDocumentType = watch("document_type");

  function updateTreatment(index: number, field: keyof PrescriptionTreatment, value: string | number | boolean) {
    const updated = treatments.map((treatment, idx) => {
      if (idx !== index) return treatment;
      const newTreatment = { ...treatment, [field]: value };

      // Check allergy conflict
      if (field === "drug_name") {
        const hasConflict = checkAllergyConflicts(value as string, patientAllergies);
        setAllergyWarnings((prev) => {
          const next = new Set(prev);
          if (hasConflict) next.add(index);
          else next.delete(index);
          return next;
        });
      }

      return newTreatment;
    });
    setTreatments(updated);
  }

  function addTreatment() {
    setTreatments([...treatments, { ...EMPTY_TREATMENT }]);
  }

  function removeTreatment(index: number) {
    setTreatments(treatments.filter((_, idx) => idx !== index));
    setAllergyWarnings((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }

  function toggleRecommendation(rec: string) {
    setSelectedRecommendations((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  }

  function addCustomRecommendation() {
    const trimmed = customRecommendation.trim();
    if (!trimmed || selectedRecommendations.includes(trimmed)) return;
    setSelectedRecommendations((prev) => [...prev, trimmed]);
    setCustomRecommendation("");
  }

  function addFollowUpTest() {
    const trimmed = customTest.trim();
    if (!trimmed) return;
    setFollowUpTests((prev) => [...prev, trimmed]);
    setCustomTest("");
  }

  async function handleFormSubmit(formData: Omit<PrescriptionInput, "treatments" | "recommendations" | "follow_up_tests">) {
    if (allergyWarnings.size > 0) return;

    // Validate treatments manually (outside RHF scope)
    for (const treatment of treatments) {
      if (!treatment.drug_name.trim()) {
        import("sonner").then(({ toast }) => toast.error("Le nom du médicament est requis pour tous les traitements"));
        return;
      }
      if (treatment.duration_days < 1) {
        import("sonner").then(({ toast }) => toast.error("La durée de traitement doit être d'au moins 1 jour"));
        return;
      }
    }

    await onSubmit({
      ...formData,
      treatments,
      recommendations: selectedRecommendations,
      follow_up_tests: followUpTests,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">

      {/* Validated diagnosis banner */}
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <span className="text-green-600 text-lg">✓</span>
        </div>
        <div>
          <p className="text-xs text-green-600 font-semibold">Diagnostic validé par le médecin</p>
          <p className="text-sm font-medium text-green-800">{validatedDiagnosisName}</p>
        </div>
      </div>

      {/* Document type */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Type de document</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {DOCUMENT_TYPES.map((docType) => (
            <Controller key={docType.value} name="document_type" control={control} render={({ field }) => (
              <button type="button" onClick={() => field.onChange(docType.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  selectedDocumentType === docType.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}>
                <span className="text-2xl">{docType.emoji}</span>
                <span className={`text-[11px] font-semibold text-center leading-tight ${
                  selectedDocumentType === docType.value ? "text-primary" : "text-foreground"
                }`}>{docType.label}</span>
              </button>
            )} />
          ))}
        </div>
      </section>

      {/* Treatments */}
      <section className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Traitements prescrits</h3>
          </div>
          <Button type="button" onClick={addTreatment} variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Ajouter un médicament
          </Button>
        </div>

        {treatments.map((treatment, index) => (
          <div key={index} className={`space-y-4 p-5 rounded-xl border-2 transition-all ${
            allergyWarnings.has(index)
              ? "border-destructive bg-destructive/5"
              : "border-border bg-card"
          }`}>
            {allergyWarnings.has(index) && (
              <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Allergie détectée — vérifiez ce médicament
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2 md:col-span-1 space-y-1.5">
                <Label className="text-xs font-medium">Médicament <span className="text-destructive">*</span></Label>
                <Input
                  value={treatment.drug_name}
                  onChange={(e) => updateTreatment(index, "drug_name", e.target.value)}
                  placeholder="Nom commercial ou DCI"
                  className="rounded-xl border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Dosage</Label>
                <Input
                  value={treatment.dosage_mg}
                  onChange={(e) => updateTreatment(index, "dosage_mg", e.target.value)}
                  placeholder="Ex: 500mg, 1g..."
                  className="rounded-xl border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Durée (jours)</Label>
                <Input
                  type="number" min={1}
                  value={treatment.duration_days}
                  onChange={(e) => updateTreatment(index, "duration_days", Number(e.target.value))}
                  className="rounded-xl border-border text-sm"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium">Fréquence</Label>
                <Input
                  value={treatment.frequency}
                  onChange={(e) => updateTreatment(index, "frequency", e.target.value)}
                  placeholder="Ex: 2 fois par jour, toutes les 8h..."
                  className="rounded-xl border-border text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Voie d'administration</Label>
                <select
                  value={treatment.route}
                  onChange={(e) => updateTreatment(index, "route", e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {ROUTES.map((route) => (
                    <option key={route.value} value={route.value}>{route.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-3 space-y-1.5">
                <Label className="text-xs font-medium">Précautions / Remarques</Label>
                <Input
                  value={treatment.precautions}
                  onChange={(e) => updateTreatment(index, "precautions", e.target.value)}
                  placeholder="Ex: prendre pendant les repas, ne pas écraser..."
                  className="rounded-xl border-border text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={treatment.is_generic}
                  onChange={(e) => updateTreatment(index, "is_generic", e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <span className="text-muted-foreground">Substitution générique autorisée</span>
              </label>
              {treatments.length > 1 && (
                <button type="button" onClick={() => removeTreatment(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 text-xs">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Recommendations */}
      <section className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Recommandations</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_RECOMMENDATIONS.map((rec) => (
            <button key={rec} type="button" onClick={() => toggleRecommendation(rec)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                selectedRecommendations.includes(rec)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}>
              {rec}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={customRecommendation} onChange={(e) => setCustomRecommendation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRecommendation())}
            placeholder="Autre recommandation..." className="rounded-xl border-border text-sm" />
          <Button type="button" onClick={addCustomRecommendation} variant="outline" className="rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Follow-up */}
      <section className="space-y-4 border-t border-border pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Suivi</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Prochain RDV dans (jours)</Label>
            <Input type="number" min={0} placeholder="Ex: 7, 30..." className="rounded-xl border-border" {...register("follow_up_delay_days")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Examens de suivi</Label>
            <div className="flex gap-2">
              <Input value={customTest} onChange={(e) => setCustomTest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFollowUpTest())}
                placeholder="Ex: NFS à 3 mois..." className="rounded-xl border-border text-sm" />
              <Button type="button" onClick={addFollowUpTest} variant="outline" size="sm" className="rounded-xl"><Plus className="w-4 h-4" /></Button>
            </div>
            {followUpTests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {followUpTests.map((test) => (
                  <span key={test} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-lg">
                    {test}
                    <button type="button" onClick={() => setFollowUpTests((prev) => prev.filter((t) => t !== test))}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Practitioner */}
      <section className="space-y-4 border-t border-border pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Praticien signataire</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Titre</Label>
            <Input placeholder="Dr., Pr., Infirmier(e)..." className="rounded-xl border-border" {...register("practitioner_title")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nom <span className="text-destructive">*</span></Label>
            <Input placeholder="Prénom Nom" className="rounded-xl border-border" {...register("practitioner_name")} />
            {errors.practitioner_name && <p className="text-xs text-destructive">{errors.practitioner_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">N° RPPS / Ordre</Label>
            <Input placeholder="Numéro d'identification" className="rounded-xl border-border" {...register("practitioner_rpps")} />
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={onBack} variant="outline" className="rounded-xl border-border">Retour</Button>
        <Button type="submit" disabled={isSubmitting || allergyWarnings.size > 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium flex-1">
          {isSubmitting ? "Génération..." : "Générer et enregistrer l'ordonnance"}
        </Button>
      </div>
    </form>
  );
}
