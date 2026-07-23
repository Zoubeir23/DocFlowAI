-- ═══════════════════════════════════════════════════════════════════════════════
-- 017 — Un abonnement 'active' expiré ne doit plus donner droit au quota payant
--        (audit paiements/abonnements 2026-07-23)
--
-- CRITICAL : enforce_appointment_quota() (migration 015) ne vérifie
-- current_period_end que pour le statut 'trialing' — un abonnement 'active'
-- est considéré éligible sans jamais regarder sa date d'expiration.
--
-- Pour Stripe ce n'était pas exploitable : les webhooks
-- (customer.subscription.updated/deleted) font retomber le statut à
-- past_due/cancelled dès que la carte n'est plus débitée avec succès.
--
-- Mais un paiement crypto (app/api/webhooks/crypto/route.ts) est un virement
-- on-chain ponctuel qui pose current_period_end à +1 mois sans AUCUNE
-- infrastructure de reconduction : pas de webhook de renouvellement, pas de
-- cron (le seul cron du projet est appointment-reminders). Une clinique qui
-- paie une fois en crypto gardait donc le quota du plan payant à vie.
--
-- Le fix aligne 'active' sur le même pattern que 'trialing' : éligible
-- uniquement tant que current_period_end n'est pas dépassée. Sans effet sur
-- Stripe (les webhooks tiennent déjà period_end à jour à chaque cycle) ; pour
-- crypto, le quota retombe correctement sur le plan gratuit à l'échéance,
-- sans intervention manuelle — même pattern "pas de job cron" déjà utilisé
-- pour le plan gratuit (migration 010) et l'essai (migration 015).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION enforce_appointment_quota() RETURNS TRIGGER AS $$
DECLARE
  v_plan          TEXT;
  v_status        TEXT;
  v_limit         INTEGER;
  v_period_start  TIMESTAMPTZ;
  v_period_end    TIMESTAMPTZ;
  v_current       INTEGER;
  v_eligible      BOOLEAN;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('appointment_quota:' || NEW.clinic_id::text));

  SELECT plan, status, current_period_start, current_period_end
    INTO v_plan, v_status, v_period_start, v_period_end
  FROM subscriptions
  WHERE clinic_id = NEW.clinic_id;

  v_eligible := v_status IN ('active', 'trialing')
    AND v_period_end IS NOT NULL AND v_period_end > NOW();

  IF NOT v_eligible THEN
    v_plan := 'free';
  END IF;
  v_plan := COALESCE(v_plan, 'free');

  v_limit := CASE v_plan
    WHEN 'free'    THEN 50
    WHEN 'starter' THEN 200
    ELSE NULL
  END;

  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fenêtre glissante pour le plan gratuit (migration 010) : current_period_end
  -- ne se renouvelle jamais tout seul pour un abonnement 'free', qu'il vienne
  -- d'un onboarding direct ou d'un essai/abonnement expiré retombé sur 'free'
  -- ci-dessus.
  IF v_plan = 'free' THEN
    v_period_start := NOW() - INTERVAL '30 days';
    v_period_end   := NOW();
  ELSE
    v_period_start := COALESCE(v_period_start, NOW() - INTERVAL '30 days');
    v_period_end   := COALESCE(v_period_end, NOW() + INTERVAL '30 days');
  END IF;

  SELECT COUNT(*) INTO v_current
  FROM appointments
  WHERE clinic_id = NEW.clinic_id
    AND status <> 'cancelled'
    AND created_at BETWEEN v_period_start AND v_period_end;

  IF v_current >= v_limit THEN
    RAISE EXCEPTION 'quota_exceeded';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
