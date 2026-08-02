import { getTranslations } from "next-intl/server";
import { Lock, ShieldAlert, FileLock2, UserCog, type LucideIcon } from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";

interface SecurityGuarantee {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Section « Sécurité » : les garanties réellement en place côté production
 * (RLS Supabase, filtrage SSRF des webhooks, en-têtes durcis, RBAC).
 */
export async function SecuritySection() {
  const t = await getTranslations("landing.security");

  const guarantees: SecurityGuarantee[] = [
    { key: "rls", icon: Lock, title: t("rlsTitle"), description: t("rlsDesc") },
    { key: "ssrf", icon: ShieldAlert, title: t("ssrfTitle"), description: t("ssrfDesc") },
    { key: "headers", icon: FileLock2, title: t("headersTitle"), description: t("headersDesc") },
    { key: "rbac", icon: UserCog, title: t("rbacTitle"), description: t("rbacDesc") },
  ];

  return (
    <section id="security" className="scroll-mt-32 py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-14">
          <SectionLabel>{t("label")}</SectionLabel>
          <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium text-foreground leading-[1.1]">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{t("subtitle")}</p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-3xl overflow-hidden">
          {guarantees.map((guarantee) => {
            const Icon = guarantee.icon;

            return (
              <li
                key={guarantee.key}
                className="bg-card p-8 hover:bg-primary/[0.03] transition-colors"
              >
                <Icon className="w-6 h-6 text-primary mb-6" strokeWidth={1.5} />
                <h3 className="font-bold text-foreground">{guarantee.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {guarantee.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
