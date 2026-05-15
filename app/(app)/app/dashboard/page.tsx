import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/actions/appointments";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import {
  CalendarClock,
  Users,
  CalendarMinus,
  CalendarX2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap,
} from "lucide-react";
import type { AppointmentWithRelations } from "@/types";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getQuotaUsage } from "@/lib/subscription/quota";

export default async function DashboardPage() {
  const supabase = await createClient();
  const db = supabase as any;
  const t = await getTranslations("dashboard");
  const localeStr = await getLocale();
  const dfLocale = localeStr === "fr" ? fr : enUS;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, full_name, clinic:clinics(name)")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string; full_name: string; clinic: { name: string } } | null };

  if (!userData) redirect("/onboarding");

  const clinicId = userData.clinic_id;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const hour = today.getHours();
  const greeting = hour < 12 ? t("greeting.morning") : hour < 17 ? t("greeting.afternoon") : t("greeting.evening");
  const rawName = userData.full_name || "Doctor";
  const formattedName = rawName.toLowerCase().startsWith("dr") ? rawName : `Dr. ${rawName}`;

  const [stats, todayAppts, upcomingAppts, quotaUsage] = await Promise.all([
    getDashboardStats(clinicId),
    db
      .from("appointments")
      .select("*, patient:patients(*), service:services(*)")
      .eq("clinic_id", clinicId)
      .gte("start_at", `${todayStr}T00:00:00`)
      .lt("start_at", `${todayStr}T23:59:59`)
      .neq("status", "cancelled")
      .order("start_at"),
    db
      .from("appointments")
      .select("*, patient:patients(*), service:services(*)")
      .eq("clinic_id", clinicId)
      .gte("start_at", new Date().toISOString())
      .in("status", ["booked", "confirmed"])
      .order("start_at")
      .limit(6),
    getQuotaUsage(clinicId, db).catch(() => null),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── BOLD HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-card border-b border-border px-4 py-8 md:px-6 md:py-12 lg:px-10 lg:py-16 fade-in-up flex-shrink-0">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 md:mb-4">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-semibold text-[10px] md:text-xs text-primary uppercase tracking-[0.2em]">{t("liveDashboard")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-foreground tracking-tight mb-2 md:mb-3">
              {greeting}, <br className="md:hidden" /> <span className="text-primary">{formattedName}</span>
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground font-medium max-w-xl">
              {format(today, "EEEE, d MMMM yyyy", { locale: dfLocale })}
              <span className="mx-2 md:mx-3 opacity-30">|</span>
              {userData.clinic?.name}
            </p>
          </div>
          
          <Link
            href="/app/appointments"
            className="btn-primary flex items-center justify-center gap-2 flex-shrink-0 w-full md:w-auto"
          >
            {t("viewAllAppointments")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── CONTENT BODY ──────────────────────────────────────────────────────── */}
      <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 flex-1 w-full">

        {/* Top Stats - 3 Columns for impact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
          <StatCard
            title={t("statToday")}
            value={stats.todayAppointments}
            icon={CalendarClock}
            change={{ value: t("scheduledToday"), trend: "neutral" }}
          />
          <StatCard
            title={t("statPatients")}
            value={stats.totalPatients}
            icon={Users}
            change={{ value: t("allTime"), trend: "up" }}
          />
          <StatCard
            title={t("statCompletion")}
            value={`${stats.completionRate}%`}
            icon={TrendingUp}
            change={{ value: t("statVsTotal"), trend: "up" }}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 fade-in-up" style={{ animationDelay: "0.2s" }}>
          
          {/* Main Column: Today's Appointments */}
          <div className="xl:col-span-2 space-y-8">
            <div className="card-panel">
              <div className="card-panel-header">
                <div>
                  <h3 className="text-lg font-bold text-foreground tracking-tight">{t("todaySchedule")}</h3>
                  <p className="text-sm text-muted-foreground">{format(today, "EEEE, d MMM", { locale: dfLocale })}</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 text-primary font-bold px-4 py-1.5 rounded-full text-sm">
                  {(todayAppts.data || []).length} {t("appointments")}
                </div>
              </div>
              <div className="p-0">
                <AppointmentTable
                  appointments={(todayAppts.data || []) as unknown as AppointmentWithRelations[]}
                />
              </div>
            </div>
            
            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="icon-box-sm bg-muted"><Clock className="w-4 h-4 text-muted-foreground" /></div>
                <div>
                  <p className="text-xl font-bold">{stats.upcomingAppointments}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t("statUpcoming")}</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="icon-box-sm bg-destructive/10"><CalendarMinus className="w-4 h-4 text-destructive" /></div>
                <div>
                  <p className="text-xl font-bold text-destructive">{stats.pendingCancellations}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t("statCancellations")}</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="icon-box-sm bg-amber-500/10"><CalendarX2 className="w-4 h-4 text-amber-500" /></div>
                <div>
                  <p className="text-xl font-bold">{stats.noShowRate}%</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{t("statNoShows")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-8">
            
            {/* AI Assistant Promo - Premium Dark Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Sparkles className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-primary-foreground/20 px-3 py-1 rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                  <span className="text-xs font-bold tracking-wider uppercase text-primary-foreground">{t("aiAssistant")}</span>
                </div>
                <h4 className="text-2xl font-bold mb-3 text-primary-foreground">{t("smartBookingActive")}</h4>
                <p className="text-primary-foreground/70 font-medium mb-8 leading-relaxed">
                  {t("aiWidgetLive")}
                </p>
                <Link
                  href="/app/ai-settings"
                  className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-xl font-bold transition-all"
                >
                  {t("configureAI")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quota Usage Card */}
            {quotaUsage && (() => {
              const appt = quotaUsage.appointments;
              const staff = quotaUsage.staff;
              const apptPct = appt.limit ? Math.min((appt.current / appt.limit) * 100, 100) : 0;
              const staffPct = staff.limit ? Math.min((staff.current / staff.limit) * 100, 100) : 0;
              const isApptCritical = appt.limit !== null && appt.current >= appt.limit;
              const isApptWarning = appt.limit !== null && apptPct >= 80 && !isApptCritical;
              return (
                <div className="card-panel overflow-hidden">
                  <div className="card-panel-header">
                    <div className="flex items-center gap-2">
                      {isApptCritical
                        ? <AlertTriangle className="w-4 h-4 text-destructive" />
                        : isApptWarning
                          ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                          : <Zap className="w-4 h-4 text-primary" />
                      }
                      <h3 className="font-bold text-foreground">{t("planUsage")}</h3>
                    </div>
                    <Link href="/app/billing" className="text-xs font-semibold text-primary hover:underline">
                      {t("viewPlans")}
                    </Link>
                  </div>
                  {isApptCritical && (
                    <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {t("appointmentsLimitReached")}
                    </div>
                  )}
                  {isApptWarning && (
                    <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {t("appointmentsLimitApproaching")}
                    </div>
                  )}
                  <div className="px-4 pb-4 space-y-4">
                    {/* Appointments bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">{t("appointmentsThisMonth")}</span>
                        <span className={`text-xs font-bold ${isApptCritical ? "text-destructive" : isApptWarning ? "text-amber-500" : "text-foreground"}`}>
                          {appt.current}{appt.limit !== null ? ` / ${appt.limit}` : " / ∞"}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isApptCritical ? "bg-destructive" : isApptWarning ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: appt.limit ? `${apptPct}%` : "100%" }}
                        />
                      </div>
                    </div>
                    {/* Staff bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">{t("staffAccounts")}</span>
                        <span className={`text-xs font-bold ${staffPct >= 100 ? "text-destructive" : staffPct >= 80 ? "text-amber-500" : "text-foreground"}`}>
                          {staff.current}{staff.limit !== null ? ` / ${staff.limit}` : " / ∞"}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${staffPct >= 100 ? "bg-destructive" : staffPct >= 80 ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: staff.limit ? `${staffPct}%` : "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Upcoming Appointments Feed */}
            <div className="card-panel">
              <div className="card-panel-header">
                <h3 className="font-bold text-foreground">{t("upcoming")}</h3>
                <Link href="/app/appointments" className="text-sm font-semibold text-primary hover:underline">
                  {t("seeAll")}
                </Link>
              </div>
              <div className="p-2">
                {(upcomingAppts.data || []).length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t("noUpcoming")}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {((upcomingAppts.data || []) as AppointmentWithRelations[]).map((appt) => {
                      const a = appt as AppointmentWithRelations;
                      const statusDots: Record<string, string> = {
                        confirmed: "bg-primary",
                        booked: "bg-muted-foreground",
                        default: "bg-muted",
                      };
                      const dot = statusDots[a.status] || statusDots.default;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-4 p-3 hover:bg-accent rounded-xl transition-colors group cursor-default"
                        >
                          <div className="w-12 h-12 rounded-xl bg-card border border-border flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">
                              {format(new Date(a.start_at), "MMM", { locale: dfLocale })}
                            </span>
                            <span className="text-sm font-bold text-foreground leading-none">
                              {format(new Date(a.start_at), "dd")}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                              <p className="text-sm font-bold text-foreground truncate">
                                {a.patient?.full_name}
                              </p>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground truncate">
                              {format(new Date(a.start_at), "H:mm", { locale: dfLocale })} · {a.service?.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
