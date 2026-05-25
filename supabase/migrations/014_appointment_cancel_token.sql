ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancel_token UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_cancel_token
  ON appointments (cancel_token);
