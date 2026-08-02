import { getTranslations } from "next-intl/server";
import { ShieldCheck, Stethoscope } from "lucide-react";

/**
 * Maquette statique de l'assistant diagnostic (codage ICD-11 + contrôle OpenFDA).
 * Uniquement des tokens de thème : carte blanche en clair, carte profonde en sombre.
 */
export async function DiagnosticPreviewCard() {
  const t = await getTranslations("landing.medicalRecord.mock");

  return (
    <div
      className="rounded-3xl bg-card border border-border p-7 shadow-xl shadow-primary/5"
      role="img"
      aria-label={`${t("label")} — ${t("diagnosisValue")}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-border">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("label")}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
          {t("badge")}
        </span>
      </div>

      <div className="py-6 space-y-3">
        <div className="p-4 rounded-2xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <Stethoscope className="w-3.5 h-3.5" />
            {t("diagnosisLabel")}
          </div>
          <div className="mt-2 font-cormorant text-2xl text-foreground">{t("diagnosisValue")}</div>
        </div>

        <div className="p-4 rounded-2xl bg-muted/50 border border-border">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              {t("prescriptionLabel")}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("safeBadge")}
            </span>
          </div>
          <div className="mt-2 font-cormorant text-2xl text-foreground">
            {t("prescriptionValue")}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-primary py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground">
        {t("action")}
      </div>
    </div>
  );
}
