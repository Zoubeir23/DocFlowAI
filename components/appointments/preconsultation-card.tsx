import { ClipboardList, AlertTriangle } from "lucide-react";

export interface PreconsultationData {
  reason?: string;
  symptoms?: string;
  medications?: string;
  allergies?: string;
  pain_level?: number;
}

interface PreconsultationCardProps {
  formData: PreconsultationData | null;
  submittedAt: string | null;
}

const PAIN_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Aucune", color: "text-emerald-600" },
  1: { label: "Très légère", color: "text-emerald-500" },
  2: { label: "Légère", color: "text-green-500" },
  3: { label: "Modérée légère", color: "text-lime-600" },
  4: { label: "Modérée", color: "text-yellow-500" },
  5: { label: "Moyenne", color: "text-amber-500" },
  6: { label: "Modérée forte", color: "text-orange-400" },
  7: { label: "Forte", color: "text-orange-500" },
  8: { label: "Très forte", color: "text-red-500" },
  9: { label: "Intense", color: "text-red-600" },
  10: { label: "Insupportable", color: "text-red-700" },
};

export function PreconsultationCard({ formData, submittedAt }: PreconsultationCardProps) {
  if (!formData || !submittedAt) return null;

  const painInfo = formData.pain_level !== undefined ? PAIN_LABELS[formData.pain_level] : null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Formulaire pré-consultation</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(submittedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {formData.reason && (
          <div className="col-span-2 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Raison de la visite</p>
            <p className="text-foreground leading-relaxed">{formData.reason}</p>
          </div>
        )}

        {formData.symptoms && (
          <div className="col-span-2 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Symptômes</p>
            <p className="text-foreground leading-relaxed">{formData.symptoms}</p>
          </div>
        )}

        {formData.medications && (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Médicaments</p>
            <p className="text-foreground">{formData.medications}</p>
          </div>
        )}

        {formData.allergies && (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Allergies
            </p>
            <p className="text-amber-700 dark:text-amber-400 font-medium">{formData.allergies}</p>
          </div>
        )}

        {formData.pain_level !== undefined && painInfo && (
          <div className="col-span-2 flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Douleur :</p>
            <span className={`font-bold ${painInfo.color}`}>
              {formData.pain_level}/10 — {painInfo.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
