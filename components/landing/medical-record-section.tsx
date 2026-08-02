import { getTranslations } from "next-intl/server";
import { FileText, ShieldAlert, BookOpenCheck, type LucideIcon } from "lucide-react";
import { SectionLabel } from "@/components/landing/section-label";
import { DiagnosticPreviewCard } from "@/components/landing/diagnostic-preview-card";

interface MedicalRecordHighlight {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Section « Dossier & IA » : codage OMS (ICD-11 / ICF / ICHI), contrôle
 * d'interactions OpenFDA et carnet numérique partagé avec le patient.
 */
export async function MedicalRecordSection() {
  const t = await getTranslations("landing.medicalRecord");

  const highlights: MedicalRecordHighlight[] = [
    { key: "icd", icon: FileText, title: t("icdTitle"), description: t("icdDesc") },
    { key: "fda", icon: ShieldAlert, title: t("fdaTitle"), description: t("fdaDesc") },
    { key: "carnet", icon: BookOpenCheck, title: t("carnetTitle"), description: t("carnetDesc") },
  ];

  return (
    <section
      id="medical-record"
      className="scroll-mt-32 py-28 lg:py-32 border-y border-border bg-muted/20 relative overflow-hidden"
    >
      <div
        className="absolute -left-40 top-1/4 w-[520px] h-[520px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-6">
            <SectionLabel>{t("label")}</SectionLabel>
            <h2 className="mt-6 text-4xl md:text-5xl font-cormorant font-medium text-foreground leading-[1.1]">
              {t("title")}
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{t("subtitle")}</p>

            <ul className="mt-10 space-y-7">
              {highlights.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <li key={highlight.key} className="flex items-start gap-5">
                    <div className="w-11 h-11 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{highlight.title}</h3>
                      <p className="mt-1 text-muted-foreground leading-relaxed">
                        {highlight.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-6 fade-in-up" style={{ animationDelay: "0.15s" }}>
            <DiagnosticPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
