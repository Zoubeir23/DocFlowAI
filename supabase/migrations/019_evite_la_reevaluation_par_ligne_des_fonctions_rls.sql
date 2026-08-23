-- ═══════════════════════════════════════════════════════════════════════════════
-- 019 — Évite la réévaluation ligne par ligne des fonctions RLS
--        (audit complet 2026-08-23 — tasks/audit-2026-08-23-full-codebase.md, H7)
--
-- get_user_clinic_id(), get_user_role() et is_super_admin() (migration 002)
-- sont STABLE mais appelées directement dans les clauses USING/WITH CHECK,
-- sans être enveloppées dans un SELECT. Postgres ne garantit alors pas une
-- évaluation unique par requête : sur un balayage de N lignes (ex: la liste
-- des rendez-vous ou des patients d'une clinique), la fonction peut être
-- réexécutée jusqu'à N fois, chacune relançant sa propre requête sur `users`.
-- Envelopper l'appel dans un SELECT permet au planificateur de le traiter
-- comme un InitPlan évalué une seule fois — recommandation documentée par
-- Supabase pour les politiques RLS à fonction STABLE.
--
-- Les clauses ci-dessous sont extraites telles quelles du catalogue Postgres
-- (pg_policies) sur une base locale ayant appliqué toutes les migrations
-- jusqu'à la 018 incluse, puis réécrites en enveloppant uniquement les trois
-- appels de fonction concernés — aucune autre partie de la condition n'est
-- modifiée, la portée d'accès de chaque politique reste identique.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "ai_conversations_select_staff" ON ai_conversations;
CREATE POLICY "ai_conversations_select_staff" ON ai_conversations FOR SELECT USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "api_keys_manage_owner" ON api_keys;
CREATE POLICY "api_keys_manage_owner" ON api_keys FOR ALL USING (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = ANY (ARRAY['owner'::text, 'super_admin'::text])))) WITH CHECK (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = ANY (ARRAY['owner'::text, 'super_admin'::text]))));

DROP POLICY IF EXISTS "appointments_manage_staff" ON appointments;
CREATE POLICY "appointments_manage_staff" ON appointments FOR ALL USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "appointments_select_staff" ON appointments;
CREATE POLICY "appointments_select_staff" ON appointments FOR SELECT USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "availability_manage_staff" ON availability_rules;
CREATE POLICY "availability_manage_staff" ON availability_rules FOR ALL USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "blocked_dates_manage_staff" ON blocked_dates;
CREATE POLICY "blocked_dates_manage_staff" ON blocked_dates FOR ALL USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "clinic_settings_manage_owner" ON clinic_settings;
CREATE POLICY "clinic_settings_manage_owner" ON clinic_settings FOR ALL USING (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = 'owner'::text)));

DROP POLICY IF EXISTS "clinic_settings_select_staff" ON clinic_settings;
CREATE POLICY "clinic_settings_select_staff" ON clinic_settings FOR SELECT USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "clinics_select_own" ON clinics;
CREATE POLICY "clinics_select_own" ON clinics FOR SELECT USING ((id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "clinics_select_super_admin" ON clinics;
CREATE POLICY "clinics_select_super_admin" ON clinics FOR SELECT USING ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "clinics_update_owner" ON clinics;
CREATE POLICY "clinics_update_owner" ON clinics FOR UPDATE USING (((id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = 'owner'::text)));

DROP POLICY IF EXISTS "clinics_update_super_admin" ON clinics;
CREATE POLICY "clinics_update_super_admin" ON clinics FOR UPDATE USING ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "patients_manage_staff" ON patients;
CREATE POLICY "patients_manage_staff" ON patients FOR ALL USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "patients_select_staff" ON patients;
CREATE POLICY "patients_select_staff" ON patients FOR SELECT USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "services_manage_staff" ON services;
CREATE POLICY "services_manage_staff" ON services FOR ALL USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "staff_invitations_manage_owner" ON staff_invitations;
CREATE POLICY "staff_invitations_manage_owner" ON staff_invitations FOR ALL USING (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = 'owner'::text)));

DROP POLICY IF EXISTS "staff_invitations_select_own_clinic" ON staff_invitations;
CREATE POLICY "staff_invitations_select_own_clinic" ON staff_invitations FOR SELECT USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "subscriptions_select_owner" ON subscriptions;
CREATE POLICY "subscriptions_select_owner" ON subscriptions FOR SELECT USING (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = 'owner'::text)));

DROP POLICY IF EXISTS "subscriptions_select_staff" ON subscriptions;
CREATE POLICY "subscriptions_select_staff" ON subscriptions FOR SELECT USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "subscriptions_select_super_admin" ON subscriptions;
CREATE POLICY "subscriptions_select_super_admin" ON subscriptions FOR SELECT USING ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "subscriptions_update_super_admin" ON subscriptions;
CREATE POLICY "subscriptions_update_super_admin" ON subscriptions FOR UPDATE USING ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "users_manage_owner" ON users;
CREATE POLICY "users_manage_owner" ON users FOR ALL USING (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = 'owner'::text))) WITH CHECK (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = 'owner'::text)));

DROP POLICY IF EXISTS "users_select_super_admin" ON users;
CREATE POLICY "users_select_super_admin" ON users FOR SELECT USING ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "users_select_team" ON users;
CREATE POLICY "users_select_team" ON users FOR SELECT USING ((clinic_id = (SELECT get_user_clinic_id())));

DROP POLICY IF EXISTS "users_update_super_admin" ON users;
CREATE POLICY "users_update_super_admin" ON users FOR UPDATE USING ((SELECT is_super_admin()));

DROP POLICY IF EXISTS "webhooks_manage_owner" ON webhooks;
CREATE POLICY "webhooks_manage_owner" ON webhooks FOR ALL USING (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = ANY (ARRAY['owner'::text, 'super_admin'::text])))) WITH CHECK (((clinic_id = (SELECT get_user_clinic_id())) AND ((SELECT get_user_role()) = ANY (ARRAY['owner'::text, 'super_admin'::text]))));
