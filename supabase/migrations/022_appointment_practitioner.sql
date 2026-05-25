-- Migration 022 — Assignation d'un praticien à un rendez-vous
-- Lie chaque RDV à un membre du personnel (users) de la clinique

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_id
  ON appointments (practitioner_id)
  WHERE practitioner_id IS NOT NULL;

-- RLS : le staff peut lire/écrire les RDV de sa clinique (déjà couvert par les policies existantes)
-- Pas de nouvelle policy nécessaire car practitioner_id est une colonne de la table appointments
-- qui est déjà protégée par les policies clinic_id-based.
