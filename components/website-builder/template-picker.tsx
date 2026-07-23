"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { clinicTemplates, type ClinicTemplate } from "@/data/clinic-templates";
import { Globe, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { initializeClinicWebsite } from "@/actions/website";
import { cn } from "@/lib/utils";

export function TemplatePicker({ onComplete }: { onComplete: (website: any) => void }) {
  const t = useTranslations("websiteBuilder");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(clinicTemplates[0].id);

  const selectedTemplate = clinicTemplates.find((tpl) => tpl.id === selectedId) ?? clinicTemplates[0];

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const res = await initializeClinicWebsite(selectedTemplate.id);
      if (res.success && res.data) {
        toast.success(t("toastSuccess"));
        onComplete(res.data);
      } else {
        throw new Error(res.error || t("toastError"));
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-[1100px] mx-auto space-y-10 animate-in fade-in-0 duration-300">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t("createTitle")}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Choisissez le design de votre site. Vous pourrez personnaliser les couleurs, textes et images depuis l&apos;éditeur.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {clinicTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={template.id === selectedId}
            onSelect={() => setSelectedId(template.id)}
          />
        ))}
      </div>

      {/* Create button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {isCreating ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {isCreating ? t("creating") : t("createButton")}
        </button>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: ClinicTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const { primary, background, style } = template.data.style_config;
  const badgeTextColor = style === "lumiere-privee" || style === "oracare-editorial" ? "#fff" : background;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "text-left rounded-3xl overflow-hidden border-2 transition-all duration-200 bg-background",
        selected ? "border-primary shadow-xl ring-4 ring-primary/10 -translate-y-1" : "border-border hover:border-primary/40 hover:-translate-y-0.5"
      )}
    >
      {/* Image */}
      <div className="aspect-[4/3] w-full overflow-hidden relative">
        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-end p-4" style={{ background: `linear-gradient(to top, ${background}cc, transparent)` }}>
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: primary, color: badgeTextColor }}
          >
            {template.category}
          </span>
        </div>
        {selected && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-2">
        <h3 className="font-bold text-base">{template.name}</h3>
        <p className="text-muted-foreground text-[13px] leading-relaxed line-clamp-3">{template.description}</p>
      </div>
    </button>
  );
}
