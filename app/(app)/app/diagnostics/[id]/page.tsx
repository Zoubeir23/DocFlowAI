import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { getDiagnosticById } from "@/actions/diagnostics";
import { getDoctorSignature } from "@/actions/doctor-signature";
import { PrescriptionPrintDocument } from "@/components/diagnostics/prescription-print-document";

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

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <PrescriptionPrintDocument
          diagnostic={diagnostic}
          signatureDataUrl={signature?.signature_data_url}
        />
      </div>
    </div>
  );
}
