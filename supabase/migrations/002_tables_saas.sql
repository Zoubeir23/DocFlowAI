-- ============================================================
-- DocFlowAI — Tables SaaS : abonnements, site web, staff, intégrations, admin
-- ============================================================

-- ── Abonnements ───────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id              UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  plan                   TEXT        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  status                 TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  payment_provider       TEXT        NOT NULL DEFAULT 'crypto',
  current_period_start   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Sites web clinique ────────────────────────────────────────────────────────
CREATE TABLE clinic_websites (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  template_id    TEXT        NOT NULL DEFAULT 'medical-modern',
  hero_data      JSONB       DEFAULT '{"title":"Votre santé, notre priorité","subtitle":"Cabinet médical moderne avec prise de rendez-vous en ligne","ctaPrimary":"Prendre rendez-vous","ctaSecondary":"Nos services","bgImage":""}'::jsonb,
  about_data     JSONB       DEFAULT '{"bio":"","specialties":[],"diplomas":[],"avatar":""}'::jsonb,
  gallery        JSONB       DEFAULT '[]'::jsonb,
  testimonials   JSONB       DEFAULT '[]'::jsonb,
  experience     JSONB       DEFAULT '[]'::jsonb,
  blog_posts     JSONB       DEFAULT '[]'::jsonb,
  style_config   JSONB       DEFAULT '{"primary":"#2563eb","primaryDark":"#3b82f6","secondary":"#64748b","secondaryDark":"#94a3b8","accent":"#10b981","accentDark":"#34d399","background":"#ffffff","backgroundDark":"#0f172a","fontBody":"Inter","fontHead":"Inter","radius":"0.75rem","shadow":"soft","style":"medical-modern"}'::jsonb,
  contact_data   JSONB       DEFAULT '{"address":"","phone":"","schedule":"Lundi – Vendredi · 8h – 19h","insurance_info":"Conventionné secteur 1"}'::jsonb,
  show_chat_widget   BOOLEAN DEFAULT true,
  show_services      BOOLEAN DEFAULT true,
  show_gallery       BOOLEAN DEFAULT true,
  show_testimonials  BOOLEAN DEFAULT true,
  show_blog          BOOLEAN DEFAULT false,
  meta_title         TEXT,
  meta_description   TEXT,
  is_published       BOOLEAN DEFAULT false,
  published_at       TIMESTAMPTZ,
  views_count        INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- ── Invitations staff ─────────────────────────────────────────────────────────
CREATE TABLE staff_invitations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id  UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  role       staff_role  NOT NULL DEFAULT 'receptionist',
  token      TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status     TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE (clinic_id, email)
);

-- ── Accès multi-clinique ──────────────────────────────────────────────────────
CREATE TABLE user_clinic_access (
  user_id   UUID               NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID               NOT NULL REFERENCES clinics(id)    ON DELETE CASCADE,
  role      clinic_access_role NOT NULL DEFAULT 'owner',
  joined_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, clinic_id)
);

-- ── Webhooks ──────────────────────────────────────────────────────────────────
CREATE TABLE webhooks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  url               TEXT        NOT NULL,
  events            TEXT[]      NOT NULL DEFAULT '{}',
  secret            TEXT        NOT NULL,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  last_status_code  INTEGER,
  failure_count     INTEGER     NOT NULL DEFAULT 0
);

-- ── Clés API ──────────────────────────────────────────────────────────────────
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

-- ── Messages admin ────────────────────────────────────────────────────────────
CREATE TABLE admin_messages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT        NOT NULL CHECK (type IN ('support', 'enterprise')),
  status        TEXT        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed')),
  sender_name   TEXT        NOT NULL,
  sender_email  TEXT        NOT NULL,
  sender_plan   TEXT,
  subject       TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  metadata      JSONB       DEFAULT '{}',
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_id     UUID        REFERENCES clinics(id)   ON DELETE SET NULL,
  admin_reply   TEXT,
  replied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Campagnes newsletter ──────────────────────────────────────────────────────
CREATE TABLE newsletter_campaigns (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          TEXT        NOT NULL,
  body_html        TEXT        NOT NULL,
  body_text        TEXT,
  target_roles     TEXT[]      DEFAULT NULL,
  status           TEXT        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  recipients_count INTEGER     DEFAULT 0,
  sent_count       INTEGER     DEFAULT 0,
  failed_count     INTEGER     DEFAULT 0,
  created_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Liste d'attente ───────────────────────────────────────────────────────────
CREATE TABLE waitlist (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_name  TEXT        NOT NULL,
  patient_phone TEXT        NOT NULL,
  patient_email TEXT,
  service_id    UUID        REFERENCES services(id) ON DELETE SET NULL,
  notes         TEXT,
  status        TEXT        NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified', 'booked', 'cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  notified_at   TIMESTAMPTZ
);
