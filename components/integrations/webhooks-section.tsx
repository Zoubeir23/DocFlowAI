"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listWebhooks, createWebhook, deleteWebhook, toggleWebhook, testWebhook,
  regenerateWebhookSecret, type WebhookRecord, type WebhookEvent,
} from "@/actions/webhooks";
import { WEBHOOK_EVENTS } from "@/lib/webhook-events";
import {
  Webhook, Plus, Trash2, EyeOff, Loader2, ToggleLeft, ToggleRight,
  AlertTriangle, Send, RotateCcw, CheckCircle2, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CopyButton } from "./copy-button";

export function WebhooksSection() {
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
