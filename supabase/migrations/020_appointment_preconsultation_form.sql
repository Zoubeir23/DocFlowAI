-- Migration 020 — Formulaire pré-consultation patient

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS preconsultation_form JSONB,
  ADD COLUMN IF NOT EXISTS preconsultation_submitted_at TIMESTAMPTZ;

-- La policy est intentionnellement restrictive : status doit rester booked/confirmed
-- et le patient ne peut pas modifier payment_status ni medical_notes.
-- Le server action ajoute .is("preconsultation_submitted_at", null) pour l'idempotency.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Patient peut soumettre son formulaire pré-consultation'
  ) THEN
    CREATE POLICY "Patient peut soumettre son formulaire pré-consultation"
      ON appointments FOR UPDATE
      USING (
        patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
        AND status IN ('booked', 'confirmed')
      )
      WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
        AND status IN ('booked', 'confirmed')
      );
  END IF;
END $$;
