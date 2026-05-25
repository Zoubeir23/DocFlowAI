"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import {
  startOfMonth, subMonths, format, eachMonthOfInterval,
  getHours, parseISO,
  startOfWeek, subWeeks, eachWeekOfInterval,
  getDay,
} from "date-fns";

export type AnalyticsPeriod = 3 | 6 | 12;

export interface MonthlyStats {
  month: string;
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

export interface DayOfWeekStat {
  day: string;
  shortDay: string;
  count: number;
}

export interface PatientRetention {
  newPatients: number;
  returningPatients: number;
}

export interface KpiVariation {
  current: number;
  previous: number;
  /** Positive = growth, negative = decline, null = no previous data */
  changePercent: number | null;
}

export interface AnalyticsData {
  monthly: MonthlyStats[];
  topServices: ServiceStat[];
  statusBreakdown: StatusBreakdown[];
  peakHours: HourStat[];
  weeklyFillRate: WeeklyFillRate[];
  weekly: WeeklyTrend[];
  dayOfWeek: DayOfWeekStat[];
  patientRetention: PatientRetention;
  totals: {
    allTime: number;
    completionRate: number;
    noShowRate: number;
    totalRevenue: number;
    avgPerMonth: number;
  };
  variations: {
    totalRdv: KpiVariation;
    revenue: KpiVariation;
    newPatients: KpiVariation;
    completionRate: KpiVariation;
  };
  period: AnalyticsPeriod;
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

function computeVariation(current: number, previous: number): KpiVariation {
  const changePercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { current, previous, changePercent };
}

export async function getAnalyticsData(periodInput: AnalyticsPeriod = 6): Promise<AnalyticsData | null> {
  const VALID_PERIODS: AnalyticsPeriod[] = [3, 6, 12];
  const period: AnalyticsPeriod = VALID_PERIODS.includes(periodInput as AnalyticsPeriod)
    ? periodInput
    : 6;

  try {
    const clinicId = await getAuthenticatedClinicId();
    if (!clinicId) return null;

    const supabase = await createClient();
    const db = supabase as any;

    const now = new Date();
    const periodStart = startOfMonth(subMonths(now, period - 1));
    const previousPeriodStart = startOfMonth(subMonths(now, period * 2 - 1));

    // ── Current period appointments ─────────────────────────────────────────────
    const { data: appointments } = await db
      .from("appointments")
      .select("id, status, start_at, created_at, service:services(name, price), patient_id")
      .eq("clinic_id", clinicId)
      .gte("start_at", periodStart.toISOString())
      .order("start_at");

    const appts: any[] = appointments ?? [];

    // ── Previous period appointments (for variation) ────────────────────────────
    const { data: prevAppointments } = await db
      .from("appointments")
      .select("id, status, start_at, service:services(price)")
      .eq("clinic_id", clinicId)
      .gte("start_at", previousPeriodStart.toISOString())
      .lt("start_at", periodStart.toISOString());

    const prevAppts: any[] = prevAppointments ?? [];

    // ── Patients ────────────────────────────────────────────────────────────────
    const { data: patients } = await db
      .from("patients")
      .select("id, created_at")
      .eq("clinic_id", clinicId)
      .gte("created_at", periodStart.toISOString());

    const newPatients: any[] = patients ?? [];

    const { data: prevPatients } = await db
      .from("patients")
      .select("id")
      .eq("clinic_id", clinicId)
      .gte("created_at", previousPeriodStart.toISOString())
      .lt("created_at", periodStart.toISOString());

    const prevNewPatients: any[] = prevPatients ?? [];

    // ── All-time appointments for totals ─────────────────────────────────────────
    const { data: allAppts } = await db
      .from("appointments")
      .select("id, status, service:services(price)")
      .eq("clinic_id", clinicId);

    const allApptsList: any[] = allAppts ?? [];

    // ── Patient retention — returning (had ≥1 RDV before period) vs. new ─────────
    const periodPatientIds = Array.from(new Set(appts.map((a: any) => a.patient_id).filter(Boolean))) as string[];

    let returningCount = 0;
    if (periodPatientIds.length > 0) {
      const CHUNK_SIZE = 200;
      const returningIds = new Set<string>();
      for (let i = 0; i < periodPatientIds.length; i += CHUNK_SIZE) {
        const chunk = periodPatientIds.slice(i, i + CHUNK_SIZE);
        const { data: prevRdvCheck } = await db
          .from("appointments")
          .select("patient_id")
          .eq("clinic_id", clinicId)
          .lt("start_at", periodStart.toISOString())
          .in("patient_id", chunk);
        for (const r of prevRdvCheck ?? []) {
          returningIds.add(r.patient_id);
        }
      }
      returningCount = returningIds.size;
    }
    const newUniquePatients = periodPatientIds.length - returningCount;

    // ── Monthly stats ────────────────────────────────────────────────────────────
    const months = eachMonthOfInterval({ start: periodStart, end: now });
    const monthly: MonthlyStats[] = months.map((monthDate) => {
      const monthKey = format(monthDate, "yyyy-MM");
      const monthAppts = appts.filter((a: any) =>
        format(parseISO(a.start_at), "yyyy-MM") === monthKey
      );
      const monthNewPat = newPatients.filter((p: any) =>
        format(parseISO(p.created_at), "yyyy-MM") === monthKey
      ).length;

      return {
        month: format(monthDate, "MMM"),
        total: monthAppts.length,
        completed: monthAppts.filter((a: any) => a.status === "completed").length,
        cancelled: monthAppts.filter((a: any) => a.status === "cancelled").length,
        no_show: monthAppts.filter((a: any) => a.status === "no_show").length,
        new_patients: monthNewPat,
      };
    });

    // ── Top services ─────────────────────────────────────────────────────────────
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

    // ── Status breakdown (all time) ───────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    for (const a of allApptsList) {
      statusMap[a.status] = (statusMap[a.status] ?? 0) + 1;
    }
    const statusConfig: Record<string, { label: string; color: string }> = {
      completed:  { label: "Terminés",  color: "#22c55e" },
      booked:     { label: "Réservés",  color: "#3b82f6" },
      confirmed:  { label: "Confirmés", color: "#6366f1" },
      cancelled:  { label: "Annulés",   color: "#ef4444" },
      no_show:    { label: "Absent",    color: "#f59e0b" },
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

    // ── Peak hours ────────────────────────────────────────────────────────────────
    const hourMap: Record<number, number> = {};
    for (const a of appts) {
      const hour = getHours(parseISO(a.start_at));
      hourMap[hour] = (hourMap[hour] ?? 0) + 1;
    }
    const peakHours: HourStat[] = Array.from({ length: 12 }, (_, i) => {
      const h = i + 8;
      return { hour: `${h}h`, count: hourMap[h] ?? 0 };
    });

    // ── Day of week ───────────────────────────────────────────────────────────────
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const dayShort = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const dayMap: Record<number, number> = {};
    for (const a of appts) {
      const dow = getDay(parseISO(a.start_at));
      dayMap[dow] = (dayMap[dow] ?? 0) + 1;
    }
    // Mon–Sat only (1–6)
    const dayOfWeek: DayOfWeekStat[] = [1, 2, 3, 4, 5, 6].map((d) => ({
      day: dayNames[d]!,
      shortDay: dayShort[d]!,
      count: dayMap[d] ?? 0,
    }));

    // ── Weekly trend (last 8 weeks) ───────────────────────────────────────────────
    const eightWeeksAgo = startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 });
    const weekStarts = eachWeekOfInterval(
      { start: eightWeeksAgo, end: now },
      { weekStartsOn: 1 },
    );

    const { data: weeklyAppointments } = await db
      .from("appointments")
      .select("id, status, start_at")
      .eq("clinic_id", clinicId)
      .gte("start_at", eightWeeksAgo.toISOString())
      .order("start_at");

    const weeklyAppts: any[] = weeklyAppointments ?? [];

    const { data: availabilityRules } = await db
      .from("availability_rules")
      .select("day_of_week, start_time, end_time")
      .eq("clinic_id", clinicId);

    const rules: any[] = availabilityRules ?? [];

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

    const weeklySlotCapacity = rules.reduce((totalSlots: number, rule: any) => {
      const [startHour, startMinute] = (rule.start_time as string).split(":").map(Number);
      const [endHour, endMinute] = (rule.end_time as string).split(":").map(Number);
      const durationInMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
      return totalSlots + Math.floor(durationInMinutes / averageDurationMinutes);
    }, 0);

    const effectiveWeeklyCapacity =
      weeklySlotCapacity > 0 ? weeklySlotCapacity : Math.floor((8 * 60 * 5) / averageDurationMinutes);

    const weekly: WeeklyTrend[] = weekStarts.map((weekStart, index) => {
      const weekEnd = index < weekStarts.length - 1
        ? weekStarts[index + 1]!
        : new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekAppts = weeklyAppts.filter((a) => {
        const date = parseISO(a.start_at);
        return date >= weekStart && date < weekEnd;
      });

      return {
        week: `Sem ${index + 1}`,
        total: weekAppts.length,
        completed: weekAppts.filter((a: any) => a.status === "completed").length,
      };
    });

    const weeklyFillRate: WeeklyFillRate[] = weekStarts.map((weekStart, index) => {
      const weekEnd = index < weekStarts.length - 1
        ? weekStarts[index + 1]!
        : new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const bookedCount = weeklyAppts.filter((a) => {
        const date = parseISO(a.start_at);
        return (
          date >= weekStart &&
          date < weekEnd &&
          ["booked", "confirmed", "completed"].includes(a.status)
        );
      }).length;

      return {
        week: `Sem ${index + 1}`,
        rate: effectiveWeeklyCapacity > 0
          ? Math.min(100, Math.round((bookedCount / effectiveWeeklyCapacity) * 100))
          : 0,
      };
    });

    // ── All-time totals ───────────────────────────────────────────────────────────
    const totalAllTime = allApptsList.length;
    const completedCount = allApptsList.filter((a: any) => a.status === "completed").length;
    const noShowCount = allApptsList.filter((a: any) => a.status === "no_show").length;
    const finishedCount = completedCount + noShowCount;
    const totalRevenue = allApptsList
      .filter((a: any) => a.status === "completed")
      .reduce((sum: number, a: any) => sum + Number(a.service?.price ?? 0), 0);

    // ── Period-specific metrics for variations ────────────────────────────────────
    const periodRevenue = appts
      .filter((a: any) => a.status === "completed")
      .reduce((sum: number, a: any) => sum + Number(a.service?.price ?? 0), 0);

    const prevRevenue = prevAppts
      .filter((a: any) => a.status === "completed")
      .reduce((sum: number, a: any) => sum + Number(a.service?.price ?? 0), 0);

    const periodCompleted = appts.filter((a: any) => a.status === "completed").length;
    const periodFinished = appts.filter((a: any) => ["completed", "no_show"].includes(a.status)).length;
    const periodCompletionRate = periodFinished > 0 ? Math.round((periodCompleted / periodFinished) * 100) : 0;

    const prevCompleted = prevAppts.filter((a: any) => a.status === "completed").length;
    const prevFinished = prevAppts.filter((a: any) => ["completed", "no_show"].includes(a.status)).length;
    const prevCompletionRate = prevFinished > 0 ? Math.round((prevCompleted / prevFinished) * 100) : 0;

    return {
      monthly,
      topServices,
      statusBreakdown,
      peakHours,
      weeklyFillRate,
      weekly,
      dayOfWeek,
      patientRetention: {
        newPatients: Math.max(0, newUniquePatients),
        returningPatients: returningCount,
      },
      totals: {
        allTime: totalAllTime,
        completionRate: finishedCount > 0 ? Math.round((completedCount / finishedCount) * 100) : 0,
        noShowRate: finishedCount > 0 ? Math.round((noShowCount / finishedCount) * 100) : 0,
        totalRevenue,
        avgPerMonth: monthly.length > 0
          ? Math.round(monthly.reduce((s, m) => s + m.total, 0) / monthly.length)
          : 0,
      },
      variations: {
        totalRdv: computeVariation(appts.length, prevAppts.length),
        revenue: computeVariation(periodRevenue, prevRevenue),
        newPatients: computeVariation(newPatients.length, prevNewPatients.length),
        completionRate: computeVariation(periodCompletionRate, prevCompletionRate),
      },
      period,
    };
  } catch (err) {
    console.error("[getAnalyticsData]", err);
    return null;
  }
}
