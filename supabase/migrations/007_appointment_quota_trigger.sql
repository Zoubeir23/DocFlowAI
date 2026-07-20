-- ═══════════════════════════════════════════════════════════════════════════════
-- 007 — Verrouillage transactionnel du contrôle de quota de rendez-vous
--        (audit bugs/sécurité 2026-07-20)
--
-- MEDIUM : checkAppointmentQuota fait un SELECT count() puis l'appelant
-- effectue l'INSERT dans un appel séparé : sous requêtes concurrentes, deux
-- créations peuvent toutes deux lire un compteur sous la limite avant que
-- l'une des deux ne soit committée, dépassant légèrement le quota du plan.
-- On applique la même stratégie que create_booking_from_widget
-- (pg_advisory_xact_lock) mais au niveau d'un trigger BEFORE INSERT, pour
-- couvrir tous les chemins d'insertion (dashboard, API publique, widget)
-- sans dupliquer la logique dans chaque appelant.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION enforce_appointment_quota() RETURNS TRIGGER AS $$
DECLARE
  v_plan          TEXT;
  v_limit         INTEGER;
  v_period_start  TIMESTAMPTZ;
  v_period_end    TIMESTAMPTZ;
  v_current       INTEGER;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Sérialise les créations concurrentes de la même clinique pour que le
  -- comptage ci-dessous ne soit pas soumis à une race condition.
  PERFORM pg_advisory_xact_lock(hashtext('appointment_quota:' || NEW.clinic_id::text));

  SELECT plan, current_period_start, current_period_end
    INTO v_plan, v_period_start, v_period_end
  FROM subscriptions
  WHERE clinic_id = NEW.clinic_id;

  v_plan := COALESCE(v_plan, 'free');

  -- Reflète PLAN_LIMITS.appointments (lib/subscription/quota.ts).
  v_limit := CASE v_plan
    WHEN 'free'    THEN 50
    WHEN 'starter' THEN 200
    ELSE NULL -- professional / enterprise : illimité
  END;

  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  v_period_start := COALESCE(v_period_start, NOW() - INTERVAL '30 days');
  v_period_end   := COALESCE(v_period_end, NOW() + INTERVAL '30 days');

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

DROP TRIGGER IF EXISTS trg_enforce_appointment_quota ON appointments;
CREATE TRIGGER trg_enforce_appointment_quota
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION enforce_appointment_quota();
