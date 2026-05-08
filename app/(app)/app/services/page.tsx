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
import { useTranslations } from "next-intl";

async function fetchClinicId() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
  return data?.clinic_id || null;
}

export default function ServicesPage() {
  const t = useTranslations("services");
  const tc = useTranslations("common");
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
        toast.success(t("created"));
        queryClient.invalidateQueries({ queryKey: ["services"] });
        setShowModal(false);
        reset();
      } else {
        toast.error(result.error || t("createError"));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceInput> }) => updateService(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("updated"));
        queryClient.invalidateQueries({ queryKey: ["services"] });
        setShowModal(false);
        setEditingService(null);
        reset();
      } else {
        toast.error(result.error || t("updateError"));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("deleted"));
        queryClient.invalidateQueries({ queryKey: ["services"] });
      } else {
        toast.error(result.error || t("deleteError"));
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
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">{t("title")}</h2>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            {services.filter(s => s.is_active).length} {tc("active").toLowerCase()} · {services.length} total
          </p>
        </div>
        <Button
          onClick={() => { setEditingService(null); reset({ is_active: true }); setShowModal(true); }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("newService")}
        </Button>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5 space-y-3">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : services.map((service, idx) => (
              <div
                key={service.id}
                className={`bg-card border border-border rounded-lg p-5 hover-lift group transition-all ${!service.is_active ? "opacity-50 grayscale" : ""}`}
              >
                {/* Icon + status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">
                    {serviceIcons[idx % serviceIcons.length]}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    service.is_active
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    {service.is_active ? tc("active") : tc("inactive")}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-medium text-foreground text-sm mb-3 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>

                {/* Meta */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    </div>
                    {service.duration_minutes} {t("minutes")}
                  </div>
                  {service.price !== null && service.price !== undefined && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                      </div>
                      {formatCurrency(service.price || 0)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => openEdit(service)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> {tc("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => updateMutation.mutate({ id: service.id, data: { is_active: !service.is_active } })}
                  >
                    {service.is_active ? (
                      <><ToggleRight className="w-3 h-3 mr-1 text-primary" /> {tc("active")}</>
                    ) : (
                      <><ToggleLeft className="w-3 h-3 mr-1" /> {tc("inactive")}</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 text-xs rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-0"
                    onClick={() => { if (confirm(t("deleteConfirm"))) deleteMutation.mutate(service.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
      </div>

      {services.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">{t("noServices")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("noServicesDesc")}</p>
        </div>
      )}

      {/* Add/Edit modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingService(null); reset({ is_active: true }); } }}
      >
        <DialogContent className="rounded-lg border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              {editingService ? t("editService") : t("addService")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">{t("serviceName")}</Label>
              <Input
                placeholder={t("serviceNamePlaceholder")}
                className="rounded-lg border-border focus:ring-primary focus:border-primary"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">{t("duration")} ({t("minutes")})</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={5}
                  max={480}
                  placeholder="30"
                  className="pl-9 rounded-lg border-border focus:ring-primary focus:border-primary"
                  {...register("duration_minutes")}
                />
              </div>
              {errors.duration_minutes && <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">{t("price")} <span className="text-muted-foreground font-normal">({t("optional")})</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="pl-9 rounded-lg border-border focus:ring-primary focus:border-primary"
                  {...register("price")}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-lg border-border" onClick={() => setShowModal(false)}>
                {tc("cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingService ? tc("save") : t("createService")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
