-- Migration 005: Add date_of_birth to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
