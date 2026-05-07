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

async function fetchClinicId() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
  return data?.clinic_id || null;
}

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-teal-50 text-teal-700 border border-teal-100",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  completed: "bg-slate-50 text-slate-600 border border-slate-200",
  cancelled: "bg-red-50 text-red-600 border border-red-100",
  no_show: "bg-amber-50 text-amber-700 border border-amber-100",
};

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

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
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Patients</h2>
          </div>
          <p className="text-slate-500 text-sm ml-10">
            {patientsResult?.total || 0} patients registered
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl gradient-brand text-white border-none shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.02] transition-all duration-200 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name, phone, or email..."
          className="pl-10 h-10 rounded-xl border-slate-200 bg-white focus:ring-teal-500 focus:border-teal-400 text-sm shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
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
                className="glass-card rounded-2xl p-5 text-left hover-lift hover:ring-1 hover:ring-teal-200 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
                    {patient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-700 text-sm truncate group-hover:text-teal-700 transition-colors">
                      {patient.full_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Since {format(parseISO(patient.created_at), "MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <span className="truncate">{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
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
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold">No patients found</p>
          {search ? (
            <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
          ) : (
            <p className="text-sm text-slate-400 mt-1">Patients are added automatically when they book via the AI widget</p>
          )}
        </div>
      )}

      {/* Patient detail modal */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-slate-100 shadow-2xl p-0 overflow-hidden">
          {selectedPatient && (
            <>
              {/* Modal header gradient */}
              <div className="gradient-brand px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedPatient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedPatient.full_name}</h3>
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
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <FileText className="w-4 h-4 text-teal-500" /> Notes
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedPatient.notes}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <h4 className="font-bold text-slate-700 text-sm">Visit History</h4>
                  </div>
                  {patientAppts && patientAppts.length > 0 ? (
                    <div className="space-y-2">
                      {(patientAppts as any[]).slice(0, 8).map((appt) => {
                        const a = appt as { id: string; start_at: string; end_at: string; status: string; service: { name: string } };
                        return (
                          <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-teal-50/40 rounded-xl transition-colors">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{a.service?.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {format(parseISO(a.start_at), "MMM d, yyyy · h:mm a")}
                              </p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[a.status] || "bg-slate-100 text-slate-500"}`}>
                              {getStatusLabel(a.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm">No appointment history yet</p>
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
        <DialogContent className="rounded-2xl border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Add New Patient
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Full Name</Label>
              <Input
                placeholder="Dr. John Smith"
                className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                {...register("full_name")}
              />
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Phone Number</Label>
              <Input
                placeholder="+1-555-0123"
                className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Email <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input
                type="email"
                placeholder="patient@email.com"
                className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                {...register("email")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea
                placeholder="Allergies, medical history..."
                className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400 resize-none"
                rows={3}
                {...register("notes")}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl border-slate-200" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl gradient-brand text-white border-none shadow-md shadow-teal-200/40 font-semibold"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Add Patient"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
