"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateDiagnostic } from "@/actions/diagnostics";

interface DiagnosticValidationPanelProps {
  diagnosticId: string;
  diagnosisCode: string;
  diagnosisName: string;
}

export function DiagnosticValidationPanel({
  diagnosticId,
  diagnosisCode,
  diagnosisName,
}: DiagnosticValidationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [validatedBy, setValidatedBy] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejection, setShowRejection] = useState(false);

  function handleValidate() {
    if (!validatedBy.trim()) return;
    startTransition(async () => {
      const result = await validateDiagnostic(
        diagnosticId,
        diagnosisCode,
        diagnosisName,
        validatedBy,
        "validated"
      );
      if (result.success) {
        toast.success("Diagnostic validé");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur de validation");
      }
    });
  }

  function handleReject() {
    if (!validatedBy.trim() || !rejectionReason.trim()) return;
    startTransition(async () => {
      const result = await validateDiagnostic(
        diagnosticId,
        diagnosisCode,
        diagnosisName,
        validatedBy,
        "rejected",
        rejectionReason
      );
      if (result.success) {
        toast.success("Diagnostic rejeté");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-2xl p-6 space-y-4 print:hidden">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-amber-800 dark:text-amber-300">Validation médicale requise</h3>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Nom du médecin validateur <span className="text-destructive">*</span></Label>
        <Input
          placeholder="Dr. Nom Prénom"
          value={validatedBy}
          onChange={(e) => setValidatedBy(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {!showRejection ? (
        <div className="flex gap-3">
          <Button
            onClick={handleValidate}
            disabled={!validatedBy.trim() || isPending}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <ShieldCheck className="w-4 h-4" />
            {isPending ? "Validation..." : "Valider le diagnostic"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRejection(true)}
            disabled={!validatedBy.trim() || isPending}
            className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            Rejeter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-red-600">Motif du rejet <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Expliquez la raison du rejet..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="max-w-md"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              disabled={!validatedBy.trim() || !rejectionReason.trim() || isPending}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <XCircle className="w-4 h-4" />
              {isPending ? "Rejet..." : "Confirmer le rejet"}
            </Button>
            <Button variant="ghost" onClick={() => setShowRejection(false)} disabled={isPending}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
