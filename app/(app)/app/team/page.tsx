"use client";

import { useState, useEffect, useTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTeamMembers,
  listPendingInvitations,
  inviteTeamMember,
  cancelInvitation,
  removeTeamMember,
  getMyRole,
  type TeamMember,
  type StaffInvitation,
  type StaffRole,
} from "@/actions/team";
import { getClinicQuotaUsage } from "@/actions/quota";
import {
  Users, UserPlus, Mail, Trash2, X, Crown, AlertTriangle,
  Loader2, Send, ShieldCheck, UserCog, Lock, ChevronRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  receptionist: "Réceptionniste",
  assistant: "Assistant(e)",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  owner: Crown,
  receptionist: UserCog,
  assistant: ShieldCheck,
};

function RoleBadge({ role }: { role: string }) {
  const Icon = ROLE_ICONS[role] ?? Users;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
      role === "owner"
        ? "bg-primary/10 border-primary/20 text-primary"
        : "bg-muted border-border text-muted-foreground"
    )}>
      <Icon className="w-3 h-3" />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function InviteModal({
  onClose,
  onSuccess,
  disabled,
}: {
  onClose: () => void;
  onSuccess: () => void;
  disabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("receptionist");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteTeamMember(email.trim(), role);
      if (result.success) {
        toast.success("Invitation envoyée !");
        onSuccess();
        onClose();
      } else {
        setError(result.error ?? "Erreur inconnue");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Inviter un membre</h2>
              <p className="text-xs text-muted-foreground">Un email d'invitation sera envoyé</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Email</Label>
            <Input
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Rôle</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["receptionist", "assistant"] as StaffRole[]).map((r) => {
                const Icon = ROLE_ICONS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all",
                      role === r
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {ROLE_LABELS[r]}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || disabled} className="flex-1 btn-primary">
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Envoyer</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["team-members"],
    queryFn: listTeamMembers,
  });

  const { data: invitations = [], isLoading: loadingInvites } = useQuery({
    queryKey: ["team-invitations"],
    queryFn: listPendingInvitations,
  });

  const { data: quotaUsage } = useQuery({
    queryKey: ["quotaUsage"],
    queryFn: getClinicQuotaUsage,
  });

  const { data: myRole } = useQuery({
    queryKey: ["my-role"],
    queryFn: getMyRole,
  });

  const staffQuota = quotaUsage?.staff;
  const isQuotaFull = staffQuota?.limit !== null && staffQuota != null && members.length >= (staffQuota.limit ?? Infinity);
  const quotaPct = staffQuota?.limit ? (members.length / staffQuota.limit) * 100 : 0;

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return;
    setRemovingId(memberId);
    const result = await removeTeamMember(memberId);
    setRemovingId(null);
    if (result.success) {
      toast.success("Membre retiré");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["quotaUsage"] });
    } else {
      toast.error(result.error ?? "Erreur");
    }
  };

  const handleCancelInvite = async (id: string) => {
    setCancellingId(id);
    const result = await cancelInvitation(id);
    setCancellingId(null);
    if (result.success) {
      toast.success("Invitation annulée");
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
    } else {
      toast.error(result.error ?? "Erreur");
    }
  };

  const isOwner = myRole?.role === "owner" || myRole?.role === "super_admin";
  const currentPlan = staffQuota?.plan ?? "free";
  const isFreePlan = currentPlan === "free";

  return (
    <div className="page-container max-w-4xl">
      <div className="section-header">
        <div className="icon-container">
          <Users className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h2 className="section-title">Équipe</h2>
          <p className="section-subtitle">Gérez les membres de votre cabinet</p>
        </div>
        {isOwner && !isFreePlan && (
          <Button
            onClick={() => setShowInviteModal(true)}
            disabled={isQuotaFull}
            className="btn-primary"
            title={isQuotaFull ? "Limite de comptes atteinte — passez à un plan supérieur" : undefined}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter un membre
          </Button>
        )}
      </div>

      {/* Free plan upgrade wall */}
      {isFreePlan && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 overflow-hidden">
          <div className="flex items-start gap-4 p-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground mb-1">Gestion d&apos;équipe non disponible sur le plan gratuit</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pour inviter des réceptionnistes ou assistants dans votre cabinet, passez à un plan payant.
                Chaque membre de l&apos;équipe a accès au tableau de bord selon son rôle.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { plan: "Starter", staff: "3 membres", color: "text-blue-600", bg: "bg-blue-500/8 border-blue-500/20" },
                  { plan: "Professionnel", staff: "10 membres", color: "text-violet-600", bg: "bg-violet-500/8 border-violet-500/20" },
                  { plan: "Entreprise", staff: "Illimité", color: "text-emerald-600", bg: "bg-emerald-500/8 border-emerald-500/20" },
                ].map((tier) => (
                  <div key={tier.plan} className={`rounded-xl border p-3 ${tier.bg}`}>
                    <p className={`text-xs font-bold ${tier.color}`}>{tier.plan}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{tier.staff}</p>
                  </div>
                ))}
              </div>
              <Link href="/app/billing">
                <Button className="btn-primary gap-2">
                  <Sparkles className="w-4 h-4" />
                  Voir les plans
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quota bar — hidden on free (upgrade wall already explains the situation) */}
      {!isFreePlan && staffQuota && staffQuota.limit !== null && (
        <div className={cn(
          "rounded-xl border p-4 flex items-center gap-4",
          isQuotaFull
            ? "bg-destructive/8 border-destructive/20"
            : quotaPct >= 80
              ? "bg-amber-500/8 border-amber-500/20"
              : "bg-muted/50 border-border"
        )}>
          {isQuotaFull || quotaPct >= 80
            ? <AlertTriangle className={cn("w-4 h-4 flex-shrink-0", isQuotaFull ? "text-destructive" : "text-amber-500")} />
            : <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-foreground">
                {members.length} / {staffQuota.limit} comptes utilisés
              </span>
              {isQuotaFull && (
                <a href="/app/billing" className="text-xs font-bold text-primary hover:underline">
                  Passer à un plan supérieur →
                </a>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isQuotaFull ? "bg-destructive" : quotaPct >= 80 ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(quotaPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active members + pending invitations — only shown on paid plans */}
      {!isFreePlan && (
        <>
          <div className="card-panel">
            <div className="card-panel-header">
              <h3 className="font-bold text-foreground">Membres actifs</h3>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {members.length}
              </span>
            </div>
            <div className="divide-y divide-border">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Aucun membre</div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {member.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <RoleBadge role={member.role} />
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(member.created_at), "d MMM yyyy", { locale: fr })}
                    </p>
                    {member.role !== "owner" && isOwner && (
                      <button
                        onClick={() => handleRemove(member.id, member.full_name)}
                        disabled={removingId === member.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Retirer"
                      >
                        {removingId === member.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {isOwner && (
            <div className="card-panel">
              <div className="card-panel-header">
                <h3 className="font-bold text-foreground">Invitations en attente</h3>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {invitations.length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {loadingInvites ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-10">
                    <Mail className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune invitation en attente</p>
                  </div>
                ) : (
                  invitations.map((invite) => {
                    const isExpired = new Date(invite.expires_at) < new Date();
                    return (
                      <div key={invite.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[invite.role]} · expire {format(new Date(invite.expires_at), "d MMM", { locale: fr })}
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full border",
                          isExpired
                            ? "bg-destructive/10 border-destructive/20 text-destructive"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                        )}>
                          {isExpired ? "Expirée" : "En attente"}
                        </span>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={cancellingId === invite.id}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Annuler"
                        >
                          {cancellingId === invite.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <X className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
            queryClient.invalidateQueries({ queryKey: ["quotaUsage"] });
          }}
          disabled={isQuotaFull}
        />
      )}
    </div>
  );
}
