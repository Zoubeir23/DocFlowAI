"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformStats, listAllClinics, listAllUsers,
  toggleUserActive, toggleClinicActive, updateClinicPlan,
  type AdminClinicRow, type AdminUserRow,
} from "@/actions/super-admin";
import {
  ShieldCheck, Building2, Users, CalendarCheck, TrendingUp,
  Search, ToggleLeft, ToggleRight, Crown, Loader2,
  ChevronDown, RefreshCw, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted border-border text-muted-foreground",
  starter: "bg-blue-500/10 border-blue-500/20 text-blue-600",
  professional: "bg-violet-500/10 border-violet-500/20 text-violet-600",
  enterprise: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
};

const PLAN_OPTIONS = ["free", "starter", "professional", "enterprise"] as const;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
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

function PlanSelect({ clinicId, currentPlan, onChanged }: { clinicId: string; currentPlan: string; onChanged: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

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
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors",
          PLAN_COLORS[currentPlan] ?? PLAN_COLORS.free
        )}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
        {currentPlan}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden w-36">
          {PLAN_OPTIONS.map((plan) => (
            <button
              key={plan}
              onClick={() => handleSelect(plan)}
              className={cn(
                "w-full px-3 py-2 text-xs font-semibold text-left hover:bg-muted transition-colors",
                plan === currentPlan && "bg-primary/5 text-primary"
              )}
            >
              {plan}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClinicsTable({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["admin-clinics"],
    queryFn: () => listAllClinics({ limit: 100 }),
  });

  const filtered = clinics.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.owner_email.toLowerCase().includes(q);
  });

  const handleToggleClinic = async (clinicId: string) => {
    setToggling(clinicId);
    const result = await toggleClinicActive(clinicId);
    setToggling(null);
    if (result.success) {
      const next = result.data?.is_active ? "activée" : "désactivée";
      toast.success(`Clinique ${next}`);
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } else {
      toast.error(result.error ?? "Erreur");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Clinique</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Propriétaire</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">RDV</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Membres</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Créée</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                Aucune clinique trouvée
              </td>
            </tr>
          ) : (
            filtered.map((clinic) => (
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
                  <PlanSelect
                    clinicId={clinic.id}
                    currentPlan={clinic.plan}
                    onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin-clinics"] })}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{clinic.appointment_count}</td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{clinic.user_count}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {format(new Date(clinic.created_at), "d MMM yyyy", { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleClinic(clinic.id)}
                    disabled={toggling === clinic.id}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    title={clinic.is_active ? "Désactiver" : "Activer"}
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAllUsers({ limit: 100 }),
  });

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.clinic_name.toLowerCase().includes(q);
  });

  const handleToggleUser = async (userId: string) => {
    setToggling(userId);
    const result = await toggleUserActive(userId);
    setToggling(null);
    if (result.success) {
      const next = result.data?.is_active ? "activé" : "désactivé";
      toast.success(`Compte ${next}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } else {
      toast.error(result.error ?? "Erreur");
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    owner: "Propriétaire",
    receptionist: "Réceptionniste",
    assistant: "Assistant(e)",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilisateur</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rôle</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Clinique</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Inscrit</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Compte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                Aucun utilisateur trouvé
              </td>
            </tr>
          ) : (
            filtered.map((user) => (
              <tr key={user.id} className={cn("hover:bg-muted/30 transition-colors", !user.is_active && "opacity-50")}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-md border",
                    user.role === "owner"
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-foreground">{user.clinic_name}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md border", PLAN_COLORS[user.plan] ?? PLAN_COLORS.free)}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {format(new Date(user.created_at), "d MMM yyyy", { locale: fr })}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleUser(user.id)}
                    disabled={toggling === user.id}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    title={user.is_active ? "Désactiver" : "Activer"}
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"clinics" | "users">("clinics");
  const [search, setSearch] = useState("");

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getPlatformStats,
  });

  const handleLogout = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any;
    await db.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">DocFlow Admin</p>
              <p className="text-xs text-muted-foreground">Tableau de bord super admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { refetchStats(); }}
              className="text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-2">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 h-24 animate-pulse" />
            ))
          ) : (
            <>
              <StatCard icon={Building2} label="Cliniques total" value={stats?.total_clinics ?? 0} sub={`${stats?.active_clinics ?? 0} actives`} color="bg-blue-500/10 text-blue-600" />
              <StatCard icon={Users} label="Utilisateurs" value={stats?.total_users ?? 0} color="bg-violet-500/10 text-violet-600" />
              <StatCard icon={CalendarCheck} label="Rendez-vous" value={stats?.total_appointments ?? 0} color="bg-emerald-500/10 text-emerald-600" />
              <StatCard
                icon={TrendingUp}
                label="Plans payants"
                value={(stats?.plans.starter ?? 0) + (stats?.plans.professional ?? 0) + (stats?.plans.enterprise ?? 0)}
                sub={`${stats?.plans.enterprise ?? 0} Enterprise`}
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
          {/* Tabs + search */}
          <div className="flex items-center justify-between p-5 border-b border-border gap-4 flex-wrap">
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              {(["clinics", "users"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSearch(""); }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "clinics" ? "Cliniques" : "Utilisateurs"}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "clinics" ? "Rechercher une clinique..." : "Rechercher un utilisateur..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          {activeTab === "clinics"
            ? <ClinicsTable search={search} />
            : <UsersTable search={search} />
          }
        </div>
      </div>
    </div>
  );
}
