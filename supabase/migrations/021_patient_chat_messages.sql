-- Migration 021 — Chat sécurisé médecin ↔ patient

CREATE TABLE patient_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('doctor', 'patient')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_messages_patient_id ON patient_messages (patient_id, created_at DESC);
CREATE INDEX idx_patient_messages_clinic_id ON patient_messages (clinic_id, read_at) WHERE read_at IS NULL;

ALTER TABLE patient_messages ENABLE ROW LEVEL SECURITY;

-- Médecin : accès complet aux messages de sa clinique
CREATE POLICY "Staff peut lire les messages de sa clinique"
  ON patient_messages FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff peut envoyer des messages"
  ON patient_messages FOR INSERT
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    AND sender_role = 'doctor'
  );

CREATE POLICY "Staff peut marquer les messages comme lus"
  ON patient_messages FOR UPDATE
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- Patient : accès à ses propres messages uniquement
CREATE POLICY "Patient peut lire ses messages"
  ON patient_messages FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()));

CREATE POLICY "Patient peut envoyer des messages"
  ON patient_messages FOR INSERT
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    AND sender_role = 'patient'
  );

CREATE POLICY "Patient peut marquer ses messages comme lus"
  ON patient_messages FOR UPDATE
  USING (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()))
  WITH CHECK (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()));

-- Activer Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE patient_messages;
