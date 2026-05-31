"use client";

import { useState, useTransition, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listWebhooks, createWebhook, deleteWebhook, toggleWebhook, testWebhook,
  regenerateWebhookSecret, type WebhookRecord, type WebhookEvent,
} from "@/actions/webhooks";
import { WEBHOOK_EVENTS } from "@/lib/webhook-events";
import {
  listApiKeys, createApiKey, revokeApiKey, type ApiKeyRecord,
} from "@/actions/api-keys";
import {
  Plug, Webhook, Code2, Zap, RefreshCw, Plus, Trash2, Eye, EyeOff,
  Copy, Check, Loader2, ToggleLeft, ToggleRight, AlertTriangle, Crown,
  Lock, ChevronRight, Send, RotateCcw, ExternalLink, CheckCircle2,
  Key, Bot, Calendar, Bell, FileText, Users, MessageSquare, Sparkles,
  HelpCircle, ChevronDown, ChevronUp, Stethoscope, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useQuery as useRQQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function usePlan() {
  return useRQQuery({
    queryKey: ["integrations-plan"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = createClient() as any;
      const { data: { user } } = await db.auth.getUser();
      if (!user) return "free";
      const { data: userData } = await db.from("users").select("clinic_id, role").eq("id", user.id).maybeSingle();
      if (!userData) return "free";
      if (userData.role === "super_admin") return "enterprise";
      if (!userData.clinic_id) return "free";
      const { data: sub } = await db.from("subscriptions").select("plan").eq("clinic_id", userData.clinic_id).maybeSingle();
      return (sub?.plan as string) ?? "free";
    },
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-muted transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

// ─── EXPLICATION MÉDECIN ───────────────────────────────────────────────────────

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

function MedicalUseCasesSection() {
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

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "C'est quoi un webhook ?",
    answer: "Un webhook, c'est comme un \"signal d'alerte\" que DocFlow envoie à un autre logiciel dès qu'il se passe quelque chose (nouveau rendez-vous, annulation, etc.). L'autre logiciel reçoit ce signal et peut agir en conséquence — par exemple, envoyer un SMS à votre secrétaire.",
  },
  {
    question: "C'est quoi une clé API ?",
    answer: "Une clé API, c'est un mot de passe spécial qui permet à un autre logiciel de se connecter à DocFlow en votre nom. Comme une carte d'accès : seul le logiciel qui possède la clé peut lire ou écrire dans vos données.",
  },
  {
    question: "C'est quoi MCP / Claude Desktop ?",
    answer: "MCP (Model Context Protocol) est une technologie qui connecte DocFlow à Claude Desktop, l'assistant IA d'Anthropic. Une fois configuré, vous pouvez parler à Claude en langage naturel et il accède directement à vos données DocFlow pour vous répondre.",
  },
  {
    question: "Je ne suis pas informaticien. Par où commencer ?",
    answer: "Commencez par l'intégration MCP avec Claude Desktop — c'est la plus simple, aucun code requis. Ensuite, si vous voulez automatiser des tâches (agenda, notifications), utilisez Zapier ou Make avec les webhooks. Ces deux plateformes proposent des tutoriels visuels sans code.",
  },
  {
    question: "Est-ce que mes données patients sont sécurisées ?",
    answer: "Oui. Chaque webhook est signé avec une clé secrète unique, et chaque clé API peut être révoquée à tout moment. Toutes les communications passent par HTTPS. Vous contrôlez exactement quelles données sont partagées et avec qui.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">Questions fréquentes</h3>
      </div>
      <div className="space-y-2">
        {FAQ_ITEMS.map((item, index) => (
          <div key={index} className="border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <p className="text-xs font-semibold text-foreground">{item.question}</p>
              {openIndex === index
                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GUIDE DÉMARRAGE RAPIDE ───────────────────────────────────────────────────

function QuickStartGuideSection() {
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

// ─── WEBHOOKS SECTION ────────────────────────────────────────────────────────

function WebhooksSection() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: hooks = [], isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: listWebhooks,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["webhooks"] });

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createWebhook({ name: newName, url: newUrl, events: selectedEvents });
      if (result.success && result.data) {
        toast.success("Webhook créé");
        setRevealedSecrets((prev) => ({ ...prev, [result.data!.id]: result.data!.secret }));
        setNewName(""); setNewUrl(""); setSelectedEvents([]);
        setShowCreateForm(false);
        invalidate();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteWebhook(id);
      if (result.success) { toast.success("Supprimé"); invalidate(); }
      else toast.error(result.error ?? "Erreur");
    });
  };

  const handleToggle = (hook: WebhookRecord) => {
    startTransition(async () => {
      await toggleWebhook(hook.id, !hook.is_active);
      invalidate();
    });
  };

  const handleTest = (id: string) => {
    setTestingId(id);
    startTransition(async () => {
      const result = await testWebhook(id);
      if (result.success) toast.success("Payload test envoyé");
      else toast.error(result.error ?? "Échec du test");
      setTestingId(null);
      invalidate();
    });
  };

  const handleRegenSecret = (id: string) => {
    startTransition(async () => {
      const result = await regenerateWebhookSecret(id);
      if (result.success && result.data) {
        setRevealedSecrets((prev) => ({ ...prev, [id]: result.data!.secret }));
        toast.success("Secret régénéré — copiez-le maintenant");
      } else toast.error(result.error ?? "Erreur");
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Webhooks</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            DocFlow envoie un signal automatique à l&apos;URL de votre choix à chaque événement (rendez-vous créé, annulé, etc.).
            Utilisez ces signaux avec <strong>Zapier</strong> ou <strong>Make</strong> pour déclencher n&apos;importe quelle action.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateForm(true)} className="btn-primary rounded-xl gap-1.5 text-xs flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> Nouveau
        </Button>
      </div>

      {/* Reminder box for non-technical users */}
      <div className="flex items-start gap-2 p-3 bg-muted/40 border border-border rounded-xl">
        <ClipboardList className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Comment ça marche :</strong> Créez un webhook ici, copiez son URL, puis collez-la dans Zapier (déclencheur &quot;Catch Hook&quot;) ou Make (déclencheur &quot;Custom Webhook&quot;). DocFlow enverra automatiquement les données à chaque événement sélectionné.
        </p>
      </div>

      {showCreateForm && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-4">
          <p className="text-sm font-semibold text-foreground">Créer un webhook</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nom</Label>
              <Input placeholder="Ex : Sync Google Calendar" value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL de destination (HTTPS requis)</Label>
              <Input placeholder="https://hooks.zapier.com/hooks/catch/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="rounded-xl text-sm" />
              <p className="text-[10px] text-muted-foreground">Copiez cette URL depuis Zapier ou Make</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Événements à surveiller</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <button
                  key={ev.value}
                  type="button"
                  onClick={() => toggleEvent(ev.value)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all",
                    selectedEvents.includes(ev.value)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {selectedEvents.includes(ev.value)
                    ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex-shrink-0" />}
                  <div>
                    <p className="text-[11px] font-bold">{ev.label}</p>
                    <p className="text-[10px] opacity-70">{ev.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!newName || !newUrl || !selectedEvents.length || isPending} className="btn-primary rounded-xl text-xs" size="sm">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Créer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="rounded-xl text-xs">Annuler</Button>
          </div>
        </div>
      )}

      {hooks.length === 0 && !showCreateForm && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Webhook className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aucun webhook configuré</p>
          <p className="text-xs text-muted-foreground max-w-xs">Créez votre premier webhook pour commencer à connecter DocFlow à vos outils.</p>
        </div>
      )}

      <div className="space-y-3">
        {hooks.map((hook) => (
          <div key={hook.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", hook.is_active ? "bg-emerald-500/10" : "bg-muted")}>
                <Webhook className={cn("w-4 h-4", hook.is_active ? "text-emerald-600" : "text-muted-foreground")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{hook.name}</p>
                <p className="text-xs text-muted-foreground truncate">{hook.url}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hook.failure_count >= 5 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" />{hook.failure_count} échecs
                  </span>
                )}
                {hook.last_status_code !== null && (
                  <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border",
                    hook.last_status_code >= 200 && hook.last_status_code < 300
                      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                      : "text-destructive bg-destructive/10 border-destructive/20"
                  )}>
                    {hook.last_status_code}
                  </span>
                )}
                <button onClick={() => handleToggle(hook)} disabled={isPending} className="text-muted-foreground hover:text-foreground transition-colors" title={hook.is_active ? "Désactiver" : "Activer"}>
                  {hook.is_active
                    ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                    : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleTest(hook.id)}
                  disabled={isPending || testingId === hook.id}
                  title="Envoyer un payload de test pour vérifier que la connexion fonctionne"
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {testingId === hook.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(hook.id)} disabled={isPending} className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Supprimer ce webhook">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {hook.events.map((ev) => (
                  <span key={ev} className="text-[10px] font-mono font-bold px-2 py-0.5 bg-muted border border-border rounded-md text-muted-foreground">
                    {ev}
                  </span>
                ))}
              </div>

              {revealedSecrets[hook.id] ? (
                <div className="flex items-center gap-2 p-2 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                  <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 flex-1 truncate">{revealedSecrets[hook.id]}</p>
                  <CopyButton value={revealedSecrets[hook.id]} />
                  <button onClick={() => setRevealedSecrets((prev) => { const next = { ...prev }; delete next[hook.id]; return next; })} className="p-1 rounded hover:bg-muted transition-colors">
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button onClick={() => handleRegenSecret(hook.id)} disabled={isPending} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors" title="Régénérer le secret de sécurité de ce webhook">
                  <RotateCcw className="w-3 h-3" /> Régénérer le secret de sécurité
                </button>
              )}

              {hook.last_triggered_at && (
                <p className="text-[10px] text-muted-foreground">
                  Dernier appel : {format(new Date(hook.last_triggered_at), "d MMM yyyy à HH:mm", { locale: fr })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Signature verification doc */}
      <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-2">
        <p className="text-xs font-bold text-foreground">Vérification de signature (pour développeurs)</p>
        <p className="text-[11px] text-muted-foreground">
          Pour sécuriser votre webhook côté serveur, vérifiez que chaque requête vient bien de DocFlow en validant le header <code className="font-mono bg-muted px-1 py-0.5 rounded">X-DocFlow-Signature: sha256=&lt;hmac&gt;</code> avec votre secret.
        </p>
        <pre className="text-[10px] font-mono text-muted-foreground bg-muted p-3 rounded-xl overflow-auto">{`const crypto = require('crypto');
function verify(secret, payload, signature) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload).digest('hex');
  return expected === signature;
}`}</pre>
      </div>
    </div>
  );
}

// ─── API KEYS SECTION ─────────────────────────────────────────────────────────

function ApiKeysSection({ onKeyGenerated }: { onKeyGenerated?: (rawKey: string) => void }) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ id: string; key: string } | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: listApiKeys,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["api-keys"] });

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createApiKey(newKeyName);
      if (result.success && result.data) {
        setRevealedKey({ id: result.data.id, key: result.data.rawKey });
        onKeyGenerated?.(result.data.rawKey);
        setNewKeyName("");
        setShowCreateForm(false);
        invalidate();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  const handleRevoke = (id: string) => {
    startTransition(async () => {
      const result = await revokeApiKey(id);
      if (result.success) { toast.success("Clé révoquée"); invalidate(); }
      else toast.error(result.error ?? "Erreur");
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Clés API</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Une clé API est un mot de passe unique qui permet à un logiciel externe de se connecter à DocFlow en votre nom.
            Créez une clé par logiciel connecté — si vous suspectez une fuite, révoquez-la immédiatement.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateForm(true)} className="btn-primary rounded-xl gap-1.5 text-xs flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> Générer
        </Button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong>Important :</strong> Une clé API n&apos;est affichée qu&apos;une seule fois à sa création. Copiez-la immédiatement et conservez-la dans un endroit sûr. Si vous la perdez, supprimez-la et créez-en une nouvelle.
        </p>
      </div>

      {revealedKey && (
        <div className="p-4 bg-amber-500/8 border border-amber-500/30 rounded-2xl space-y-2">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Copiez cette clé maintenant — elle ne sera plus affichée.</p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-foreground flex-1 bg-muted px-3 py-2 rounded-xl break-all">{revealedKey.key}</code>
            <CopyButton value={revealedKey.key} />
          </div>
          <button onClick={() => setRevealedKey(null)} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            J&apos;ai copié ma clé
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-foreground">Nouvelle clé API</p>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nom (pour vous rappeler à quoi elle sert)</Label>
            <Input
              placeholder="Ex : Connexion Mediboard, Zapier Production"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="rounded-xl text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!newKeyName.trim() || isPending} className="btn-primary rounded-xl text-xs" size="sm">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />} Générer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="rounded-xl text-xs">Annuler</Button>
          </div>
        </div>
      )}

      {keys.length === 0 && !showCreateForm && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Key className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aucune clé API générée</p>
          <p className="text-xs text-muted-foreground max-w-xs">Générez une clé pour connecter DocFlow à un logiciel médical ou à l&apos;assistant MCP.</p>
        </div>
      )}

      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className={cn("flex items-center gap-3 p-3 rounded-xl border", k.is_active ? "bg-card border-border" : "bg-muted/30 border-border opacity-60")}>
            <Key className={cn("w-4 h-4 flex-shrink-0", k.is_active ? "text-primary" : "text-muted-foreground")} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{k.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <code className="text-[10px] font-mono text-muted-foreground">{k.key_prefix}••••••••</code>
                {k.last_used_at && (
                  <span className="text-[10px] text-muted-foreground">
                    Dernière utilisation : {format(new Date(k.last_used_at), "d MMM yyyy", { locale: fr })}
                  </span>
                )}
              </div>
            </div>
            {k.is_active && (
              <Button variant="outline" size="sm" onClick={() => handleRevoke(k.id)} disabled={isPending} className="rounded-xl text-xs text-destructive border-destructive/20 hover:bg-destructive/10 flex-shrink-0 gap-1" title="Révoquer cette clé — elle ne fonctionnera plus immédiatement">
                <Trash2 className="w-3 h-3" /> Révoquer
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* API reference */}
      <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-2">
        <p className="text-xs font-bold text-foreground">Référence API (pour développeurs)</p>
        <p className="text-[11px] text-muted-foreground">
          Transmettez votre clé à votre prestataire informatique pour qu&apos;il intègre DocFlow à votre DPI.
          L&apos;authentification se fait via le header <code className="font-mono bg-muted px-1 py-0.5 rounded">Authorization: Bearer dfk_...</code>
        </p>
        <div className="space-y-1.5">
          {[
            { method: "GET", path: "/api/v1/appointments", desc: "Lister les rendez-vous" },
            { method: "POST", path: "/api/v1/appointments", desc: "Créer un rendez-vous" },
            { method: "GET", path: "/api/v1/patients", desc: "Lister les patients" },
          ].map((endpoint) => (
            <div key={`${endpoint.method}-${endpoint.path}`} className="flex items-center gap-2">
              <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                endpoint.method === "GET" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              )}>
                {endpoint.method}
              </span>
              <code className="text-[10px] font-mono text-muted-foreground">{endpoint.path}</code>
              <span className="text-[10px] text-muted-foreground">— {endpoint.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MCP SECTION ──────────────────────────────────────────────────────────────

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

function McpSection({ lastRawKey }: { lastRawKey: string | null }) {
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

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
