-- Migration 004: Medical Carnets (Digital Medical Records)

-- 1. Create the patient_carnets table
CREATE TABLE patient_carnets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_code TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE patient_carnets ENABLE ROW LEVEL SECURITY;

-- 2. Update patients and diagnostics to link to carnets
ALTER TABLE patients ADD COLUMN carnet_id UUID REFERENCES patient_carnets(id) ON DELETE SET NULL;
ALTER TABLE diagnostics ADD COLUMN carnet_id UUID REFERENCES patient_carnets(id) ON DELETE SET NULL;

-- 3. Data Migration: Create carnets for all existing patients
DO $$
DECLARE
  r RECORD;
  new_carnet_id UUID;
  new_code TEXT;
BEGIN
  FOR r IN SELECT id FROM patients WHERE carnet_id IS NULL LOOP
    -- Generate a random code like CAR-1A2B3C4D
    new_code := 'CAR-' || upper(substr(md5(random()::text), 1, 8));
    
    -- Ensure uniqueness (loop until successful insertion in case of collision, though very rare)
    BEGIN
      INSERT INTO patient_carnets (public_code) VALUES (new_code) RETURNING id INTO new_carnet_id;
    EXCEPTION WHEN unique_violation THEN
      new_code := 'CAR-' || upper(substr(md5(random()::text), 1, 8));
      INSERT INTO patient_carnets (public_code) VALUES (new_code) RETURNING id INTO new_carnet_id;
    END;

    -- Update the patient and their past diagnostics
    UPDATE patients SET carnet_id = new_carnet_id WHERE id = r.id;
    UPDATE diagnostics SET carnet_id = new_carnet_id WHERE patient_id = r.id;
  END LOOP;
END
$$;

-- 4. RLS Policies for patient_carnets
-- Staff can view a carnet if one of their clinic's patients is linked to it
CREATE POLICY "patient_carnets_select_staff" ON patient_carnets FOR SELECT 
USING (
  id IN (
    SELECT carnet_id FROM patients 
    WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  )
);

-- Patient portal users can view their own carnet
CREATE POLICY "patient_carnets_select_self" ON patient_carnets FOR SELECT
USING (
  id IN (
    SELECT carnet_id FROM patients WHERE auth_user_id = auth.uid()
  )
);

-- 5. RLS Policies for cross-clinic diagnostics
-- Staff can read a diagnostic from ANY clinic if it shares a carnet_id with a patient in their clinic
CREATE POLICY "diagnostics_select_shared_carnet" ON diagnostics FOR SELECT
USING (
  carnet_id IN (
    SELECT carnet_id FROM patients 
    WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  )
);

-- 6. Trigger to auto-create carnet for new patients
CREATE OR REPLACE FUNCTION auto_create_patient_carnet()
RETURNS TRIGGER AS $$
DECLARE
  new_carnet_id UUID;
  new_code TEXT;
  success BOOLEAN := FALSE;
BEGIN
  IF NEW.carnet_id IS NULL THEN
    WHILE NOT success LOOP
      new_code := 'CAR-' || upper(substr(md5(random()::text), 1, 8));
      BEGIN
        INSERT INTO patient_carnets (public_code) VALUES (new_code) RETURNING id INTO new_carnet_id;
        success := TRUE;
      EXCEPTION WHEN unique_violation THEN
        -- retry
      END;
    END LOOP;
    NEW.carnet_id := new_carnet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_patient_carnet
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION auto_create_patient_carnet();

-- 7. Trigger to auto-link carnet to diagnostics
CREATE OR REPLACE FUNCTION auto_link_diagnostic_carnet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.carnet_id IS NULL AND NEW.patient_id IS NOT NULL THEN
    SELECT carnet_id INTO NEW.carnet_id FROM patients WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_link_diagnostic_carnet
BEFORE INSERT ON diagnostics
FOR EACH ROW
EXECUTE FUNCTION auto_link_diagnostic_carnet();
