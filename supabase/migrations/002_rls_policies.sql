-- Activation de la sécurité au niveau des lignes (RLS)
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

-- Fonction utilitaire : récupérer le clinic_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fonction utilitaire : récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Politiques RLS — Cliniques
CREATE POLICY "Les utilisateurs authentifiés peuvent créer une clinique"
  ON clinics FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Les utilisateurs peuvent voir leur propre clinique"
  ON clinics FOR SELECT
  USING (id = get_user_clinic_id());

CREATE POLICY "Les propriétaires peuvent modifier leur clinique"
  ON clinics FOR UPDATE
  USING (id = get_user_clinic_id() AND get_user_role() = 'owner');

-- Politiques RLS — Utilisateurs
CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent voir les membres de leur équipe"
  ON users FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Les propriétaires peuvent gérer le personnel"
  ON users FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Politiques RLS — Patients
CREATE POLICY "Le personnel peut voir les patients"
  ON patients FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Le personnel peut gérer les patients"
  ON patients FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Politiques RLS — Services
CREATE POLICY "Tout le monde peut voir les services actifs"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Le personnel peut gérer les services"
  ON services FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Politiques RLS — Règles de disponibilité
CREATE POLICY "Tout le monde peut voir les disponibilités"
  ON availability_rules FOR SELECT
  USING (true);

CREATE POLICY "Le personnel peut gérer les disponibilités"
  ON availability_rules FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Politiques RLS — Dates bloquées
CREATE POLICY "Tout le monde peut voir les dates bloquées"
  ON blocked_dates FOR SELECT
  USING (true);

CREATE POLICY "Le personnel peut gérer les dates bloquées"
  ON blocked_dates FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Politiques RLS — Rendez-vous
CREATE POLICY "Le personnel peut voir les rendez-vous"
  ON appointments FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Le personnel peut gérer les rendez-vous"
  ON appointments FOR ALL
  USING (clinic_id = get_user_clinic_id());

-- Politiques RLS — Conversations IA
CREATE POLICY "Le personnel peut voir les conversations"
  ON ai_conversations FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "N'importe qui peut créer une conversation"
  ON ai_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "N'importe qui peut mettre à jour sa conversation"
  ON ai_conversations FOR UPDATE
  USING (true);

-- Politiques RLS — Paramètres de la clinique
CREATE POLICY "Tout le monde peut voir les paramètres de la clinique"
  ON clinic_settings FOR SELECT
  USING (true);

CREATE POLICY "Les propriétaires peuvent gérer les paramètres"
  ON clinic_settings FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

-- Politiques RLS — Abonnements
CREATE POLICY "Le personnel peut voir l'abonnement"
  ON subscriptions FOR SELECT
  USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Les propriétaires peuvent gérer l'abonnement"
  ON subscriptions FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');
