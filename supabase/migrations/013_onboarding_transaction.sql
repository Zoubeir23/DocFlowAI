-- ═══════════════════════════════════════════════════════════════════════════════
-- 015 — Onboarding atomique (audit approfondi multi-cliniques 2026-07-21)
--
-- HIGH : createOnboarding enchaîne 7 insertions séquentielles sans transaction
-- via PostgREST. Si l'une échoue après la création de clinics/users, la
-- clinique existe et l'utilisateur y est rattaché mais sans abonnement, sans
-- horaires ni FAQ, et l'action renvoyait success:true car seule l'erreur sur
-- clinics était vérifiée. Une seule fonction RPC exécutée dans une seule
-- transaction Postgres garantit que tout réussit ou rien n'est créé.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_clinic_onboarding(
  p_user_id     UUID,
  p_clinic_name TEXT,
  p_slug        TEXT,
  p_timezone    TEXT,
  p_full_name   TEXT,
  p_email       TEXT
)
RETURNS JSON AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND clinic_id IS NOT NULL) THEN
    RAISE EXCEPTION 'already_onboarded';
  END IF;

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

  INSERT INTO subscriptions (clinic_id, plan, status, current_period_start, current_period_end)
  VALUES (v_clinic_id, 'free', 'active', NOW(), NOW() + INTERVAL '14 days');

  INSERT INTO services (clinic_id, name, duration_minutes, price, is_active) VALUES
    (v_clinic_id, 'General Consultation', 30, NULL, true),
    (v_clinic_id, 'Follow Up Visit', 15, NULL, true);

  INSERT INTO availability_rules (clinic_id, day_of_week, start_time, end_time, break_start, break_end, is_active)
  SELECT v_clinic_id, day, '09:00', '17:00', '12:00', '13:00', true
  FROM unnest(ARRAY[1,2,3,4,5]) AS day;

  RETURN json_build_object('clinic_id', v_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION create_clinic_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
