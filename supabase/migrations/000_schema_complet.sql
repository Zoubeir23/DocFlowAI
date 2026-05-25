-- ============================================================
-- DocFlowAI — Schéma complet (squash de 001 à 024)
-- Généré le 2026-05-25 — remplace toutes les migrations individuelles
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Types ENUM ───────────────────────────────────────────────────────────────
CREATE TYPE user_role         AS ENUM ('owner', 'receptionist', 'assistant', 'super_admin');
CREATE TYPE staff_role        AS ENUM ('receptionist', 'assistant');
CREATE TYPE clinic_access_role AS ENUM ('owner', 'receptionist', 'assistant');

-- ── Tables ───────────────────────────────────────────────────────────────────

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

CREATE TABLE users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id  UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role       user_role   NOT NULL DEFAULT 'owner',
  full_name  TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patients (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  full_name        TEXT        NOT NULL,
  phone            TEXT        NOT NULL,
  email            TEXT,
  notes            TEXT,
  auth_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  portal_invited_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT patients_clinic_phone_unique UNIQUE (clinic_id, phone)
);

CREATE UNIQUE INDEX idx_patients_auth_user_id
  ON patients(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE TABLE services (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  duration_minutes INTEGER     NOT NULL DEFAULT 30,
  price            DECIMAL(10,2),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE availability_rules (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    UUID    NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time   TIME    NOT NULL,
  end_time     TIME    NOT NULL,
  break_start  TIME,
  break_end    TIME,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (clinic_id, day_of_week)
);

CREATE TABLE blocked_dates (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id  UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clinic_id, date)
);

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

CREATE TABLE ai_conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_temp_id TEXT        NOT NULL,
  messages        JSONB       NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE user_clinic_access (
  user_id   UUID               NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID               NOT NULL REFERENCES clinics(id)    ON DELETE CASCADE,
  role      clinic_access_role NOT NULL DEFAULT 'owner',
  joined_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, clinic_id)
);

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

CREATE TABLE diagnostics (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id                 UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id                UUID        REFERENCES patients(id) ON DELETE SET NULL,
  patient_full_name         TEXT        NOT NULL,
  patient_age_years         INTEGER     NOT NULL CHECK (patient_age_years >= 0 AND patient_age_years <= 120),
  patient_age_group         TEXT        NOT NULL
    CHECK (patient_age_group IN ('infant', 'toddler', 'child', 'minor', 'adult')),
  patient_sex               TEXT        NOT NULL CHECK (patient_sex IN ('male', 'female')),
  patient_weight_kg         NUMERIC(5,1),
  patient_height_cm         INTEGER,
  patient_blood_group       TEXT
    CHECK (patient_blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  chronic_conditions        TEXT[]      NOT NULL DEFAULT '{}',
  allergies                 TEXT[]      NOT NULL DEFAULT '{}',
  current_medications       TEXT[]      NOT NULL DEFAULT '{}',
  surgical_history          TEXT[]      NOT NULL DEFAULT '{}',
  family_history            TEXT[]      NOT NULL DEFAULT '{}',
  vital_temperature         NUMERIC(4,1),
  vital_blood_pressure_systolic  INTEGER,
  vital_blood_pressure_diastolic INTEGER,
  vital_heart_rate          INTEGER,
  vital_respiratory_rate    INTEGER,
  vital_oxygen_saturation   NUMERIC(4,1),
  chief_complaint           TEXT        NOT NULL,
  symptoms                  TEXT[]      NOT NULL DEFAULT '{}',
  symptom_duration          TEXT,
  symptom_intensity         INTEGER     CHECK (symptom_intensity BETWEEN 1 AND 10),
  aggravating_factors       TEXT[]      NOT NULL DEFAULT '{}',
  relieving_factors         TEXT[]      NOT NULL DEFAULT '{}',
  icd_candidates            JSONB       NOT NULL DEFAULT '[]',
  additional_tests_required TEXT[]      NOT NULL DEFAULT '{}',
  clinical_notes            TEXT,
  validation_status         TEXT        NOT NULL DEFAULT 'draft'
    CHECK (validation_status IN ('draft', 'pending_validation', 'validated', 'rejected')),
  validated_diagnosis_code  TEXT,
  validated_diagnosis_name  TEXT,
  validated_by              TEXT,
  validated_at              TIMESTAMPTZ,
  rejection_reason          TEXT,
  document_type             TEXT        NOT NULL DEFAULT 'consultation'
    CHECK (document_type IN ('consultation', 'prescription', 'receipt', 'medical_report', 'sick_leave')),
  treatments                JSONB       NOT NULL DEFAULT '[]',
  recommendations           TEXT[]      NOT NULL DEFAULT '{}',
  follow_up_delay_days      INTEGER,
  follow_up_tests           TEXT[]      NOT NULL DEFAULT '{}',
  practitioner_name         TEXT,
  practitioner_title        TEXT,
  practitioner_rpps         TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doctor_signatures (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id          UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  signature_data_url TEXT        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ── Index de performance ─────────────────────────────────────────────────────
CREATE INDEX idx_appointments_clinic_id         ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient_id        ON appointments(patient_id);
CREATE INDEX idx_appointments_start_at          ON appointments(start_at);
CREATE INDEX idx_appointments_status            ON appointments(status);
CREATE INDEX idx_appointments_practitioner_id   ON appointments(practitioner_id) WHERE practitioner_id IS NOT NULL;
CREATE INDEX idx_appointments_payment_status    ON appointments(payment_status) WHERE payment_status IN ('pending', 'paid');
CREATE INDEX idx_appointments_reminder          ON appointments(start_at, reminder_sent_at) WHERE status IN ('booked', 'confirmed');
CREATE INDEX idx_appointments_teleconsultation  ON appointments(teleconsultation_room_id) WHERE teleconsultation_room_id IS NOT NULL;
CREATE INDEX idx_patients_clinic_id             ON patients(clinic_id);
CREATE INDEX idx_patients_phone                 ON patients(phone);
CREATE INDEX idx_ai_conversations_clinic_id     ON ai_conversations(clinic_id);
CREATE INDEX idx_ai_conversations_patient_temp  ON ai_conversations(patient_temp_id);
CREATE INDEX idx_staff_invitations_clinic_id    ON staff_invitations(clinic_id);
CREATE INDEX idx_staff_invitations_token        ON staff_invitations(token);
CREATE INDEX idx_staff_invitations_status       ON staff_invitations(status);
CREATE INDEX idx_user_clinic_access_user_id     ON user_clinic_access(user_id);
CREATE INDEX idx_user_clinic_access_clinic_id   ON user_clinic_access(clinic_id);
CREATE INDEX idx_webhooks_clinic_id             ON webhooks(clinic_id);
CREATE INDEX idx_webhooks_active                ON webhooks(clinic_id, is_active);
CREATE INDEX idx_api_keys_clinic_id             ON api_keys(clinic_id);
CREATE INDEX idx_api_keys_hash                  ON api_keys(key_hash);
CREATE INDEX idx_admin_messages_type            ON admin_messages(type);
CREATE INDEX idx_admin_messages_status          ON admin_messages(status);
CREATE INDEX idx_admin_messages_created         ON admin_messages(created_at DESC);
CREATE INDEX idx_newsletter_campaigns_status    ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_campaigns_created   ON newsletter_campaigns(created_at DESC);
CREATE INDEX idx_waitlist_clinic                ON waitlist(clinic_id, status, created_at);
CREATE INDEX idx_diagnostics_clinic_id          ON diagnostics(clinic_id);
CREATE INDEX idx_diagnostics_patient_id         ON diagnostics(patient_id);
CREATE INDEX idx_diagnostics_validation_status  ON diagnostics(validation_status);
CREATE INDEX idx_diagnostics_created_at         ON diagnostics(created_at DESC);
CREATE INDEX idx_clinic_websites_clinic_id      ON clinic_websites(clinic_id);
CREATE INDEX idx_clinic_websites_published      ON clinic_websites(is_published);
CREATE INDEX idx_subscriptions_stripe_customer  ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe_sub       ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- ── Fonctions utilitaires ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role = 'super_admin' FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_diagnostics_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION increment_website_views(website_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE clinic_websites SET views_count = views_count + 1 WHERE id = website_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_booking_from_widget(
  p_clinic_id       UUID,
  p_patient_name    TEXT,
  p_patient_phone   TEXT,
  p_patient_email   TEXT    DEFAULT NULL,
  p_service_id      UUID    DEFAULT NULL,
  p_start_at        TIMESTAMPTZ DEFAULT NULL,
  p_end_at          TIMESTAMPTZ DEFAULT NULL,
  p_notes           TEXT    DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_patient_id     UUID;
  v_appointment_id UUID;
BEGIN
  INSERT INTO patients (clinic_id, full_name, phone, email)
  VALUES (p_clinic_id, p_patient_name, p_patient_phone, p_patient_email)
  ON CONFLICT (clinic_id, phone) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = COALESCE(EXCLUDED.email, patients.email)
  RETURNING id INTO v_patient_id;

  IF v_patient_id IS NULL THEN
    SELECT id INTO v_patient_id FROM patients
    WHERE clinic_id = p_clinic_id AND phone = p_patient_phone;
  END IF;

  INSERT INTO appointments (clinic_id, patient_id, service_id, status, source, start_at, end_at, notes)
  VALUES (p_clinic_id, v_patient_id, p_service_id, 'booked', 'widget', p_start_at, p_end_at, p_notes)
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object('appointment_id', v_appointment_id, 'patient_id', v_patient_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_clinic_info_by_slug(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_clinic   clinics%ROWTYPE;
  v_settings clinic_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_clinic FROM clinics WHERE slug = p_slug;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO v_settings FROM clinic_settings WHERE clinic_id = v_clinic.id;
  RETURN json_build_object(
    'id',                v_clinic.id,
    'name',              v_clinic.name,
    'slug',              v_clinic.slug,
    'timezone',          v_clinic.timezone,
    'widget_color',      COALESCE(v_settings.widget_color, '#2563eb'),
    'welcome_message',   COALESCE(v_settings.welcome_message, 'Hello! How can I help you today?'),
    'tone',              COALESCE(v_settings.tone, 'professional and friendly'),
    'booking_behavior',  COALESCE(v_settings.booking_behavior, ''),
    'faq',               COALESCE(v_settings.faq, '[]'::jsonb),
    'slot_duration_minutes', COALESCE(v_settings.slot_duration_minutes, 15)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION create_booking_from_widget TO anon;
GRANT EXECUTE ON FUNCTION get_clinic_info_by_slug   TO anon;

-- ── Triggers ─────────────────────────────────────────────────────────────────
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_settings_updated_at
  BEFORE UPDATE ON clinic_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER diagnostics_updated_at
  BEFORE UPDATE ON diagnostics
  FOR EACH ROW EXECUTE FUNCTION set_diagnostics_updated_at();

-- ── Activation RLS ──────────────────────────────────────────────────────────
ALTER TABLE clinics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_websites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clinic_access  ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist            ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_signatures   ENABLE ROW LEVEL SECURITY;

-- ── Politiques RLS ───────────────────────────────────────────────────────────

-- clinics
CREATE POLICY "clinics_insert_owner"          ON clinics FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clinics_select_own"            ON clinics FOR SELECT USING (id = get_user_clinic_id());
CREATE POLICY "clinics_update_owner"          ON clinics FOR UPDATE USING (id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "clinics_select_super_admin"    ON clinics FOR SELECT USING (is_super_admin());
CREATE POLICY "clinics_update_super_admin"    ON clinics FOR UPDATE USING (is_super_admin());

-- users
CREATE POLICY "users_insert_self"             ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_select_team"             ON users FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "users_manage_owner"            ON users FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "users_update_self"             ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_select_super_admin"      ON users FOR SELECT USING (is_super_admin());
CREATE POLICY "users_update_super_admin"      ON users FOR UPDATE USING (is_super_admin());

-- patients
CREATE POLICY "patients_select_staff"         ON patients FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "patients_manage_staff"         ON patients FOR ALL   USING (clinic_id = get_user_clinic_id());
CREATE POLICY "patients_select_self"          ON patients FOR SELECT USING (auth_user_id = auth.uid());

-- services
CREATE POLICY "services_select_active"        ON services FOR SELECT USING (is_active = true);
CREATE POLICY "services_manage_staff"         ON services FOR ALL   USING (clinic_id = get_user_clinic_id());

-- availability_rules
CREATE POLICY "availability_select_all"       ON availability_rules FOR SELECT USING (true);
CREATE POLICY "availability_manage_staff"     ON availability_rules FOR ALL   USING (clinic_id = get_user_clinic_id());

-- blocked_dates
CREATE POLICY "blocked_dates_select_all"      ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "blocked_dates_manage_staff"    ON blocked_dates FOR ALL   USING (clinic_id = get_user_clinic_id());

-- appointments
CREATE POLICY "appointments_select_staff"     ON appointments FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "appointments_manage_staff"     ON appointments FOR ALL   USING (clinic_id = get_user_clinic_id());
CREATE POLICY "appointments_select_patient"   ON appointments FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()));
CREATE POLICY "appointments_cancel_patient"   ON appointments FOR UPDATE
  USING (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()))
  WITH CHECK (status = 'cancelled');
CREATE POLICY "appointments_preconsultation_patient" ON appointments FOR UPDATE
  USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    AND status IN ('booked', 'confirmed')
  )
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    AND status IN ('booked', 'confirmed')
  );

-- ai_conversations
CREATE POLICY "ai_conversations_select_staff" ON ai_conversations FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "ai_conversations_insert_any"   ON ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "ai_conversations_update_any"   ON ai_conversations FOR UPDATE USING (true);

-- clinic_settings
CREATE POLICY "clinic_settings_select_all"    ON clinic_settings FOR SELECT USING (true);
CREATE POLICY "clinic_settings_manage_owner"  ON clinic_settings FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

-- subscriptions
CREATE POLICY "subscriptions_select_staff"    ON subscriptions FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "subscriptions_manage_owner"    ON subscriptions FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "subscriptions_select_super_admin" ON subscriptions FOR SELECT USING (is_super_admin());
CREATE POLICY "subscriptions_update_super_admin" ON subscriptions FOR UPDATE USING (is_super_admin());

-- clinic_websites
CREATE POLICY "clinic_websites_manage_staff"  ON clinic_websites FOR ALL    TO authenticated USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "clinic_websites_select_published" ON clinic_websites FOR SELECT TO anon, authenticated USING (is_published = true);

-- staff_invitations
CREATE POLICY "staff_invitations_manage_owner" ON staff_invitations FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "staff_invitations_select_any"   ON staff_invitations FOR SELECT USING (true);

-- user_clinic_access
CREATE POLICY "user_clinic_access_select_own"  ON user_clinic_access FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_clinic_access_delete_own"  ON user_clinic_access FOR DELETE USING (user_id = auth.uid());

-- webhooks
CREATE POLICY "webhooks_manage_owner"          ON webhooks FOR ALL USING (clinic_id = get_user_clinic_id());

-- api_keys
CREATE POLICY "api_keys_manage_owner"          ON api_keys FOR ALL USING (clinic_id = get_user_clinic_id());

-- admin_messages
CREATE POLICY "admin_messages_super_admin"     ON admin_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

-- newsletter_campaigns
CREATE POLICY "newsletter_campaigns_super_admin" ON newsletter_campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));

-- waitlist
CREATE POLICY "waitlist_clinic_access"         ON waitlist FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- diagnostics
CREATE POLICY "diagnostics_manage_staff"       ON diagnostics FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "diagnostics_select_patient"     ON diagnostics FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()));

-- doctor_signatures
CREATE POLICY "doctor_signatures_select_own"   ON doctor_signatures FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "doctor_signatures_select_clinic" ON doctor_signatures FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "doctor_signatures_insert_own"   ON doctor_signatures FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "doctor_signatures_update_own"   ON doctor_signatures FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "doctor_signatures_delete_own"   ON doctor_signatures FOR DELETE USING (user_id = auth.uid());

-- ── Remplissage initial user_clinic_access depuis users ──────────────────────
INSERT INTO user_clinic_access (user_id, clinic_id, role, joined_at)
SELECT id, clinic_id, role::TEXT::clinic_access_role, created_at
FROM users
WHERE role != 'super_admin'
ON CONFLICT DO NOTHING;
