-- Migration 019 — Paiement en ligne des rendez-vous

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded')),
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_payment_status
  ON appointments (payment_status)
  WHERE payment_status IN ('pending', 'paid');
