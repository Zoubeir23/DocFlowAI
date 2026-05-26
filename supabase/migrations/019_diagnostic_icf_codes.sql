-- Add ICF (International Classification of Functioning) codes column to diagnostics
-- ICF codes document functional limitations for sick leave certificates
ALTER TABLE diagnostics
  ADD COLUMN IF NOT EXISTS icf_codes JSONB NOT NULL DEFAULT '[]';
