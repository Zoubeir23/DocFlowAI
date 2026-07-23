-- ═══════════════════════════════════════════════════════════════════════════════
-- 015 — Essai gratuit de 14 jours pour Starter/Professional
--
-- Les boutons "Démarrer l'essai gratuit" de /pricing pointaient tous vers
-- /signup sans passer le plan choisi : l'onboarding créait systématiquement
-- un abonnement 'free', quel que soit le plan cliqué. Aucun essai réel
-- n'existait. Ce correctif ajoute un statut 'trialing' (sans carte bancaire,
-- 14 jours, plan réel Starter/Professional), avec rétrogradation automatique
-- et silencieuse vers les quotas du plan gratuit à l'expiration — sans job
-- cron, en réévaluant l'éligibilité à chaque lecture (même pattern que la
-- migration 009 pour le statut 'active').
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Autoriser le nouveau statut 'trialing' sur subscriptions.status
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trialing', 'inactive', 'cancelled', 'past_due'));

-- 2. create_clinic_onboarding accepte désormais un plan optionnel.
--    'starter'/'professional' → abonnement 'trialing' 14 jours, sans CB.
--    Toute autre valeur (dont NULL, 'free', 'enterprise') → comportement
--    inchangé : plan gratuit standard (l'auto-service Enterprise n'existe
--    pas, il passe par create_enterprise_clinic / contact commercial).
CREATE OR REPLACE FUNCTION create_clinic_onboarding(
  p_user_id     UUID,
  p_clinic_name TEXT,
  p_slug        TEXT,
  p_timezone    TEXT,
  p_full_name   TEXT,
  p_email       TEXT,
  p_plan        TEXT DEFAULT 'free'
)
RETURNS JSON AS $$
DECLARE
  v_clinic_id   UUID;
  v_is_trial    BOOLEAN;
  v_actual_plan TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND clinic_id IS NOT NULL) THEN
    RAISE EXCEPTION 'already_onboarded';
  END IF;

  v_is_trial := p_plan IN ('starter', 'professional');
  v_actual_plan := CASE WHEN v_is_trial THEN p_plan ELSE 'free' END;

  INSERT INTO clinics (name, slug, timezone, owner_id)
  VALUES (p_clinic_name, p_slug, p_timezone, p_user_id)
  RETURNING id INTO v_clinic_id;

  INSERT INTO users (id, clinic_id, role, full_name, email)
  VALUES (p_user_id, v_clinic_id, 'owner', p_full_name, p_email)
  ON CONFLICT (id) DO UPDATE
    SET clinic_id = EXCLUDED.clinic_id,
        role      = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        email     = EXCLUDED.email;

  INSERT INTO clinic_settings (clinic_id, widget_color, welcome_message, faq, slot_duration_minutes, tone, booking_behavior)
  VALUES (
    v_clinic_id,
    '#2563eb',
    'Welcome to ' || p_clinic_name || '! I''m your AI booking assistant. How can I help you today?',
    '[]'::jsonb,
    15,
    'professional and friendly',
    'Guide patients through booking smoothly. Always suggest the nearest available slot.'
  );

  IF v_is_trial THEN
    INSERT INTO subscriptions (clinic_id, plan, status, current_period_start, current_period_end)
    VALUES (v_clinic_id, v_actual_plan, 'trialing', NOW(), NOW() + INTERVAL '14 days');
  ELSE
    INSERT INTO subscriptions (clinic_id, plan, status, current_period_start, current_period_end)
    VALUES (v_clinic_id, v_actual_plan, 'active', NOW(), NOW() + INTERVAL '14 days');
  END IF;

  INSERT INTO services (clinic_id, name, duration_minutes, price, is_active) VALUES
    (v_clinic_id, 'General Consultation', 30, NULL, true),
    (v_clinic_id, 'Follow Up Visit', 15, NULL, true);

  INSERT INTO availability_rules (clinic_id, day_of_week, start_time, end_time, break_start, break_end, is_active)
  SELECT v_clinic_id, day, '09:00', '17:00', '12:00', '13:00', true
  FROM unnest(ARRAY[1,2,3,4,5]) AS day;

  RETURN json_build_object('clinic_id', v_clinic_id, 'plan', v_actual_plan, 'trial', v_is_trial);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- L'ancienne signature à 6 paramètres n'est plus appelée par le code applicatif
-- (actions/clinic.ts est mis à jour dans le même correctif) ; on la supprime
-- pour éviter toute confusion/appel accidentel sur l'ancien comportement.
DROP FUNCTION IF EXISTS create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 3. Le trigger de quota (migration 009) doit traiter un essai 'trialing' non
--    expiré comme 'active' — sinon un essai Starter/Professional retomberait
--    immédiatement sur les 50 RDV/mois du plan gratuit, vidant l'essai de
--    tout intérêt. Un essai expiré (current_period_end dépassé) retombe bien
--    sur le plan gratuit, sans intervention manuelle ni job cron.
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

  v_eligible := v_status = 'active'
    OR (v_status = 'trialing' AND v_period_end IS NOT NULL AND v_period_end > NOW());

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
  -- d'un onboarding direct ou d'un essai expiré retombé sur 'free' ci-dessus.
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
