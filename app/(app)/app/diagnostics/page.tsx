"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Stethoscope, Plus, Search, FileText, Trash2,
  ShieldCheck, Clock, XCircle, FileEdit, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDiagnostics, deleteDiagnostic } from "@/actions/diagnostics";
import type { DiagnosticValidationStatus } from "@/types";

const PAGE_SIZE = 15;

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: { label: "Brouillon", icon: FileEdit, className: "bg-gray-100 text-gray-600" },
  pending_validation: { label: "En attente", icon: Clock, className: "bg-amber-100 text-amber-700" },
  validated: { label: "Validé", icon: ShieldCheck, className: "bg-green-100 text-green-700" },
  rejected: { label: "Rejeté", icon: XCircle, className: "bg-red-100 text-red-700" },
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  consultation: "Consultation",
  prescription: "Ordonnance",
  receipt: "Reçu",
  medical_report: "Rapport",
  sick_leave: "Certificat",
};

const AGE_GROUP_EMOJI: Record<string, string> = {
  infant: "👶",
  toddler: "🧒",
  child: "👦",
  minor: "🧑",
  adult: "👤",
};

type StatusFilter = DiagnosticValidationStatus | "all";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending_validation", label: "En attente" },
  { value: "validated", label: "Validés" },
  { value: "draft", label: "Brouillons" },
  { value: "rejected", label: "Rejetés" },
];

export default function DiagnosticsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ["diagnostics", statusFilter, search, page],
    queryFn: () => getDiagnostics(page, PAGE_SIZE, statusFilter === "all" ? undefined : statusFilter, search),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDiagnostic(id),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Diagnostic supprimé");
        queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      } else {
        toast.error(response.error ?? "Erreur de suppression");
      }
      setPendingDeleteId(null);
    },
  });

  const diagnostics = result?.data ?? [];

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-card border-b border-border px-4 py-8 md:px-6 md:py-12 lg:px-10 lg:py-16 flex-shrink-0">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <Stethoscope className="w-5 h-5 text-primary" strokeWidth={2} />
              <span className="font-semibold text-xs text-primary uppercase tracking-[0.2em]">Diagnostics médicaux</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-2">
              Dossiers diagnostiques
            </h1>
            <p className="text-muted-foreground">
              {result?.total ?? 0} dossier{(result?.total ?? 0) > 1 ? "s" : ""} — Patient → ICD-11 → Ordonnance
            </p>
          </div>
          <Link href="/app/diagnostics/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              Nouveau diagnostic
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-10 py-8 flex-1 space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un patient, diagnostic..."
              className="pl-10 h-10 rounded-xl border-border bg-card text-sm"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStatusFilterChange(value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-60 rounded" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          ) : diagnostics.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Aucun diagnostic</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Aucun résultat pour cette recherche" : "Commencez par créer un nouveau diagnostic"}
              </p>
              <Link href="/app/diagnostics/new">
                <Button className="mt-4 rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> Nouveau diagnostic
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {diagnostics.map((diagnostic) => {
                const statusConfig = STATUS_CONFIG[diagnostic.validation_status];
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={diagnostic.id} className="flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors group">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 text-lg">
                      {AGE_GROUP_EMOJI[diagnostic.patient_age_group]}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm truncate">
                          {diagnostic.patient_full_name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {diagnostic.patient_age_years} ans — {diagnostic.patient_sex === "male" ? "M" : "F"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {diagnostic.validated_diagnosis_code && (
                          <span className="font-mono text-primary mr-1.5">{diagnostic.validated_diagnosis_code}</span>
                        )}
                        {diagnostic.validated_diagnosis_name || diagnostic.chief_complaint}
                      </p>
                    </div>

                    {/* Document type */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                      {DOCUMENT_TYPE_LABELS[diagnostic.document_type]}
                    </div>

                    {/* Date */}
                    <p className="hidden md:block text-xs text-muted-foreground flex-shrink-0">
                      {format(parseISO(diagnostic.created_at), "d MMM yyyy", { locale: fr })}
                    </p>

                    {/* Status */}
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${statusConfig.className}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/app/diagnostics/${diagnostic.id}`}>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-xs">
                          Voir
                        </Button>
                      </Link>
                      <button
                        onClick={() => setPendingDeleteId(diagnostic.id)}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <PaginationBar
          page={page}
          totalPages={result?.totalPages ?? 1}
          total={result?.total ?? 0}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!pendingDeleteId} onOpenChange={() => setPendingDeleteId(null)}>
        <DialogContent className="rounded-xl border-border shadow-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              Supprimer ce dossier diagnostique ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cette action est irréversible. Le dossier diagnostique, les codes ICD-11 et l'ordonnance associée seront définitivement supprimés.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl border-border" onClick={() => setPendingDeleteId(null)}
                disabled={deleteMutation.isPending}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-medium"
                onClick={() => pendingDeleteId && deleteMutation.mutate(pendingDeleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
