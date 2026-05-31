"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IcdCandidate, PatientProfileInput, SymptomsInput } from "@/types";

interface DoctorValidationStepProps {
  patientProfile: PatientProfileInput;
  symptomsData: SymptomsInput;
  candidates: IcdCandidate[];
  additionalTests: string[];
  onValidate: (
    code: string,
    name: string,
    validatedBy: string,
    status: "validated" | "rejected",
    rejectionReason?: string
  ) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function DoctorValidationStep({
  patientProfile,
  symptomsData,
  candidates,
  additionalTests,
  onValidate,
  onBack,
  isSubmitting,
}: DoctorValidationStepProps) {
  const t = useTranslations("diagnostics.validation");
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [validatedBy, setValidatedBy] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const topCandidate = candidates[selectedCandidateIndex];

  async function handleValidate() {
    if (!topCandidate || !validatedBy.trim()) return;
    await onValidate(
      topCandidate.code,
      topCandidate.title,
      validatedBy,
      "validated"
    );
  }

  async function handleReject() {
    if (!topCandidate || !validatedBy.trim() || !rejectionReason.trim()) return;
    await onValidate(
      topCandidate.code,
      topCandidate.title,
      validatedBy,
      "rejected",
      rejectionReason
    );
  }

  function getProbabilityBadge(probability: number) {
    if (probability >= 60) return "bg-green-100 text-green-700 border-green-200";
    if (probability >= 30) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  }

  return (
    <div className="space-y-8">

      {/* Validation header */}
      <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800">{t("obligatoryTitle")}</p>
          <p className="text-sm text-amber-700 mt-1">
            {t("obligatoryDesc")}
          </p>
        </div>
      </div>

      {/* Patient summary */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Résumé clinique</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Patient", value: patientProfile.patient_full_name },
            { label: "Âge", value: `${patientProfile.patient_age_years} ans` },
            { label: "Sexe", value: patientProfile.patient_sex === "male" ? "Masculin" : "Féminin" },
            { label: "Intensité", value: `${symptomsData.symptom_intensity}/10` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-foreground mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted/40 rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Motif de consultation</p>
          <p className="text-sm text-foreground">{symptomsData.chief_complaint}</p>
        </div>

        {patientProfile.allergies.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700">Allergies connues</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {patientProfile.allergies.map((allergy) => (
                  <span key={allergy} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-lg">{allergy}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {patientProfile.current_medications.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-semibold text-blue-700 mb-1">Médicaments actuels</p>
            <div className="flex flex-wrap gap-1.5">
              {patientProfile.current_medications.map((med) => (
                <span key={med} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-lg">{med}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Ranked candidates */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Sélectionner le diagnostic retenu
        </h3>
        <div className="space-y-2">
          {candidates.map((candidate, index) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelectedCandidateIndex(index)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                selectedCandidateIndex === index
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selectedCandidateIndex === index ? "border-primary bg-primary" : "border-border"
              }`}>
                {selectedCandidateIndex === index && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {candidate.code && (
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {candidate.code}
                    </span>
                  )}
                  {candidate.is_serious && (
                    <span className="text-[11px] text-orange-500 font-medium">⚠ Grave</span>
                  )}
                </div>
                <p className="text-sm text-foreground mt-0.5">{candidate.title}</p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex-shrink-0 ${getProbabilityBadge(candidate.probability)}`}>
                {candidate.probability}%
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Additional tests */}
      {additionalTests.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-700 mb-2">Examens complémentaires recommandés avant validation</p>
          <ul className="space-y-1">
            {additionalTests.map((test) => (
              <li key={test} className="text-sm text-amber-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validator identity */}
      <section className="space-y-2 border-t border-border pt-6">
        <Label className="text-sm font-medium">{t("validatorName")} <span className="text-destructive">*</span></Label>
        <Input
          value={validatedBy}
          onChange={(e) => setValidatedBy(e.target.value)}
          placeholder={t("validatorPlaceholder")}
          className="rounded-xl border-border max-w-sm"
        />
        {!validatedBy.trim() && (
          <p className="text-xs text-muted-foreground">{t("requiredHint")}</p>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="button" onClick={onBack} variant="outline" className="rounded-xl border-border">
          {t("back")}
        </Button>

        {!showRejectionForm ? (
          <>
            <Button
              type="button"
              onClick={() => setShowRejectionForm(true)}
              variant="outline"
              className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
            >
              <XCircle className="w-4 h-4" />
              {t("rejectRequestTests")}
            </Button>
            <Button
              type="button"
              onClick={handleValidate}
              disabled={!topCandidate || !validatedBy.trim() || isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium flex-1 gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? t("validating") : t("validateAndPrescribe")}
            </Button>
          </>
        ) : (
          <div className="flex-1 space-y-3">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("rejectionReasonDoctorStep")}
              className="rounded-xl border-destructive/40 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <Button type="button" onClick={() => setShowRejectionForm(false)} variant="outline" className="rounded-xl">
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleReject}
                disabled={!validatedBy.trim() || !rejectionReason.trim() || isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-medium flex-1"
              >
                {isSubmitting ? t("sending") : t("confirmReject")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
