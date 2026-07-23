import { Calendar, Bell, FileText, Users, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MEDICAL_USE_CASES = [
  {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    title: "Synchroniser votre agenda",
    description: "Chaque nouveau rendez-vous DocFlow apparaît automatiquement dans Google Calendar, Outlook ou votre agenda personnel. Fini la double saisie.",
    integration: "Zapier / Make",
    difficulty: "Facile",
  },
  {
    icon: Bell,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    title: "Alertes en temps réel",
    description: "Recevez une notification WhatsApp ou SMS dès qu'un patient annule un rendez-vous de dernière minute ou remplit sa fiche de pré-consultation.",
    integration: "Zapier / Make",
    difficulty: "Facile",
  },
  {
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    title: "Alimenter votre DPI",
    description: "Envoyez automatiquement les données de consultation (diagnostic, ordonnance) vers votre logiciel médical existant — Mediboard, Doctolib, Axisanté, etc.",
    integration: "API REST",
    difficulty: "Technique",
  },
  {
    icon: Users,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    title: "CRM & suivi patient",
    description: "Créez automatiquement une fiche patient dans votre CRM dès la première consultation, et mettez-la à jour après chaque visite.",
    integration: "Webhooks",
    difficulty: "Technique",
  },
  {
    icon: MessageSquare,
    color: "text-pink-600",
    bg: "bg-pink-500/10",
    title: "Notifications équipe",
    description: "Envoyez un message Slack ou Teams à votre secrétaire quand un patient arrive ou confirme son rendez-vous.",
    integration: "Zapier / Make",
    difficulty: "Facile",
  },
  {
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-500/10",
    title: "Assistant IA vocal",
    description: "Posez des questions à Claude Desktop en langage naturel : \"Quels patients ai-je cet après-midi ?\", \"Crée un rendez-vous pour Fatima demain à 15h\".",
    integration: "MCP Claude",
    difficulty: "Facile",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  "Facile": "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  "Technique": "text-amber-600 bg-amber-500/10 border-amber-500/20",
};

const INTEGRATION_COLORS: Record<string, string> = {
  "Zapier / Make": "text-amber-600 bg-amber-500/10 border-amber-500/20",
  "API REST": "text-blue-600 bg-blue-500/10 border-blue-500/20",
  "Webhooks": "text-violet-600 bg-violet-500/10 border-violet-500/20",
  "MCP Claude": "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
};

export function MedicalUseCasesSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">Ce que vous pouvez faire avec les intégrations</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Les intégrations permettent à DocFlow de communiquer avec les autres outils que vous utilisez au quotidien — sans avoir besoin de coder.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MEDICAL_USE_CASES.map((useCase) => (
          <div key={useCase.title} className="p-4 bg-card border border-border rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", useCase.bg)}>
                <useCase.icon className={cn("w-4 h-4", useCase.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{useCase.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{useCase.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", INTEGRATION_COLORS[useCase.integration])}>
                {useCase.integration}
              </span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", DIFFICULTY_COLORS[useCase.difficulty])}>
                {useCase.difficulty}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
