-- Migration 018 — Portail patient
-- Lie un compte Supabase Auth à un patient existant

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portal_invited_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_auth_user_id
  ON patients(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Patient peut lire sa propre fiche
CREATE POLICY "Patient peut voir sa propre fiche"
  ON patients FOR SELECT
  USING (auth_user_id = auth.uid());

-- Patient peut lire ses propres RDV
CREATE POLICY "Patient peut voir ses propres RDV"
  ON appointments FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );

-- Patient peut annuler ses RDV (status → cancelled uniquement)
CREATE POLICY "Patient peut annuler ses RDV"
  ON appointments FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (status = 'cancelled');

-- Patient peut lire ses diagnostics
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diagnostics') THEN
    EXECUTE $policy$
      CREATE POLICY "Patient peut voir ses diagnostics"
        ON diagnostics FOR SELECT
        USING (
          patient_id IN (
            SELECT id FROM patients WHERE auth_user_id = auth.uid()
          )
        );
    $policy$;
  END IF;
END$$;
