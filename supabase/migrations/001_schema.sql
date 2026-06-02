-- ============================================================
-- DocFlowAI — Schéma complet : extensions, enums, tables
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Types ENUM ────────────────────────────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('owner', 'receptionist', 'assistant', 'super_admin');
CREATE TYPE staff_role         AS ENUM ('receptionist', 'assistant');
CREATE TYPE clinic_access_role AS ENUM ('owner', 'receptionist', 'assistant');

-- ── Cliniques ─────────────────────────────────────────────────────────────────
CREATE TABLE clinics (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  slug       TEXT        UNIQUE NOT NULL,
  logo_url   TEXT,
  timezone   TEXT        NOT NULL DEFAULT 'UTC',
  owner_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Utilisateurs ──────────────────────────────────────────────────────────────
CREATE TABLE users (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id      UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role           user_role   NOT NULL DEFAULT 'owner',
  full_name      TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  is_super_admin BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Patients ──────────────────────────────────────────────────────────────────
CREATE TABLE patients (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  full_name         TEXT        NOT NULL,
  phone             TEXT        NOT NULL,
  email             TEXT,
  notes             TEXT,
  date_of_birth     DATE,
  auth_user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  portal_invited_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT patients_clinic_phone_unique UNIQUE (clinic_id, phone)
);

CREATE UNIQUE INDEX idx_patients_auth_user_id
  ON patients(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ── Services ──────────────────────────────────────────────────────────────────
CREATE TABLE services (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  duration_minutes INTEGER     NOT NULL DEFAULT 30,
  price            DECIMAL(10,2),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Règles de disponibilité ───────────────────────────────────────────────────
CREATE TABLE availability_rules (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID    NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time  TIME    NOT NULL,
  end_time    TIME    NOT NULL,
  break_start TIME,
  break_end   TIME,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (clinic_id, day_of_week)
);

-- ── Dates bloquées ────────────────────────────────────────────────────────────
CREATE TABLE blocked_dates (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id  UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, date)
);

-- ── Rendez-vous ───────────────────────────────────────────────────────────────
CREATE TABLE appointments (
  id                           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id                    UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id                   UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id                   UUID        NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  practitioner_id              UUID        REFERENCES users(id) ON DELETE SET NULL,
  status                       TEXT        NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked', 'confirmed', 'completed', 'cancelled', 'no_show')),
  source                       TEXT        NOT NULL DEFAULT 'manual'
    CHECK (source IN ('widget', 'manual')),
  start_at                     TIMESTAMPTZ NOT NULL,
  end_at                       TIMESTAMPTZ NOT NULL,
  notes                        TEXT,
  medical_notes                TEXT,
  cancel_token                 UUID        NOT NULL DEFAULT gen_random_uuid(),
  reminder_sent_at             TIMESTAMPTZ,
  payment_status               TEXT        NOT NULL DEFAULT 'not_required'
    CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded')),
  stripe_checkout_session_id   TEXT,
  preconsultation_form         JSONB,
  preconsultation_submitted_at TIMESTAMPTZ,
  teleconsultation_room_id     TEXT,
  teleconsultation_status      TEXT
    CHECK (teleconsultation_status IN ('pending', 'active', 'ended')),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_appointments_cancel_token ON appointments(cancel_token);

-- ── Conversations IA ──────────────────────────────────────────────────────────
CREATE TABLE ai_conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_temp_id TEXT        NOT NULL,
  messages        JSONB       NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Paramètres clinique ───────────────────────────────────────────────────────
CREATE TABLE clinic_settings (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  widget_color          TEXT        NOT NULL DEFAULT '#2563eb',
  welcome_message       TEXT        NOT NULL DEFAULT 'Hello! I am your AI booking assistant. How can I help you today?',
  faq                   JSONB       NOT NULL DEFAULT '[]',
  slot_duration_minutes INTEGER     NOT NULL DEFAULT 15,
  tone                  TEXT        NOT NULL DEFAULT 'professional and friendly',
  booking_behavior      TEXT        NOT NULL DEFAULT 'Be proactive in suggesting available slots and guide patients through the booking process.',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- ── Diagnostics ───────────────────────────────────────────────────────────────
CREATE TABLE diagnostics (
  id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id                       UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id                      UUID        REFERENCES patients(id) ON DELETE SET NULL,
  patient_full_name               TEXT        NOT NULL,
  patient_age_years               INTEGER     NOT NULL CHECK (patient_age_years >= 0 AND patient_age_years <= 120),
  patient_age_group               TEXT        NOT NULL
    CHECK (patient_age_group IN ('infant', 'toddler', 'child', 'minor', 'adult')),
  patient_sex                     TEXT        NOT NULL CHECK (patient_sex IN ('male', 'female')),
  patient_weight_kg               NUMERIC(5,1),
  patient_height_cm               INTEGER,
  patient_blood_group             TEXT
    CHECK (patient_blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  chronic_conditions              TEXT[]      NOT NULL DEFAULT '{}',
  allergies                       TEXT[]      NOT NULL DEFAULT '{}',
  current_medications             TEXT[]      NOT NULL DEFAULT '{}',
  surgical_history                TEXT[]      NOT NULL DEFAULT '{}',
  family_history                  TEXT[]      NOT NULL DEFAULT '{}',
  vital_temperature               NUMERIC(4,1),
  vital_blood_pressure_systolic   INTEGER,
  vital_blood_pressure_diastolic  INTEGER,
  vital_heart_rate                INTEGER,
  vital_respiratory_rate          INTEGER,
  vital_oxygen_saturation         NUMERIC(4,1),
  chief_complaint                 TEXT        NOT NULL,
  symptoms                        TEXT[]      NOT NULL DEFAULT '{}',
  symptom_duration                TEXT,
  symptom_intensity               INTEGER     CHECK (symptom_intensity BETWEEN 1 AND 10),
  aggravating_factors             TEXT[]      NOT NULL DEFAULT '{}',
  relieving_factors               TEXT[]      NOT NULL DEFAULT '{}',
  icd_candidates                  JSONB       NOT NULL DEFAULT '[]',
  icf_codes                       JSONB       NOT NULL DEFAULT '[]',
  additional_tests_required       TEXT[]      NOT NULL DEFAULT '{}',
  clinical_notes                  TEXT,
  validation_status               TEXT        NOT NULL DEFAULT 'draft'
    CHECK (validation_status IN ('draft', 'pending_validation', 'validated', 'rejected')),
  validated_diagnosis_code        TEXT,
  validated_diagnosis_name        TEXT,
  validated_by                    TEXT,
  validated_at                    TIMESTAMPTZ,
  rejection_reason                TEXT,
  document_type                   TEXT        NOT NULL DEFAULT 'consultation'
    CHECK (document_type IN ('consultation', 'prescription', 'receipt', 'medical_report', 'sick_leave')),
  treatments                      JSONB       NOT NULL DEFAULT '[]',
  recommendations                 TEXT[]      NOT NULL DEFAULT '{}',
  follow_up_delay_days            INTEGER,
  follow_up_tests                 TEXT[]      NOT NULL DEFAULT '{}',
  practitioner_name               TEXT,
  practitioner_title              TEXT,
  practitioner_rpps               TEXT,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Signatures médecins ───────────────────────────────────────────────────────
CREATE TABLE doctor_signatures (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id          UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  signature_data_url TEXT        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
