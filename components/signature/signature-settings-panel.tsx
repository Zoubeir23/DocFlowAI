"use client";

import { useState, useTransition, useEffect } from "react";
import { saveDoctorSignature, deleteDoctorSignature, getDoctorSignature } from "@/actions/doctor-signature";
import { SignaturePad } from "./signature-pad";
import { toast } from "sonner";
import { PenLine, CheckCircle2, Loader2 } from "lucide-react";
import type { DoctorSignature } from "@/actions/doctor-signature";

export function SignatureSettingsPanel() {
  const [currentSignature, setCurrentSignature] = useState<DoctorSignature | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctorSignature().then((sig) => {
      setCurrentSignature(sig);
      setLoading(false);
    });
  }, []);
  const [isPending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!loading) setEditMode(!currentSignature);
  }, [loading, currentSignature]);

  if (loading) {
    return (
      <div className="card-panel">
        <div className="card-panel-header">
          <div className="flex items-center gap-3">
            <PenLine className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground text-[15px] uppercase tracking-wider">Signature électronique</span>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  function handleSave(dataUrl: string) {
    startTransition(async () => {
      const result = await saveDoctorSignature(dataUrl);
      if (result.success) {
        toast.success("Signature enregistrée");
        setCurrentSignature({
          ...( currentSignature ?? { id: "", user_id: "", clinic_id: "" }),
          signature_data_url: dataUrl,
          updated_at: new Date().toISOString(),
        });
        setEditMode(false);
      } else {
        toast.error(result.error ?? "Erreur lors de l'enregistrement");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDoctorSignature();
      if (result.success) {
        toast.success("Signature supprimée");
        setCurrentSignature(null);
        setEditMode(true);
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression");
      }
    });
  }

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div className="flex items-center gap-3">
          <PenLine className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground text-[15px] uppercase tracking-wider">
            Signature électronique
          </span>
        </div>
        {currentSignature && !editMode && (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="text-xs font-semibold text-primary hover:underline"
            disabled={isPending}
          >
            Modifier
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Cette signature sera automatiquement apposée sur vos ordonnances et documents médicaux imprimés.
        </p>

        {currentSignature && !editMode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Signature enregistrée
            </div>
            <div className="bg-white border-2 border-border rounded-xl p-4 flex items-center justify-center h-36">
              <img
                src={currentSignature.signature_data_url}
                alt="Votre signature"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(currentSignature.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        ) : (
          <SignaturePad
            initialDataUrl={currentSignature?.signature_data_url}
            onSave={handleSave}
            onDelete={currentSignature ? handleDelete : undefined}
            disabled={isPending}
          />
        )}
      </div>
    </div>
  );
}
