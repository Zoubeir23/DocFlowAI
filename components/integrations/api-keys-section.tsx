"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listApiKeys, createApiKey, revokeApiKey } from "@/actions/api-keys";
import { Key, Plus, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CopyButton } from "./copy-button";

export function ApiKeysSection({ onKeyGenerated }: { onKeyGenerated?: (rawKey: string) => void }) {
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
