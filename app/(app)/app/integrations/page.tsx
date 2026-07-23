"use client";

import { useState } from "react";
import {
  Plug, Webhook, Code2, Zap, Crown, Lock, ChevronRight, Key, Bot,
  CheckCircle2, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePlan } from "@/components/integrations/use-plan";
import { MedicalUseCasesSection } from "@/components/integrations/medical-use-cases-section";
import { QuickStartGuideSection } from "@/components/integrations/quick-start-guide-section";
import { WebhooksSection } from "@/components/integrations/webhooks-section";
import { ApiKeysSection } from "@/components/integrations/api-keys-section";
import { McpSection } from "@/components/integrations/mcp-section";
import { FaqSection } from "@/components/integrations/faq-section";

export default function IntegrationsPage() {
  const { data: plan = "free" } = usePlan();
  const isEnterprise = plan === "enterprise";
  const [lastRawKey, setLastRawKey] = useState<string | null>(null);

  return (
    <div className="page-container max-w-4xl space-y-8">

      {/* Header */}
      <div className="section-header">
        <div className="icon-container">
          <Plug className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h2 className="section-title">Intégrations</h2>
          <p className="section-subtitle">Connectez DocFlow à vos outils — agenda, logiciel médical, assistant IA et automatisations</p>
        </div>
        {isEnterprise && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl">
            <Crown className="w-3.5 h-3.5" /> Entreprise
          </span>
        )}
      </div>

      {/* Plan lock banner */}
      {!isEnterprise && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-muted/50 border border-border rounded-2xl">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Webhooks et API REST — Plan Entreprise</p>
              <p className="text-xs text-muted-foreground mt-0.5">L&apos;assistant IA (MCP) est disponible sur tous les plans gratuitement.</p>
            </div>
          </div>
          <Link href="/app/billing" className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            Voir les plans <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Use cases grid */}
      <MedicalUseCasesSection />

      {/* Quick start guide */}
      <QuickStartGuideSection />

      {/* Integration overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Webhook, label: "Webhooks", desc: "Signaux automatiques à chaque événement", color: "text-violet-600", bg: "bg-violet-500/10" },
          { icon: Code2, label: "API REST", desc: "Connexion à votre DPI / logiciel médical", color: "text-blue-600", bg: "bg-blue-500/10" },
          { icon: Zap, label: "Zapier / Make", desc: "Automatisations sans code", color: "text-amber-600", bg: "bg-amber-500/10" },
          { icon: Bot, label: "Claude Desktop", desc: "Assistant IA en langage naturel", color: "text-emerald-600", bg: "bg-emerald-500/10" },
        ].map((item) => (
          <div key={item.label} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border border-border text-center", isEnterprise || item.label === "Claude Desktop" ? "bg-card" : "bg-muted/30 opacity-60")}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg)}>
              <item.icon className={cn("w-5 h-5", item.color)} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            {(isEnterprise || item.label === "Claude Desktop") && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
        ))}
      </div>

      {isEnterprise && (
        <>
          {/* Zapier guide */}
          <div className="flex items-start gap-4 p-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Zapier & Make — Automatisations sans code</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Ces plateformes permettent de connecter DocFlow à des centaines d&apos;applications sans écrire une seule ligne de code.
                <strong className="text-foreground"> Exemple :</strong> à chaque nouveau rendez-vous DocFlow → ajouter automatiquement une entrée dans Google Calendar, envoyer un SMS au patient, ou créer une tâche dans Notion.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong className="text-foreground">Comment faire :</strong> Créez un webhook DocFlow ci-dessous → copiez son URL → dans Zapier choisissez &quot;Webhook → Catch Hook&quot; et collez l&apos;URL.
              </p>
              <div className="flex gap-2 mt-2">
                <a href="https://zapier.com/apps/webhook/integrations" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
                  Guide Zapier <ExternalLink className="w-3 h-3" />
                </a>
                <a href="https://www.make.com/en/help/tools/webhooks" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
                  Guide Make <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Webhooks */}
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-violet-600" />
                  <h3 className="font-bold text-foreground">Webhooks</h3>
                </div>
              </div>
              <div className="p-5">
                <WebhooksSection />
              </div>
            </div>

            {/* API Keys */}
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-foreground">Clés API</h3>
                </div>
              </div>
              <div className="p-5">
                <ApiKeysSection onKeyGenerated={setLastRawKey} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* MCP — visible pour tous les plans */}
      <McpSection lastRawKey={lastRawKey} />

      {/* FAQ */}
      <FaqSection />
    </div>
  );
}
