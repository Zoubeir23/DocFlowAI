CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_waitlist_clinic ON waitlist (clinic_id, status, created_at);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_access_waitlist" ON waitlist FOR ALL USING (
  clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
);
