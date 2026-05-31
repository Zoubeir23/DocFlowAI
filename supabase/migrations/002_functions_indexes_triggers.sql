-- ============================================================
-- DocFlowAI — Index de performance, fonctions utilitaires, triggers
-- ============================================================

-- ── Index de performance ──────────────────────────────────────────────────────
CREATE INDEX idx_appointments_clinic_id        ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient_id       ON appointments(patient_id);
CREATE INDEX idx_appointments_start_at         ON appointments(start_at);
CREATE INDEX idx_appointments_status           ON appointments(status);
CREATE INDEX idx_appointments_practitioner_id  ON appointments(practitioner_id) WHERE practitioner_id IS NOT NULL;
CREATE INDEX idx_appointments_payment_status   ON appointments(payment_status) WHERE payment_status IN ('pending', 'paid');
CREATE INDEX idx_appointments_reminder         ON appointments(start_at, reminder_sent_at) WHERE status IN ('booked', 'confirmed');
CREATE INDEX idx_appointments_teleconsultation ON appointments(teleconsultation_room_id) WHERE teleconsultation_room_id IS NOT NULL;
CREATE INDEX idx_patients_clinic_id            ON patients(clinic_id);
CREATE INDEX idx_patients_phone                ON patients(phone);
CREATE INDEX idx_ai_conversations_clinic_id    ON ai_conversations(clinic_id);
CREATE INDEX idx_ai_conversations_patient_temp ON ai_conversations(patient_temp_id);
CREATE INDEX idx_staff_invitations_clinic_id   ON staff_invitations(clinic_id);
CREATE INDEX idx_staff_invitations_token       ON staff_invitations(token);
CREATE INDEX idx_staff_invitations_status      ON staff_invitations(status);
CREATE INDEX idx_user_clinic_access_user_id    ON user_clinic_access(user_id);
CREATE INDEX idx_user_clinic_access_clinic_id  ON user_clinic_access(clinic_id);
CREATE INDEX idx_webhooks_clinic_id            ON webhooks(clinic_id);
CREATE INDEX idx_webhooks_active               ON webhooks(clinic_id, is_active);
CREATE INDEX idx_api_keys_clinic_id            ON api_keys(clinic_id);
CREATE INDEX idx_api_keys_hash                 ON api_keys(key_hash);
CREATE INDEX idx_admin_messages_type           ON admin_messages(type);
CREATE INDEX idx_admin_messages_status         ON admin_messages(status);
CREATE INDEX idx_admin_messages_created        ON admin_messages(created_at DESC);
CREATE INDEX idx_newsletter_campaigns_status   ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_campaigns_created  ON newsletter_campaigns(created_at DESC);
CREATE INDEX idx_waitlist_clinic               ON waitlist(clinic_id, status, created_at);
CREATE INDEX idx_diagnostics_clinic_id         ON diagnostics(clinic_id);
CREATE INDEX idx_diagnostics_patient_id        ON diagnostics(patient_id);
CREATE INDEX idx_diagnostics_validation_status ON diagnostics(validation_status);
CREATE INDEX idx_diagnostics_created_at        ON diagnostics(created_at DESC);
CREATE INDEX idx_clinic_websites_clinic_id     ON clinic_websites(clinic_id);
CREATE INDEX idx_clinic_websites_published     ON clinic_websites(is_published);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_subscriptions_stripe_sub      ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

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
  SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid();
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
  p_clinic_id     UUID,
  p_patient_name  TEXT,
  p_patient_phone TEXT,
  p_patient_email TEXT        DEFAULT NULL,
  p_service_id    UUID        DEFAULT NULL,
  p_start_at      TIMESTAMPTZ DEFAULT NULL,
  p_end_at        TIMESTAMPTZ DEFAULT NULL,
  p_notes         TEXT        DEFAULT NULL
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
    'id',                    v_clinic.id,
    'name',                  v_clinic.name,
    'slug',                  v_clinic.slug,
    'timezone',              v_clinic.timezone,
    'widget_color',          COALESCE(v_settings.widget_color, '#2563eb'),
    'welcome_message',       COALESCE(v_settings.welcome_message, 'Hello! How can I help you today?'),
    'tone',                  COALESCE(v_settings.tone, 'professional and friendly'),
    'booking_behavior',      COALESCE(v_settings.booking_behavior, ''),
    'faq',                   COALESCE(v_settings.faq, '[]'::jsonb),
    'slot_duration_minutes', COALESCE(v_settings.slot_duration_minutes, 15)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION create_booking_from_widget TO anon;
GRANT EXECUTE ON FUNCTION get_clinic_info_by_slug   TO anon;

-- ── Triggers ──────────────────────────────────────────────────────────────────
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_settings_updated_at
  BEFORE UPDATE ON clinic_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER diagnostics_updated_at
  BEFORE UPDATE ON diagnostics
  FOR EACH ROW EXECUTE FUNCTION set_diagnostics_updated_at();

-- ── Realtime ──────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
