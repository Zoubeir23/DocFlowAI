-- ═══════════════════════════════════════════════════════════════════════════════
-- 016 — WITH CHECK explicite sur webhooks/api_keys (défense en profondeur)
--        (audit approfondi RBAC 2026-07-21)
--
-- La restriction de rôle owner/super_admin a déjà été ajoutée en migration
-- 005 (M4 fix) — ce que l'audit RBAC n'avait pas vu car il ne lisait que
-- 003_rls_policies.sql. Il manque toujours un WITH CHECK explicite, par
-- cohérence avec le pattern déjà appliqué sur users/subscriptions.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "webhooks_manage_owner" ON webhooks;
CREATE POLICY "webhooks_manage_owner" ON webhooks FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'))
  WITH CHECK (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'));

DROP POLICY IF EXISTS "api_keys_manage_owner" ON api_keys;
CREATE POLICY "api_keys_manage_owner" ON api_keys FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'))
  WITH CHECK (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'));
