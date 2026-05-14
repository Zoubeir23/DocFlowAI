-- Migration : 005_website_builder.sql
-- Description : Création de la table clinic_websites pour le constructeur de site web

CREATE TABLE IF NOT EXISTS clinic_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Template utilisé
  template_id text NOT NULL DEFAULT 'medical-modern',

  -- Contenu des sections (JSONB)
  hero_data jsonb DEFAULT '{
    "title": "Votre santé, notre priorité",
    "subtitle": "Cabinet médical moderne avec prise de rendez-vous en ligne",
    "ctaPrimary": "Prendre rendez-vous",
    "ctaSecondary": "Nos services",
    "bgImage": ""
  }'::jsonb,

  about_data jsonb DEFAULT '{
    "bio": "",
    "specialties": [],
    "diplomas": [],
    "avatar": ""
  }'::jsonb,

  gallery jsonb DEFAULT '[]'::jsonb,          -- Photos de la clinique
  testimonials jsonb DEFAULT '[]'::jsonb,      -- Avis patients
  experience jsonb DEFAULT '[]'::jsonb,        -- Parcours du médecin
  blog_posts jsonb DEFAULT '[]'::jsonb,        -- Conseils santé

  -- Configuration du style
  style_config jsonb DEFAULT '{
    "primary": "#2563eb",
    "primaryDark": "#3b82f6",
    "secondary": "#64748b",
    "secondaryDark": "#94a3b8",
    "accent": "#10b981",
    "accentDark": "#34d399",
    "background": "#ffffff",
    "backgroundDark": "#0f172a",
    "fontBody": "Inter",
    "fontHead": "Inter",
    "radius": "0.75rem",
    "shadow": "soft",
    "style": "medical-modern"
  }'::jsonb,

  -- Options d'affichage
  show_chat_widget boolean DEFAULT true,       -- Injecter le widget IA
  show_services boolean DEFAULT true,          -- Afficher les services (depuis la table services)
  show_gallery boolean DEFAULT true,
  show_testimonials boolean DEFAULT true,
  show_blog boolean DEFAULT false,

  -- SEO
  meta_title text,
  meta_description text,

  -- Publication
  is_published boolean DEFAULT false,
  published_at timestamptz,

  -- Statistiques
  views_count integer DEFAULT 0,

  -- Horodatages
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de la RLS
ALTER TABLE clinic_websites ENABLE ROW LEVEL SECURITY;

-- Le médecin peut voir et modifier son propre site
CREATE POLICY "Les utilisateurs peuvent gérer leur propre site"
  ON clinic_websites FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

-- Tout le monde peut voir un site publié (route publique)
CREATE POLICY "Tout le monde peut voir les sites publiés"
  ON clinic_websites FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_clinic_websites_clinic_id ON clinic_websites(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_websites_published ON clinic_websites(is_published);

-- Fonction d'incrémentation du compteur de vues
CREATE OR REPLACE FUNCTION increment_website_views(website_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE clinic_websites
  SET views_count = views_count + 1
  WHERE id = website_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
