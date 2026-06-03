"use client";

import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientProfileInput, PatientAgeGroup, PatientSex, BloodGroup } from "@/types";

const profileSchema = z.object({
  patient_full_name: z.string().min(2, "Nom requis"),
  patient_age_years: z.coerce.number().min(0).max(120).nullable().optional(),
  patient_age_group: z.enum(["infant", "toddler", "child", "minor", "adult"]).nullable().optional(),
  patient_sex: z.enum(["male", "female"]).nullable().optional(),
  patient_weight_kg: z.coerce.number().min(0).max(300).nullable().optional(),
  patient_height_cm: z.coerce.number().min(0).max(250).nullable().optional(),
  patient_blood_group: z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-","unknown"]).optional(),
  chronic_conditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  current_medications: z.array(z.string()).optional(),
  surgical_history: z.array(z.string()).optional(),
  family_history: z.array(z.string()).optional(),
});

const AGE_GROUPS: { value: PatientAgeGroup; label: string; range: string; emoji: string }[] = [
  { value: "infant", label: "Nourrisson", range: "0–3 ans", emoji: "👶" },
  { value: "toddler", label: "Petit enfant", range: "3–5 ans", emoji: "🧒" },
  { value: "child", label: "Enfant", range: "5–12 ans", emoji: "👦" },
  { value: "minor", label: "Mineur", range: "12–18 ans", emoji: "🧑" },
  { value: "adult", label: "Adulte", range: "18+ ans", emoji: "👤" },
];

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];

const COMMON_CHRONIC: string[] = [
  "Diabète type 2", "Diabète type 1", "Hypertension", "Asthme", "BPCO",
  "Insuffisance cardiaque", "Épilepsie", "Hypothyroïdie", "Hyperthyroïdie",
  "VIH/SIDA", "Drépanocytose", "Dépression", "Anxiété chronique",
];

const COMMON_ALLERGIES: string[] = [
  "Pénicilline", "Amoxicilline", "Aspirine", "Ibuprofène", "Sulfamides",
  "Latex", "Arachides", "Gluten", "Lactose", "Codéine",
];

interface TagInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}

function TagInput({ value, onChange, placeholder, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  return (
    <div className="space-y-2">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !value.includes(s)).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="px-2.5 py-1 text-xs rounded-lg border border-border bg-muted/50 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(input))}
          placeholder={placeholder}
          className="rounded-xl border-border focus:ring-primary focus:border-primary text-sm"
        />
        <Button type="button" onClick={() => addTag(input)} variant="outline" size="sm" className="rounded-xl">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface PatientProfileStepProps {
  defaultValues?: Partial<PatientProfileInput>;
  defaultPatientName?: string;
  onNext: (data: PatientProfileInput) => void;
}

export function PatientProfileStep({ defaultValues, defaultPatientName, onNext }: PatientProfileStepProps) {
  const t = useTranslations("diagnostics.patientStep");
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PatientProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      patient_full_name: defaultPatientName ?? "",
      patient_age_group: "adult",
      patient_sex: "male",
      patient_blood_group: "unknown",
      chronic_conditions: [],
      allergies: [],
      current_medications: [],
      surgical_history: [],
      family_history: [],
      ...defaultValues,
    },
  });

  const selectedAgeGroup = watch("patient_age_group");
  const selectedSex = watch("patient_sex");
  const selectedBloodGroup = watch("patient_blood_group");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">

      {/* Identity */}
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide text-primary">
          Identité du patient
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nom complet</Label>
            <Input
              placeholder="Prénom Nom"
              className="rounded-xl border-border"
              {...register("patient_full_name")}
            />
            {errors.patient_full_name && <p className="text-xs text-destructive">{errors.patient_full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Âge</Label>
            <Input
              type="number" min={0} max={120} placeholder="Années"
              className="rounded-xl border-border"
              {...register("patient_age_years")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Poids (kg)</Label>
            <Input type="number" step="0.1" placeholder="Ex: 65.5" className="rounded-xl border-border" {...register("patient_weight_kg")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Taille (cm)</Label>
            <Input type="number" placeholder="Ex: 170" className="rounded-xl border-border" {...register("patient_height_cm")} />
          </div>
        </div>

        {/* Age group */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Catégorie d'âge</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {AGE_GROUPS.map((group) => (
              <Controller key={group.value} name="patient_age_group" control={control} render={({ field }) => (
                <button type="button" onClick={() => field.onChange(group.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    selectedAgeGroup === group.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}>
                  <span className="text-xl">{group.emoji}</span>
                  <span className="text-xs font-semibold">{group.label}</span>
                  <span className="text-[10px] opacity-60">{group.range}</span>
                </button>
              )} />
            ))}
          </div>
        </div>

        {/* Sex */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sexe</Label>
          <div className="flex gap-3">
            {([{ value: "male" as PatientSex, label: "Masculin", icon: "♂" }, { value: "female" as PatientSex, label: "Féminin", icon: "♀" }]).map((option) => (
              <Controller key={option.value} name="patient_sex" control={control} render={({ field }) => (
                <button type="button" onClick={() => field.onChange(option.value)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                    selectedSex === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}>
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              )} />
            ))}
          </div>
        </div>

        {/* Blood group */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Groupe sanguin</Label>
          <div className="flex flex-wrap gap-2">
            {BLOOD_GROUPS.map((bg) => (
              <Controller key={bg} name="patient_blood_group" control={control} render={({ field }) => (
                <button type="button" onClick={() => field.onChange(bg)}
                  className={`px-3 py-1.5 rounded-lg border-2 text-sm font-mono font-bold transition-all ${
                    selectedBloodGroup === bg
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}>
                  {bg === "unknown" ? "?" : bg}
                </button>
              )} />
            ))}
          </div>
        </div>
      </section>

      {/* Medical history */}
      <section className="space-y-5 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide text-primary">
          Antécédents médicaux
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Maladies chroniques</Label>
            <Controller name="chronic_conditions" control={control} render={({ field }) => (
              <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Ajouter une maladie chronique..." suggestions={COMMON_CHRONIC} />
            )} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Allergies connues</Label>
            <Controller name="allergies" control={control} render={({ field }) => (
              <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Ajouter une allergie..." suggestions={COMMON_ALLERGIES} />
            )} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Médicaments actuels</Label>
            <Controller name="current_medications" control={control} render={({ field }) => (
              <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Nom du médicament..." />
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Interventions chirurgicales</Label>
              <Controller name="surgical_history" control={control} render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Ex: Appendicectomie 2019..." />
              )} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Antécédents familiaux</Label>
              <Controller name="family_history" control={control} render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Ex: Diabète (père)..." />
              )} />
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium px-8">
          {t("nextButton")}
        </Button>
      </div>
    </form>
  );
}
