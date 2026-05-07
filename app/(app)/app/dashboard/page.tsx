import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/actions/appointments";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import {
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Activity,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { AppointmentWithRelations } from "@/types";
import { format } from "date-fns";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const db = supabase as any;

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
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (userData.full_name || "Doctor").split(" ")[0];

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
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="pulse-dot" />
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Live Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {greeting}, Dr. {firstName}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {format(today, "EEEE, MMMM d, yyyy")} — {userData.clinic?.name}
          </p>
        </div>
        <Link
          href="/app/appointments"
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.02] transition-all duration-200"
        >
          <Activity className="w-4 h-4" />
          View All Appointments
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Today"
          value={stats.todayAppointments}
          icon={Calendar}
          gradient="linear-gradient(135deg,#0d9488,#0891b2)"
          change="Scheduled today"
          changeType="neutral"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingAppointments}
          icon={Clock}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
          change="Booked & confirmed"
          changeType="neutral"
        />
        <StatCard
          title="Patients"
          value={stats.totalPatients}
          icon={Users}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          change="All time"
          changeType="positive"
        />
        <StatCard
          title="Cancellations"
          value={stats.pendingCancellations}
          icon={AlertCircle}
          iconColor="text-rose-500"
          iconBg="bg-rose-50"
          change={stats.pendingCancellations > 0 ? "Needs attention" : "All clear"}
          changeType={stats.pendingCancellations > 0 ? "negative" : "neutral"}
        />
        <StatCard
          title="Completion"
          value={`${stats.completionRate}%`}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          change="vs. total"
          changeType="positive"
        />
        <StatCard
          title="No-Shows"
          value={`${stats.noShowRate}%`}
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          change="Missed visits"
          changeType={stats.noShowRate > 20 ? "negative" : "neutral"}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Today's schedule */}
        <div className="xl:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Today's Schedule</h3>
                  <p className="text-xs text-slate-400">{format(today, "EEEE, MMM d")}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                {(todayAppts.data || []).length} appointments
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
        <div className="space-y-4">
          {/* Upcoming appointments */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-cyan-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Upcoming</h3>
              </div>
              <Link href="/app/appointments" className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-0.5">
                See all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3 space-y-1.5">
              {(upcomingAppts.data || []).length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No upcoming appointments</p>
                </div>
              ) : (
                ((upcomingAppts.data || []) as AppointmentWithRelations[]).map((appt) => {
                  const a = appt as AppointmentWithRelations;
                  const statusColors: Record<string, string> = {
                    confirmed: "bg-emerald-400",
                    booked: "bg-teal-400",
                    default: "bg-slate-300",
                  };
                  const dot = statusColors[a.status] || statusColors.default;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-teal-700 transition-colors">
                          {a.patient?.full_name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {a.service?.name} · {format(new Date(a.start_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI widget promo */}
          <div className="rounded-2xl gradient-brand p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span className="text-xs font-semibold text-teal-100 uppercase tracking-wider">AI Assistant</span>
              </div>
              <p className="text-sm font-bold mb-1">Smart Booking Active</p>
              <p className="text-xs text-teal-100/80 leading-relaxed">Your AI widget is live and accepting patient bookings 24/7.</p>
              <Link
                href="/app/ai-settings"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
              >
                Configure AI <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
