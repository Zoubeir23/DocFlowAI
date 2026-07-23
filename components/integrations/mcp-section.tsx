"use client";

import { useState, useEffect } from "react";
import { Bot, Check, Copy, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const MCP_TOOLS = [
  { name: "get_today_appointments", desc: "Rendez-vous du jour", example: "\"Quels patients ai-je cet après-midi ?\"" },
  { name: "list_appointments", desc: "Lister les rendez-vous (+ filtre statut)", example: "\"Mes rendez-vous annulés cette semaine\"" },
  { name: "list_patients", desc: "Lister / rechercher les patients", example: "\"Trouve la fiche de Mohamed Diallo\"" },
  { name: "get_dashboard_stats", desc: "Statistiques du cabinet", example: "\"Combien de consultations ce mois ?\"" },
  { name: "create_appointment", desc: "Créer un rendez-vous", example: "\"Prends un RDV pour Fatima demain à 14h\"" },
  { name: "list_services", desc: "Lister les services actifs", example: "\"Quels services propose mon cabinet ?\"" },
];

const OS_CONFIG_PATHS = [
  { os: "macOS", path: "~/Library/Application Support/Claude/claude_desktop_config.json" },
  { os: "Windows", path: "%APPDATA%\\Claude\\claude_desktop_config.json" },
  { os: "Linux", path: "~/.config/Claude/claude_desktop_config.json" },
];

export function McpSection({ lastRawKey }: { lastRawKey: string | null }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState("https://your-app.vercel.app");

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const displayKey = lastRawKey ?? "dfk_VOTRE_CLE_API";
  const isKeyReady = !!lastRawKey;

  const mcpConfig = JSON.stringify({
    mcpServers: {
      docflow: {
        url: `${appUrl}/api/mcp`,
        headers: { "x-api-key": displayKey },
      },
    },
  }, null, 2);

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-foreground">Assistant IA — Claude Desktop</h3>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Gratuit
        </span>
      </div>

      <div className="p-5 space-y-6">

        {/* Plain language intro */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
          <p className="text-xs font-bold text-foreground">En quoi ça consiste ?</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Une fois configuré, vous ouvrez <strong className="text-foreground">Claude Desktop</strong> sur votre ordinateur et vous lui parlez comme à un assistant.
            Claude a accès à votre cabinet DocFlow en temps réel et peut répondre à vos questions ou effectuer des actions — le tout en langage naturel, sans interface à apprendre.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            {[
              { quote: "\"Qui est mon prochain patient ?\"", response: "Dr, votre prochain RDV est M. Alioune Sall à 14h30 pour une consultation générale." },
              { quote: "\"Annule le RDV de demain matin\"", response: "J'ai annulé le rendez-vous de Mme Traoré prévu demain à 9h." },
              { quote: "\"Combien de patients cette semaine ?\"", response: "Vous avez eu 23 consultations cette semaine, dont 3 annulées." },
            ].map((item) => (
              <div key={item.quote} className="p-2.5 bg-muted/40 rounded-xl border border-border space-y-1.5">
                <p className="text-[10px] font-semibold text-primary">{item.quote}</p>
                <p className="text-[10px] text-muted-foreground italic leading-relaxed">{item.response}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Available tools */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Ce que Claude peut faire avec votre cabinet</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MCP_TOOLS.map((tool) => (
              <div key={tool.name} className="flex items-start gap-2 p-2.5 bg-muted/40 rounded-xl border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{tool.desc}</p>
                  <p className="text-[10px] text-muted-foreground italic mt-0.5">{tool.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Configuration en 4 étapes (5 minutes)</p>
          <ol className="space-y-2">
            {[
              {
                label: "Téléchargez Claude Desktop",
                detail: "Disponible gratuitement sur claude.ai/download pour Mac et Windows.",
                link: null,
              },
              {
                label: "Générez une clé API DocFlow",
                detail: isKeyReady
                  ? "Clé prête — la configuration ci-dessous est déjà remplie avec votre clé."
                  : "Dans la section \"Clés API\" ci-dessus (plan Entreprise), cliquez \"Générer\" et donnez-lui un nom. Revenez ici — la config se met à jour automatiquement.",
                link: null,
              },
              {
                label: "Ouvrez le fichier de configuration Claude Desktop",
                detail: "Dans Claude Desktop : menu Fichier → Paramètres → Développeur → Modifier la config. Ou naviguez directement au chemin indiqué ci-dessous selon votre système.",
                link: null,
              },
              {
                label: "Collez la configuration JSON et redémarrez",
                detail: "Copiez le bloc JSON ci-dessous, collez-le dans le fichier, sauvegardez, puis redémarrez Claude Desktop. L'outil \"docflow\" apparaît dans la barre d'outils.",
                link: null,
              },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center mt-0.5 border",
                  i === 1 && isKeyReady
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-primary/10 border-primary/20 text-primary"
                )}>
                  {i === 1 && isKeyReady ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{step.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* OS paths */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Emplacement du fichier de configuration</p>
          <div className="space-y-1.5">
            {OS_CONFIG_PATHS.map(({ os, path }) => (
              <div key={os} className="flex items-center justify-between gap-3 px-3 py-2 bg-muted/40 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-14">{os}</span>
                  <code className="text-[10px] font-mono text-foreground">{path}</code>
                </div>
                <button onClick={() => copy(path, `path-${os}`)} className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0" title="Copier le chemin">
                  {copiedKey === `path-${os}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Config JSON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Configuration à coller <span className="font-normal normal-case tracking-normal text-muted-foreground">(claude_desktop_config.json)</span>
              </p>
              {isKeyReady && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Votre clé API est incluse — prête à coller
                </p>
              )}
            </div>
            <button
              onClick={() => copy(mcpConfig, "config")}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {copiedKey === "config" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === "config" ? "Copié !" : "Copier tout"}
            </button>
          </div>

          <pre className={cn(
            "text-xs rounded-xl p-4 overflow-x-auto font-mono leading-relaxed border",
            isKeyReady
              ? "bg-[#0f1117] text-[#e2e8f0] border-emerald-500/30"
              : "bg-[#0f1117] text-[#e2e8f0] border-border"
          )}>
            {mcpConfig}
          </pre>

          {!isKeyReady && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Générez une clé API dans la section ci-dessus, puis revenez ici — la configuration se met à jour automatiquement avec votre vraie clé.
            </p>
          )}
        </div>

        {/* Endpoint */}
        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
          <div>
            <p className="text-xs font-semibold text-foreground">Endpoint MCP</p>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{appUrl}/api/mcp</p>
          </div>
          <button
            onClick={() => copy(`${appUrl}/api/mcp`, "url")}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Copier l'URL"
          >
            {copiedKey === "url" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <a
          href="https://modelcontextprotocol.io/quickstart/user"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
        >
          Documentation MCP officielle <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
