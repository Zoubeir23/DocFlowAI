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
    id: "lumiere-privee",
    name: "Lumière Privée",
    description:
      "Design luxe et confidentiel pour cabinets et cliniques privées haut de gamme. Fond noir profond, or antique, typographie serif italique raffinée et mise en page épurée sans fioritures.",
    category: "Clinique privée & Spécialiste",
    thumbnail:
      "https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80&w=800&h=600&fit=crop",
    data: {
      hero_data: {
        title: "Une médecine d'exception, en toute confidentialité",
        subtitle:
          "Un accompagnement médical d'excellence, sur rendez-vous, dans un cadre pensé pour votre sérénité.",
        ctaPrimary: "Prendre rendez-vous",
        ctaSecondary: "Découvrir le cabinet",
        bgImage: "",
      },
      style_config: {
        primary: "#C6A15B",
        primaryDark: "#D9BC80",
        secondary: "#8A7248",
        secondaryDark: "#B09863",
        accent: "#C6A15B",
        accentDark: "#D9BC80",
        background: "#0B0A08",
        backgroundDark: "#0B0A08",
        fontBody: "Manrope",
        fontHead: "Fraunces",
        radius: "0px",
        shadow: "none",
        style: "lumiere-privee",
      },
    },
  },
  {
    id: "structure-brut",
    name: "Structure Brut",
    description:
      "Design brutaliste et confiant pour cliniques modernes qui veulent se démarquer. Blanc/noir contrastés, accent cobalt franc, typographie massive et bordures épaisses.",
    category: "Clinique moderne & Multi-spécialités",
    thumbnail:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&h=600&fit=crop",
    data: {
      hero_data: {
        title: "Votre santé sans compromis",
        subtitle:
          "Un accompagnement médical direct, sans détour, disponible 24h/24 pour votre bien-être.",
        ctaPrimary: "Prendre rendez-vous",
        ctaSecondary: "Voir nos services",
        bgImage: "",
      },
      style_config: {
        primary: "#0038FF",
        primaryDark: "#3D63FF",
        secondary: "#0A0A0A",
        secondaryDark: "#F7F7F2",
        accent: "#0038FF",
        accentDark: "#3D63FF",
        background: "#F7F7F2",
        backgroundDark: "#0A0A0A",
        fontBody: "Work Sans",
        fontHead: "Anton",
        radius: "0px",
        shadow: "hard",
        style: "structure-brut",
      },
    },
  },
  {
    id: "oracare-editorial",
    name: "Cabinet Éditorial",
    description:
      "Design éditorial audacieux inspiré des meilleurs cabinets médicaux modernes. Fond crème chaleureux, typographie Bebas Neue bold, cartes flottantes colorées et mise en page asymétrique.",
    category: "Médecin & Spécialiste",
    thumbnail:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&h=600&fit=crop",
    data: {
      hero_data: {
        title: "Votre santé notre priorité",
        subtitle:
          "Un accompagnement médical personnalisé, disponible 24h/24 pour votre bien-être et celui de votre famille.",
        ctaPrimary: "Prendre rendez-vous",
        ctaSecondary: "Découvrir le cabinet",
        bgImage: "",
      },
      style_config: {
        primary: "#FF2D78",
        primaryDark: "#FF5C97",
        secondary: "#26C6DA",
        secondaryDark: "#4DD8E8",
        accent: "#26C6DA",
        accentDark: "#4DD8E8",
        background: "#F5F0E8",
        backgroundDark: "#1A1A2E",
        fontBody: "DM Sans",
        fontHead: "Bebas Neue",
        radius: "1rem",
        shadow: "soft",
        style: "oracare-editorial",
      },
    },
  },
];
