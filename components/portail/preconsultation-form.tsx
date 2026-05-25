"use client";

import { useState } from "react";
import { ClipboardList, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { submitPreconsultationForm, type PreconsultationFormData } from "@/actions/preconsultation";

interface PreconsultationFormProps {
  appointmentId: string;
  alreadySubmitted: boolean;
}

const PAIN_LABELS: Record<number, string> = {
  0: "Aucune douleur",
  1: "Très légère", 2: "Légère", 3: "Modérée légère",
  4: "Modérée", 5: "Moyenne",
  6: "Modérée forte", 7: "Forte",
  8: "Très forte", 9: "Intense",
  10: "Insupportable",
};

export function PreconsultationForm({ appointmentId, alreadySubmitted }: PreconsultationFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [form, setForm] = useState<PreconsultationFormData>({
    reason: "",
    symptoms: "",
    medications: "",
    allergies: "",
    pain_level: 0,
  });

  if (submitted) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Formulaire envoyé
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reason.trim()) {
      toast.error("Veuillez indiquer la raison de votre visite");
      return;
    }
    setLoading(true);
    const result = await submitPreconsultationForm(appointmentId, form);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Erreur lors de l'envoi");
      return;
    }
    toast.success("Formulaire envoyé à votre médecin");
    setSubmitted(true);
    setOpen(false);
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
      >
        <ClipboardList className="w-3.5 h-3.5" />
        Remplir le formulaire pré-consultation
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Raison de la visite <span className="text-destructive">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ex : douleur au dos depuis 3 jours…"
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Symptômes actuels</label>
            <textarea
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              placeholder="Ex : fièvre 38.5°, toux sèche, fatigue…"
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Médicaments en cours</label>
              <textarea
                value={form.medications}
                onChange={(e) => setForm({ ...form, medications: e.target.value })}
                placeholder="Nom et dosage…"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Allergies connues</label>
              <textarea
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="Médicaments, aliments…"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              Niveau de douleur : <span className="text-primary">{form.pain_level}/10 — {PAIN_LABELS[form.pain_level]}</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={form.pain_level}
              onChange={(e) => setForm({ ...form, pain_level: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 — Aucune</span>
              <span>10 — Max</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-primary text-primary-foreground rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Envoi…" : "Envoyer au médecin"}
          </button>
        </form>
      )}
    </div>
  );
}
