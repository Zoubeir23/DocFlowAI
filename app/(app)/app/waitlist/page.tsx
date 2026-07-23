"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Phone, Mail, Trash2, Bell, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import {
  getWaitlist,
  addToWaitlist,
  updateWaitlistStatus,
  deleteWaitlistEntry,
} from "@/actions/waitlist";
import type { WaitlistEntry, WaitlistInput } from "@/actions/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ServiceOption {
  id: string;
  name: string;
}

async function fetchServices(): Promise<ServiceOption[]> {
  const supabase = createClient() as any;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];
  const { data: userData } = await supabase
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!userData?.clinic_id) return [];
  const { data } = await supabase
    .from("services")
    .select("id, name")
    .eq("clinic_id", userData.clinic_id)
    .eq("is_active", true)
    .order("name");
  return (data || []) as ServiceOption[];
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
  notified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50",
  booked: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50",
};

const STATUS_LABELS: Record<string, string> = {
  waiting: "En attente",
  notified: "Notifie",
  booked: "RDV pris",
  cancelled: "Annule",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "waiting", label: "En attente" },
  { value: "notified", label: "Notifies" },
  { value: "booked", label: "RDV pris" },
  { value: "cancelled", label: "Annules" },
];

function WaitlistStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold",
        STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.cancelled
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface AddWaitlistFormState {
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  service_id: string;
  notes: string;
}

const EMPTY_FORM: AddWaitlistFormState = {
  patient_name: "",
  patient_phone: "",
  patient_email: "",
  service_id: "",
  notes: "",
};

export default function WaitlistPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("waiting");
  const [formState, setFormState] = useState<AddWaitlistFormState>(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: services = [] } = useQuery({
    queryKey: ["services-options"],
    queryFn: fetchServices,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["waitlist", statusFilter],
    queryFn: () => getWaitlist(statusFilter),
  });

  const addMutation = useMutation({
    mutationFn: (input: WaitlistInput) => addToWaitlist(input),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Patient ajoute a la liste d'attente");
        queryClient.invalidateQueries({ queryKey: ["waitlist"] });
        setShowAddModal(false);
        setFormState(EMPTY_FORM);
      } else {
        toast.error(result.error ?? "Erreur lors de l'ajout");
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "notified" | "booked" | "cancelled" }) =>
      updateWaitlistStatus(id, status),
    onSuccess: (result, variables) => {
      if (result.success) {
        const messages: Record<string, string> = {
          notified: "Patient notifie",
          booked: "RDV marque comme pris",
          cancelled: "Entree annulee",
        };
        toast.success(messages[variables.status] ?? "Statut mis a jour");
        queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWaitlistEntry(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Entree supprimee");
        queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
  });

  function handleFormChange(field: keyof AddWaitlistFormState, value: string) {
    setFormState((previous) => ({ ...previous, [field]: value }));
  }

  function handleAddSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input: WaitlistInput = {
      patient_name: formState.patient_name,
      patient_phone: formState.patient_phone,
      patient_email: formState.patient_email || undefined,
      service_id: formState.service_id || undefined,
      notes: formState.notes || undefined,
    };
    addMutation.mutate(input);
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="section-header">
          <div className="icon-container">
            <Clock className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="section-title">Liste d&apos;attente</h2>
            <p className="section-subtitle">
              {entries.length} patient{entries.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
              statusFilter === option.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Patient
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telephone
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Service demande
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Depuis
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32 rounded-lg" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28 rounded-lg" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-36 rounded-lg" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-lg" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-24 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                : entries.map((entry: WaitlistEntry) => (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{entry.patient_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3 text-primary flex-shrink-0" />
                          {entry.patient_phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {entry.patient_email ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                            {entry.patient_email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-muted-foreground">
                          {entry.service?.name ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-muted-foreground text-xs">
                          {formatDistanceToNow(parseISO(entry.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <WaitlistStatusBadge status={entry.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {entry.status === "waiting" && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: entry.id, status: "notified" })
                              }
                              disabled={updateStatusMutation.isPending}
                              title="Notifier le patient"
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50 transition-all"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Notifier</span>
                            </button>
                          )}
                          {(entry.status === "waiting" || entry.status === "notified") && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ id: entry.id, status: "booked" })
                              }
                              disabled={updateStatusMutation.isPending}
                              title="Marquer RDV pris"
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 border border-transparent hover:border-green-200 dark:hover:border-green-800/50 transition-all"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">RDV pris</span>
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(entry.id)}
                            disabled={deleteMutation.isPending}
                            title="Supprimer"
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!isLoading && entries.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">Aucun patient en attente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez des patients a la liste d&apos;attente pour les contacter lors d&apos;un créneau disponible.
            </p>
          </div>
        )}
      </div>

      {/* Add modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="rounded-xl border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="icon-container-sm">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Ajouter a la liste d&apos;attente
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Nom du patient</Label>
              <Input
                placeholder="Jean Dupont"
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                value={formState.patient_name}
                onChange={(event) => handleFormChange("patient_name", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Telephone</Label>
              <Input
                placeholder="+33 6 12 34 56 78"
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                value={formState.patient_phone}
                onChange={(event) => handleFormChange("patient_phone", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Email{" "}
                <span className="text-muted-foreground font-normal">(optionnel)</span>
              </Label>
              <Input
                type="email"
                placeholder="jean.dupont@email.com"
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                value={formState.patient_email}
                onChange={(event) => handleFormChange("patient_email", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Service demande{" "}
                <span className="text-muted-foreground font-normal">(optionnel)</span>
              </Label>
              <Select
                value={formState.service_id}
                onValueChange={(value) => handleFormChange("service_id", value)}
              >
                <SelectTrigger className="rounded-xl border-border focus:ring-primary">
                  <SelectValue placeholder="Selectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun service specifique</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Notes{" "}
                <span className="text-muted-foreground font-normal">(optionnel)</span>
              </Label>
              <Textarea
                placeholder="Informations complementaires..."
                className="rounded-xl border-border focus:ring-primary focus:border-primary resize-none"
                rows={3}
                value={formState.notes}
                onChange={(event) => handleFormChange("notes", event.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-border"
                onClick={() => {
                  setShowAddModal(false);
                  setFormState(EMPTY_FORM);
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
