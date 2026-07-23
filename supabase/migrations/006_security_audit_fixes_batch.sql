-- ═══════════════════════════════════════════════════════════════════════════════
-- 006 — Lot de corrections issues des audits de sécurité (2026-07-20 / 2026-07-21)
--
-- Fusion de 7 migrations atomiques historiques en un seul fichier pour alléger
-- le dossier de migrations. Chaque section reprend intégralement le contexte
-- et le contenu de la migration d'origine.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- A — Contrainte anti-chevauchement de rendez-vous (audit bugs/sécurité 2026-07-20)
--
-- CRITICAL : createAppointment (dashboard) et POST /api/v1/appointments (API
-- publique) n'appliquaient aucun contrôle de chevauchement, contrairement à
-- create_booking_from_widget qui vérifie déjà les conflits sous verrou
-- (pg_advisory_xact_lock). Cette contrainte protège TOUS les chemins
-- d'insertion/mise à jour, présents et futurs, au niveau base de données.
--
-- Granularité alignée sur create_booking_from_widget : le contrôle se fait au
-- niveau de la clinique (clinic_id), pas du praticien, car practitioner_id
-- n'est pas renseigné par le widget ni par l'API publique.
-- ───────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    clinic_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status IN ('booked', 'confirmed'));

-- ───────────────────────────────────────────────────────────────────────────────
-- B — Correction RLS subscriptions (audit abonnements/paiements 2026-07-20)
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
-- ───────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "subscriptions_manage_owner" ON subscriptions;

CREATE POLICY "subscriptions_select_owner" ON subscriptions
  FOR SELECT USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

-- ───────────────────────────────────────────────────────────────────────────────
-- C — Idempotence explicite des webhooks Stripe (audit abonnements/paiements 2026-07-20)
--
-- LOW : la protection contre le double traitement d'un même événement Stripe
-- reposait uniquement sur l'idempotence naturelle des handlers (upsert par
-- clinic_id/stripe_subscription_id). Une table de suivi des event.id déjà
-- traités donne une garantie explicite, combinée au retour d'erreur HTTP
-- (changement applicatif côté route webhook) qui permet désormais les retries
-- Stripe.
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id    TEXT        PRIMARY KEY,
  event_type  TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy authenticated/anon : accessible uniquement via le service role.

-- ───────────────────────────────────────────────────────────────────────────────
-- D — WITH CHECK explicite sur webhooks/api_keys (défense en profondeur)
--     (audit approfondi RBAC 2026-07-21)
--
-- La restriction de rôle owner/super_admin a déjà été ajoutée en migration
-- 005 (M4 fix) — ce que l'audit RBAC n'avait pas vu car il ne lisait que
-- 003_rls_policies.sql. Il manque toujours un WITH CHECK explicite, par
-- cohérence avec le pattern déjà appliqué sur users/subscriptions.
-- ───────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "webhooks_manage_owner" ON webhooks;
CREATE POLICY "webhooks_manage_owner" ON webhooks FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'))
  WITH CHECK (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'));

DROP POLICY IF EXISTS "api_keys_manage_owner" ON api_keys;
CREATE POLICY "api_keys_manage_owner" ON api_keys FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'))
  WITH CHECK (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'));

-- ───────────────────────────────────────────────────────────────────────────────
-- E — Policy INSERT/UPDATE explicite sur user_clinic_access
--     (audit approfondi RBAC 2026-07-21)
--
-- HIGH (risque latent) : seules SELECT/DELETE ont une policy pour l'utilisateur
-- authentifié ; aucune policy INSERT/UPDATE n'existe. L'écriture ne passe
-- aujourd'hui que par le service role (bypass RLS), donc pas d'exploitation
-- actuelle, mais l'absence de policy documentée est un piège de fiabilité :
-- une future action utilisant le client RLS échouerait silencieusement, ou
-- pire, une policy trop permissive pourrait être ajoutée par erreur plus tard
-- sans qu'on se souvienne que ce choix était intentionnel.
-- ───────────────────────────────────────────────────────────────────────────────

CREATE POLICY "user_clinic_access_insert_service_only" ON user_clinic_access
  FOR INSERT WITH CHECK (false);

CREATE POLICY "user_clinic_access_update_service_only" ON user_clinic_access
  FOR UPDATE USING (false) WITH CHECK (false);

-- ───────────────────────────────────────────────────────────────────────────────
-- F — Durcissement RLS sur diagnostics (audit approfondi carnet médical 2026-07-21)
--
-- HIGH : diagnostics_select_patient ne filtre pas sur validation_status,
-- contrairement à diagnostics_select_shared_carnet qui est bornée à
-- 'validated'. Un patient authentifié peut lire ses propres diagnostics en
-- brouillon/attente de validation via le client Supabase anon key exposé
-- côté navigateur (bypass des server actions), incluant des hypothèses IA
-- non validées et des notes cliniques internes.
--
-- Complément : diagnostics_manage_staff est FOR ALL sans restriction de rôle
-- ni sur les colonnes modifiées. N'importe quel receptionist/assistant peut,
-- via le même bypass, appeler directement l'API REST et passer
-- validation_status à 'validated' avec un validated_by arbitraire — ce qui
-- contournerait entièrement la vérification de rôle ajoutée à
-- validateDiagnostic() (migration 010). Un trigger réplique cette même règle
-- au niveau base de données.
-- ───────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "diagnostics_select_patient" ON diagnostics;
CREATE POLICY "diagnostics_select_patient" ON diagnostics FOR SELECT
  USING (
    patient_id IN (SELECT id FROM patients WHERE auth_user_id = auth.uid())
    AND validation_status = 'validated'
  );

CREATE OR REPLACE FUNCTION enforce_diagnostic_validation_role() RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.validation_status IS DISTINCT FROM OLD.validation_status
     AND NEW.validation_status IN ('validated', 'rejected')
     AND get_user_role() NOT IN ('owner', 'super_admin') THEN
    RAISE EXCEPTION 'validation_requires_medical_role';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_diagnostic_validation_role ON diagnostics;
CREATE TRIGGER trg_enforce_diagnostic_validation_role
  BEFORE UPDATE ON diagnostics
  FOR EACH ROW EXECUTE FUNCTION enforce_diagnostic_validation_role();

-- ───────────────────────────────────────────────────────────────────────────────
-- G — Expiration des clés API publiques (audit approfondi RBAC 2026-07-21)
--
-- MEDIUM : api_keys n'a pas de colonne expires_at ; une clé qui fuit (log,
-- repo, historique de commande) reste exploitable indéfiniment tant qu'elle
-- n'est pas révoquée manuellement. Les clés existantes reçoivent une
-- expiration à 1 an à partir de maintenant ; les nouvelles clés expirent 1 an
-- après leur création (valeur par défaut, applicative).
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
UPDATE api_keys SET expires_at = created_at + INTERVAL '1 year' WHERE expires_at IS NULL;
