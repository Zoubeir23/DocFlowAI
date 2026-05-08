import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/actions/appointments";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import {
  CalendarClock,
  CalendarHeart,
  UsersRound,
  CheckCircle,
  CalendarMinus,
  CalendarX,
  Clock,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { AppointmentWithRelations } from "@/types";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

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

  const [stats, todayAppts, upcomingAppts] = await Promise.all([
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
  ]);

  return (
    <div className="p-8 lg:p-12 space-y-8 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[1px] h-3 bg-primary"></div>
            <span className="font-mono text-[15px] text-muted-foreground uppercase tracking-[0.15em]">{t("liveDashboard")}</span>
          </div>
          <h2 className="font-cormorant font-normal text-[40px] text-foreground tracking-tight leading-none">
            {greeting}, {formattedName}
          </h2>
          <p className="font-sans font-normal text-muted-foreground text-[15px] mt-4 capitalize">
            {format(today, "EEEE, d MMMM yyyy", { locale: dfLocale })} — {userData.clinic?.name}
          </p>
        </div>
        <Link
          href="/app/appointments"
          className="btn-void-ghost flex items-center gap-2"
        >
          {t("viewAllAppointments")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="void-grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
        <StatCard
          title={t("statToday")}
          value={stats.todayAppointments}
          icon={CalendarClock}
          change={{ value: t("scheduledToday"), trend: "neutral" }}
        />
        <StatCard
          title={t("statUpcoming")}
          value={stats.upcomingAppointments}
          icon={Clock}
          change={{ value: t("bookedConfirmed"), trend: "neutral" }}
        />
        <StatCard
          title={t("statPatients")}
          value={stats.totalPatients}
          icon={UsersRound}
          change={{ value: t("allTime"), trend: "up" }}
        />
        <StatCard
          title={t("statCancellations")}
          value={stats.pendingCancellations}
          icon={CalendarMinus}
          change={{ value: stats.pendingCancellations > 0 ? t("statNeedsAttention") : t("statAllClear"), trend: stats.pendingCancellations > 0 ? "down" : "neutral" }}
        />
        <StatCard
          title={t("statCompletion")}
          value={`${stats.completionRate}%`}
          icon={CheckCircle}
          change={{ value: t("statVsTotal"), trend: "up" }}
        />
        <StatCard
          title={t("statNoShows")}
          value={`${stats.noShowRate}%`}
          icon={CalendarX}
          change={{ value: t("statMissedVisits"), trend: stats.noShowRate > 20 ? "down" : "neutral" }}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 fade-in-up" style={{ animationDelay: "0.2s" }}>

        {/* Today's schedule */}
        <div className="xl:col-span-2">
          <div className="void-card">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border">
              <div className="flex items-center gap-3">
                <CalendarClock strokeWidth={1.5} className="w-5 h-5 text-foreground" />
                <div>
                  <h3 className="font-cormorant font-normal text-[22px] text-foreground">{t("todaySchedule")}</h3>
                  <p className="font-mono text-[15px] uppercase tracking-[0.1em] text-muted-foreground">{format(today, "EEEE, d MMM", { locale: dfLocale })}</p>
                </div>
              </div>
              <span className="font-mono text-[14px] uppercase tracking-[0.1em] text-primary">
                {(todayAppts.data || []).length} {t("appointments")}
              </span>
            </div>
            <div className="p-4">
              <AppointmentTable
                appointments={(todayAppts.data || []) as unknown as AppointmentWithRelations[]}
              />
            </div>
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div className="space-y-8">
          {/* Upcoming appointments */}
          <div className="void-card">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Clock strokeWidth={1.5} className="w-5 h-5 text-foreground" />
                <h3 className="font-cormorant font-normal text-[22px] text-foreground">{t("upcoming")}</h3>
              </div>
              <Link href="/app/appointments" className="font-mono text-[14px] text-primary uppercase tracking-[0.1em] hover:text-foreground transition-colors flex items-center gap-1">
                {t("seeAll")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4 space-y-1">
              {(upcomingAppts.data || []).length === 0 ? (
                <div className="text-center py-12">
                  <Clock strokeWidth={1} className="w-10 h-10 text-foreground/10 mx-auto mb-4" />
                  <p className="font-sans font-normal text-[15px] text-muted-foreground">{t("noUpcoming")}</p>
                </div>
              ) : (
                ((upcomingAppts.data || []) as AppointmentWithRelations[]).map((appt) => {
                  const a = appt as AppointmentWithRelations;
                  const statusColors: Record<string, string> = {
                    confirmed: "bg-primary",
                    booked: "bg-muted-foreground",
                    default: "bg-muted",
                  };
                  const dot = statusColors[a.status] || statusColors.default;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 p-4 hover:bg-accent transition-colors group border-l border-transparent hover:border-primary"
                    >
                      <div className={`w-[3px] h-[3px] rounded-full flex-shrink-0 ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-normal text-[14px] text-foreground truncate group-hover:text-foreground transition-colors">
                          {a.patient?.full_name}
                        </p>
                        <p className="font-mono text-[14px] text-muted-foreground uppercase tracking-wide truncate mt-1">
                          {a.service?.name} · {format(new Date(a.start_at), "d MMM, H:mm", { locale: dfLocale })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI widget promo */}
          <div className="void-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles strokeWidth={1.5} className="w-5 h-5 text-primary" />
              <span className="font-mono text-[14px] text-foreground uppercase tracking-[0.15em]">{t("aiAssistant")}</span>
            </div>
            <h4 className="font-cormorant font-normal text-[24px] text-foreground mb-2">{t("smartBookingActive")}</h4>
            <p className="font-sans font-normal text-[15px] text-foreground leading-relaxed mb-8">{t("aiWidgetLive")}</p>
            <Link
              href="/app/ai-settings"
              className="btn-void-ghost flex items-center justify-center gap-2 w-full"
            >
              {t("configureAI")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
