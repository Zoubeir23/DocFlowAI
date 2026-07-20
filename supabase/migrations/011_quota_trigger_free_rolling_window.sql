-- ═══════════════════════════════════════════════════════════════════════════════
-- 011 — Fenêtre glissante pour le quota du plan gratuit côté trigger DB
--        (audit abonnements/paiements 2026-07-20)
--
-- HIGH : même bug que lib/subscription/quota.ts — current_period_end du plan
-- gratuit est figée à l'onboarding (+14 jours) et n'évolue jamais, ce qui
-- désactivait silencieusement la limite de 50 RDV/mois après deux semaines.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION enforce_appointment_quota() RETURNS TRIGGER AS $$
DECLARE
  v_plan          TEXT;
  v_status        TEXT;
  v_limit         INTEGER;
  v_period_start  TIMESTAMPTZ;
  v_period_end    TIMESTAMPTZ;
  v_current       INTEGER;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('appointment_quota:' || NEW.clinic_id::text));

  SELECT plan, status, current_period_start, current_period_end
    INTO v_plan, v_status, v_period_start, v_period_end
  FROM subscriptions
  WHERE clinic_id = NEW.clinic_id;

  IF v_status IS DISTINCT FROM 'active' THEN
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
