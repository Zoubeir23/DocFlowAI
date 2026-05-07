"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, DollarSign, Edit2, Trash2, Stethoscope, ToggleLeft, ToggleRight, Activity } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createService, updateService, deleteService, getServices } from "@/actions/services";
import { serviceSchema, type ServiceInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@/types";

async function fetchClinicId() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
  return data?.clinic_id || null;
}

export default function ServicesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  const { data: clinicId } = useQuery({ queryKey: ["clinicId"], queryFn: fetchClinicId });

  const { data: servicesResult, isLoading } = useQuery({
    queryKey: ["services", clinicId],
    queryFn: () => getServices(clinicId!),
    enabled: !!clinicId,
  });

  const services = servicesResult?.data || [];

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { is_active: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: ServiceInput) => createService(clinicId!, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Service created");
        queryClient.invalidateQueries({ queryKey: ["services"] });
        setShowModal(false);
        reset();
      } else {
        toast.error(result.error || "Failed to create service");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceInput> }) => updateService(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Service updated");
        queryClient.invalidateQueries({ queryKey: ["services"] });
        setShowModal(false);
        setEditingService(null);
        reset();
      } else {
        toast.error(result.error || "Failed to update");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Service deleted");
        queryClient.invalidateQueries({ queryKey: ["services"] });
      } else {
        toast.error(result.error || "Failed to delete");
      }
    },
  });

  const openEdit = (service: Service) => {
    setEditingService(service);
    setValue("name", service.name);
    setValue("duration_minutes", service.duration_minutes);
    setValue("price", service.price ?? undefined);
    setValue("is_active", service.is_active);
    setShowModal(true);
  };

  const onSubmit = (data: ServiceInput) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const serviceIcons = ["🩺", "💉", "🔬", "🧬", "🩻", "🩹", "💊", "🏥"];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Services</h2>
          </div>
          <p className="text-slate-500 text-sm ml-10">
            {services.filter(s => s.is_active).length} active · {services.length} total
          </p>
        </div>
        <Button
          onClick={() => { setEditingService(null); reset({ is_active: true }); setShowModal(true); }}
          className="rounded-xl gradient-brand text-white border-none shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.02] transition-all font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>
            ))
          : services.map((service, idx) => (
              <div
                key={service.id}
                className={`glass-card rounded-2xl p-5 hover-lift group transition-all ${!service.is_active ? "opacity-60 saturate-0" : ""}`}
              >
                {/* Icon + status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-center text-xl">
                    {serviceIcons[idx % serviceIcons.length]}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    service.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                    {service.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-bold text-slate-800 text-sm mb-3 group-hover:text-teal-700 transition-colors">
                  {service.name}
                </h3>

                {/* Meta */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-5 h-5 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3 h-3 text-teal-500" />
                    </div>
                    {service.duration_minutes} minutes
                  </div>
                  {service.price !== null && service.price !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                      </div>
                      {formatCurrency(service.price || 0)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                    onClick={() => openEdit(service)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    onClick={() => updateMutation.mutate({ id: service.id, data: { is_active: !service.is_active } })}
                  >
                    {service.is_active ? (
                      <><ToggleRight className="w-3 h-3 mr-1 text-emerald-500" /> Active</>
                    ) : (
                      <><ToggleLeft className="w-3 h-3 mr-1" /> Inactive</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 text-xs rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 p-0"
                    onClick={() => { if (confirm("Delete this service?")) deleteMutation.mutate(service.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
      </div>

      {services.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold">No services yet</p>
          <p className="text-sm text-slate-400 mt-1">Add the services your clinic provides to allow AI-powered booking</p>
        </div>
      )}

      {/* Add/Edit modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingService(null); reset({ is_active: true }); } }}
      >
        <DialogContent className="rounded-2xl border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Service Name</Label>
              <Input
                placeholder="e.g. General Consultation"
                className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Duration (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  min={5}
                  max={480}
                  placeholder="30"
                  className="pl-9 rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                  {...register("duration_minutes")}
                />
              </div>
              {errors.duration_minutes && <p className="text-xs text-red-500">{errors.duration_minutes.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Price <span className="text-slate-400 font-normal">(optional)</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="pl-9 rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                  {...register("price")}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl border-slate-200" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl gradient-brand text-white border-none shadow-md shadow-teal-200/40 font-semibold"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingService ? "Save Changes" : "Create Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
