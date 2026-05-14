-- Migration 010 : Rôle super_admin + colonne is_active sur utilisateurs et cliniques

-- 1. Mise à jour de la contrainte CHECK sur users.role pour inclure 'super_admin'
--    PostgreSQL exige de supprimer puis recréer la contrainte CHECK
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check,
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('owner', 'receptionist', 'assistant', 'super_admin'));

-- Mise à jour de la contrainte sur user_clinic_access (super_admin n'y figure pas — accès global)
ALTER TABLE user_clinic_access
  DROP CONSTRAINT IF EXISTS user_clinic_access_role_check,
  ADD CONSTRAINT user_clinic_access_role_check
    CHECK (role IN ('owner', 'receptionist', 'assistant'));

-- 2. Ajout de is_active sur les utilisateurs (true par défaut — tous les comptes existants restent actifs)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. Ajout de is_active sur les cliniques
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 4. Fonction utilitaire : vérifier si l'utilisateur courant est super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role = 'super_admin' FROM users WHERE id = auth.uid();
$$;

-- 5. Politiques RLS : le super_admin peut lire et modifier toutes les données

CREATE POLICY "super_admin_lecture_cliniques"
  ON clinics FOR SELECT
  USING (is_super_admin());

CREATE POLICY "super_admin_lecture_utilisateurs"
  ON users FOR SELECT
  USING (is_super_admin());

CREATE POLICY "super_admin_modification_utilisateurs"
  ON users FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "super_admin_lecture_abonnements"
  ON subscriptions FOR SELECT
  USING (is_super_admin());

CREATE POLICY "super_admin_modification_abonnements"
  ON subscriptions FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "super_admin_modification_cliniques"
  ON clinics FOR UPDATE
  USING (is_super_admin());
