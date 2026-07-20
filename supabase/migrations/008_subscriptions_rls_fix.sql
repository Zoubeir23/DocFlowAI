-- ═══════════════════════════════════════════════════════════════════════════════
-- 008 — Correction RLS subscriptions (audit abonnements/paiements 2026-07-20)
--
-- CRITICAL : "subscriptions_manage_owner" était FOR ALL avec seulement USING,
-- sans WITH CHECK. En Postgres, l'absence de WITH CHECK sur une policy
-- FOR ALL/INSERT/UPDATE réutilise la clause USING comme check, donc un owner
-- authentifié pouvait écrire N'IMPORTE QUELLE valeur dans sa ligne subscriptions
-- via PostgREST (plan, status, current_period_end...), contournant totalement
-- Stripe et le paiement crypto.
--
-- Toutes les écritures légitimes sur subscriptions passent déjà par le client
-- admin (service role) : onboarding (actions/clinic.ts, actions/clinics.ts),
-- webhooks Stripe/crypto, actions admin (admin-clinics.ts). Aucun flux
-- applicatif ne dépend d'une écriture directe par le client authentifié.
-- La policy est donc restreinte à SELECT (redondant avec
-- subscriptions_select_staff mais inoffensif), ce qui retire toute
-- possibilité d'écriture pour un utilisateur non service-role.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "subscriptions_manage_owner" ON subscriptions;

CREATE POLICY "subscriptions_select_owner" ON subscriptions
  FOR SELECT USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
