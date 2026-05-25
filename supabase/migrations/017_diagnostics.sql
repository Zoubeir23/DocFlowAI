-- Full medical diagnostic system
-- Flow: Patient → Symptoms → ICD-11 Analysis → Doctor Validation → Prescription

CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

  -- ── Step 1: Patient demographics ─────────────────────────────────────────
  patient_full_name TEXT NOT NULL,
  patient_age_years INTEGER NOT NULL CHECK (patient_age_years >= 0 AND patient_age_years <= 120),
  patient_age_group TEXT NOT NULL CHECK (patient_age_group IN ('infant', 'toddler', 'child', 'minor', 'adult')),
  patient_sex TEXT NOT NULL CHECK (patient_sex IN ('male', 'female')),
  patient_weight_kg NUMERIC(5,1),
  patient_height_cm INTEGER,
  patient_blood_group TEXT CHECK (patient_blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),

  -- ── Step 1b: Medical history ──────────────────────────────────────────────
  chronic_conditions TEXT[] NOT NULL DEFAULT '{}',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  current_medications TEXT[] NOT NULL DEFAULT '{}',
  surgical_history TEXT[] NOT NULL DEFAULT '{}',
  family_history TEXT[] NOT NULL DEFAULT '{}',

  -- ── Step 2: Vital signs ───────────────────────────────────────────────────
  vital_temperature NUMERIC(4,1),           -- °C
  vital_blood_pressure_systolic INTEGER,    -- mmHg
  vital_blood_pressure_diastolic INTEGER,   -- mmHg
  vital_heart_rate INTEGER,                 -- bpm
  vital_respiratory_rate INTEGER,           -- breaths/min
  vital_oxygen_saturation NUMERIC(4,1),     -- %

  -- ── Step 2b: Symptoms ─────────────────────────────────────────────────────
  chief_complaint TEXT NOT NULL,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  symptom_duration TEXT,                    -- e.g. "3 jours", "2 semaines"
  symptom_intensity INTEGER CHECK (symptom_intensity BETWEEN 1 AND 10),
  aggravating_factors TEXT[] NOT NULL DEFAULT '{}',
  relieving_factors TEXT[] NOT NULL DEFAULT '{}',

  -- ── Step 3: ICD-11 analysis + scoring ────────────────────────────────────
  icd_candidates JSONB NOT NULL DEFAULT '[]',
  -- [{ id, code, title, score, probability, is_serious }]
  additional_tests_required TEXT[] NOT NULL DEFAULT '{}',
  clinical_notes TEXT,

  -- ── Step 4: Doctor validation ─────────────────────────────────────────────
  validation_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (validation_status IN ('draft', 'pending_validation', 'validated', 'rejected')),
  validated_diagnosis_code TEXT,
  validated_diagnosis_name TEXT,
  validated_by TEXT,
  validated_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- ── Step 5: Prescription ──────────────────────────────────────────────────
  document_type TEXT NOT NULL DEFAULT 'consultation'
    CHECK (document_type IN ('consultation', 'prescription', 'receipt', 'medical_report', 'sick_leave')),
  treatments JSONB NOT NULL DEFAULT '[]',
  -- [{ drug_name, dosage_mg, frequency, duration_days, route, precautions, is_generic }]
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  follow_up_delay_days INTEGER,
  follow_up_tests TEXT[] NOT NULL DEFAULT '{}',
  practitioner_name TEXT,
  practitioner_title TEXT,
  practitioner_rpps TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_members_can_manage_diagnostics"
  ON diagnostics FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS diagnostics_clinic_id_idx ON diagnostics(clinic_id);
CREATE INDEX IF NOT EXISTS diagnostics_patient_id_idx ON diagnostics(patient_id);
CREATE INDEX IF NOT EXISTS diagnostics_validation_status_idx ON diagnostics(validation_status);
CREATE INDEX IF NOT EXISTS diagnostics_created_at_idx ON diagnostics(created_at DESC);

CREATE OR REPLACE FUNCTION set_diagnostics_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER diagnostics_updated_at
  BEFORE UPDATE ON diagnostics
  FOR EACH ROW EXECUTE FUNCTION set_diagnostics_updated_at();
