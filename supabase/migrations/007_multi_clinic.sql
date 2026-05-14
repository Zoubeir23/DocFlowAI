-- Table des accès multi-cliniques (support Enterprise — un utilisateur peut accéder à plusieurs cliniques)
CREATE TABLE user_clinic_access (
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id)   ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'owner',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, clinic_id)
);

CREATE INDEX idx_user_clinic_access_user_id   ON user_clinic_access(user_id);
CREATE INDEX idx_user_clinic_access_clinic_id ON user_clinic_access(clinic_id);

-- Remplissage initial depuis la table users existante
INSERT INTO user_clinic_access (user_id, clinic_id, role, joined_at)
SELECT id, clinic_id, role, created_at FROM users
ON CONFLICT DO NOTHING;

ALTER TABLE user_clinic_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres accès"
  ON user_clinic_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres accès"
  ON user_clinic_access FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres accès"
  ON user_clinic_access FOR DELETE
  USING (user_id = auth.uid());
