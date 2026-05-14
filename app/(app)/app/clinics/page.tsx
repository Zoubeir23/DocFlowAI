"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  listUserClinics,
  switchActiveClinic,
  createNewClinic,
} from "@/actions/clinics";
import {
  Building2,
  Plus,
  CheckCircle2,
  Loader2,
  ArrowRightLeft,
  Crown,
  Globe2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function usePlan() {
  return useQuery({
    queryKey: ["clinics-plan"],
    queryFn: async () => {
      const db = createClient() as ReturnType<typeof createClient>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { user } } = await (db as any).auth.getUser();
      if (!user) return "free";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userData } = await (db as any)
        .from("users")
        .select("clinic_id")
        .eq("id", user.id)
        .single();
      if (!userData?.clinic_id) return "free";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sub } = await (db as any)
        .from("subscriptions")
        .select("plan")
        .eq("clinic_id", userData.clinic_id)
        .single();
      return (sub?.plan as string) ?? "free";
    },
  });
}

export default function ClinicsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newClinicName, setNewClinicName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const { data: plan = "free" } = usePlan();
  const isEnterprise = plan === "enterprise";

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["user-clinics"],
    queryFn: listUserClinics,
  });

  const handleSwitch = (clinicId: string) => {
    if (clinics.find((c) => c.clinic_id === clinicId)?.is_active) return;
    setSwitchingId(clinicId);
    startTransition(async () => {
      const result = await switchActiveClinic(clinicId);
      if (result.success) {
        toast.success("Clinique active changée");
        queryClient.invalidateQueries({ queryKey: ["user-clinics"] });
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur lors du changement");
      }
      setSwitchingId(null);
    });
  };

  const handleCreate = () => {
    if (!newClinicName.trim()) return;
    startTransition(async () => {
      const result = await createNewClinic(newClinicName.trim());
      if (result.success) {
        toast.success(`Clinique "${newClinicName}" créée`);
        setNewClinicName("");
        setShowCreateForm(false);
        queryClient.invalidateQueries({ queryKey: ["user-clinics"] });
      } else {
        toast.error(result.error ?? "Erreur lors de la création");
      }
    });
  };

  return (
    <div className="page-container max-w-3xl space-y-8">
      {/* Header */}
      <div className="section-header">
        <div className="icon-container">
          <Building2 className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h2 className="section-title">Mes cliniques</h2>
          <p className="section-subtitle">Gérez vos établissements et changez de clinique active</p>
        </div>
        {isEnterprise && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl">
            <Crown className="w-3.5 h-3.5" />
            Entreprise
          </span>
        )}
      </div>

      {/* Enterprise gate */}
      {!isEnterprise && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-muted/50 border border-border rounded-2xl">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Cliniques multiples — Plan Entreprise</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gérez jusqu&apos;à 5 établissements depuis un seul compte
              </p>
            </div>
          </div>
          <Link
            href="/app/billing"
            className="flex-shrink-0 text-xs font-bold text-primary hover:underline"
          >
            Voir les plans
          </Link>
        </div>
      )}

      {/* Clinics list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {clinics.map((entry) => (
            <div
              key={entry.clinic_id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                entry.is_active
                  ? "bg-primary/5 border-primary/30"
                  : "bg-card border-border hover:border-primary/20"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                  entry.is_active
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Building2 className="w-5 h-5" strokeWidth={1.8} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground truncate">
                    {entry.clinic?.name ?? "Clinique"}
                  </p>
                  {entry.is_active && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground capitalize">
                    {entry.role}
                  </span>
                  {entry.clinic?.slug && (
                    <a
                      href={`/clinique/${entry.clinic.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Globe2 className="w-3 h-3" />
                      {entry.clinic.slug}
                    </a>
                  )}
                </div>
              </div>

              {!entry.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSwitch(entry.clinic_id)}
                  disabled={switchingId === entry.clinic_id || isPending}
                  className="flex-shrink-0 rounded-xl gap-1.5 text-xs"
                >
                  {switchingId === entry.clinic_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  )}
                  Activer
                </Button>
              )}
            </div>
          ))}

          {/* Create new clinic */}
          {isEnterprise && clinics.length < 5 && (
            <div>
              {showCreateForm ? (
                <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Nouvelle clinique</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nom de l&apos;établissement</Label>
                    <Input
                      placeholder="Ex : Clinique du Parc Nord"
                      value={newClinicName}
                      onChange={(e) => setNewClinicName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="rounded-xl"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreate}
                      disabled={!newClinicName.trim() || isPending}
                      className="btn-primary rounded-xl gap-1.5 text-xs"
                      size="sm"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Créer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowCreateForm(false); setNewClinicName(""); }}
                      className="rounded-xl text-xs"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/3 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Ajouter une clinique</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {5 - clinics.length} emplacement{5 - clinics.length > 1 ? "s" : ""} restant{5 - clinics.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              )}
            </div>
          )}

          {isEnterprise && clinics.length >= 5 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Limite de 5 cliniques atteinte
            </p>
          )}
        </div>
      )}
    </div>
  );
}
