"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Phone, Mail, FileText, Users, X, Calendar } from "lucide-react";
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

async function fetchClinicId() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
  return data?.clinic_id || null;
}

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-teal-50 text-teal-700 border border-foreground/10",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  completed: "bg-background text-foreground/70 border border-foreground/10",
  cancelled: "bg-red-50 text-red-600 border border-red-100",
  no_show: "bg-amber-50 text-amber-700 border border-amber-100",
};

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
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
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-foreground" />
            </div>
            <h2 className="text-2xl font-medium text-foreground tracking-tight">{t("title")}</h2>
          </div>
          <p className="text-foreground/60 text-sm ml-10">
            {patientsResult?.total || 0} {t("registered")}
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 text-foreground border-none shadow-none hover: transition-all duration-200 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("addPatient")}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
        <Input
          placeholder={t("searchPlaceholder")}
          className="pl-10 h-10 rounded-none border-foreground/10 bg-background focus:ring-0 focus:border-[#14b8a6] text-sm shadow-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground/70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-none p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-none" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28 rounded-none" />
                    <Skeleton className="h-3 w-20 rounded-none" />
                  </div>
                </div>
                <Skeleton className="h-3 w-36 rounded-none" />
              </div>
            ))
          : patients.map((patient, idx) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="glass-card rounded-none p-5 text-left hover-lift hover:ring-1 hover:ring-teal-200 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-none bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-foreground text-sm font-medium flex-shrink-0 shadow-none`}>
                    {patient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground/80 text-sm truncate group-hover:text-teal-700 transition-colors">
                      {patient.full_name}
                    </h3>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {t("sinceLabel")} {format(parseISO(patient.created_at), "MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-foreground/10 pt-3">
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <Phone className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <span className="truncate">{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <Mail className="w-3 h-3 text-teal-400 flex-shrink-0" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
      </div>

      {patients.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-none bg-background border border-foreground/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground/70 font-medium">{t("noResults")}</p>
          {search ? (
            <p className="text-sm text-foreground/50 mt-1">{t("tryDifferent")}</p>
          ) : (
            <p className="text-sm text-foreground/50 mt-1">{t("autoAdded")}</p>
          )}
        </div>
      )}

      {/* Patient detail modal */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl rounded-none border-foreground/10 shadow-none p-0 overflow-hidden">
          {selectedPatient && (
            <>
              {/* Modal header gradient */}
              <div className="border-b border-foreground/10 bg-foreground/[0.02] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-none bg-foreground/[0.06] backdrop-blur flex items-center justify-center text-foreground font-medium text-xl shadow-none">
                    {selectedPatient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{selectedPatient.full_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-teal-100 text-xs">
                        <Phone className="w-3 h-3" /> {selectedPatient.phone}
                      </span>
                      {selectedPatient.email && (
                        <span className="flex items-center gap-1 text-teal-100 text-xs">
                          <Mail className="w-3 h-3" /> {selectedPatient.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {selectedPatient.notes && (
                  <div className="p-4 bg-background rounded-none border border-foreground/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                      <FileText className="w-4 h-4 text-teal-500" /> {t("notes")}
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed">{selectedPatient.notes}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <h4 className="font-medium text-foreground/80 text-sm">{t("visitHistory")}</h4>
                  </div>
                  {patientAppts && patientAppts.length > 0 ? (
                    <div className="space-y-2">
                      {(patientAppts as any[]).slice(0, 8).map((appt) => {
                        const a = appt as { id: string; start_at: string; end_at: string; status: string; service: { name: string } };
                        return (
                          <div key={a.id} className="flex items-center justify-between p-3 bg-background hover:bg-[#14b8a6]/[0.03]/40 rounded-none transition-colors">
                            <div>
                              <p className="text-sm font-medium text-foreground/80">{a.service?.name}</p>
                              <p className="text-xs text-foreground/50 mt-0.5">
                                {format(parseISO(a.start_at), "MMM d, yyyy · h:mm a")}
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] || "bg-muted text-foreground/60"}`}>
                              {getStatusLabel(a.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-foreground/50">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">{t("noHistory")}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add patient modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="rounded-none border-foreground/10 shadow-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="w-7 h-7 bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-foreground" />
              </div>
              {t("addNewPatient")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t("fullName")}</Label>
              <Input
                placeholder={t("fullNamePlaceholder")}
                className="rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6]"
                {...register("full_name")}
              />
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t("phoneNumber")}</Label>
              <Input
                placeholder={t("phonePlaceholder")}
                className="rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6]"
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">
                {t("email")} <span className="text-foreground/50 font-normal">{t("emailOptional")}</span>
              </Label>
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6]"
                {...register("email")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">
                {t("notesLabel")} <span className="text-foreground/50 font-normal">{t("notesOptional")}</span>
              </Label>
              <Textarea
                placeholder={t("notesPlaceholder")}
                className="rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6] resize-none"
                rows={3}
                {...register("notes")}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-none border-foreground/10" onClick={() => setShowAddModal(false)}>
                {t("cancelButton")}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 text-foreground border-none shadow-none font-medium"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? t("adding") : t("addButton")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
