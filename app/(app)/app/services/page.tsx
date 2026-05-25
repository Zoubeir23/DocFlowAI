"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, DollarSign, Edit2, Trash2, HeartPulse, ToggleLeft, ToggleRight, Activity, Smile } from "lucide-react";
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

const EMOJI_LIST = ["🩺", "💉", "🔬", "🧬", "🩻", "🩹", "💊", "🏥", "🦷", "👁️", "🧠", "🦴", "🩸", "🧫", "⚕️", "🚑", "🧑‍⚕️", "👩‍⚕️"];

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
  const [selectedEmoji, setSelectedEmoji] = useState<string>("🩺");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
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

  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;

  const openEdit = (service: Service) => {
    setEditingService(service);
    
    // Extract emoji if present
    const match = service.name.match(emojiRegex);
    if (match) {
      setSelectedEmoji(match[1]);
      setValue("name", match[2].trim());
    } else {
      setSelectedEmoji("🩺"); // default
      setValue("name", service.name);
    }
    
    setValue("duration_minutes", service.duration_minutes);
    setValue("price", service.price ?? undefined);
    setValue("is_active", service.is_active);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingService(null);
    setSelectedEmoji("🩺");
    reset({ is_active: true, name: "", duration_minutes: 30 });
    setShowModal(true);
  };

  const onSubmit = (data: ServiceInput) => {
    // Prefix name with the selected emoji
    const payload = {
      ...data,
      name: `${selectedEmoji} ${data.name.trim()}`
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const defaultIcons = ["🩺", "💉", "🔬", "🧬", "🩻", "🩹", "💊", "🏥"];

  return (
    <div className="min-h-screen bg-background">
      {/* ── BOLD HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-card border-b border-border px-6 py-12 lg:px-10 lg:py-16 fade-in-up">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <HeartPulse className="w-5 h-5 text-primary" strokeWidth={2} />
              <span className="font-semibold text-xs text-primary uppercase tracking-[0.2em]">{t("title")}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              {services.filter(s => s.is_active).length} {tc("active").toLowerCase()} · {services.length} total
            </p>
          </div>
          
          <Button
            onClick={openNew}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
            {t("newService")}
          </Button>
        </div>
      </div>

      {/* ── CONTENT BODY ──────────────────────────────────────────────────────── */}
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 fade-in-up" style={{ animationDelay: "0.1s" }}>
        
        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-panel p-6 space-y-4">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-20 rounded-lg" />
                </div>
              ))
            : services.map((service, idx) => {
                const match = service.name.match(emojiRegex);
                const icon = match ? match[1] : defaultIcons[idx % defaultIcons.length];
                const displayName = match ? match[2] : service.name;

                return (
                  <div
                    key={service.id}
                    className={`card-panel hover-lift group transition-all p-6 flex flex-col ${!service.is_active ? "opacity-50 grayscale" : ""}`}
                  >
                    {/* Icon + status */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shadow-inner">
                        {icon}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                        service.is_active
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {service.is_active ? tc("active") : tc("inactive")}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-foreground text-lg mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {displayName}
                    </h3>

                    {/* Meta */}
                    <div className="space-y-2 mb-6 mt-auto">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-foreground">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        {service.duration_minutes} {t("minutes")}
                      </div>
                      {service.price !== null && service.price !== undefined && (
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-emerald-500">
                            <DollarSign className="w-3.5 h-3.5" />
                          </div>
                          {formatCurrency(service.price || 0)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-9 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all"
                        onClick={() => openEdit(service)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> {tc("edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-9 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all"
                        onClick={() => updateMutation.mutate({ id: service.id, data: { is_active: !service.is_active } })}
                      >
                        {service.is_active ? (
                          <><ToggleRight className="w-4 h-4 mr-1.5 text-primary" /> {tc("active")}</>
                        ) : (
                          <><ToggleLeft className="w-4 h-4 mr-1.5" /> {tc("inactive")}</>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 text-xs rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-transparent transition-all p-0 flex-shrink-0"
                        onClick={() => { if (confirm(t("deleteConfirm"))) deleteMutation.mutate(service.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
        </div>

        {services.length === 0 && !isLoading && (
          <div className="text-center py-24 bg-card border border-border rounded-3xl">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5 shadow-inner">
              <HeartPulse className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-xl text-foreground font-bold mb-2">{t("noServices")}</p>
            <p className="text-base text-muted-foreground">{t("noServicesDesc")}</p>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingService(null); reset({ is_active: true }); setShowEmojiPicker(false); } }}
      >
        <DialogContent className="rounded-3xl border-border shadow-2xl p-0 overflow-hidden max-w-md">
          <DialogHeader className="bg-muted/30 border-b border-border p-6 pb-5">
            <DialogTitle className="flex items-center gap-3 text-xl text-foreground font-bold">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              {editingService ? t("editService") : t("addService")}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">{t("serviceName")}</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-14 h-12 rounded-xl text-2xl border-border hover:bg-accent p-0 flex items-center justify-center shadow-sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {selectedEmoji}
                  </Button>
                  
                  {showEmojiPicker && (
                    <div className="absolute top-14 left-0 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-64 grid grid-cols-5 gap-2">
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-muted rounded-lg transition-colors"
                          onClick={() => { setSelectedEmoji(emoji); setShowEmojiPicker(false); }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <Input
                    placeholder={t("serviceNamePlaceholder")}
                    className="h-12 rounded-xl border-border focus:ring-primary focus:border-primary font-medium shadow-sm text-base"
                    {...register("name")}
                  />
                </div>
              </div>
              {errors.name && <p className="text-xs font-semibold text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">{t("duration")} ({t("minutes")})</Label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  min={5}
                  max={480}
                  placeholder="30"
                  className="pl-12 h-12 rounded-xl border-border focus:ring-primary focus:border-primary font-medium shadow-sm text-base"
                  {...register("duration_minutes")}
                />
              </div>
              {errors.duration_minutes && <p className="text-xs font-semibold text-destructive">{errors.duration_minutes.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">{t("price")} <span className="text-muted-foreground font-medium">({t("optional")})</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="pl-12 h-12 rounded-xl border-border focus:ring-primary focus:border-primary font-medium shadow-sm text-base"
                  {...register("price")}
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl border-border font-bold shadow-sm" onClick={() => setShowModal(false)}>
                {tc("cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 btn-primary"
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
