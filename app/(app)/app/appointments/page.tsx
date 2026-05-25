"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, Filter, RefreshCw, Download } from "lucide-react";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { getAppointments } from "@/actions/appointments";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 20;

/* Dark-mode safe filter tab classes */
const STATUS_FILTER_ACTIVE: Record<string, string> = {
  all: "bg-primary text-primary-foreground",
  booked: "status-booked font-semibold",
  confirmed: "status-confirmed font-semibold",
  completed: "status-completed font-semibold",
  cancelled: "status-cancelled font-semibold",
  no_show: "status-no_show font-semibold",
};

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const t = useTranslations("appointments");

  const statusOptions = [
    { value: "all", label: t("statusAll") },
    { value: "booked", label: t("statusBooked") },
    { value: "confirmed", label: t("statusConfirmed") },
    { value: "completed", label: t("statusCompleted") },
    { value: "cancelled", label: t("statusCancelled") },
    { value: "no_show", label: t("statusNoShow") },
  ];

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  const { data: result, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["appointments", statusFilter, page],
    queryFn: () => getAppointments(page, PAGE_SIZE, statusFilter),
  });

  const appointments = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── BOLD HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-card border-b border-border px-4 py-8 md:px-6 md:py-12 lg:px-10 lg:py-16 fade-in-up flex-shrink-0">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 md:mb-4">
              <CalendarCheck2 className="w-5 h-5 text-primary" strokeWidth={2} />
              <span className="font-semibold text-xs text-primary uppercase tracking-[0.2em]">{t("title")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-2 md:mb-3">
              {t("manageTrack")}
            </h1>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn-secondary flex items-center gap-2 flex-1 md:flex-none justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
            <a
              href="/api/export/appointments"
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-accent transition-colors flex-1 md:flex-none justify-center"
            >
              <Download className="w-4 h-4" />
              CSV
            </a>
          </div>
        </div>
      </div>

      {/* ── CONTENT BODY ──────────────────────────────────────────────────────── */}
      <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 fade-in-up flex-1 w-full" style={{ animationDelay: "0.1s" }}>

        {/* Mobile Swipe Hint */}
        <div className="md:hidden flex items-center justify-center gap-2 text-[11px] font-bold text-muted-foreground bg-muted/30 py-1.5 rounded-xl border border-border">
          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          {t("swipeFiltersHint")}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 md:gap-3 min-w-max">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 border shadow-sm whitespace-nowrap ${
                  statusFilter === opt.value
                    ? STATUS_FILTER_ACTIVE[opt.value] || "bg-primary text-primary-foreground border-transparent"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table card */}
        <div className="card-panel">
          <div className="card-panel-header bg-muted/20">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground text-[15px] uppercase tracking-wider">
                {statusOptions.find(o => o.value === statusFilter)?.label}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {total}
              </span>
            </div>
            <div className="hidden md:block">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48 h-10 rounded-xl text-sm font-bold border-border bg-card shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border font-medium">
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm rounded-lg py-2">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-0">
            <AppointmentTable
              appointments={appointments}
              loading={isLoading}
              onRefresh={refetch}
            />
          </div>
          <div className="px-4">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
