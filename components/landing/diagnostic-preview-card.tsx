import { getTranslations } from "next-intl/server";
import { ShieldCheck, Stethoscope } from "lucide-react";

/**
 * Maquette statique de l'assistant diagnostic (codage ICD-11 + contrôle OpenFDA).
 * Fond profond constant : la carte reste lisible en thème clair comme en sombre.
 */
export async function DiagnosticPreviewCard() {
  const t = await getTranslations("landing.medicalRecord.mock");

  return (
    <div
      className="rounded-3xl bg-[hsl(222_47%_8%)] border border-white/10 p-7 shadow-2xl"
      role="img"
      aria-label={`${t("label")} — ${t("diagnosisValue")}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
          {t("label")}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
          {t("badge")}
        </span>
      </div>

      <div className="py-6 space-y-3">
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-white/45">
            <Stethoscope className="w-3.5 h-3.5" />
            {t("diagnosisLabel")}
          </div>
          <div className="mt-2 font-cormorant text-2xl text-white">{t("diagnosisValue")}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/45">
              {t("prescriptionLabel")}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("safeBadge")}
            </span>
          </div>
          <div className="mt-2 font-cormorant text-2xl text-white">{t("prescriptionValue")}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-primary/90 py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground">
        {t("action")}
      </div>
    </div>
  );
}
