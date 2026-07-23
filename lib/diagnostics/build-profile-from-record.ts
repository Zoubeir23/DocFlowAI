import type { DiagnosticRecord, PatientProfileInput, SymptomsInput } from "@/types";

export function buildPatientProfileFromRecord(record: DiagnosticRecord): PatientProfileInput {
  return {
    patient_full_name: record.patient_full_name,
    patient_age_years: record.patient_age_years ?? undefined,
    patient_age_group: record.patient_age_group ?? undefined,
    patient_sex: record.patient_sex ?? undefined,
    patient_weight_kg: record.patient_weight_kg ?? null,
    patient_height_cm: record.patient_height_cm ?? null,
    patient_blood_group: record.patient_blood_group ?? "unknown",
    chronic_conditions: record.chronic_conditions ?? [],
    allergies: record.allergies ?? [],
    current_medications: record.current_medications ?? [],
    surgical_history: record.surgical_history ?? [],
    family_history: record.family_history ?? [],
  };
}

export function buildSymptomsFromRecord(record: DiagnosticRecord): SymptomsInput {
  return {
    chief_complaint: record.chief_complaint ?? "",
    symptoms: record.symptoms ?? [],
    symptom_duration: record.symptom_duration ?? "",
    symptom_intensity: record.symptom_intensity ?? 5,
    aggravating_factors: record.aggravating_factors ?? [],
    relieving_factors: record.relieving_factors ?? [],
    vital_temperature: record.vital_temperature ?? null,
    vital_blood_pressure_systolic: record.vital_blood_pressure_systolic ?? null,
    vital_blood_pressure_diastolic: record.vital_blood_pressure_diastolic ?? null,
    vital_heart_rate: record.vital_heart_rate ?? null,
    vital_respiratory_rate: record.vital_respiratory_rate ?? null,
    vital_oxygen_saturation: record.vital_oxygen_saturation ?? null,
  };
}
