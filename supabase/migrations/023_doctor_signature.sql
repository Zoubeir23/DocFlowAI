-- Migration 023 — Signature électronique du médecin
-- Stocke l'image de signature (base64 PNG) par utilisateur clinique

CREATE TABLE IF NOT EXISTS doctor_signatures (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  signature_data_url TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- RLS
ALTER TABLE doctor_signatures ENABLE ROW LEVEL SECURITY;

-- Le propriétaire peut lire sa propre signature
CREATE POLICY "doctor_signatures_select_own"
  ON doctor_signatures FOR SELECT
  USING (user_id = auth.uid());

-- Le staff de la clinique peut lire les signatures de leurs collègues (pour les PDF)
CREATE POLICY "doctor_signatures_select_clinic"
  ON doctor_signatures FOR SELECT
  USING (clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  ));

-- Seul le propriétaire peut insérer/modifier sa signature
CREATE POLICY "doctor_signatures_insert_own"
  ON doctor_signatures FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "doctor_signatures_update_own"
  ON doctor_signatures FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "doctor_signatures_delete_own"
  ON doctor_signatures FOR DELETE
  USING (user_id = auth.uid());
