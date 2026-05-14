-- Table des invitations du personnel
CREATE TABLE staff_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'receptionist' CHECK (role IN ('receptionist', 'assistant')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(clinic_id, email)
);

CREATE INDEX idx_staff_invitations_clinic_id ON staff_invitations(clinic_id);
CREATE INDEX idx_staff_invitations_token ON staff_invitations(token);
CREATE INDEX idx_staff_invitations_status ON staff_invitations(status);

ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

-- Les propriétaires peuvent gérer les invitations de leur clinique
CREATE POLICY "Les propriétaires peuvent gérer les invitations"
  ON staff_invitations FOR ALL
  USING (clinic_id = get_user_clinic_id() AND get_user_role() = 'owner');

-- N'importe qui peut lire une invitation par token (nécessaire pour la page d'adhésion sans authentification)
CREATE POLICY "N'importe qui peut lire une invitation par token"
  ON staff_invitations FOR SELECT
  USING (true);
