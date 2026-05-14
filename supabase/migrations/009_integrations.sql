-- Webhooks : notifications en temps réel lors des changements de rendez-vous
CREATE TABLE webhooks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  url             TEXT        NOT NULL,
  events          TEXT[]      NOT NULL DEFAULT '{}',
  secret          TEXT        NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  last_status_code  INTEGER,
  failure_count   INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_webhooks_clinic_id ON webhooks(clinic_id);
CREATE INDEX idx_webhooks_active    ON webhooks(clinic_id, is_active);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les propriétaires gèrent les webhooks"
  ON webhooks FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Clés API : permettent aux systèmes externes de s'authentifier auprès de l'API REST DocFlow
CREATE TABLE api_keys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  key_hash     TEXT        NOT NULL UNIQUE,
  key_prefix   TEXT        NOT NULL,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_clinic_id ON api_keys(clinic_id);
CREATE INDEX idx_api_keys_hash      ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les propriétaires gèrent les clés API"
  ON api_keys FOR ALL
  USING (clinic_id = get_user_clinic_id());
