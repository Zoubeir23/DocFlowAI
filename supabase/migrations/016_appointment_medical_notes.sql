-- Add medical_notes column to appointments
-- Distinct from `notes` (booking note entered by staff/patient)
-- medical_notes is filled by the practitioner after the consultation
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS medical_notes TEXT;
