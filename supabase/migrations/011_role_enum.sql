-- Migration 011 : Conversion de la colonne role en type ENUM PostgreSQL
-- Cela permet d'afficher un dropdown dans le dashboard Supabase lors de l'édition d'un utilisateur.

-- 1. Création du type ENUM pour les rôles utilisateur
CREATE TYPE user_role AS ENUM ('owner', 'receptionist', 'assistant', 'super_admin');

-- 2. Suppression du DEFAULT avant la conversion (PostgreSQL ne peut pas caster automatiquement)
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- 3. Suppression de la contrainte CHECK (remplacée par l'ENUM)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 4. Conversion de la colonne vers le type ENUM
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;

-- 5. Réapplication du DEFAULT avec le type ENUM
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'owner'::user_role;

-- ── staff_invitations ────────────────────────────────────────────────────────

CREATE TYPE staff_role AS ENUM ('receptionist', 'assistant');


ALTER TABLE staff_invitations ALTER COLUMN role DROP DEFAULT;
ALTER TABLE staff_invitations DROP CONSTRAINT IF EXISTS staff_invitations_role_check;
ALTER TABLE staff_invitations ALTER COLUMN role TYPE staff_role USING role::staff_role;
ALTER TABLE staff_invitations ALTER COLUMN role SET DEFAULT 'receptionist'::staff_role;

-- ── user_clinic_access ───────────────────────────────────────────────────────

CREATE TYPE clinic_access_role AS ENUM ('owner', 'receptionist', 'assistant');

ALTER TABLE user_clinic_access ALTER COLUMN role DROP DEFAULT;
ALTER TABLE user_clinic_access DROP CONSTRAINT IF EXISTS user_clinic_access_role_check;
ALTER TABLE user_clinic_access ALTER COLUMN role TYPE clinic_access_role USING role::clinic_access_role;
ALTER TABLE user_clinic_access ALTER COLUMN role SET DEFAULT 'owner'::clinic_access_role;
