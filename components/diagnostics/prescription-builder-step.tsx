"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, AlertTriangle, Pill, ClipboardList, ActivitySquare, Loader2, Check } from "lucide-react";
import { AtcDrugSearch } from "@/components/diagnostics/atc-drug-search";
import { IcfSearchField } from "@/components/diagnostics/icf-search-field";
import { DrugInteractionWarning } from "@/components/diagnostics/drug-interaction-warning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkAllergyConflicts } from "@/lib/diagnostic-scoring";
import type { PrescriptionInput, PrescriptionTreatment, DiagnosticDocumentType, IcfCode, DrugInteractionPair, PharmacovigilanceSignal } from "@/types";

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
  rxcui: "",
  atc_code: "",
  dosage_mg: "",
  frequency: "1 fois par jour",
  duration_days: 7,
  route: "oral",
  precautions: "",
  is_generic: false,
};

function VigibaseSignalBadge({ signal }: { signal: PharmacovigilanceSignal }) {
  const isHighRisk = signal.seriousnessRate > 50;
  return (
    <div
      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
        isHighRisk
          ? "bg-orange-50 border-orange-200 text-orange-800"
          : "bg-blue-50 border-blue-200 text-blue-800"
      }`}
    >
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold">
          {signal.totalReports.toLocaleString()} effets indésirables signalés (FDA FAERS)
        </span>
        {signal.seriousnessRate > 0 && (
          <span className="ml-1 opacity-75">• {signal.seriousnessRate}% graves</span>
        )}
        {signal.topReactions.length > 0 && (
          <p className="mt-0.5 opacity-75">
            Top réactions: {signal.topReactions.slice(0, 3).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

/** Issue du contrôle d'interactions, rendue visible dans tous les cas. */
type InteractionCheckState = "idle" | "checking" | "clear" | "found" | "failed";

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
  const t = useTranslations("diagnostics");
  const [treatments, setTreatments] = useState<PrescriptionTreatment[]>([{ ...EMPTY_TREATMENT }]);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [customRecommendation, setCustomRecommendation] = useState("");
  const [followUpTests, setFollowUpTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState("");
  const [allergyWarnings, setAllergyWarnings] = useState<Set<number>>(new Set());

  const [icfCodes, setIcfCodes] = useState<IcfCode[]>([]);
  const [drugInteractions, setDrugInteractions] = useState<DrugInteractionPair[]>([]);
  const [interactionCheckState, setInteractionCheckState] = useState<InteractionCheckState>("idle");
  const [uncodedDrugCount, setUncodedDrugCount] = useState(0);
  const [vigibaseSignals, setVigibaseSignals] = useState<Map<string, PharmacovigilanceSignal>>(new Map());

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<Omit<PrescriptionInput, "treatments" | "recommendations" | "follow_up_tests" | "icf_codes">>({
    resolver: zodResolver(prescriptionSchema.omit({ treatments: true, recommendations: true, follow_up_tests: true })),
    defaultValues: {
      document_type: "prescription",
      follow_up_delay_days: 7,
      practitioner_title: "Dr.",
    },
  });

  const selectedDocumentType = watch("document_type");

  // Contrôle des interactions à chaque changement de traitement.
  //
  // Chaque issue est rendue visible : un échec réseau ne doit jamais ressembler
  // à « aucune interaction », sans quoi le prescripteur lit l'absence d'alerte
  // comme un feu vert. Les médicaments sans code RxNorm sortent du contrôle et
  // sont comptés pour être signalés explicitement.
  const checkInteractions = useCallback(async (currentTreatments: PrescriptionTreatment[]) => {
    const namedTreatments = currentTreatments.filter(
      (treatment) => treatment.drug_name && treatment.drug_name.trim() !== ""
    );
    const rxcuis = namedTreatments
      .map((treatment) => treatment.rxcui)
      .filter((code): code is string => Boolean(code) && /^\d+$/.test(code!));

    setUncodedDrugCount(namedTreatments.length - rxcuis.length);

    if (rxcuis.length < 2) {
      setDrugInteractions([]);
      setInteractionCheckState("idle");
      return;
    }

    setInteractionCheckState("checking");
    try {
      const response = await fetch("/api/who/drug-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rxcuis }),
      });

      if (!response.ok) {
        setDrugInteractions([]);
        setInteractionCheckState("failed");
        return;
      }

      const result: { interactions: DrugInteractionPair[] } = await response.json();
      const foundInteractions = result.interactions ?? [];
      setDrugInteractions(foundInteractions);
      setInteractionCheckState(foundInteractions.length > 0 ? "found" : "clear");
    } catch {
      setDrugInteractions([]);
      setInteractionCheckState("failed");
    }
  }, []);

  async function fetchVigibaseSignal(rxcui: string, drugName: string) {
    if (!rxcui || !/^\d+$/.test(rxcui) || vigibaseSignals.has(rxcui)) return;
    try {
      const response = await fetch(
        `/api/who/vigibase?rxcui=${encodeURIComponent(rxcui)}&drugName=${encodeURIComponent(drugName)}`
      );
      if (response.ok) {
        const data: { signal: PharmacovigilanceSignal | null } = await response.json();
        if (data.signal) {
          setVigibaseSignals((prev) => new Map(prev).set(rxcui, data.signal!));
        }
      }
    } catch {
      // Advisory only — ignore errors
    }
  }

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

      // Fetch vigibase signal when a valid rxcui is set
      if (field === "rxcui" && value) {
        fetchVigibaseSignal(value as string, newTreatment.drug_name);
      }

      return newTreatment;
    });
    setTreatments(updated);
    // Re-check interactions when rxcui changes
    if (field === "rxcui") {
      checkInteractions(updated);
    }
  }

  function addTreatment() {
    setTreatments([...treatments, { ...EMPTY_TREATMENT }]);
  }

  function removeTreatment(index: number) {
    const updated = treatments.filter((_, idx) => idx !== index);
    setTreatments(updated);
    setAllergyWarnings((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    checkInteractions(updated);
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

  async function handleFormSubmit(formData: Omit<PrescriptionInput, "treatments" | "recommendations" | "follow_up_tests" | "icf_codes">) {
    if (allergyWarnings.size > 0) return;

    // Les traitements sont optionnels : les lignes sans médicament renseigné
    // sont simplement omises plutôt que de bloquer la soumission (ex: reçu,
    // certificat, rapport médical sans prescription associée).
    const filledTreatments = treatments.filter((treatment) => treatment.drug_name.trim() !== "");
    for (const treatment of filledTreatments) {
      if (treatment.duration_days < 1) {
        import("sonner").then(({ toast }) => toast.error("La durée de traitement doit être d'au moins 1 jour"));
        return;
      }
    }

    await onSubmit({
      ...formData,
      treatments: filledTreatments,
      recommendations: selectedRecommendations,
      follow_up_tests: followUpTests,
      icf_codes: icfCodes,
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
          <p className="text-xs text-green-600 font-semibold">{t("prescriptionStep.validatedBanner")}</p>
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
            <Plus className="w-3.5 h-3.5" /> {t("prescriptionStep.addMedication")}
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
                {t("prescriptionStep.allergyWarning")}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2 md:col-span-1 space-y-1.5">
                <Label className="text-xs font-medium">Médicament <span className="text-destructive">*</span></Label>
                <AtcDrugSearch
                  value={treatment.drug_name}
                  atcCode={treatment.atc_code}
                  onSelect={(name, atcCode, rxcui) => {
                    updateTreatment(index, "drug_name", name);
                    updateTreatment(index, "atc_code", atcCode);
                    updateTreatment(index, "rxcui", rxcui);
                  }}
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
                <Label className="text-xs font-medium">Voie d&apos;administration</Label>
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

            {/* Vigibase pharmacovigilance signal */}
            {treatment.rxcui && vigibaseSignals.has(treatment.rxcui) && (
              <VigibaseSignalBadge signal={vigibaseSignals.get(treatment.rxcui)!} />
            )}

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
              <button type="button" onClick={() => removeTreatment(index)}
                className="text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 text-xs">
                <Trash2 className="w-3.5 h-3.5" /> {t("prescriptionStep.remove")}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Contrôle des interactions : chaque issue est affichée, y compris l'échec */}
      {(interactionCheckState !== "idle" || uncodedDrugCount > 0) && (
        <section className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 ${interactionCheckState === "failed" ? "text-destructive" : "text-amber-500"}`}
            />
            <h3
              className={`text-sm font-semibold uppercase tracking-wide ${
                interactionCheckState === "failed" ? "text-destructive" : "text-amber-600"
              }`}
            >
              {t("prescriptionStep.interactionsTitle")}
              {interactionCheckState === "checking" && (
                <Loader2 className="inline ml-2 w-3 h-3 animate-spin" />
              )}
            </h3>
          </div>

          {interactionCheckState === "checking" && (
            <p className="text-sm text-muted-foreground">
              {t("prescriptionStep.interactionsChecking")}
            </p>
          )}

          {interactionCheckState === "found" && (
            <DrugInteractionWarning interactions={drugInteractions} />
          )}

          {interactionCheckState === "clear" && (
            <p className="flex items-center gap-2 text-sm text-emerald-600">
              <Check className="w-4 h-4" />
              {t("prescriptionStep.interactionsClear")}
            </p>
          )}

          {interactionCheckState === "failed" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm text-destructive">
                {t("prescriptionStep.interactionsFailed")}
              </p>
              <button
                type="button"
                onClick={() => checkInteractions(treatments)}
                className="text-xs font-semibold uppercase tracking-wide text-destructive underline underline-offset-4"
              >
                {t("prescriptionStep.interactionsRetry")}
              </button>
            </div>
          )}

          {uncodedDrugCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("prescriptionStep.interactionsUncoded", { count: uncodedDrugCount })}
            </p>
          )}
        </section>
      )}

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

      {/* ICF codes — only for sick leave certificates */}
      {selectedDocumentType === "sick_leave" && (
        <section className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <ActivitySquare className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-600">
              Limitations fonctionnelles (ICF — OMS)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Documentez les limitations fonctionnelles du patient pour justifier l&apos;arrêt de travail.
          </p>
          <IcfSearchField
            selectedCodes={icfCodes}
            onAdd={(code) => setIcfCodes((prev) => [...prev, code])}
            onRemove={(codeId) => setIcfCodes((prev) => prev.filter((c) => c.id !== codeId))}
          />
        </section>
      )}

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
        <Button type="button" onClick={onBack} variant="outline" className="rounded-xl border-border">{t("prescriptionStep.back")}</Button>
        <Button type="submit" disabled={isSubmitting || allergyWarnings.size > 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium flex-1">
          {isSubmitting ? t("prescriptionStep.generating") : t("prescriptionStep.generateAndSave")}
        </Button>
      </div>
    </form>
  );
}
