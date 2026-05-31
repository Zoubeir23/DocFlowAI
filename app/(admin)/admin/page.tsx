"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformStats, listAllClinics, listAllUsers,
  toggleUserActive, toggleClinicActive, updateClinicPlan, updateUserRole,
  listAdminMessages, updateMessageStatus, replyToMessage,
  listNewsletterCampaigns, sendNewsletter,
  listAllApiKeys, listAllWebhooks,
  type AdminClinicRow, type AdminUserRow, type AdminMessageRow,
  type NewsletterCampaignRow, type AdminApiKeyRow, type AdminWebhookRow,
} from "@/actions/super-admin";
import {
  ShieldCheck, Building2, Users, CalendarCheck, TrendingUp,
  Search, ToggleLeft, ToggleRight, Crown, Loader2,
  ChevronDown, ChevronLeft, RefreshCw, LogOut, Inbox, Send, Mail,
  MessageSquare, X, Check, Clock, CheckCheck, AlertCircle,
  ChevronRight, Megaphone, History, Plug, Key, Webhook,
  ExternalLink, AlertTriangle, LayoutDashboard, Link2, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslations } from "next-intl";

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted border-border text-muted-foreground",
  starter: "bg-blue-500/10 border-blue-500/20 text-blue-600",
  professional: "bg-violet-500/10 border-violet-500/20 text-violet-600",
  enterprise: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
};

const PLAN_OPTIONS = ["free", "starter", "professional", "enterprise"] as const;

const STATUS_CONFIG = {
  open: { label: "Ouvert", color: "bg-red-500/10 border-red-500/20 text-red-600", icon: AlertCircle },
  in_progress: { label: "En cours", color: "bg-amber-500/10 border-amber-500/20 text-amber-600", icon: Clock },
  closed: { label: "Fermé", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600", icon: CheckCheck },
};

const TYPE_CONFIG = {
  support: { label: "Support", color: "bg-blue-500/10 border-blue-500/20 text-blue-600" },
  enterprise: { label: "Enterprise", color: "bg-violet-500/10 border-violet-500/20 text-violet-600" },
};

const ROLE_OPTIONS = [
  { value: "owner", label: "Propriétaires (médecins)" },
  { value: "receptionist", label: "Réceptionnistes" },
  { value: "assistant", label: "Assistants" },
];

// ── Shared components ─────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Portal dropdown (fix overflow:hidden clipping) ────────────────────────────

function PortalDropdown({ anchorRef, open, onClose, width, children }: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  width: number;
  children: React.ReactNode;
}) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideAnchor = anchorRef.current?.contains(target) ?? false;
      const insidePanel = panelRef.current?.contains(target) ?? false;
      if (!insideAnchor && !insidePanel) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
      style={{ top: coords.top, left: coords.left, width }}
    >
      {children}
    </div>,
    document.body
  );
}

// ── PlanSelect ────────────────────────────────────────────────────────────────

function PlanSelect({ clinicId, currentPlan, onChanged }: { clinicId: string; currentPlan: string; onChanged: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const handleSelect = (plan: typeof PLAN_OPTIONS[number]) => {
    setOpen(false);
    startTransition(async () => {
      const result = await updateClinicPlan(clinicId, plan);
      if (result.success) {
        toast.success(`Plan mis à jour : ${plan}`);
        onChanged();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors", PLAN_COLORS[currentPlan] ?? PLAN_COLORS.free)}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
        {currentPlan}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      <PortalDropdown anchorRef={buttonRef} open={open} onClose={close} width={144}>
        {PLAN_OPTIONS.map((plan) => (
          <button
            key={plan}
            onClick={() => handleSelect(plan)}
            className={cn("w-full px-3 py-2 text-xs font-semibold text-left hover:bg-muted transition-colors", plan === currentPlan && "bg-primary/5 text-primary")}
          >
            {plan}
          </button>
        ))}
      </PortalDropdown>
    </>
  );
}

// ── RoleSelect ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-violet-500/10 border-violet-500/20 text-violet-600",
  receptionist: "bg-sky-500/10 border-sky-500/20 text-sky-600",
  assistant: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  super_admin: "bg-rose-500/10 border-rose-500/20 text-rose-600",
};

const ALL_ROLE_OPTIONS = [
  { value: "owner", label: "Propriétaire" },
  { value: "receptionist", label: "Réceptionniste" },
  { value: "assistant", label: "Assistant(e)" },
  { value: "super_admin", label: "Super Admin" },
] as const;

type UserRoleValue = typeof ALL_ROLE_OPTIONS[number]["value"];

function RoleSelect({ userId, currentRole, onChanged }: { userId: string; currentRole: string; onChanged: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const handleSelect = (role: UserRoleValue) => {
    setOpen(false);
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result.success) {
        toast.success(`Rôle mis à jour : ${role}`);
        onChanged();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors", ROLE_COLORS[currentRole] ?? ROLE_COLORS.owner)}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
        {ALL_ROLE_OPTIONS.find((r) => r.value === currentRole)?.label ?? currentRole}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      <PortalDropdown anchorRef={buttonRef} open={open} onClose={close} width={160}>
        {ALL_ROLE_OPTIONS.map((role) => (
          <button
            key={role.value}
            onClick={() => handleSelect(role.value)}
            className={cn("w-full px-3 py-2 text-xs font-semibold text-left hover:bg-muted transition-colors", role.value === currentRole && "bg-primary/5 text-primary")}
          >
            {role.label}
          </button>
        ))}
      </PortalDropdown>
    </>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function Pagination({ page, total, onPageChange }: { page: number; total: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total}
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold border transition-colors",
              p === page
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            [{p}]
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Clinics table ─────────────────────────────────────────────────────────────

function ClinicsTable({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["admin-clinics"],
    queryFn: () => listAllClinics({ limit: 500 }),
  });

  const filtered = clinics.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.owner_email.toLowerCase().includes(q);
  });

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleClinic = async (clinicId: string) => {
    setToggling(clinicId);
    const result = await toggleClinicActive(clinicId);
    setToggling(null);
    if (result.success) {
      toast.success(`Clinique ${result.data?.is_active ? "activée" : "désactivée"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } else {
      toast.error(result.error ?? "Erreur");
    }
  };

  if (isLoading) return <TableLoader />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Clinique", "Propriétaire", "Plan", "RDV", "Membres", "Créée", "Statut"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Aucune clinique trouvée</td></tr>
            ) : paginated.map((clinic) => (
              <tr key={clinic.id} className={cn("hover:bg-muted/30 transition-colors", !clinic.is_active && "opacity-50")}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{clinic.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{clinic.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground text-xs">{clinic.owner_name}</p>
                  <p className="text-xs text-muted-foreground">{clinic.owner_email}</p>
                </td>
                <td className="px-4 py-3">
                  <PlanSelect clinicId={clinic.id} currentPlan={clinic.plan} onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin-clinics"] })} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{clinic.appointment_count}</td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{clinic.user_count}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(clinic.created_at), "d MMM yyyy", { locale: fr })}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleClinic(clinic.id)}
                    disabled={toggling === clinic.id}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                  >
                    {toggling === clinic.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : clinic.is_active ? (
                      <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-emerald-600">Active</span></>
                    ) : (
                      <><ToggleLeft className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">Inactive</span></>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}

// ── Users table ───────────────────────────────────────────────────────────────

function UsersTable({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAllUsers({ limit: 500 }),
  });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.clinic_name.toLowerCase().includes(q);
  });

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleUser = async (userId: string) => {
    setToggling(userId);
    const result = await toggleUserActive(userId);
    setToggling(null);
    if (result.success) {
      toast.success(`Compte ${result.data?.is_active ? "activé" : "désactivé"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } else {
      toast.error(result.error ?? "Erreur");
    }
  };

  if (isLoading) return <TableLoader />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Utilisateur", "Rôle", "Clinique", "Plan", "Inscrit", "Compte"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Aucun utilisateur trouvé</td></tr>
            ) : paginated.map((user) => (
              <tr key={user.id} className={cn("hover:bg-muted/30 transition-colors", !user.is_active && "opacity-50")}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <RoleSelect
                    userId={user.id}
                    currentRole={user.role}
                    onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-foreground">{user.clinic_name}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border", PLAN_COLORS[user.plan] ?? PLAN_COLORS.free)}>{user.plan}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(user.created_at), "d MMM yyyy", { locale: fr })}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleUser(user.id)}
                    disabled={toggling === user.id}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                  >
                    {toggling === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : user.is_active ? (
                      <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-emerald-600">Actif</span></>
                    ) : (
                      <><ToggleLeft className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">Inactif</span></>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

function MessageDetail({
  message,
  onClose,
  onRefresh,
}: {
  message: AdminMessageRow;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [replyText, setReplyText] = useState(message.admin_reply ?? "");
  const [isPending, startTransition] = useTransition();
  const statusCfg = STATUS_CONFIG[message.status];
  const typeCfg = TYPE_CONFIG[message.type];

  const handleStatusChange = (status: "open" | "in_progress" | "closed") => {
    startTransition(async () => {
      const result = await updateMessageStatus(message.id, status);
      if (result.success) {
        toast.success("Statut mis à jour");
        onRefresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    startTransition(async () => {
      const result = await replyToMessage(message.id, replyText.trim());
      if (result.success) {
        toast.success("Réponse envoyée et message fermé");
        onRefresh();
        onClose();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  const meta = message.metadata as Record<string, string>;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border", typeCfg.color)}>{typeCfg.label}</span>
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1", statusCfg.color)}>
                <statusCfg.icon className="w-3 h-3" />
                {statusCfg.label}
              </span>
              {message.sender_plan && (
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border", PLAN_COLORS[message.sender_plan] ?? PLAN_COLORS.free)}>
                  {message.sender_plan}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-foreground">{message.subject}</h2>
            <p className="text-xs text-muted-foreground">
              De : <span className="font-medium text-foreground">{message.sender_name}</span> ({message.sender_email}) · {format(new Date(message.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata enterprise */}
          {message.type === "enterprise" && Object.keys(meta).length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 grid grid-cols-2 gap-2 text-xs">
              {meta.organizationName && <div><span className="text-muted-foreground">Organisation :</span> <span className="font-semibold">{meta.organizationName}</span></div>}
              {meta.contactRole && <div><span className="text-muted-foreground">Rôle :</span> <span className="font-semibold">{meta.contactRole}</span></div>}
              {meta.phone && <div><span className="text-muted-foreground">Téléphone :</span> <span className="font-semibold">{meta.phone}</span></div>}
              {meta.numberOfDoctors && <div><span className="text-muted-foreground">Médecins :</span> <span className="font-semibold">{meta.numberOfDoctors}</span></div>}
            </div>
          )}

          {/* Metadata support */}
          {message.type === "support" && meta.priority && (
            <div className="bg-muted/50 rounded-xl p-3 text-xs flex items-center gap-2">
              <span className="text-muted-foreground">Priorité :</span>
              <span className="font-bold capitalize">{meta.priority}</span>
              {meta.ticketId && <span className="ml-auto font-mono text-muted-foreground">#{meta.ticketId}</span>}
            </div>
          )}

          {/* Message body */}
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message.body}</p>
          </div>

          {/* Previous reply */}
          {message.admin_reply && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Réponse envoyée le {format(new Date(message.replied_at!), "d MMM yyyy", { locale: fr })}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{message.admin_reply}</p>
            </div>
          )}

          {/* Reply area */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground">Répondre par email</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tapez votre réponse..."
              rows={5}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {(["open", "in_progress", "closed"] as const).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isPending || message.status === s}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                    message.status === s ? cn(cfg.color, "cursor-default") : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <Button onClick={handleReply} disabled={isPending || !replyText.trim()} size="sm" className="gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer la réponse
          </Button>
        </div>
      </div>
    </div>
  );
}

function InboxPanel() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<"all" | "support" | "enterprise">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "closed">("open");
  const [selectedMessage, setSelectedMessage] = useState<AdminMessageRow | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-messages", typeFilter, statusFilter],
    queryFn: () => listAdminMessages({
      type: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: 100,
    }),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
    setSelectedMessage(null);
  };

  return (
    <div className="p-5 space-y-4">
      {selectedMessage && (
        <MessageDetail
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {(["all", "support", "enterprise"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-all", typeFilter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t === "all" ? "Tous" : t === "support" ? "Support" : "Enterprise"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {(["all", "open", "in_progress", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-all", statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <TableLoader />
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucun message</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {messages.map((msg) => {
            const statusCfg = STATUS_CONFIG[msg.status];
            const typeCfg = TYPE_CONFIG[msg.type];
            return (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className="w-full text-left px-4 py-4 hover:bg-muted/40 transition-colors flex items-start gap-4"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", typeCfg.color)}>
                  {msg.type === "support" ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">{msg.sender_name}</span>
                    <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1", statusCfg.color)}>
                      <statusCfg.icon className="w-3 h-3" />{statusCfg.label}
                    </span>
                    {msg.sender_plan && (
                      <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded border", PLAN_COLORS[msg.sender_plan] ?? PLAN_COLORS.free)}>{msg.sender_plan}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.body.slice(0, 100)}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {format(new Date(msg.created_at), "d MMM", { locale: fr })}
                  <ChevronRight className="w-4 h-4 ml-1 inline" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Newsletter ────────────────────────────────────────────────────────────────

function NewsletterPanel() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"compose" | "history">("compose");

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["admin-newsletters"],
    queryFn: listNewsletterCampaigns,
  });

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSend = () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Sujet et contenu requis");
      return;
    }

    startTransition(async () => {
      const result = await sendNewsletter({
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim(),
        targetRoles: selectedRoles.length > 0 ? selectedRoles : null,
      });

      if (result.success && result.data) {
        toast.success(`Newsletter envoyée — ${result.data.sentCount} destinataires, ${result.data.failedCount} échecs`);
        setSubject("");
        setBodyHtml("");
        setSelectedRoles([]);
        queryClient.invalidateQueries({ queryKey: ["admin-newsletters"] });
        setView("history");
      } else {
        toast.error(result.error ?? "Erreur d'envoi");
      }
    });
  };

  return (
    <div className="p-5 space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {(["compose", "history"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5", view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {v === "compose" ? <><Megaphone className="w-4 h-4" />Composer</> : <><History className="w-4 h-4" />Historique</>}
          </button>
        ))}
      </div>

      {view === "compose" ? (
        <div className="space-y-5 max-w-2xl">
          {/* Segmentation par rôle */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Destinataires</label>
            <p className="text-xs text-muted-foreground">Aucune sélection = tous les utilisateurs actifs</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  onClick={() => toggleRole(role.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                    selectedRoles.includes(role.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {selectedRoles.includes(role.value) && <Check className="w-3 h-3 inline mr-1" />}
                  {role.label}
                </button>
              ))}
            </div>
            {selectedRoles.length > 0 && (
              <p className="text-xs text-primary font-medium">Envoi aux : {selectedRoles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label).join(", ")}</p>
            )}
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Sujet</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nouveautés DocFlow — Mai 2026"
              className="rounded-xl"
            />
          </div>

          {/* Corps */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Contenu (HTML ou texte)</label>
            <p className="text-xs text-muted-foreground">Le prénom du médecin sera ajouté automatiquement à l&apos;envoi.</p>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder={`Bonjour Docteur,\n\nVoici les dernières nouveautés de DocFlow AI...`}
              rows={10}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
          </div>

          {/* Preview info */}
          {bodyHtml && (
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-xs font-bold text-muted-foreground mb-2">Aperçu</p>
              <div
                className="text-sm text-foreground"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={isPending || !subject.trim() || !bodyHtml.trim()}
            className="gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isPending ? "Envoi en cours..." : "Envoyer la newsletter"}
          </Button>
        </div>
      ) : (
        /* History */
        <div>
          {campaignsLoading ? (
            <TableLoader />
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <History className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucune campagne envoyée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: NewsletterCampaignRow }) {
  const statusColors = {
    draft: "bg-muted border-border text-muted-foreground",
    sending: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    sent: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    failed: "bg-red-500/10 border-red-500/20 text-red-600",
  };

  const successRate = campaign.recipients_count > 0
    ? Math.round((campaign.sent_count / campaign.recipients_count) * 100)
    : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground text-sm">{campaign.subject}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {campaign.sent_at
              ? `Envoyée le ${format(new Date(campaign.sent_at), "d MMM yyyy à HH:mm", { locale: fr })}`
              : `Créée le ${format(new Date(campaign.created_at), "d MMM yyyy", { locale: fr })}`}
          </p>
        </div>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border whitespace-nowrap", statusColors[campaign.status])}>
          {campaign.status === "sent" ? "Envoyée" : campaign.status === "sending" ? "En cours" : campaign.status === "failed" ? "Échec" : "Brouillon"}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span><span className="font-bold text-foreground">{campaign.recipients_count}</span> destinataires</span>
        <span><span className="font-bold text-emerald-600">{campaign.sent_count}</span> envoyés</span>
        {campaign.failed_count > 0 && <span><span className="font-bold text-red-500">{campaign.failed_count}</span> échecs</span>}
        {campaign.status === "sent" && <span className="ml-auto font-bold text-foreground">{successRate}% succès</span>}
      </div>

      {campaign.target_roles && campaign.target_roles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {campaign.target_roles.map((role) => (
            <span key={role} className="text-xs bg-muted border border-border px-2 py-0.5 rounded-md font-medium text-muted-foreground">
              {ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role}
            </span>
          ))}
        </div>
      )}

      {campaign.status === "sent" && campaign.recipients_count > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${successRate}%` }} />
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TableLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ── Integrations monitor ──────────────────────────────────────────────────────

function IntegrationsMonitorPanel() {
  const [subTab, setSubTab] = useState<"apikeys" | "webhooks">("apikeys");
  const [search, setSearch] = useState("");

  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["admin-apikeys"],
    queryFn: listAllApiKeys,
  });

  const { data: webhooks = [], isLoading: hooksLoading } = useQuery({
    queryKey: ["admin-webhooks"],
    queryFn: listAllWebhooks,
  });

  const filteredKeys = apiKeys.filter((k) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return k.clinic_name.toLowerCase().includes(q) || k.owner_email.toLowerCase().includes(q) || k.name.toLowerCase().includes(q);
  });

  const filteredHooks = webhooks.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.clinic_name.toLowerCase().includes(q) || h.owner_email.toLowerCase().includes(q) || h.name.toLowerCase().includes(q);
  });

  return (
    <div className="p-5 space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Clés API total", value: apiKeys.length, color: "text-blue-600 bg-blue-500/10" },
          { label: "Clés actives", value: apiKeys.filter((k) => k.is_active).length, color: "text-emerald-600 bg-emerald-500/10" },
          { label: "Webhooks total", value: webhooks.length, color: "text-violet-600 bg-violet-500/10" },
          { label: "Webhooks actifs", value: webhooks.filter((h) => h.is_active).length, color: "text-amber-600 bg-amber-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold", stat.color)}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {([
            { id: "apikeys" as const, label: "Clés API", icon: Key },
            { id: "webhooks" as const, label: "Webhooks", icon: Webhook },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => { setSubTab(t.id); setSearch(""); }}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5", subTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            placeholder="Filtrer par clinique ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* API Keys table */}
      {subTab === "apikeys" && (
        keysLoading ? <TableLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Nom", "Clinique", "Propriétaire", "Préfixe", "Dernière utilisation", "Statut"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKeys.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Aucune clé API trouvée</td></tr>
                ) : filteredKeys.map((k) => (
                  <tr key={k.id} className={cn("hover:bg-muted/30 transition-colors", !k.is_active && "opacity-50")}>
                    <td className="px-4 py-3 font-semibold text-sm text-foreground">{k.name}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{k.clinic_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{k.owner_email}</td>
                    <td className="px-4 py-3"><code className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">{k.key_prefix}</code></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {k.last_used_at ? format(new Date(k.last_used_at), "d MMM yyyy", { locale: fr }) : "Jamais"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border", k.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-muted border-border text-muted-foreground")}>
                        {k.is_active ? "Active" : "Révoquée"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Webhooks table */}
      {subTab === "webhooks" && (
        hooksLoading ? <TableLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Nom", "Clinique", "URL", "Événements", "Dernier appel", "Échecs", "Statut"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHooks.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Aucun webhook trouvé</td></tr>
                ) : filteredHooks.map((h) => (
                  <tr key={h.id} className={cn("hover:bg-muted/30 transition-colors", !h.is_active && "opacity-50")}>
                    <td className="px-4 py-3 font-semibold text-sm text-foreground">{h.name}</td>
                    <td className="px-4 py-3 text-xs text-foreground">{h.clinic_name}</td>
                    <td className="px-4 py-3">
                      <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary hover:underline flex items-center gap-1 max-w-[180px] truncate">
                        {h.url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(h.events ?? []).map((ev: string) => (
                          <span key={ev} className="text-[9px] font-mono bg-muted border border-border px-1.5 py-0.5 rounded">{ev}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {h.last_triggered_at ? format(new Date(h.last_triggered_at), "d MMM yyyy", { locale: fr }) : "Jamais"}
                      {h.last_status_code && (
                        <span className={cn("ml-1.5 font-mono text-[10px]", h.last_status_code < 300 ? "text-emerald-600" : "text-red-500")}>
                          {h.last_status_code}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {h.failure_count > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                          <AlertTriangle className="w-3 h-3" />{h.failure_count}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border", h.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-muted border-border text-muted-foreground")}>
                        {h.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type AdminTab = "clinics" | "users" | "inbox" | "newsletter" | "integrations";

export default function SuperAdminPage() {
  const router = useRouter();
  const t = useTranslations("superAdmin");
  const [activeTab, setActiveTab] = useState<AdminTab>("clinics");
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getPlatformStats,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-messages", "all", "open"],
    queryFn: () => listAdminMessages({ status: "open", limit: 100 }),
  });

  const unreadCount = messages.length;

  const handleLogout = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any;
    await db.auth.signOut();
    router.push("/login");
  };

  const TABS: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "clinics", label: t("navClinics"), icon: Building2 },
    { id: "users", label: t("navUsers"), icon: Users },
    { id: "inbox", label: t("navInbox"), icon: Inbox, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "newsletter", label: t("navNewsletter"), icon: Megaphone },
    { id: "integrations", label: t("navMonitor"), icon: Plug },
  ];

  const showSearch = activeTab === "clinics" || activeTab === "users";

  // Close mobile menu when tab changes
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearch("");
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Mobile backdrop ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "flex flex-col h-full border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0",
          // Mobile: fixed overlay, Desktop: relative in flow
          "fixed inset-y-0 left-0 z-50 md:relative",
          // Width: mobile always 280px, desktop depends on collapsed state
          "w-[280px]",
          sidebarCollapsed ? "md:w-[72px]" : "md:w-[260px]",
          // Mobile slide animation
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border relative">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{t("title")}</p>
              <p className="text-[10px] text-muted-foreground">{t("role")}</p>
            </div>
          )}
          {/* Mobile close button */}
          <button
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-muted rounded-full hover:bg-accent text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav admin */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("sectionAdmin")}
            </p>
          )}
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
              {tab.badge !== undefined && (
                <span className={cn(
                  "bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0",
                  sidebarCollapsed ? "absolute top-1 right-1 w-4 h-4" : "ml-auto w-5 h-5"
                )}>
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </button>
          ))}

          {/* Separator */}
          <div className="my-2 border-t border-border" />

          {/* Mon espace — liens vers l'app clinique */}
          {!sidebarCollapsed && (
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("sectionMySpace")}
            </p>
          )}
          <a
            href="/app/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{t("navMyClinic")}</span>}
          </a>
          <a
            href="/app/integrations"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <Link2 className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{t("navMyIntegrations")}</span>}
          </a>
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-border space-y-0.5">
          {/* Theme + Language switchers */}
          <div className={cn("flex items-center gap-2", sidebarCollapsed ? "md:flex-col md:justify-center md:gap-3" : "justify-between px-2")}>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>

          <button
            onClick={() => refetchStats()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-all",
              sidebarCollapsed && "justify-center"
            )}
            title={t("refresh")}
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>{t("refresh")}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-all",
              sidebarCollapsed && "justify-center"
            )}
            title={t("logout")}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>{t("logout")}</span>}
          </button>
        </div>

        {/* ── Desktop collapse toggle ── */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="hidden md:flex absolute -right-4 top-16 w-8 h-8 rounded-full bg-background border-2 border-primary/20 hover:border-primary shadow-xl items-center justify-center text-foreground hover:bg-primary/5 transition-all z-[100]"
          title={sidebarCollapsed ? t("expand") : t("collapse")}
        >
          {sidebarCollapsed
            ? <ChevronRight strokeWidth={3} className="w-4 h-4 text-primary" />
            : <ChevronLeft strokeWidth={3} className="w-4 h-4 text-primary" />
          }
        </button>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          {/* Hamburger on mobile */}
          <button
            className="md:hidden mr-3 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">
              {TABS.find((t) => t.id === activeTab)?.label ?? "Tableau de bord"}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {activeTab === "clinics" && t("descClinics")}
              {activeTab === "users" && t("descUsers")}
              {activeTab === "inbox" && t("descInbox")}
              {activeTab === "newsletter" && t("descNewsletter")}
              {activeTab === "integrations" && t("descMonitor")}
            </p>
          </div>
          {showSearch && (
            <div className="relative w-40 sm:w-56 md:w-64 ml-2 sm:ml-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "clinics" ? t("searchClinic") : t("searchUser")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 h-24 animate-pulse" />
              ))
            ) : (
              <>
                <StatCard icon={Building2} label={t("statClinicsTotal")} value={stats?.total_clinics ?? 0} sub={`${stats?.active_clinics ?? 0} actives`} color="bg-blue-500/10 text-blue-600" />
                <StatCard icon={Users} label={t("statUsers")} value={stats?.total_users ?? 0} color="bg-violet-500/10 text-violet-600" />
                <StatCard icon={CalendarCheck} label={t("statAppointments")} value={stats?.total_appointments ?? 0} color="bg-emerald-500/10 text-emerald-600" />
                <StatCard
                  icon={TrendingUp}
                  label={t("statPaidPlans")}
                  value={(stats?.plans.starter ?? 0) + (stats?.plans.professional ?? 0) + (stats?.plans.enterprise ?? 0)}
                  sub={`${stats?.plans.enterprise ?? 0} ${t("enterprise")}`}
                  color="bg-amber-500/10 text-amber-600"
                />
              </>
            )}
          </div>

          {/* Plan breakdown */}
          {stats && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.plans).map(([plan, count]) => (
                <div key={plan} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold", PLAN_COLORS[plan] ?? PLAN_COLORS.free)}>
                  <Crown className="w-3 h-3" />
                  {plan} <span className="font-mono font-semibold">×{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Main panel */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {activeTab === "clinics" && <ClinicsTable search={search} />}
            {activeTab === "users" && <UsersTable search={search} />}
            {activeTab === "inbox" && <InboxPanel />}
            {activeTab === "newsletter" && <NewsletterPanel />}
            {activeTab === "integrations" && <IntegrationsMonitorPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
