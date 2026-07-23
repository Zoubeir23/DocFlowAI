import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickStartGuideSection() {
  return (
    <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold text-foreground">Guide de démarrage — Pour les médecins non-techniciens</p>
      </div>
      <div className="space-y-3">
        {[
          {
            step: "1",
            title: "Configurez Claude Desktop (5 min)",
            detail: "Dans la section MCP ci-dessous, générez une clé API, copiez la configuration JSON, et collez-la dans Claude Desktop. Vous pourrez ensuite parler à votre cabinet en langage naturel.",
            tag: "Recommandé en premier",
            tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
          },
          {
            step: "2",
            title: "Créez un compte Zapier gratuit",
            detail: "Zapier permet de connecter DocFlow à des centaines d'applications (Google Calendar, Slack, Gmail...) sans une seule ligne de code. Créez un webhook DocFlow, puis utilisez-le comme déclencheur dans Zapier.",
            tag: "Sans code",
            tagColor: "text-blue-600 bg-blue-500/10 border-blue-500/20",
          },
          {
            step: "3",
            title: "Intégrez votre logiciel médical",
            detail: "Si vous utilisez un DPI (Mediboard, Axisanté, etc.), demandez à votre prestataire informatique de connecter l'API DocFlow. Transmettez-lui la documentation ci-dessous et votre clé API.",
            tag: "Nécessite un technicien",
            tagColor: "text-amber-600 bg-amber-500/10 border-amber-500/20",
          },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center mt-0.5">
              {item.step}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", item.tagColor)}>
                  {item.tag}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
