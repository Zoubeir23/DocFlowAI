"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import {
  startOfMonth, subMonths, format, eachMonthOfInterval,
  startOfDay, getHours, parseISO,
  startOfWeek, subWeeks, eachWeekOfInterval,
} from "date-fns";

export interface MonthlyStats {
  month: string;       // "Jan", "Fév", etc.
  total: number;
  completed: number;
  cancelled: number;
  no_show: number;
  new_patients: number;
}

export interface ServiceStat {
  name: string;
  count: number;
  revenue: number;
}

export interface StatusBreakdown {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface HourStat {
  hour: string;
  count: number;
}

export interface WeeklyFillRate {
  week: string;
  rate: number;
}

export interface WeeklyTrend {
  week: string;
  total: number;
  completed: number;
}

export interface AnalyticsData {
  monthly: MonthlyStats[];
  topServices: ServiceStat[];
  statusBreakdown: StatusBreakdown[];
  peakHours: HourStat[];
  weeklyFillRate: WeeklyFillRate[];
  weekly: WeeklyTrend[];
  totals: {
    allTime: number;
    completionRate: number;
    noShowRate: number;
    totalRevenue: number;
    avgPerMonth: number;
  };
}

async function getAuthenticatedClinicId(): Promise<string | null> {
  const supabase = await createClient();
  const db = supabase as any;
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;
  const { data: userData } = await db
    .from("users").select("clinic_id").eq("id", authData.user.id).single();
  return userData?.clinic_id ?? null;
}

export async function getAnalyticsData(): Promise<AnalyticsData | null> {
  try {
    const clinicId = await getAuthenticatedClinicId();
    if (!clinicId) return null;

    const supabase = await createClient();
    const db = supabase as any;

    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    // Fetch all appointments in the last 6 months with service info
    const { data: appointments } = await db
      .from("appointments")
      .select("id, status, start_at, created_at, service:services(name, price), patient_id")
      .eq("clinic_id", clinicId)
      .gte("start_at", sixMonthsAgo.toISOString())
      .order("start_at");

    const appts: any[] = appointments ?? [];

    // Fetch new patients per month
    const { data: patients } = await db
      .from("patients")
      .select("id, created_at")
      .eq("clinic_id", clinicId)
      .gte("created_at", sixMonthsAgo.toISOString());

    const newPatients: any[] = patients ?? [];

    // All-time appointments for totals
    const { data: allAppts } = await db
      .from("appointments")
      .select("id, status, service:services(price)")
      .eq("clinic_id", clinicId);

    const allApptsList: any[] = allAppts ?? [];

    // ── Monthly stats ───────────────────────────────────────────────────────────
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
    const monthly: MonthlyStats[] = months.map((monthDate) => {
      const monthKey = format(monthDate, "yyyy-MM");
      const monthAppts = appts.filter((a) =>
        format(parseISO(a.start_at), "yyyy-MM") === monthKey
      );
      const monthNewPat = newPatients.filter((p) =>
        format(parseISO(p.created_at), "yyyy-MM") === monthKey
      ).length;

      return {
        month: format(monthDate, "MMM"),
        total: monthAppts.length,
        completed: monthAppts.filter((a) => a.status === "completed").length,
        cancelled: monthAppts.filter((a) => a.status === "cancelled").length,
        no_show: monthAppts.filter((a) => a.status === "no_show").length,
        new_patients: monthNewPat,
      };
    });

    // ── Top services ────────────────────────────────────────────────────────────
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    for (const a of appts) {
      const name = a.service?.name ?? "Service inconnu";
      const price = Number(a.service?.price ?? 0);
      const existing = serviceMap.get(name) ?? { count: 0, revenue: 0 };
      serviceMap.set(name, {
        count: existing.count + 1,
        revenue: existing.revenue + (a.status === "completed" ? price : 0),
      });
    }
    const topServices: ServiceStat[] = Array.from(serviceMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // ── Status breakdown (all time) ─────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const a of allApptsList) {
      statusMap[a.status] = (statusMap[a.status] ?? 0) + 1;
    }
    const statusConfig: Record<string, { label: string; color: string }> = {
      completed: { label: "Terminés", color: "#22c55e" },
      booked: { label: "Réservés", color: "#3b82f6" },
      confirmed: { label: "Confirmés", color: "#6366f1" },
      cancelled: { label: "Annulés", color: "#ef4444" },
      no_show: { label: "Absent", color: "#f59e0b" },
    };
    const statusBreakdown: StatusBreakdown[] = Object.entries(statusMap)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        label: statusConfig[status]?.label ?? status,
        count,
        color: statusConfig[status]?.color ?? "#94a3b8",
      }))
      .sort((a, b) => b.count - a.count);

    // ── Peak hours (last 6 months) ───────────────────────────────────────────────
    const hourMap: Record<number, number> = {};
    for (const a of appts) {
      const hour = getHours(parseISO(a.start_at));
      hourMap[hour] = (hourMap[hour] ?? 0) + 1;
    }
    const peakHours: HourStat[] = Array.from({ length: 12 }, (_, i) => {
      const h = i + 8; // 8h to 19h
      return { hour: `${h}h`, count: hourMap[h] ?? 0 };
    });

    // ── Weekly trend (last 8 weeks) ─────────────────────────────────────────────
    const eightWeeksAgo = startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 });
    const weekStarts = eachWeekOfInterval(
      { start: eightWeeksAgo, end: now },
      { weekStartsOn: 1 },
    );

    // Fetch appointments for weekly calculations
    const { data: weeklyAppointments } = await db
      .from("appointments")
      .select("id, status, start_at")
      .eq("clinic_id", clinicId)
      .gte("start_at", eightWeeksAgo.toISOString())
      .order("start_at");

    const weeklyAppts: any[] = weeklyAppointments ?? [];

    // Fetch availability rules for fill rate calculation
    const { data: availabilityRules } = await db
      .from("availability_rules")
      .select("day_of_week, start_time, end_time")
      .eq("clinic_id", clinicId);

    const rules: any[] = availabilityRules ?? [];

    // Fetch average service duration for slot size
    const { data: servicesData } = await db
      .from("services")
      .select("duration_minutes")
      .eq("clinic_id", clinicId);

    const servicesList: any[] = servicesData ?? [];
    const averageDurationMinutes =
      servicesList.length > 0
        ? servicesList.reduce((sum: number, s: any) => sum + (Number(s.duration_minutes) || 30), 0) /
          servicesList.length
        : 30;

    // Compute weekly slots capacity from availability_rules
    // Each rule: day_of_week (0-6), start_time, end_time
    const weeklySlotCapacity = rules.reduce((totalSlots: number, rule: any) => {
      const [startHour, startMinute] = (rule.start_time as string).split(":").map(Number);
      const [endHour, endMinute] = (rule.end_time as string).split(":").map(Number);
      const durationInMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      return totalSlots + Math.floor(durationInMinutes / averageDurationMinutes);
    }, 0);

    // Fallback: 8h/day × 5 days / average duration if no rules
    const effectiveWeeklyCapacity =
      weeklySlotCapacity > 0
        ? weeklySlotCapacity
        : Math.floor((8 * 60 * 5) / averageDurationMinutes);

    const weekly: WeeklyTrend[] = weekStarts.map((weekStart, index) => {
      const weekEnd = index < weekStarts.length - 1
        ? weekStarts[index + 1]
        : new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekAppts = weeklyAppts.filter((a) => {
        const date = parseISO(a.start_at);
        return date >= weekStart && date < weekEnd;
      });

      return {
        week: `Sem ${index + 1}`,
        total: weekAppts.length,
        completed: weekAppts.filter((a) => a.status === "completed").length,
      };
    });

    const weeklyFillRate: WeeklyFillRate[] = weekStarts.map((weekStart, index) => {
      const weekEnd = index < weekStarts.length - 1
        ? weekStarts[index + 1]
        : new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const bookedCount = weeklyAppts.filter((a) => {
        const date = parseISO(a.start_at);
        return (
          date >= weekStart &&
          date < weekEnd &&
          ["booked", "confirmed", "completed"].includes(a.status)
        );
      }).length;

      const rate =
        effectiveWeeklyCapacity > 0
          ? Math.min(100, Math.round((bookedCount / effectiveWeeklyCapacity) * 100))
          : 0;

      return { week: `Sem ${index + 1}`, rate };
    });

    // ── All-time totals ─────────────────────────────────────────────────────────
    const totalAllTime = allApptsList.length;
    const completedCount = allApptsList.filter((a) => a.status === "completed").length;
    const noShowCount = allApptsList.filter((a) => a.status === "no_show").length;
    const finishedCount = completedCount + noShowCount;
    const totalRevenue = allApptsList
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);

    return {
      monthly,
      topServices,
      statusBreakdown,
      peakHours,
      weeklyFillRate,
      weekly,
      totals: {
        allTime: totalAllTime,
        completionRate: finishedCount > 0 ? Math.round((completedCount / finishedCount) * 100) : 0,
        noShowRate: finishedCount > 0 ? Math.round((noShowCount / finishedCount) * 100) : 0,
        totalRevenue,
        avgPerMonth: monthly.length > 0
          ? Math.round(monthly.reduce((s, m) => s + m.total, 0) / monthly.length)
          : 0,
      },
    };
  } catch (err) {
    console.error("[getAnalyticsData]", err);
    return null;
  }
}
