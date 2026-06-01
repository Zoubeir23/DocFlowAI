"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Phone, Mail, FileText, Users, X, CalendarDays, Upload, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { createPatient, getPatients, getPatientAppointments } from "@/actions/patients";
import { patientSchema, type PatientInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Patient } from "@/types";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { CsvImportDialog } from "@/components/patients/csv-import-dialog";
import { ImportCarnetDialog } from "@/components/patients/import-carnet-dialog";
import { CarnetNumeriqueSection } from "@/components/patients/carnet-numerique-section";
import { FileDown } from "lucide-react";

async function fetchClinicId() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).maybeSingle();
  return data?.clinic_id || null;
}

/* Dark-mode safe status styles */
const STATUS_STYLES: Record<string, string> = {
  booked: "status-booked",
  confirmed: "status-confirmed",
  completed: "status-completed",
  cancelled: "status-cancelled",
  no_show: "status-no_show",
};

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showImportCarnet, setShowImportCarnet] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations("patients");

  const { data: clinicId } = useQuery({ queryKey: ["clinicId"], queryFn: fetchClinicId });

  const { data: patientsResult, isLoading } = useQuery({
    queryKey: ["patients", clinicId, search],
    queryFn: () => getPatients(clinicId!, 1, 50, search),
    enabled: !!clinicId,
  });

  const { data: patientAppts } = useQuery({
    queryKey: ["patient-appointments", selectedPatient?.id],
    queryFn: () => getPatientAppointments(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: PatientInput) => createPatient(clinicId!, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Patient added");
        queryClient.invalidateQueries({ queryKey: ["patients"] });
        setShowAddModal(false);
        reset();
      } else {
        toast.error(result.error || "Failed to add patient");
      }
    },
  });

  const patients = patientsResult?.data || [];

  const avatarColors = [
    "from-teal-500 to-cyan-500",
    "from-violet-500 to-purple-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-blue-500 to-indigo-500",
  ];

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="section-header">
          <div className="icon-container">
            <Users className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="section-title">{t("title")}</h2>
            <p className="section-subtitle">
              {patientsResult?.total || 0} {t("registered")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCsvImport(true)}
            className="rounded-xl font-medium"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t("importCsv")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowImportCarnet(true)}
            className="rounded-xl font-medium"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {t("importCarnet")}
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("addPatient")}
          </Button>
        </div>
      </div>

      {clinicId && (
        <ImportCarnetDialog
          open={showImportCarnet}
          onOpenChange={setShowImportCarnet}
          clinicId={clinicId}
        />
      )}
      
      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          className="pl-10 h-10 rounded-xl border-border bg-card focus:ring-primary focus:border-primary text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28 rounded-lg" />
                    <Skeleton className="h-3 w-20 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-3 w-36 rounded-lg" />
              </div>
            ))
          : patients.map((patient, idx) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="glass-card p-5 text-left hover-lift hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {patient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {patient.full_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("sinceLabel")} {format(parseISO(patient.created_at), "MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="truncate">{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
      </div>

      {patients.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">{t("noResults")}</p>
          {search ? (
            <p className="text-sm text-muted-foreground mt-1">{t("tryDifferent")}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">{t("autoAdded")}</p>
          )}
        </div>
      )}

      {/* Patient detail modal */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl rounded-xl border-border shadow-lg p-0 overflow-hidden">
          {selectedPatient && (
            <>
              {/* Modal header */}
              <div className="border-b border-border bg-muted/30 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary font-bold text-xl">
                      {selectedPatient.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedPatient.full_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Phone className="w-3 h-3" /> {selectedPatient.phone}
                        </span>
                        {selectedPatient.email && (
                          <span className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Mail className="w-3 h-3" /> {selectedPatient.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/app/patients/${selectedPatient.id}`}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t("viewFullProfile")}
                  </Link>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                {selectedPatient.notes && (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <FileText className="w-4 h-4 text-primary" /> {t("notes")}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedPatient.notes}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-foreground text-sm">{t("visitHistory")}</h4>
                  </div>
                  {patientAppts && patientAppts.length > 0 ? (
                    <div className="space-y-2">
                      {(patientAppts as any[]).slice(0, 8).map((appt) => {
                        const a = appt as { id: string; start_at: string; end_at: string; status: string; service: { name: string } };
                        return (
                          <div key={a.id} className="flex items-center justify-between p-3 bg-muted/20 hover:bg-accent rounded-xl transition-colors">
                            <div>
                              <p className="text-sm font-medium text-foreground">{a.service?.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(parseISO(a.start_at), "MMM d, yyyy · h:mm a")}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[a.status] || "status-completed"}`}>
                              {getStatusLabel(a.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm">{t("noHistory")}</p>
                    </div>
                  )}
                </div>

                <CarnetNumeriqueSection patientId={selectedPatient.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add patient modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="rounded-xl border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="icon-container-sm">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              {t("addNewPatient")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">{t("fullName")}</Label>
              <Input
                placeholder={t("fullNamePlaceholder")}
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                {...register("full_name")}
              />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">{t("phoneNumber")}</Label>
              <Input
                placeholder={t("phonePlaceholder")}
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                {t("email")} <span className="text-muted-foreground font-normal">{t("emailOptional")}</span>
              </Label>
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                {...register("email")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                {t("notesLabel")} <span className="text-muted-foreground font-normal">{t("notesOptional")}</span>
              </Label>
              <Textarea
                placeholder={t("notesPlaceholder")}
                className="rounded-xl border-border focus:ring-primary focus:border-primary resize-none"
                rows={3}
                {...register("notes")}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl border-border" onClick={() => setShowAddModal(false)}>
                {t("cancelButton")}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? t("adding") : t("addButton")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CsvImportDialog
        open={showCsvImport}
        onOpenChange={setShowCsvImport}
        onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["patients"] })}
      />
    </div>
  );
}
