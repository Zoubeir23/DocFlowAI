-- Migration 020 — Formulaire pré-consultation patient

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS preconsultation_form JSONB,
  ADD COLUMN IF NOT EXISTS preconsultation_submitted_at TIMESTAMPTZ;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Patient peut soumettre son formulaire pré-consultation'
  ) THEN
    CREATE POLICY "Patient peut soumettre son formulaire pré-consultation"
      ON appointments FOR UPDATE
      USING (
        patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;
