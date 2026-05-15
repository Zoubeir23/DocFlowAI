-- Migration 012 : Inbox super admin + système newsletter

-- ── Table admin_messages (tickets support + demandes enterprise) ──────────────

CREATE TABLE IF NOT EXISTS admin_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL CHECK (type IN ('support', 'enterprise')),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),

  -- Expéditeur
  sender_name   text NOT NULL,
  sender_email  text NOT NULL,
  sender_plan   text,

  -- Contenu
  subject       text NOT NULL,
  body          text NOT NULL,
  metadata      jsonb DEFAULT '{}',   -- priorité, organisation, nb médecins, etc.

  -- Référence à l'utilisateur si authentifié
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clinic_id     uuid REFERENCES clinics(id) ON DELETE SET NULL,

  -- Réponse admin
  admin_reply   text,
  replied_at    timestamptz,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_admin_messages_type     ON admin_messages(type);
CREATE INDEX IF NOT EXISTS idx_admin_messages_status   ON admin_messages(status);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created  ON admin_messages(created_at DESC);

-- RLS : seuls les super admins peuvent lire/modifier
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin peut tout faire sur admin_messages"
  ON admin_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- Les serveurs (service_role) peuvent insérer des messages sans RLS
-- Cela permet aux server actions d'enregistrer les tickets sans être super admin

-- ── Table newsletter_campaigns ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text NOT NULL,
  body_html       text NOT NULL,
  body_text       text,

  -- Ciblage par rôle (NULL = tous les rôles)
  target_roles    text[] DEFAULT NULL,

  -- Statut
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),

  -- Statistiques d'envoi
  recipients_count  integer DEFAULT 0,
  sent_count        integer DEFAULT 0,
  failed_count      integer DEFAULT 0,

  -- Qui a créé / envoyé
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at         timestamptz,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status  ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created ON newsletter_campaigns(created_at DESC);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin peut gérer les newsletters"
  ON newsletter_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );
