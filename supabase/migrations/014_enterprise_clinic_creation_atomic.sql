-- ═══════════════════════════════════════════════════════════════════════════════
-- 014 — Création de clinique Entreprise atomique (audit approfondi multi-cliniques 2026-07-21)
--
-- MEDIUM : createNewClinic compte user_clinic_access puis insère sans
-- transaction ni verrou : deux appels concurrents (double-clic, retry
-- réseau) peuvent tous deux lire existingCount<5 avant qu'aucun n'ait
-- inséré, dépassant le quota de 5 cliniques par compte Entreprise. La
-- séquence d'inserts (clinic, clinic_settings, subscriptions,
-- user_clinic_access) n'était pas non plus transactionnelle.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_enterprise_clinic(
  p_user_id UUID,
  p_name    TEXT,
  p_slug    TEXT
)
RETURNS JSON AS $$
DECLARE
  v_clinic_id UUID;
  v_count     INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('clinic_quota:' || p_user_id::text));

  SELECT COUNT(*) INTO v_count FROM user_clinic_access WHERE user_id = p_user_id;
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'clinic_quota_exceeded';
  END IF;

  INSERT INTO clinics (name, slug, timezone, owner_id)
  VALUES (p_name, p_slug, 'UTC', p_user_id)
  RETURNING id INTO v_clinic_id;

  INSERT INTO clinic_settings (clinic_id, widget_color, welcome_message, faq, slot_duration_minutes, tone, booking_behavior)
  VALUES (
    v_clinic_id,
    '#2563eb',
    'Bienvenue à ' || p_name || ' ! Je suis votre assistant de réservation IA. Comment puis-je vous aider ?',
    '[]'::jsonb,
    15,
    'professionnel et amical',
    'Guide les patients vers le rendez-vous le plus proche disponible.'
  );

  INSERT INTO subscriptions (clinic_id, plan, status, current_period_start, current_period_end)
  VALUES (v_clinic_id, 'enterprise', 'active', NOW(), NOW() + INTERVAL '365 days');

  INSERT INTO user_clinic_access (user_id, clinic_id, role)
  VALUES (p_user_id, v_clinic_id, 'owner');

  RETURN json_build_object('clinic_id', v_clinic_id, 'slug', p_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION create_enterprise_clinic(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_enterprise_clinic(UUID, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION create_enterprise_clinic(UUID, TEXT, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION create_enterprise_clinic(UUID, TEXT, TEXT) TO service_role;
