-- ============================================================
-- DocFlowAI — Activation RLS et politiques de sécurité
-- ============================================================

-- ── Activation RLS ────────────────────────────────────────────────────────────
ALTER TABLE clinics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_websites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clinic_access   ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys             ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist             ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_signatures    ENABLE ROW LEVEL SECURITY;

-- ── Politiques : clinics ──────────────────────────────────────────────────────
CREATE POLICY "clinics_insert_owner"       ON clinics FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "clinics_select_own"         ON clinics FOR SELECT USING (id = get_user_clinic_id());
CREATE POLICY "clinics_update_owner"       ON clinics FOR UPDATE USING (id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "clinics_select_super_admin" ON clinics FOR SELECT USING (is_super_admin());
CREATE POLICY "clinics_update_super_admin" ON clinics FOR UPDATE USING (is_super_admin());

-- ── Politiques : users ────────────────────────────────────────────────────────
CREATE POLICY "users_insert_self"        ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_select_team"        ON users FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "users_manage_owner"       ON users FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "users_update_self"        ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_select_super_admin" ON users FOR SELECT USING (is_super_admin());
CREATE POLICY "users_update_super_admin" ON users FOR UPDATE USING (is_super_admin());

-- ── Politiques : patients ─────────────────────────────────────────────────────
CREATE POLICY "patients_select_staff" ON patients FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "patients_manage_staff" ON patients FOR ALL   USING (clinic_id = get_user_clinic_id());
CREATE POLICY "patients_select_self"  ON patients FOR SELECT USING (auth_user_id = auth.uid());

-- ── Politiques : services ─────────────────────────────────────────────────────
CREATE POLICY "services_select_active" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "services_manage_staff"  ON services FOR ALL   USING (clinic_id = get_user_clinic_id());

-- ── Politiques : availability_rules ──────────────────────────────────────────
CREATE POLICY "availability_select_all"   ON availability_rules FOR SELECT USING (true);
CREATE POLICY "availability_manage_staff" ON availability_rules FOR ALL   USING (clinic_id = get_user_clinic_id());

-- ── Politiques : blocked_dates ────────────────────────────────────────────────
CREATE POLICY "blocked_dates_select_all"   ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "blocked_dates_manage_staff" ON blocked_dates FOR ALL   USING (clinic_id = get_user_clinic_id());

-- ── Politiques : appointments ─────────────────────────────────────────────────
CREATE POLICY "appointments_select_staff"  ON appointments FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "appointments_manage_staff"  ON appointments FOR ALL   USING (clinic_id = get_user_clinic_id());
CREATE POLICY "appointments_select_patient" ON appointments FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()));
CREATE POLICY "appointments_cancel_patient" ON appointments FOR UPDATE
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

-- ── Politiques : ai_conversations ────────────────────────────────────────────
CREATE POLICY "ai_conversations_select_staff" ON ai_conversations FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "ai_conversations_insert_widget" ON ai_conversations FOR INSERT
  WITH CHECK (clinic_id IN (SELECT id FROM clinics WHERE is_active = true));
CREATE POLICY "ai_conversations_update_own_session" ON ai_conversations FOR UPDATE
  USING (clinic_id IN (SELECT id FROM clinics WHERE is_active = true));

-- ── Politiques : clinic_settings ─────────────────────────────────────────────
CREATE POLICY "clinic_settings_select_all"   ON clinic_settings FOR SELECT USING (true);
CREATE POLICY "clinic_settings_manage_owner" ON clinic_settings FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

-- ── Politiques : subscriptions ────────────────────────────────────────────────
CREATE POLICY "subscriptions_select_staff"       ON subscriptions FOR SELECT USING (clinic_id = get_user_clinic_id());
CREATE POLICY "subscriptions_manage_owner"       ON subscriptions FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "subscriptions_select_super_admin" ON subscriptions FOR SELECT USING (is_super_admin());
CREATE POLICY "subscriptions_update_super_admin" ON subscriptions FOR UPDATE USING (is_super_admin());

-- ── Politiques : clinic_websites ──────────────────────────────────────────────
CREATE POLICY "clinic_websites_manage_staff"     ON clinic_websites FOR ALL    TO authenticated USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "clinic_websites_select_published" ON clinic_websites FOR SELECT TO anon, authenticated USING (is_published = true);

-- ── Politiques : staff_invitations ────────────────────────────────────────────
CREATE POLICY "staff_invitations_manage_owner" ON staff_invitations FOR ALL   USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
CREATE POLICY "staff_invitations_select_own_clinic" ON staff_invitations FOR SELECT
  USING (clinic_id = get_user_clinic_id());

-- ── Politiques : user_clinic_access ──────────────────────────────────────────
CREATE POLICY "user_clinic_access_select_own" ON user_clinic_access FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_clinic_access_delete_own" ON user_clinic_access FOR DELETE USING (user_id = auth.uid());

-- ── Politiques : webhooks ─────────────────────────────────────────────────────
CREATE POLICY "webhooks_manage_owner" ON webhooks FOR ALL USING (clinic_id = get_user_clinic_id());

-- ── Politiques : api_keys ────────────────────────────────────────────────────
CREATE POLICY "api_keys_manage_owner" ON api_keys FOR ALL USING (clinic_id = get_user_clinic_id());

-- ── Politiques : admin_messages ───────────────────────────────────────────────
CREATE POLICY "admin_messages_super_admin" ON admin_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = true));

-- ── Politiques : newsletter_campaigns ────────────────────────────────────────
CREATE POLICY "newsletter_campaigns_super_admin" ON newsletter_campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_super_admin = true));

-- ── Politiques : waitlist ─────────────────────────────────────────────────────
CREATE POLICY "waitlist_clinic_access" ON waitlist FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- ── Politiques : diagnostics ──────────────────────────────────────────────────
CREATE POLICY "diagnostics_manage_staff"  ON diagnostics FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "diagnostics_select_patient" ON diagnostics FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid()));

-- ── Politiques : doctor_signatures ───────────────────────────────────────────
CREATE POLICY "doctor_signatures_select_own"    ON doctor_signatures FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "doctor_signatures_select_clinic" ON doctor_signatures FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
CREATE POLICY "doctor_signatures_insert_own"    ON doctor_signatures FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "doctor_signatures_update_own"    ON doctor_signatures FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "doctor_signatures_delete_own"    ON doctor_signatures FOR DELETE USING (user_id = auth.uid());

-- ── Données initiales : remplissage user_clinic_access ───────────────────────
INSERT INTO user_clinic_access (user_id, clinic_id, role, joined_at)
SELECT id, clinic_id, role::TEXT::clinic_access_role, created_at
FROM users
WHERE role != 'super_admin'
ON CONFLICT DO NOTHING;
