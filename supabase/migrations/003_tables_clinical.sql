-- ============================================================
-- DocFlowAI — Tables cliniques : diagnostics, signatures médecins
-- ============================================================

-- ── Diagnostics ───────────────────────────────────────────────────────────────
CREATE TABLE diagnostics (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id                       UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id                      UUID        REFERENCES patients(id) ON DELETE SET NULL,
  patient_full_name               TEXT        NOT NULL,
  patient_age_years               INTEGER     NOT NULL CHECK (patient_age_years >= 0 AND patient_age_years <= 120),
  patient_age_group               TEXT        NOT NULL
    CHECK (patient_age_group IN ('infant', 'toddler', 'child', 'minor', 'adult')),
  patient_sex                     TEXT        NOT NULL CHECK (patient_sex IN ('male', 'female')),
  patient_weight_kg               NUMERIC(5,1),
  patient_height_cm               INTEGER,
  patient_blood_group             TEXT
    CHECK (patient_blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  chronic_conditions              TEXT[]      NOT NULL DEFAULT '{}',
  allergies                       TEXT[]      NOT NULL DEFAULT '{}',
  current_medications             TEXT[]      NOT NULL DEFAULT '{}',
  surgical_history                TEXT[]      NOT NULL DEFAULT '{}',
  family_history                  TEXT[]      NOT NULL DEFAULT '{}',
  vital_temperature               NUMERIC(4,1),
  vital_blood_pressure_systolic   INTEGER,
  vital_blood_pressure_diastolic  INTEGER,
  vital_heart_rate                INTEGER,
  vital_respiratory_rate          INTEGER,
  vital_oxygen_saturation         NUMERIC(4,1),
  chief_complaint                 TEXT        NOT NULL,
  symptoms                        TEXT[]      NOT NULL DEFAULT '{}',
  symptom_duration                TEXT,
  symptom_intensity               INTEGER     CHECK (symptom_intensity BETWEEN 1 AND 10),
  aggravating_factors             TEXT[]      NOT NULL DEFAULT '{}',
  relieving_factors               TEXT[]      NOT NULL DEFAULT '{}',
  icd_candidates                  JSONB       NOT NULL DEFAULT '[]',
  additional_tests_required       TEXT[]      NOT NULL DEFAULT '{}',
  clinical_notes                  TEXT,
  validation_status               TEXT        NOT NULL DEFAULT 'draft'
    CHECK (validation_status IN ('draft', 'pending_validation', 'validated', 'rejected')),
  validated_diagnosis_code        TEXT,
  validated_diagnosis_name        TEXT,
  validated_by                    TEXT,
  validated_at                    TIMESTAMPTZ,
  rejection_reason                TEXT,
  document_type                   TEXT        NOT NULL DEFAULT 'consultation'
    CHECK (document_type IN ('consultation', 'prescription', 'receipt', 'medical_report', 'sick_leave')),
  treatments                      JSONB       NOT NULL DEFAULT '[]',
  recommendations                 TEXT[]      NOT NULL DEFAULT '{}',
  follow_up_delay_days            INTEGER,
  follow_up_tests                 TEXT[]      NOT NULL DEFAULT '{}',
  practitioner_name               TEXT,
  practitioner_title              TEXT,
  practitioner_rpps               TEXT,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Signatures médecins ───────────────────────────────────────────────────────
CREATE TABLE doctor_signatures (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id          UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  signature_data_url TEXT        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
