-- ============================================================
-- DocFlowAI — Tables de base : extensions, enums, entités principales
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
