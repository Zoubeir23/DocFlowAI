-- CORRECTIF SÉCURITÉ : Suppression de la politique INSERT permissive sur user_clinic_access.
-- Seul le rôle service (client admin) doit insérer des lignes ici.
-- L'ancienne politique permettait à n'importe quel utilisateur authentifié de s'octroyer
-- l'accès à n'importe quelle clinique avec n'importe quel rôle (escalade de privilèges).

DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leurs propres accès" ON user_clinic_access;

-- Contrainte sur les valeurs de rôle autorisées
ALTER TABLE user_clinic_access
  ADD CONSTRAINT user_clinic_access_role_check
  CHECK (role IN ('owner', 'receptionist', 'assistant'));
