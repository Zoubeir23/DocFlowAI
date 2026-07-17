-- ═══════════════════════════════════════════════════════════════════════════════
-- 005 — Security hardening (audit sécurité 2026-07-17)
--
-- H1 : la RPC widget n'est plus exécutable avec la clé anon publique
--      (contournait rate limiting, quota et validation de service)
-- H2 : end_at recalculé côté serveur + refus des créneaux passés ou en conflit
-- M1 : unicité de crypto_tx_hash (empêche l'activation concurrente de deux
--      abonnements avec la même transaction)
-- M2 : fermeture des policies SELECT ouvertes cross-tenant
-- M3 : suppression des policies anon INSERT/UPDATE sur ai_conversations
-- M4 : gestion webhooks/api_keys restreinte au rôle owner
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── H2 : validation de créneau dans la RPC ────────────────────────────────────
-- p_end_at est conservé pour compatibilité de signature mais ignoré :
-- la durée est toujours dérivée du service côté serveur.
CREATE OR REPLACE FUNCTION create_booking_from_widget(
  p_clinic_id     UUID,
  p_patient_name  TEXT,
  p_patient_phone TEXT,
  p_patient_email TEXT        DEFAULT NULL,
  p_service_id    UUID        DEFAULT NULL,
  p_start_at      TIMESTAMPTZ DEFAULT NULL,
  p_end_at        TIMESTAMPTZ DEFAULT NULL,
  p_notes         TEXT        DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_patient_id       UUID;
  v_appointment_id   UUID;
  v_duration_minutes INTEGER;
  v_end_at           TIMESTAMPTZ;
BEGIN
  SELECT duration_minutes INTO v_duration_minutes
  FROM services
  WHERE id = p_service_id
    AND clinic_id = p_clinic_id
    AND is_active = true;

  IF v_duration_minutes IS NULL THEN
    RAISE EXCEPTION 'invalid_service';
  END IF;

  IF p_start_at IS NULL OR p_start_at <= NOW() THEN
    RAISE EXCEPTION 'invalid_start_time';
  END IF;

  v_end_at := p_start_at + make_interval(mins => v_duration_minutes);

  -- Sérialise les réservations concurrentes de la même clinique pour que le
  -- contrôle de chevauchement ci-dessous ne soit pas soumis à une race condition.
  PERFORM pg_advisory_xact_lock(hashtext('booking:' || p_clinic_id::text));

  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE clinic_id = p_clinic_id
      AND status IN ('booked', 'confirmed')
      AND start_at < v_end_at
      AND end_at   > p_start_at
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  INSERT INTO patients (clinic_id, full_name, phone, email)
  VALUES (p_clinic_id, p_patient_name, p_patient_phone, p_patient_email)
  ON CONFLICT (clinic_id, phone) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email     = COALESCE(EXCLUDED.email, patients.email)
  RETURNING id INTO v_patient_id;

  IF v_patient_id IS NULL THEN
    SELECT id INTO v_patient_id FROM patients
    WHERE clinic_id = p_clinic_id AND phone = p_patient_phone;
  END IF;

  INSERT INTO appointments (clinic_id, patient_id, service_id, status, source, start_at, end_at, notes)
  VALUES (p_clinic_id, v_patient_id, p_service_id, 'booked', 'widget', p_start_at, v_end_at, p_notes)
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object('appointment_id', v_appointment_id, 'patient_id', v_patient_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── H1 : seul le service role (routes serveur) peut appeler la RPC ────────────
REVOKE EXECUTE ON FUNCTION create_booking_from_widget(UUID, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_booking_from_widget(UUID, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION create_booking_from_widget(UUID, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM authenticated;
GRANT  EXECUTE ON FUNCTION create_booking_from_widget(UUID, TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;

-- ── M1 : anti-replay concurrent sur le paiement crypto ────────────────────────
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS crypto_tx_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_crypto_tx_hash_key
  ON subscriptions (crypto_tx_hash)
  WHERE crypto_tx_hash IS NOT NULL;

-- ── M2 : fermeture des lectures cross-tenant ──────────────────────────────────
-- Le widget, le site public et le chat lisent ces tables via le service role
-- côté serveur : les policies anon ouvertes n'ont aucun usage légitime.
DROP POLICY IF EXISTS "services_select_active"     ON services;
DROP POLICY IF EXISTS "availability_select_all"    ON availability_rules;
DROP POLICY IF EXISTS "blocked_dates_select_all"   ON blocked_dates;
DROP POLICY IF EXISTS "clinic_settings_select_all" ON clinic_settings;

-- Le staff (tous rôles) garde la lecture des réglages de sa propre clinique.
CREATE POLICY "clinic_settings_select_staff" ON clinic_settings FOR SELECT
  USING (clinic_id = get_user_clinic_id());

-- ── M3 : ai_conversations n'est plus modifiable avec la clé anon ──────────────
-- La route /api/widget/chat écrit via le service role ; les policies anon
-- permettaient de lire/modifier les conversations (PII) de toute clinique active.
DROP POLICY IF EXISTS "ai_conversations_insert_widget"      ON ai_conversations;
DROP POLICY IF EXISTS "ai_conversations_update_own_session" ON ai_conversations;

-- ── M4 : secrets webhooks et API keys réservés au rôle owner ──────────────────
-- Les anciennes policies ne vérifiaient que la clinique : un receptionist
-- pouvait lire les secrets via l'API Supabase directe.
DROP POLICY IF EXISTS "webhooks_manage_owner" ON webhooks;
CREATE POLICY "webhooks_manage_owner" ON webhooks FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'));

DROP POLICY IF EXISTS "api_keys_manage_owner" ON api_keys;
CREATE POLICY "api_keys_manage_owner" ON api_keys FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() IN ('owner', 'super_admin'));
