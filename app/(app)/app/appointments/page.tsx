"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Filter, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppointmentWithRelations } from "@/types";
import { useTranslations } from "next-intl";

async function fetchClinicId(): Promise<string | null> {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).single();
  return (data as { clinic_id: string } | null)?.clinic_id || null;
}

async function fetchAppointments(clinicId: string, status: string) {
  const supabase = createClient() as any;
  let query = supabase
    .from("appointments")
    .select("*, patient:patients(*), service:services(*)")
    .eq("clinic_id", clinicId)
    .order("start_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);

  const { data } = await query.limit(100);
  return (data || []) as unknown as AppointmentWithRelations[];
}

const STATUS_COUNT_COLORS: Record<string, string> = {
  all: "bg-slate-100 text-slate-600",
  booked: "bg-teal-50 text-teal-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-50 text-slate-600",
  cancelled: "bg-red-50 text-red-600",
  no_show: "bg-amber-50 text-amber-700",
};

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const t = useTranslations("appointments");

  const statusOptions = [
    { value: "all", label: t("statusAll") },
    { value: "booked", label: t("statusBooked") },
    { value: "confirmed", label: t("statusConfirmed") },
    { value: "completed", label: t("statusCompleted") },
    { value: "cancelled", label: t("statusCancelled") },
    { value: "no_show", label: t("statusNoShow") },
  ];

  const { data: clinicId } = useQuery({ queryKey: ["clinicId"], queryFn: fetchClinicId });

  const { data: appointments = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["appointments", clinicId, statusFilter],
    queryFn: () => fetchAppointments(clinicId!, statusFilter),
    enabled: !!clinicId,
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t("title")}</h2>
          </div>
          <p className="text-slate-500 text-sm ml-10">{t("manageTrack")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          {t("refresh")}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
              statusFilter === opt.value
                ? "gradient-brand text-white border-transparent shadow-md shadow-teal-200/40"
                : "bg-white border-slate-200 text-slate-500 hover:border-teal-200 hover:text-teal-600 hover:bg-teal-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 text-sm">
              {statusOptions.find(o => o.value === statusFilter)?.label}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COUNT_COLORS[statusFilter]}`}>
              {appointments.length}
            </span>
          </div>
          <div className="hidden md:block">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-8 rounded-xl text-xs border-slate-200 bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm rounded-lg">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-4">
          <AppointmentTable
            appointments={appointments}
            loading={isLoading}
            onRefresh={refetch}
          />
        </div>
      </div>
    </div>
  );
}
