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
