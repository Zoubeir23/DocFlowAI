-- Add Stripe-specific columns to subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'crypto';

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
