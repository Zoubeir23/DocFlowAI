-- ═══════════════════════════════════════════════════════════════════════════════
-- 017 — Policy INSERT/UPDATE explicite sur user_clinic_access
--        (audit approfondi RBAC 2026-07-21)
--
-- HIGH (risque latent) : seules SELECT/DELETE ont une policy pour l'utilisateur
-- authentifié ; aucune policy INSERT/UPDATE n'existe. L'écriture ne passe
-- aujourd'hui que par le service role (bypass RLS), donc pas d'exploitation
-- actuelle, mais l'absence de policy documentée est un piège de fiabilité :
-- une future action utilisant le client RLS échouerait silencieusement, ou
-- pire, une policy trop permissive pourrait être ajoutée par erreur plus tard
-- sans qu'on se souvienne que ce choix était intentionnel.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "user_clinic_access_insert_service_only" ON user_clinic_access
  FOR INSERT WITH CHECK (false);

CREATE POLICY "user_clinic_access_update_service_only" ON user_clinic_access
  FOR UPDATE USING (false) WITH CHECK (false);
