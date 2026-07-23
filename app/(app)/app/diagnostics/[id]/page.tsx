import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileEdit, Stethoscope } from "lucide-react";
import { getDiagnosticById } from "@/actions/diagnostics";
import { getDoctorSignature } from "@/actions/doctor-signature";
import { PrescriptionPrintDocument } from "@/components/diagnostics/prescription-print-document";
import { DiagnosticValidationPanel } from "@/components/diagnostics/diagnostic-validation-panel";
import { ComorbiditiesPanel } from "@/components/diagnostics/comorbidities-panel";

interface DiagnosticDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DiagnosticDetailPage({ params }: DiagnosticDetailPageProps) {
  const { id } = await params;
  const [diagnostic, signature] = await Promise.all([
    getDiagnosticById(id),
    getDoctorSignature(),
  ]);

  if (!diagnostic) notFound();

  const STATUS_STYLES: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending_validation: "bg-amber-100 text-amber-700",
    validated: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const STATUS_LABELS: Record<string, string> = {
    draft: "Brouillon",
    pending_validation: "En attente de validation",
    validated: "Validé",
    rejected: "Rejeté",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-6 md:px-6 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/app/diagnostics"
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                <h1 className="font-bold text-foreground">{diagnostic.patient_full_name}</h1>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[diagnostic.validation_status]}`}>
                  {STATUS_LABELS[diagnostic.validation_status]}
                </span>
              </div>
              {diagnostic.validated_diagnosis_name && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {diagnostic.validated_diagnosis_code && (
                    <span className="font-mono text-primary mr-1.5">{diagnostic.validated_diagnosis_code}</span>
                  )}
                  {diagnostic.validated_diagnosis_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {diagnostic.validation_status === "pending_validation" && (
          <DiagnosticValidationPanel
            diagnosticId={diagnostic.id}
            diagnosisCode={diagnostic.icd_candidates?.[0]?.code ?? ""}
            diagnosisName={diagnostic.icd_candidates?.[0]?.title ?? diagnostic.chief_complaint ?? ""}
          />
        )}
        {diagnostic.validated_diagnosis_code && (
          <ComorbiditiesPanel
            diagnosisCode={diagnostic.validated_diagnosis_code}
            diagnosisName={diagnostic.validated_diagnosis_name ?? diagnostic.chief_complaint ?? ""}
          />
        )}

        {/* Un diagnostic validé depuis ce panneau (plutôt que via l'étape 4 du
            wizard) n'a pas encore d'ordonnance tant que current_step < 6
            (updateDiagnosticPrescription). Sans ce lien, rien dans l'UI ne
            permet d'atteindre l'étape 5. */}
        {diagnostic.validation_status === "validated" && (diagnostic.current_step ?? 0) < 6 && (
          <Link
            href={`/app/diagnostics/${diagnostic.id}/edit?step=5`}
            className="print:hidden flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileEdit className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Diagnostic validé — ordonnance non créée</p>
                <p className="text-xs text-muted-foreground">Continuer vers l'étape 5 pour générer le document</p>
              </div>
            </div>
          </Link>
        )}

        <PrescriptionPrintDocument
          diagnostic={diagnostic}
          signatureDataUrl={signature?.signature_data_url}
        />
      </div>
    </div>
  );
}
