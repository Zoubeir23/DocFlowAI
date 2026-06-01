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
-- Uses 16 hex chars from UUID (~64 bits entropy) for the public code
DO $$
DECLARE
  r RECORD;
  new_carnet_id UUID;
  new_code TEXT;
BEGIN
  FOR r IN SELECT id FROM patients WHERE carnet_id IS NULL LOOP
    new_code := 'CAR-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 16));

    BEGIN
      INSERT INTO patient_carnets (public_code) VALUES (new_code) RETURNING id INTO new_carnet_id;
    EXCEPTION WHEN unique_violation THEN
      new_code := 'CAR-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 16));
      INSERT INTO patient_carnets (public_code) VALUES (new_code) RETURNING id INTO new_carnet_id;
    END;

    UPDATE patients SET carnet_id = new_carnet_id WHERE id = r.id;

    -- Link diagnostics that have patient_id set
    UPDATE diagnostics SET carnet_id = new_carnet_id WHERE patient_id = r.id;

    -- Also link diagnostics without patient_id but matching by full_name + clinic_id
    -- (covers diagnostics created via the wizard before patient linking was enforced)
    UPDATE diagnostics
    SET carnet_id = new_carnet_id
    WHERE carnet_id IS NULL
      AND patient_id IS NULL
      AND clinic_id = (SELECT clinic_id FROM patients WHERE id = r.id)
      AND patient_full_name = (SELECT full_name FROM patients WHERE id = r.id);

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
-- Staff can read a validated diagnostic from ANY clinic if it shares a carnet_id with a patient in their clinic
-- Only validated diagnostics are shared — draft/pending/rejected records are never exposed cross-clinic
CREATE POLICY "diagnostics_select_shared_carnet" ON diagnostics FOR SELECT
USING (
  validation_status = 'validated'
  AND carnet_id IN (
    SELECT carnet_id FROM patients
    WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  )
);

-- 6. Trigger to auto-create carnet for new patients
-- Uses 16 hex chars from UUID (~64 bits entropy) — sufficient for a medical bearer code
-- SECURITY DEFINER so the INSERT into patient_carnets bypasses RLS on that table
CREATE OR REPLACE FUNCTION auto_create_patient_carnet()
RETURNS TRIGGER AS $$
DECLARE
  new_carnet_id UUID;
  new_code TEXT;
  success BOOLEAN := FALSE;
BEGIN
  IF NEW.carnet_id IS NULL THEN
    WHILE NOT success LOOP
      new_code := 'CAR-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 16));
      BEGIN
        INSERT INTO patient_carnets (public_code) VALUES (new_code) RETURNING id INTO new_carnet_id;
        success := TRUE;
      EXCEPTION WHEN unique_violation THEN
        -- retry with fresh UUID
      END;
    END LOOP;
    NEW.carnet_id := new_carnet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_create_patient_carnet
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION auto_create_patient_carnet();

-- 7. Trigger to auto-link carnet to diagnostics
-- Fires on INSERT and UPDATE so that diagnostics created without patient_id
-- (e.g. from the diagnostic wizard) get linked when patient_id is set later
-- SECURITY DEFINER so the SELECT on patients bypasses RLS in all calling contexts
CREATE OR REPLACE FUNCTION auto_link_diagnostic_carnet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.carnet_id IS NULL AND NEW.patient_id IS NOT NULL THEN
    SELECT carnet_id INTO NEW.carnet_id FROM patients WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_link_diagnostic_carnet
BEFORE INSERT OR UPDATE ON diagnostics
FOR EACH ROW
EXECUTE FUNCTION auto_link_diagnostic_carnet();
