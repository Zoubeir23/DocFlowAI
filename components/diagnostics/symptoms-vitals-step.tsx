"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { X, Plus, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SymptomsInput } from "@/types";

const symptomsSchema = z.object({
  chief_complaint: z.string().min(5, "Motif de consultation requis"),
  symptoms: z.array(z.string()),
  symptom_duration: z.string(),
  symptom_intensity: z.coerce.number().min(1).max(10),
  aggravating_factors: z.array(z.string()),
  relieving_factors: z.array(z.string()),
  vital_temperature: z.coerce.number().nullable(),
  vital_blood_pressure_systolic: z.coerce.number().nullable(),
  vital_blood_pressure_diastolic: z.coerce.number().nullable(),
  vital_heart_rate: z.coerce.number().nullable(),
  vital_respiratory_rate: z.coerce.number().nullable(),
  vital_oxygen_saturation: z.coerce.number().nullable(),
});

const COMMON_SYMPTOMS: string[] = [
  "Fièvre", "Toux", "Toux grasse", "Toux sèche", "Maux de tête", "Céphalée",
  "Douleurs abdominales", "Fatigue", "Nausées", "Vomissements", "Diarrhée",
  "Douleurs thoraciques", "Essoufflement", "Vertiges", "Douleurs musculaires",
  "Éruption cutanée", "Perte d'appétit", "Constipation", "Douleurs articulaires",
  "Frissons", "Transpiration excessive", "Palpitations", "Œdèmes", "Insomnie",
  "Brûlures urinaires", "Écoulement nasal", "Mal de gorge", "Ganglions enflés",
];

const COMMON_AGGRAVATING: string[] = [
  "Effort physique", "Position debout", "Repas", "Nuit", "Froid", "Chaleur",
  "Stress", "Alcool", "Tabac", "Pression sur la zone",
];

const COMMON_RELIEVING: string[] = [
  "Repos", "Antalgiques", "Position allongée", "Chaleur locale", "Froid local",
  "Alimentation légère", "Hydratation", "Médicaments",
];

interface VitalFieldProps {
  label: string;
  unit: string;
  name: keyof Pick<SymptomsInput,
    "vital_temperature" | "vital_blood_pressure_systolic" |
    "vital_blood_pressure_diastolic" | "vital_heart_rate" |
    "vital_respiratory_rate" | "vital_oxygen_saturation"
  >;
  normalRange: string;
  warningRange?: { min?: number; max?: number };
  register: ReturnType<typeof useForm<SymptomsInput>>["register"];
  watch: ReturnType<typeof useForm<SymptomsInput>>["watch"];
}

function VitalField({ label, unit, name, normalRange, warningRange, register, watch }: VitalFieldProps) {
  const value = watch(name) as number | null;
  const isWarning = value !== null && warningRange &&
    ((warningRange.max !== undefined && value > warningRange.max) ||
     (warningRange.min !== undefined && value < warningRange.min));

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          type="number" step="0.1"
          placeholder="—"
          className={`rounded-xl border-border pr-14 ${isWarning ? "border-orange-400 bg-orange-50/50" : ""}`}
          {...register(name)}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
      </div>
      <p className={`text-[11px] ${isWarning ? "text-orange-500 font-medium" : "text-muted-foreground"}`}>
        {isWarning ? "⚠ Hors plage normale" : `Normale : ${normalRange}`}
      </p>
    </div>
  );
}

interface SymptomsVitalsStepProps {
  onNext: (data: SymptomsInput) => void;
  onBack: () => void;
}

export function SymptomsVitalsStep({ onNext, onBack }: SymptomsVitalsStepProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [selectedAggravating, setSelectedAggravating] = useState<string[]>([]);
  const [selectedRelieving, setSelectedRelieving] = useState<string[]>([]);
  const [customAggravating, setCustomAggravating] = useState("");
  const [customRelieving, setCustomRelieving] = useState("");

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<SymptomsInput>({
    resolver: zodResolver(symptomsSchema),
    defaultValues: {
      symptoms: [],
      symptom_intensity: 5,
      aggravating_factors: [],
      relieving_factors: [],
      vital_temperature: null,
      vital_blood_pressure_systolic: null,
      vital_blood_pressure_diastolic: null,
      vital_heart_rate: null,
      vital_respiratory_rate: null,
      vital_oxygen_saturation: null,
    },
  });

  const intensity = watch("symptom_intensity");

  function toggleSymptom(symptom: string) {
    const updated = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter((s) => s !== symptom)
      : [...selectedSymptoms, symptom];
    setSelectedSymptoms(updated);
    setValue("symptoms", updated);
  }

  function addCustomSymptom() {
    const trimmed = customSymptom.trim();
    if (!trimmed || selectedSymptoms.includes(trimmed)) return;
    const updated = [...selectedSymptoms, trimmed];
    setSelectedSymptoms(updated);
    setValue("symptoms", updated);
    setCustomSymptom("");
  }

  function toggleAggravating(factor: string) {
    const updated = selectedAggravating.includes(factor)
      ? selectedAggravating.filter((f) => f !== factor)
      : [...selectedAggravating, factor];
    setSelectedAggravating(updated);
    setValue("aggravating_factors", updated);
  }

  function toggleRelieving(factor: string) {
    const updated = selectedRelieving.includes(factor)
      ? selectedRelieving.filter((f) => f !== factor)
      : [...selectedRelieving, factor];
    setSelectedRelieving(updated);
    setValue("relieving_factors", updated);
  }

  function addCustomAggravating() {
    const trimmed = customAggravating.trim();
    if (!trimmed || selectedAggravating.includes(trimmed)) return;
    const updated = [...selectedAggravating, trimmed];
    setSelectedAggravating(updated);
    setValue("aggravating_factors", updated);
    setCustomAggravating("");
  }

  function addCustomRelieving() {
    const trimmed = customRelieving.trim();
    if (!trimmed || selectedRelieving.includes(trimmed)) return;
    const updated = [...selectedRelieving, trimmed];
    setSelectedRelieving(updated);
    setValue("relieving_factors", updated);
    setCustomRelieving("");
  }

  function getIntensityColor(value: number): string {
    if (value <= 3) return "text-green-600";
    if (value <= 6) return "text-orange-500";
    return "text-red-600";
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">

      {/* Chief complaint */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Motif de consultation</h3>
        <div className="space-y-1.5">
          <Textarea
            placeholder="Décrivez le motif principal de la consultation en détail..."
            className="rounded-xl border-border resize-none"
            rows={3}
            {...register("chief_complaint")}
          />
          {errors.chief_complaint && <p className="text-xs text-destructive">{errors.chief_complaint.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Durée des symptômes</Label>
            <Input placeholder="Ex: 3 jours, 2 semaines..." className="rounded-xl border-border" {...register("symptom_duration")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Intensité : <span className={`font-bold ${getIntensityColor(intensity)}`}>{intensity}/10</span>
            </Label>
            <Controller name="symptom_intensity" control={control} render={({ field }) => (
              <input
                type="range" min={1} max={10} step={1}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className="w-full accent-primary"
              />
            )} />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Léger (1)</span><span>Modéré (5)</span><span>Sévère (10)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Symptoms */}
      <section className="space-y-4 border-t border-border pt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Symptômes associés</h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.map((symptom) => (
            <button key={symptom} type="button" onClick={() => toggleSymptom(symptom)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedSymptoms.includes(symptom)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}>
              {symptom}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={customSymptom} onChange={(e) => setCustomSymptom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSymptom())}
            placeholder="Autre symptôme..." className="rounded-xl border-border text-sm" />
          <Button type="button" onClick={addCustomSymptom} variant="outline" className="rounded-xl gap-1">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {selectedSymptoms.filter((s) => !COMMON_SYMPTOMS.includes(s)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.filter((s) => !COMMON_SYMPTOMS.includes(s)).map((s) => (
              <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary">
                {s}<button type="button" onClick={() => toggleSymptom(s)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-orange-600">Facteurs aggravants</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_AGGRAVATING.map((factor) => (
                <button key={factor} type="button" onClick={() => toggleAggravating(factor)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    selectedAggravating.includes(factor)
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-border bg-card text-muted-foreground hover:border-orange-300"
                  }`}>
                  {factor}
                </button>
              ))}
              {selectedAggravating.filter((f) => !COMMON_AGGRAVATING.includes(f)).map((f) => (
                <span key={f} className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-400 rounded-lg text-xs text-orange-700">
                  {f}<button type="button" onClick={() => toggleAggravating(f)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Autre facteur aggravant..."
                value={customAggravating}
                onChange={(e) => setCustomAggravating(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAggravating())}
                className="h-8 text-xs rounded-lg"
              />
              <Button type="button" onClick={addCustomAggravating} variant="outline" size="sm" className="rounded-lg gap-1 h-8 text-xs">
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-green-600">Facteurs atténuants</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_RELIEVING.map((factor) => (
                <button key={factor} type="button" onClick={() => toggleRelieving(factor)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    selectedRelieving.includes(factor)
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-border bg-card text-muted-foreground hover:border-green-300"
                  }`}>
                  {factor}
                </button>
              ))}
              {selectedRelieving.filter((f) => !COMMON_RELIEVING.includes(f)).map((f) => (
                <span key={f} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-400 rounded-lg text-xs text-green-700">
                  {f}<button type="button" onClick={() => toggleRelieving(f)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Autre facteur atténuant..."
                value={customRelieving}
                onChange={(e) => setCustomRelieving(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRelieving())}
                className="h-8 text-xs rounded-lg"
              />
              <Button type="button" onClick={addCustomRelieving} variant="outline" size="sm" className="rounded-lg gap-1 h-8 text-xs">
                <Plus className="w-3 h-3" /> Ajouter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vital signs */}
      <section className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Signes vitaux</h3>
          <span className="text-xs text-muted-foreground">(optionnel)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <VitalField label="Température" unit="°C" name="vital_temperature" normalRange="36,5–37,5°C"
            warningRange={{ min: 36, max: 39 }} register={register} watch={watch} />
          <VitalField label="TA Systolique" unit="mmHg" name="vital_blood_pressure_systolic" normalRange="90–140 mmHg"
            warningRange={{ min: 80, max: 160 }} register={register} watch={watch} />
          <VitalField label="TA Diastolique" unit="mmHg" name="vital_blood_pressure_diastolic" normalRange="60–90 mmHg"
            warningRange={{ min: 50, max: 100 }} register={register} watch={watch} />
          <VitalField label="Fréquence cardiaque" unit="bpm" name="vital_heart_rate" normalRange="60–100 bpm"
            warningRange={{ min: 40, max: 130 }} register={register} watch={watch} />
          <VitalField label="Fréquence respiratoire" unit="/min" name="vital_respiratory_rate" normalRange="12–20/min"
            warningRange={{ min: 10, max: 25 }} register={register} watch={watch} />
          <VitalField label="Saturation O₂" unit="%" name="vital_oxygen_saturation" normalRange="95–100%"
            warningRange={{ min: 92 }} register={register} watch={watch} />
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="button" onClick={onBack} variant="outline" className="rounded-xl border-border">Retour</Button>
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium flex-1">
          Suivant : Analyse diagnostique ICD-11
        </Button>
      </div>
    </form>
  );
}
