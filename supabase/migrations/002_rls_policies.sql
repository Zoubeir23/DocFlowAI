-- Enable Row Level Security
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's clinic_id
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Clinics policies
CREATE POLICY "Authenticated users can create a clinic"
  ON clinics FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own clinic"
  ON clinics FOR SELECT
  USING (id = get_user_clinic_id());

CREATE POLICY "Owners can update their clinic"
  ON clinics FOR UPDATE
  USING (id = get_user_clinic_id() AND get_user_role() = 'owner');

-- Users policies
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view teammates"
  ON users FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Owners can manage staff"
  ON users FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Patients policies
CREATE POLICY "Clinic staff can view patients"
  ON patients FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic staff can manage patients"
  ON patients FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Services policies
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Clinic staff can manage services"
  ON services FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Availability rules policies
CREATE POLICY "Public can view availability rules"
  ON availability_rules FOR SELECT
  USING (true);

CREATE POLICY "Clinic staff can manage availability"
  ON availability_rules FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Blocked dates policies
CREATE POLICY "Public can view blocked dates"
  ON blocked_dates FOR SELECT
  USING (true);

CREATE POLICY "Clinic staff can manage blocked dates"
  ON blocked_dates FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Appointments policies
CREATE POLICY "Clinic staff can view appointments"
  ON appointments FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic staff can manage appointments"
  ON appointments FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- AI conversations policies
CREATE POLICY "Clinic staff can view conversations"
  ON ai_conversations FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Anyone can create a conversation"
  ON ai_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update own conversation"
  ON ai_conversations FOR UPDATE
  USING (true);

-- Clinic settings policies
CREATE POLICY "Public can view clinic settings"
  ON clinic_settings FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage settings"
  ON clinic_settings FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

-- Subscriptions policies
CREATE POLICY "Clinic staff can view subscription"
  ON subscriptions FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Owners can manage subscription"
  ON subscriptions FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
