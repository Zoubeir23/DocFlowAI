"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Brain, AlertTriangle, FlaskConical, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IcdSearchField } from "./icd-search-field";
import { scoreAndRankCandidates, detectRequiredTests, applyGhoPrevalenceWeighting } from "@/lib/diagnostic-scoring";
import type { IcdCandidate, IcdCode, VitalSigns, SymptomsInput, PatientProfileInput } from "@/types";

interface IcdAnalysisStepProps {
  patientProfile: PatientProfileInput;
  symptomsData: SymptomsInput;
  onNext: (candidates: IcdCandidate[], additionalTests: string[], clinicalNotes: string) => void;
  onBack: () => void;
  defaultCandidates?: IcdCandidate[];
  defaultAdditionalTests?: string[];
  defaultClinicalNotes?: string;
}

export function IcdAnalysisStep({
  patientProfile,
  symptomsData,
  onNext,
  onBack,
  defaultCandidates,
  defaultAdditionalTests,
  defaultClinicalNotes,
}: IcdAnalysisStepProps) {
  const t = useTranslations("diagnostics");
  const hasSavedAnalysis = (defaultCandidates?.length ?? 0) > 0;
  const [manualCodes, setManualCodes] = useState<IcdCode[]>([]);
  const [rankedCandidates, setRankedCandidates] = useState<IcdCandidate[]>(defaultCandidates ?? []);
  const [additionalTests, setAdditionalTests] = useState<string[]>(defaultAdditionalTests ?? []);
  const [clinicalNotes, setClinicalNotes] = useState(defaultClinicalNotes ?? "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(hasSavedAnalysis);

  const vitals: VitalSigns = {
    temperature: symptomsData.vital_temperature ?? null,
    blood_pressure_systolic: symptomsData.vital_blood_pressure_systolic ?? null,
    blood_pressure_diastolic: symptomsData.vital_blood_pressure_diastolic ?? null,
    heart_rate: symptomsData.vital_heart_rate ?? null,
    respiratory_rate: symptomsData.vital_respiratory_rate ?? null,
    oxygen_saturation: symptomsData.vital_oxygen_saturation ?? null,
  };

  const runAnalysis = useCallback(async () => {
    const allSymptoms = (symptomsData.symptoms ?? []).join(" ");
    const query = [symptomsData.chief_complaint, allSymptoms].filter(Boolean).join(" ");

    if (!query.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `/api/icd/search?q=${encodeURIComponent(query)}&lang=fr&limit=10`
      );
      const data = await response.json() as { results: Array<{ id: string; title: string; theCode?: string; score?: number }> };

      const rawResults = (data.results ?? []).map((result) => ({
        id: result.id,
        code: result.theCode ?? "",
        title: result.title,
        score: result.score,
      }));

      const scored = scoreAndRankCandidates(rawResults, {
        symptoms: symptomsData.symptoms ?? [],
        ageYears: patientProfile.patient_age_years ?? 30,
        sex: patientProfile.patient_sex ?? "male",
        vitals,
        allergies: patientProfile.allergies ?? [],
        chronicConditions: patientProfile.chronic_conditions ?? [],
        currentMedications: patientProfile.current_medications ?? [],
      });

      // Apply GHO epidemiological prevalence weighting (best-effort: silently skipped on failure)
      const weighted = await applyGhoPrevalenceWeighting(scored).catch(() => scored);

      const tests = detectRequiredTests(weighted, vitals);

      setRankedCandidates(weighted);
      setAdditionalTests(tests);
      setHasAnalyzed(true);
    } catch (error) {
      console.error("[ICD Analysis]", error);
      import("sonner").then(({ toast }) => toast.error("Échec de l'analyse ICD-11 — réessayez"));
    } finally {
      setIsAnalyzing(false);
    }
  }, [symptomsData, patientProfile]);

  useEffect(() => {
    // Ne relance pas automatiquement l'analyse si on reprend une étape 3 déjà
    // complétée — cf. defaultCandidates. L'utilisateur garde le bouton
    // "Relancer l'analyse" pour la refaire volontairement.
    if (!hasSavedAnalysis) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleManualCodesChange(codes: IcdCode[]) {
    setManualCodes(codes);
    const manualAsCandidate: IcdCandidate[] = codes.map((code) => ({
      ...code,
      score: 0.9,
      probability: 90,
      is_serious: false,
    }));
    const idsInManual = new Set(codes.map((c) => c.id));
    const filteredAuto = rankedCandidates.filter((c) => !idsInManual.has(c.id));
    setRankedCandidates([...manualAsCandidate, ...filteredAuto]);
  }

  function moveCandidateUp(index: number) {
    if (index === 0) return;
    const updated = [...rankedCandidates];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setRankedCandidates(updated);
  }

  function moveCandidateDown(index: number) {
    if (index === rankedCandidates.length - 1) return;
    const updated = [...rankedCandidates];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setRankedCandidates(updated);
  }

  function removeCandidate(id: string) {
    setRankedCandidates((prev) => prev.filter((c) => c.id !== id));
  }

  function getProbabilityColor(probability: number): string {
    if (probability >= 60) return "bg-green-100 text-green-700 border-green-200";
    if (probability >= 30) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  }

  function handleSubmit() {
    onNext(rankedCandidates, additionalTests, clinicalNotes);
  }

  return (
    <div className="space-y-8">

      {/* Context summary */}
      <div className="bg-muted/40 rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Analyse pour :</span>{" "}
          {patientProfile.patient_full_name}, {patientProfile.patient_age_years} ans,{" "}
          {patientProfile.patient_sex === "male" ? "Masculin" : "Féminin"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground">Motif :</span> {symptomsData.chief_complaint}
        </p>
        {(symptomsData.symptoms ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(symptomsData.symptoms ?? []).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-lg">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* ICD-11 Analysis results */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{t("icd.candidatesTitle")}</h3>
          {isAnalyzing && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("icd.analyzingApi")}
          </div>
        )}

        {!isAnalyzing && rankedCandidates.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Classement par probabilité. Le premier est le diagnostic principal. Réorganisez selon votre jugement clinique.
            </p>
            {rankedCandidates.map((candidate, index) => (
              <div key={candidate.id}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  index === 0
                    ? "border-primary/30 bg-primary/5"
                    : candidate.is_serious
                    ? "border-orange-200 bg-orange-50/50"
                    : "border-border bg-card"
                }`}>
                {/* Rank */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => moveCandidateUp(index)} disabled={index === 0}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-accent disabled:opacity-20">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <button type="button" onClick={() => moveCandidateDown(index)} disabled={index === rankedCandidates.length - 1}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-accent disabled:opacity-20">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {candidate.code && (
                      <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {candidate.code}
                      </span>
                    )}
                    <span className="text-sm font-medium text-foreground">{candidate.title}</span>
                    {candidate.is_serious && (
                      <span className="flex items-center gap-1 text-[11px] text-orange-600 font-medium">
                        <AlertTriangle className="w-3 h-3" /> À exclure en priorité
                      </span>
                    )}
                  </div>
                </div>

                {/* Probability */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getProbabilityColor(candidate.probability)}`}>
                    {candidate.probability}%
                  </span>
                  <button type="button" onClick={() => removeCandidate(candidate.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual ICD search */}
        <div className="space-y-2 border-t border-border pt-4">
          <Label className="text-sm font-medium">{t("icd.addManually")}</Label>
          <IcdSearchField selectedCodes={manualCodes} onCodesChange={handleManualCodesChange} />
        </div>

        <Button type="button" onClick={runAnalysis} disabled={isAnalyzing} variant="outline" className="rounded-xl gap-2 text-sm">
          <Brain className="w-4 h-4" />
          {isAnalyzing ? t("icd.analyzing") : t("icd.rerunAnalysis")}
        </Button>
      </section>

      {/* Additional tests */}
      {additionalTests.length > 0 && (
        <section className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Examens complémentaires recommandés</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {additionalTests.map((test) => (
              <div key={test} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <FlaskConical className="w-3.5 h-3.5" />
                {test}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clinical notes */}
      <section className="space-y-2 border-t border-border pt-6">
        <Label className="text-sm font-medium">Notes cliniques du praticien</Label>
        <Textarea
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="Observations cliniques, résultats d'examens physiques, remarques..."
          className="rounded-xl border-border resize-none"
          rows={4}
        />
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={onBack} variant="outline" className="rounded-xl border-border">{t("validation.back")}</Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={rankedCandidates.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium flex-1"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {t("icd.submitForValidation")}
        </Button>
      </div>
    </div>
  );
}
