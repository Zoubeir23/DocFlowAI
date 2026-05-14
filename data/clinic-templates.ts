export interface ClinicTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  data: {
    hero_data: {
      title: string;
      subtitle: string;
      ctaPrimary: string;
      ctaSecondary: string;
      bgImage: string;
    };
    style_config: {
      primary: string;
      primaryDark: string;
      secondary: string;
      secondaryDark: string;
      accent: string;
      accentDark: string;
      background: string;
      backgroundDark: string;
      fontBody: string;
      fontHead: string;
      radius: string;
      shadow: string;
      style: string;
    };
  };
}

export const clinicTemplates: ClinicTemplate[] = [
  {
    id: "medical-modern",
    name: "Medical Modern",
    description:
      "Design épuré et moderne, parfait pour les cabinets médicaux et cliniques. Couleurs rassurantes, typographie claire et mise en page équilibrée.",
    category: "Général",
    thumbnail:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&h=600&fit=crop",
    data: {
      hero_data: {
        title: "Votre santé, notre priorité",
        subtitle:
          "Cabinet médical moderne avec prise de rendez-vous en ligne. Une équipe dévouée pour vous offrir les meilleurs soins.",
        ctaPrimary: "Prendre rendez-vous",
        ctaSecondary: "Nos services",
        bgImage:
          "https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2000",
      },
      style_config: {
        primary: "#1d6fa4",
        primaryDark: "#3b9ede",
        secondary: "#64748b",
        secondaryDark: "#94a3b8",
        accent: "#0ea5a0",
        accentDark: "#2dd4bf",
        background: "#F8F7F4",
        backgroundDark: "#0f172a",
        fontBody: "DM Sans",
        fontHead: "Fraunces",
        radius: "0.875rem",
        shadow: "soft",
        style: "medical-modern",
      },
    },
  },
  {
    id: "clinic-elegant",
    name: "Clinic Élégant",
    description:
      "Style raffiné avec typographie classique et couleurs premium. Parfait pour les spécialistes, la chirurgie esthétique ou les cliniques dentaires haut de gamme.",
    category: "Spécialiste",
    thumbnail:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&h=600&fit=crop",
    data: {
      hero_data: {
        title: "L'Excellence Médicale",
        subtitle:
          "Une expertise de pointe dans un cadre apaisant et élégant. Découvrez notre approche personnalisée.",
        ctaPrimary: "Prendre rendez-vous",
        ctaSecondary: "Découvrir la clinique",
        bgImage:
          "https://images.unsplash.com/photo-1629909615184-74f495363b67?q=80&w=2000",
      },
      style_config: {
        primary: "#7c5c3e",
        primaryDark: "#a8805c",
        secondary: "#475569",
        secondaryDark: "#94a3b8",
        accent: "#c49a6c",
        accentDark: "#e0b87a",
        background: "#FAFAF8",
        backgroundDark: "#1a1510",
        fontBody: "DM Sans",
        fontHead: "Cormorant Garamond",
        radius: "0.5rem",
        shadow: "soft",
        style: "clinic-elegant",
      },
    },
  },
  {
    id: "medical-nature",
    name: "Medical Nature",
    description:
      "Design organique et apaisant avec des tons verts et des formes douces. Idéal pour la pédiatrie, la naturopathie ou la médecine douce.",
    category: "Bien-être",
    thumbnail:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&h=600&fit=crop",
    data: {
      hero_data: {
        title: "Une approche naturelle de la santé",
        subtitle:
          "Retrouvez l'équilibre et le bien-être grâce à notre accompagnement personnalisé dans un cadre serein.",
        ctaPrimary: "Prendre rendez-vous",
        ctaSecondary: "Notre philosophie",
        bgImage:
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000",
      },
      style_config: {
        primary: "#2d7d5a",
        primaryDark: "#3da876",
        secondary: "#92400e",
        secondaryDark: "#b45309",
        accent: "#6b9e52",
        accentDark: "#84c164",
        background: "#F7FAF5",
        backgroundDark: "#0e1a12",
        fontBody: "Nunito",
        fontHead: "Fraunces",
        radius: "1.25rem",
        shadow: "soft",
        style: "medical-nature",
      },
    },
  },
  {
    id: "clinical-minimalist",
    name: "Clinical Précision",
    description:
      "Design ultra-épuré, graphique et contrasté. Idéal pour les chirurgiens, les centres d'imagerie ou les spécialistes pointus.",
    category: "Chirurgical",
    thumbnail:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&h=600&fit=crop",
    data: {
      hero_data: {
        title: "Précision et Expertise",
        subtitle:
          "Une spécialisation de pointe au service de votre santé. Des soins d'excellence sans compromis.",
        ctaPrimary: "Prendre rendez-vous",
        ctaSecondary: "Voir les spécialités",
        bgImage:
          "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2000",
      },
      style_config: {
        primary: "#18181b",
        primaryDark: "#e4e4e7",
        secondary: "#71717a",
        secondaryDark: "#a1a1aa",
        accent: "#dc2626",
        accentDark: "#ef4444",
        background: "#ffffff",
        backgroundDark: "#09090b",
        fontBody: "DM Sans",
        fontHead: "Syne",
        radius: "0.375rem",
        shadow: "none",
        style: "clinical-minimalist",
      },
    },
  },
];
