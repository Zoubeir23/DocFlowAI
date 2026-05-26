"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { clinicTemplates } from "@/data/clinic-templates";
import { Globe, Sparkles, Palette, Type, Layers } from "lucide-react";
import { toast } from "sonner";
import { initializeClinicWebsite } from "@/actions/website";

export function TemplatePicker({ onComplete }: { onComplete: (website: any) => void }) {
  const t = useTranslations("websiteBuilder");
  const [isCreating, setIsCreating] = useState(false);

  const template = clinicTemplates[0];

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const res = await initializeClinicWebsite(template.id);
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
    <div className="p-8 max-w-[800px] mx-auto space-y-10 animate-in fade-in-0 duration-300">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t("createTitle")}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Votre site sera créé avec notre design éditorial. Vous pourrez personnaliser les couleurs, textes et images depuis l'éditeur.
        </p>
      </div>

      {/* Template preview card */}
      <div className="rounded-3xl border-2 border-primary overflow-hidden shadow-xl ring-4 ring-primary/10">
        {/* Image */}
        <div className="aspect-[16/7] w-full overflow-hidden relative">
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
          />
          {/* Overlay showing the design aesthetic */}
          <div className="absolute inset-0 flex items-end p-6" style={{ background: "linear-gradient(to top, rgba(26,26,46,0.8), transparent)" }}>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2" style={{ backgroundColor: "#FF2D78", color: "#fff" }}>
                {template.category}
              </span>
              <h2 className="text-2xl font-bold text-white">{template.name}</h2>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 space-y-5 bg-background">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {template.description}
          </p>

          {/* Design features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: Palette,
                title: "Palette ORACARE",
                desc: "Crème · Rose vif · Teal",
              },
              {
                icon: Type,
                title: "Typographie éditoriale",
                desc: "Bebas Neue + Playfair Display",
              },
              {
                icon: Layers,
                title: "Layout asymétrique",
                desc: "Cartes flottantes, overlays",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
