import { getTranslations } from "next-intl/server";
import {
  Bot,
  CalendarDays,
  Users,
  Video,
  LayoutTemplate,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";
import { FeatureShaderCard } from "@/components/landing/feature-shader-card";

interface FeatureCard {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}

/**
 * Grille bento des fonctionnalités : couvre l'ensemble du produit
 * (agent IA, agenda, CRM, téléconsultation, site vitrine, paiements, sécurité).
 */
export async function FeaturesSection() {
  const t = await getTranslations("landing.features");

  const cards: FeatureCard[] = [
    {
      key: "aiAssistant",
      icon: Bot,
      title: t("aiAssistantTitle"),
      description: t("aiAssistantDesc"),
      bullets: [t("bullets.aiWidget"), t("bullets.aiPrompts")],
    },
    {
      key: "calendar",
      icon: CalendarDays,
      title: t("calendarTitle"),
      description: t("calendarDesc"),
      bullets: [t("bullets.calendarDragDrop"), t("bullets.calendarSync")],
    },
    {
      key: "crm",
      icon: Users,
      title: t("crmTitle"),
      description: t("crmDesc"),
      bullets: [t("bullets.crmRecords"), t("bullets.crmNotifications")],
    },
    {
      key: "teleconsultation",
      icon: Video,
      title: t("teleconsultationTitle"),
      description: t("teleconsultationDesc"),
      bullets: [t("bullets.teleconsultationLink"), t("bullets.teleconsultationQuality")],
    },
    {
      key: "websiteBuilder",
      icon: LayoutTemplate,
      title: t("websiteBuilderTitle"),
      description: t("websiteBuilderDesc"),
      bullets: [t("bullets.websiteTemplates"), t("bullets.websiteBranding")],
    },
    {
      key: "payments",
      icon: CreditCard,
      title: t("paymentsTitle"),
      description: t("paymentsDesc"),
      bullets: [t("bullets.paymentsWebhooks"), t("bullets.paymentsApi")],
    },
  ];

  return (
    <section id="features" className="scroll-mt-32 py-28 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <SectionLabel>{t("sectionLabel")}</SectionLabel>
          <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium text-foreground leading-[1.1]">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <FeatureShaderCard
                key={card.key}
                index={index}
                title={card.title}
                description={card.description}
                bullets={card.bullets}
                icon={<Icon className="w-6 h-6" strokeWidth={1.75} />}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
