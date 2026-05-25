ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON appointments (start_at, reminder_sent_at)
  WHERE status IN ('booked', 'confirmed');
