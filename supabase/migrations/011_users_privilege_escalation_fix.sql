-- ═══════════════════════════════════════════════════════════════════════════════
-- 011 — Correction de l'escalade de privilèges sur la table users
--        (audit approfondi RBAC 2026-07-21)
--
-- CRITICAL : "users_update_self" et "users_manage_owner" sont FOR UPDATE/FOR ALL
-- sans WITH CHECK. Comme pour "subscriptions_manage_owner" (migration 006),
-- l'absence de WITH CHECK réutilise la clause USING pour valider la ligne
-- après modification, qui ne contraint jamais les colonnes role/is_super_admin/
-- clinic_id. Un utilisateur authentifié pouvait donc, en appelant directement
-- l'API REST Supabase, s'auto-attribuer role='super_admin' et
-- is_super_admin=true, ou un owner pouvait élever un membre de son équipe au
-- même niveau.
--
-- Le WITH CHECK seul ne suffit pas à distinguer l'écriture légitime
-- (acceptInvitation, qui fait évoluer clinic_id/role d'un utilisateur qui
-- accepte une invitation valide) de l'élévation malveillante — les deux
-- passent par un UPDATE sur sa propre ligne. La protection réelle est donc un
-- trigger qui n'autorise un changement de role/clinic_id que s'il correspond
-- exactement à une invitation staff_invitations valide et non expirée pour cet
-- utilisateur ; is_super_admin ne peut jamais être modifié en dehors du
-- service role.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION prevent_privilege_escalation() RETURNS TRIGGER AS $$
DECLARE
  v_has_valid_invitation BOOLEAN;
BEGIN
  -- Les actions admin (requireSuperAdmin() déjà vérifié en amont) et
  -- l'onboarding écrivent via le service role, qui contourne RLS mais pas les
  -- triggers : c'est la voie légitime pour ces colonnes, on la laisse passer.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
    RAISE EXCEPTION 'privilege_escalation_denied';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.clinic_id IS DISTINCT FROM OLD.clinic_id THEN
    SELECT EXISTS (
      SELECT 1 FROM staff_invitations
      WHERE status = 'pending'
        AND expires_at > NOW()
        AND clinic_id = NEW.clinic_id
        AND role = NEW.role
        AND lower(email) = lower(NEW.email)
    ) INTO v_has_valid_invitation;

    IF NOT v_has_valid_invitation THEN
      RAISE EXCEPTION 'privilege_escalation_denied';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation ON users;
CREATE TRIGGER trg_prevent_privilege_escalation
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_privilege_escalation();

-- Défense en profondeur : WITH CHECK explicite aligné sur USING, en plus du
-- trigger qui reste la protection réelle sur les colonnes sensibles.
DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_manage_owner" ON users;
CREATE POLICY "users_manage_owner" ON users
  FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner')
  WITH CHECK (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
