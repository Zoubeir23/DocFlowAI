-- ═══════════════════════════════════════════════════════════════════════════════
-- 012 — Idempotence explicite des webhooks Stripe (audit abonnements/paiements 2026-07-20)
--
-- LOW : la protection contre le double traitement d'un même événement Stripe
-- reposait uniquement sur l'idempotence naturelle des handlers (upsert par
-- clinic_id/stripe_subscription_id). Une table de suivi des event.id déjà
-- traités donne une garantie explicite, combinée au retour d'erreur HTTP
-- (migration précédente) qui permet désormais les retries Stripe.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id    TEXT        PRIMARY KEY,
  event_type  TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy authenticated/anon : accessible uniquement via le service role.
