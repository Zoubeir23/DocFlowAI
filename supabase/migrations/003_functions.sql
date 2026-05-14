-- Fonction de création de rendez-vous depuis le widget (contourne la RLS via le rôle service)
CREATE OR REPLACE FUNCTION create_booking_from_widget(
  p_clinic_id UUID,
  p_patient_name TEXT,
  p_patient_phone TEXT,
  p_patient_email TEXT DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_patient_id UUID;
  v_appointment_id UUID;
  v_service_duration INTEGER;
BEGIN
  -- Insertion ou mise à jour du patient
  INSERT INTO patients (clinic_id, full_name, phone, email)
  VALUES (p_clinic_id, p_patient_name, p_patient_phone, p_patient_email)
  ON CONFLICT (clinic_id, phone) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = COALESCE(EXCLUDED.email, patients.email)
  RETURNING id INTO v_patient_id;

  -- Si aucun patient retourné, recherche par téléphone
  IF v_patient_id IS NULL THEN
    SELECT id INTO v_patient_id
    FROM patients
    WHERE clinic_id = p_clinic_id AND phone = p_patient_phone;
  END IF;

  -- Création du rendez-vous
  INSERT INTO appointments (
    clinic_id, patient_id, service_id, status, source,
    start_at, end_at, notes
  )
  VALUES (
    p_clinic_id, v_patient_id, p_service_id, 'booked', 'widget',
    p_start_at, p_end_at, p_notes
  )
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object(
    'appointment_id', v_appointment_id,
    'patient_id', v_patient_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contrainte d'unicité : un patient par numéro de téléphone par clinique
ALTER TABLE patients ADD CONSTRAINT patients_clinic_phone_unique UNIQUE (clinic_id, phone);

-- Fonction de récupération des informations d'une clinique par slug
CREATE OR REPLACE FUNCTION get_clinic_info_by_slug(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_clinic clinics%ROWTYPE;
  v_settings clinic_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_clinic FROM clinics WHERE slug = p_slug;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_settings FROM clinic_settings WHERE clinic_id = v_clinic.id;

  RETURN json_build_object(
    'id', v_clinic.id,
    'name', v_clinic.name,
    'slug', v_clinic.slug,
    'timezone', v_clinic.timezone,
    'widget_color', COALESCE(v_settings.widget_color, '#2563eb'),
    'welcome_message', COALESCE(v_settings.welcome_message, 'Hello! How can I help you today?'),
    'tone', COALESCE(v_settings.tone, 'professional and friendly'),
    'booking_behavior', COALESCE(v_settings.booking_behavior, ''),
    'faq', COALESCE(v_settings.faq, '[]'::jsonb),
    'slot_duration_minutes', COALESCE(v_settings.slot_duration_minutes, 15)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Autorisation d'exécution pour le rôle anonyme (utilisé par le widget public)
GRANT EXECUTE ON FUNCTION create_booking_from_widget TO anon;
GRANT EXECUTE ON FUNCTION get_clinic_info_by_slug TO anon;
