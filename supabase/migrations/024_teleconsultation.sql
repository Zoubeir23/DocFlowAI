-- Migration 024 — Téléconsultation
-- Ajoute les colonnes de session vidéo sur les rendez-vous

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS teleconsultation_room_id TEXT,
  ADD COLUMN IF NOT EXISTS teleconsultation_status TEXT
    CHECK (teleconsultation_status IN ('pending', 'active', 'ended'))
    DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_teleconsultation_room
  ON appointments (teleconsultation_room_id)
  WHERE teleconsultation_room_id IS NOT NULL;
