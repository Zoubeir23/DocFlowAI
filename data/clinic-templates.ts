export interface ClinicTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  data: {
    hero_data: any;
    style_config: any;
  };
}

export const clinicTemplates: ClinicTemplate[] = [
  {
    id: 'medical-modern',
    name: 'Medical Modern',
    description: 'Design épuré et moderne, parfait pour les cabinets médicaux et cliniques. Couleurs rassurantes, typographie claire et mise en page équilibrée.',
    category: 'General',
    thumbnail: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&h=600&fit=crop',
    data: {
      hero_data: {
        title: 'Votre santé, notre priorité',
        subtitle: 'Cabinet médical moderne avec prise de rendez-vous en ligne. Une équipe dévouée pour vous offrir les meilleurs soins.',
        ctaPrimary: 'Prendre rendez-vous',
        ctaSecondary: 'Nos services',
        bgImage: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2000',
      },
      style_config: {
        primary: '#2563eb', // Bleu médical (clair)
        primaryDark: '#3b82f6',
        secondary: '#64748b',
        secondaryDark: '#94a3b8',
        accent: '#10b981', // Vert succès/santé
        accentDark: '#34d399',
        background: '#ffffff',
        backgroundDark: '#0f172a',
        fontBody: 'Inter',
        fontHead: 'Inter',
        radius: '0.75rem',
        shadow: 'soft',
        style: 'medical-modern',
      },
    },
  },
  {
    id: 'clinic-elegant',
    name: 'Clinic Elegant',
    description: 'Style premium avec effets de transparence et couleurs raffinées. Parfait pour les spécialistes, la chirurgie esthétique ou les cliniques dentaires haut de gamme.',
    category: 'Specialist',
    thumbnail: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&h=600&fit=crop',
    data: {
      hero_data: {
        title: 'L\'Excellence Médicale',
        subtitle: 'Une expertise de pointe dans un cadre apaisant et élégant. Découvrez notre approche personnalisée.',
        ctaPrimary: 'Prendre rendez-vous',
        ctaSecondary: 'Découvrir la clinique',
        bgImage: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?q=80&w=2000',
      },
      style_config: {
        primary: '#8b5cf6', // Violet premium
        primaryDark: '#a78bfa',
        secondary: '#475569',
        secondaryDark: '#94a3b8',
        accent: '#f472b6', // Rose doux
        accentDark: '#f9a8d4',
        background: '#f8fafc',
        backgroundDark: '#0f172a',
        fontBody: 'Inter',
        fontHead: 'Playfair Display',
        radius: '1.5rem',
        shadow: 'soft',
        style: 'clinic-elegant',
        glassmorphism: true,
      },
    },
  },
  {
    id: 'medical-nature',
    name: 'Medical Nature',
    description: 'Design organique et apaisant avec des tons verts et des formes douces. Idéal pour la pédiatrie, la naturopathie ou la médecine douce.',
    category: 'Wellness',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&h=600&fit=crop',
    data: {
      hero_data: {
        title: 'Une approche naturelle de la santé',
        subtitle: 'Retrouvez l\'équilibre et le bien-être grâce à notre accompagnement personnalisé dans un cadre serein.',
        ctaPrimary: 'Prendre rendez-vous',
        ctaSecondary: 'Notre philosophie',
        bgImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000',
      },
      style_config: {
        primary: '#10b981', // Vert nature
        primaryDark: '#34d399',
        secondary: '#f59e0b', // Orange chaud
        secondaryDark: '#fbbf24',
        accent: '#8b5cf6',
        accentDark: '#a78bfa',
        background: '#f9fafb',
        backgroundDark: '#1a1f2e',
        fontBody: 'Inter',
        fontHead: 'Inter',
        radius: '3rem', // Formes très arrondies
        shadow: 'soft',
        style: 'medical-nature',
        organic: true,
      },
    },
  },
  {
    id: 'clinical-minimalist',
    name: 'Clinical Minimalist',
    description: 'Design ultra-épuré, noir et blanc, axé sur l\'essentiel. Idéal pour les chirurgiens, les centres d\'imagerie ou les spécialistes pointus.',
    category: 'Surgical',
    thumbnail: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&h=600&fit=crop',
    data: {
      hero_data: {
        title: 'Précision et Expertise',
        subtitle: 'Une spécialisation de pointe au service de votre santé. Des soins d\'excellence sans compromis.',
        ctaPrimary: 'Prendre rendez-vous',
        ctaSecondary: 'Voir les spécialités',
        bgImage: 'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2000',
      },
      style_config: {
        primary: '#000000', // Noir
        primaryDark: '#ffffff',
        secondary: '#6b7280',
        secondaryDark: '#9ca3af',
        accent: '#ef4444', // Rouge médical/urgence
        accentDark: '#f87171',
        background: '#ffffff',
        backgroundDark: '#000000',
        fontBody: 'Inter',
        fontHead: 'Inter',
        radius: '0.25rem', // Très carré, clinique
        shadow: 'none',
        style: 'clinical-minimalist',
      },
    },
  },
];
