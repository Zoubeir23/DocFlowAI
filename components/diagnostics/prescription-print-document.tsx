"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Printer, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagnosticRecord } from "@/types";

/** Statut du sceau, calculé côté serveur : ce composant ne recalcule rien. */
type DocumentSealStatus = "sealed" | "unsealed" | "tampered";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  consultation: "Compte rendu de consultation",
  prescription: "Ordonnance médicale",
  receipt: "Reçu médical",
  medical_report: "Rapport médical",
  sick_leave: "Certificat médical",
};

const AGE_GROUP_LABELS: Record<string, string> = {
  infant: "Nourrisson (0–3 ans)",
  toddler: "Petit enfant (3–5 ans)",
  child: "Enfant (5–12 ans)",
  minor: "Mineur (12–18 ans)",
  adult: "Adulte (18+)",
};

const ROUTE_LABELS: Record<string, string> = {
  oral: "Voie orale",
  iv: "Intraveineuse (IV)",
  im: "Intramusculaire (IM)",
  topical: "Application locale",
  inhaled: "Inhalation",
  sublingual: "Sublinguale",
};

interface PrescriptionPrintDocumentProps {
  diagnostic: DiagnosticRecord;
  clinicName?: string;
  clinicAddress?: string;
  signatureDataUrl?: string;
  /** Résultat de la vérification du sceau, calculée côté serveur. */
  sealStatus?: DocumentSealStatus;
  /** Référence courte imprimable du sceau, mise en forme côté serveur. */
  sealReference?: string;
}

export function PrescriptionPrintDocument({
  diagnostic,
  clinicName = "Cabinet médical",
  clinicAddress,
  signatureDataUrl,
  sealStatus = "unsealed",
  sealReference,
}: PrescriptionPrintDocumentProps) {
  const documentTitle = (diagnostic.document_type ? DOCUMENT_TYPE_LABELS[diagnostic.document_type] : null) ?? "Document médical";
  const formattedDate = format(parseISO(diagnostic.created_at), "d MMMM yyyy", { locale: fr });

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 justify-end print:hidden">
        <Button onClick={() => window.print()} variant="outline" className="rounded-xl gap-2">
          <Printer className="w-4 h-4" /> Imprimer
        </Button>
      </div>

      {sealStatus === "tampered" && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-bold">Document modifié après signature</p>
            <p className="mt-0.5">
              Le contenu ne correspond plus à celui scellé lors de la production du document. La
              signature affichée ne l&apos;engage pas. Régénérez le document avant toute remise au
              patient.
            </p>
          </div>
        </div>
      )}

      {/* Document */}
      <div className="bg-white text-gray-900 rounded-2xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:rounded-none">

        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{clinicName}</h1>
            {clinicAddress && <p className="text-sm text-gray-500 mt-1">{clinicAddress}</p>}
            {diagnostic.practitioner_name && (
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {diagnostic.practitioner_title} {diagnostic.practitioner_name}
                {diagnostic.practitioner_rpps && (
                  <span className="text-gray-600 font-normal ml-2">— N° {diagnostic.practitioner_rpps}</span>
                )}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="inline-block bg-gray-900 text-white px-4 py-2 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest">{documentTitle}</p>
            </div>
            <p className="text-sm text-gray-500 mt-3">Le {formattedDate}</p>
            <p className="text-xs text-gray-600 font-mono mt-1">Réf: {diagnostic.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="p-8 space-y-7">

          {/* Patient */}
          <section>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Patient</p>
            <div className="bg-gray-50 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border border-gray-100">
              <div>
                <p className="text-gray-600 text-xs">Nom complet</p>
                <p className="font-bold text-gray-900 mt-0.5">{diagnostic.patient_full_name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Âge</p>
                <p className="font-bold text-gray-900 mt-0.5">{diagnostic.patient_age_years} ans</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Catégorie</p>
                <p className="font-semibold text-gray-700 mt-0.5">{diagnostic.patient_age_group ? AGE_GROUP_LABELS[diagnostic.patient_age_group] : "—"}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Sexe</p>
                <p className="font-semibold text-gray-700 mt-0.5">
                  {diagnostic.patient_sex === "male" ? "Masculin" : "Féminin"}
                </p>
              </div>
              {diagnostic.patient_weight_kg && (
                <div>
                  <p className="text-gray-600 text-xs">Poids</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{diagnostic.patient_weight_kg} kg</p>
                </div>
              )}
              {diagnostic.patient_blood_group && diagnostic.patient_blood_group !== "unknown" && (
                <div>
                  <p className="text-gray-600 text-xs">Groupe sanguin</p>
                  <p className="font-bold text-gray-900 mt-0.5">{diagnostic.patient_blood_group}</p>
                </div>
              )}
            </div>
          </section>

          {/* Diagnosis */}
          {diagnostic.validated_diagnosis_name && (
            <section>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Diagnostic retenu</p>
              <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                {diagnostic.validated_diagnosis_code && (
                  <span className="font-mono text-sm font-bold text-indigo-700 bg-white border border-indigo-200 px-3 py-1 rounded-lg flex-shrink-0">
                    {diagnostic.validated_diagnosis_code}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{diagnostic.validated_diagnosis_name}</p>
                  {diagnostic.chief_complaint && (
                    <p className="text-sm text-gray-500 mt-0.5">Motif : {diagnostic.chief_complaint}</p>
                  )}
                </div>
              </div>
              {diagnostic.validated_by && (
                <p className="text-xs text-gray-600 mt-2">
                  Validé par {diagnostic.validated_by}
                  {diagnostic.validated_at && ` le ${format(parseISO(diagnostic.validated_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}`}
                </p>
              )}
            </section>
          )}

          {/* Signes vitaux if present */}
          {(diagnostic.vital_temperature || diagnostic.vital_heart_rate || diagnostic.vital_oxygen_saturation) && (
            <section>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Signes vitaux relevés</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {diagnostic.vital_temperature && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-600">Temp.</p>
                    <p className="font-bold text-gray-900 text-sm mt-1">{diagnostic.vital_temperature}°C</p>
                  </div>
                )}
                {diagnostic.vital_blood_pressure_systolic && diagnostic.vital_blood_pressure_diastolic && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-600">TA</p>
                    <p className="font-bold text-gray-900 text-sm mt-1">
                      {diagnostic.vital_blood_pressure_systolic}/{diagnostic.vital_blood_pressure_diastolic}
                    </p>
                  </div>
                )}
                {diagnostic.vital_heart_rate && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-600">FC</p>
                    <p className="font-bold text-gray-900 text-sm mt-1">{diagnostic.vital_heart_rate} bpm</p>
                  </div>
                )}
                {diagnostic.vital_oxygen_saturation && (
                  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-600">SpO₂</p>
                    <p className="font-bold text-gray-900 text-sm mt-1">{diagnostic.vital_oxygen_saturation}%</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Clinical notes */}
          {diagnostic.clinical_notes && (
            <section>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Notes cliniques</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{diagnostic.clinical_notes}</p>
            </section>
          )}

          {/* Treatments */}
          {diagnostic.treatments && diagnostic.treatments.length > 0 && (
            <section>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Traitement prescrit</p>
              <div className="space-y-3">
                {diagnostic.treatments.map((treatment, index) => (
                  <div key={index} className="p-5 border-l-4 border-indigo-400 bg-indigo-50/60 rounded-r-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-900 text-base">
                          {treatment.drug_name}
                          {treatment.is_generic && (
                            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Générique OK</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {treatment.dosage_mg && <span className="font-semibold">{treatment.dosage_mg} — </span>}
                          {treatment.frequency} — {treatment.duration_days} jour{treatment.duration_days > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{ROUTE_LABELS[treatment.route]}</p>
                      </div>
                    </div>
                    {treatment.precautions && (
                      <p className="text-xs text-gray-500 mt-2 italic">⚠ {treatment.precautions}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {diagnostic.recommendations && diagnostic.recommendations.length > 0 && (
            <section>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Recommandations</p>
              <ul className="space-y-1.5">
                {diagnostic.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Follow-up */}
          {(diagnostic.follow_up_delay_days || (diagnostic.follow_up_tests && diagnostic.follow_up_tests.length > 0)) && (
            <section>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Suivi</p>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-gray-700 space-y-2">
                {diagnostic.follow_up_delay_days && (
                  <p>Prochaine consultation recommandée dans <strong>{diagnostic.follow_up_delay_days} jours</strong></p>
                )}
                {diagnostic.follow_up_tests && diagnostic.follow_up_tests.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Examens à prévoir :</p>
                    <ul className="space-y-1">
                      {diagnostic.follow_up_tests.map((test) => (
                        <li key={test} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {test}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Signature */}
          <section className="border-t border-gray-200 pt-6 flex justify-between items-end">
            <div className="text-xs text-gray-600 space-y-1">
              <p>Document généré le {formattedDate}</p>
              <p className="font-mono">Réf: {diagnostic.id.slice(0, 8).toUpperCase()}</p>
              {sealStatus === "sealed" && sealReference && (
                <p className="font-mono text-gray-500">Sceau: {sealReference}</p>
              )}
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-600">Signature et cachet</p>
              {signatureDataUrl ? (
                <div className="flex flex-col items-center gap-1">
                  <img
                    src={signatureDataUrl}
                    alt="Signature du médecin"
                    className="h-20 max-w-[176px] object-contain"
                  />
                  <div className="w-44 border-b border-gray-200" />
                </div>
              ) : (
                <div className="w-44 border-b-2 border-gray-300 mt-12" />
              )}
              {diagnostic.practitioner_name && (
                <p className="text-xs font-medium text-gray-700">
                  {diagnostic.practitioner_title} {diagnostic.practitioner_name}
                </p>
              )}
              {diagnostic.practitioner_rpps && (
                <p className="text-xs text-gray-600">N° {diagnostic.practitioner_rpps}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
