import { getTranslations } from "next-intl/server";
import {
  Bot,
  CalendarDays,
  Users,
  Video,
  LayoutTemplate,
  CreditCard,
  ShieldCheck,
  Check,
  type LucideIcon,
} from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";

type AccentTone = "primary" | "blue" | "emerald" | "amber";

interface FeatureCard {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  accent: AccentTone;
  wide?: boolean;
}

const ACCENT_CLASSNAMES: Record<AccentTone, string> = {
  primary: "bg-primary/10 border-primary/20 text-primary",
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-500",
};

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
      accent: "primary",
      wide: true,
    },
    {
      key: "calendar",
      icon: CalendarDays,
      title: t("calendarTitle"),
      description: t("calendarDesc"),
      bullets: [t("bullets.calendarDragDrop"), t("bullets.calendarSync")],
      accent: "blue",
    },
    {
      key: "crm",
      icon: Users,
      title: t("crmTitle"),
      description: t("crmDesc"),
      bullets: [t("bullets.crmRecords"), t("bullets.crmNotifications")],
      accent: "emerald",
    },
    {
      key: "teleconsultation",
      icon: Video,
      title: t("teleconsultationTitle"),
      description: t("teleconsultationDesc"),
      bullets: [t("bullets.teleconsultationLink"), t("bullets.teleconsultationQuality")],
      accent: "primary",
    },
    {
      key: "websiteBuilder",
      icon: LayoutTemplate,
      title: t("websiteBuilderTitle"),
      description: t("websiteBuilderDesc"),
      bullets: [t("bullets.websiteTemplates"), t("bullets.websiteBranding")],
      accent: "amber",
    },
    {
      key: "payments",
      icon: CreditCard,
      title: t("paymentsTitle"),
      description: t("paymentsDesc"),
      bullets: [t("bullets.paymentsWebhooks"), t("bullets.paymentsApi")],
      accent: "primary",
      wide: true,
    },
    {
      key: "security",
      icon: ShieldCheck,
      title: t("securityTitle"),
      description: t("securityDesc"),
      bullets: [],
      accent: "blue",
    },
  ];

  return (
    <section id="features" className="py-28 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <SectionLabel>{t("sectionLabel")}</SectionLabel>
          <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium text-foreground leading-[1.1]">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <article
                key={card.key}
                className={`group relative overflow-hidden bg-card rounded-3xl border border-border p-8 lg:p-10 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 fade-in-up ${
                  card.wide ? "md:col-span-2" : ""
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div
                  className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  aria-hidden="true"
                />

                <div
                  className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center mb-7 ${ACCENT_CLASSNAMES[card.accent]}`}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.75} />
                </div>

                <h3 className="relative text-xl font-bold text-foreground mb-3">{card.title}</h3>
                <p className="relative text-muted-foreground leading-relaxed max-w-xl">
                  {card.description}
                </p>

                {card.bullets.length > 0 && (
                  <ul className="relative mt-7 pt-6 border-t border-border space-y-2.5">
                    {card.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
