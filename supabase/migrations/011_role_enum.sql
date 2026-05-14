-- Migration 011 : Conversion de la colonne role en type ENUM PostgreSQL
-- Cela permet d'afficher un dropdown dans le dashboard Supabase lors de l'édition d'un utilisateur.

-- 1. Création du type ENUM pour les rôles utilisateur
CREATE TYPE user_role AS ENUM ('owner', 'receptionist', 'assistant', 'super_admin');

-- 2. Conversion de la colonne users.role vers le nouveau type ENUM
--    On supprime d'abord la contrainte CHECK (remplacée par l'ENUM)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check,
  ALTER COLUMN role TYPE user_role USING role::user_role;

-- 3. Recréation de la valeur par défaut avec le type ENUM
ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'owner'::user_role;

-- 4. Même conversion pour staff_invitations.role (receptionist / assistant uniquement)
CREATE TYPE staff_role AS ENUM ('receptionist', 'assistant');

ALTER TABLE staff_invitations
  DROP CONSTRAINT IF EXISTS staff_invitations_role_check,
  ALTER COLUMN role TYPE staff_role USING role::staff_role;

ALTER TABLE staff_invitations
  ALTER COLUMN role SET DEFAULT 'receptionist'::staff_role;

-- 5. Conversion de user_clinic_access.role
--    Ce type couvre owner / receptionist / assistant (pas super_admin — accès global)
CREATE TYPE clinic_access_role AS ENUM ('owner', 'receptionist', 'assistant');

ALTER TABLE user_clinic_access
  DROP CONSTRAINT IF EXISTS user_clinic_access_role_check,
  ALTER COLUMN role TYPE clinic_access_role USING role::clinic_access_role;

ALTER TABLE user_clinic_access
  ALTER COLUMN role SET DEFAULT 'owner'::clinic_access_role;
