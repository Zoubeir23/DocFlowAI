"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsData, type AnalyticsPeriod, type KpiVariation } from "@/actions/analytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Calendar, CheckCircle2, AlertTriangle,
  Loader2, BarChart3, Clock, Zap, Download, UserCheck, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function VariationBadge({ variation }: { variation: KpiVariation }) {
  if (variation.changePercent === null) return null;
  const isPositive = variation.changePercent >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md",
      isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
    )}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? "+" : ""}{variation.changePercent}%
    </span>
  );
}

function StatCard({
  title, value, subtitle, icon: Icon, color = "primary", variation,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: "primary" | "emerald" | "amber" | "destructive";
  variation?: KpiVariation;
}) {
  const colorMap = {
    primary:     "bg-primary/10 text-primary",
    emerald:     "bg-emerald-500/10 text-emerald-600",
    amber:       "bg-amber-500/10 text-amber-600",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {variation && <VariationBadge variation={variation} />}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Period selector ───────────────────────────────────────────────────────────

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: "3 mois",  value: 3  },
  { label: "6 mois",  value: 6  },
  { label: "12 mois", value: 12 },
];

// ── CSV export ────────────────────────────────────────────────────────────────

function exportAnalyticsCsv(data: Awaited<ReturnType<typeof getAnalyticsData>>) {
  if (!data) return;

  const rows: string[] = [
    "Mois,Total RDV,Terminés,Annulés,Absences,Nouveaux patients",
    ...data.monthly.map((m) =>
      `${m.month},${m.total},${m.completed},${m.cancelled},${m.no_show},${m.new_patients}`
    ),
    "",
    "Service,Nombre RDV,CA (€)",
    ...data.topServices.map((s) =>
      `"${s.name}",${s.count},${s.revenue.toFixed(2)}`
    ),
    "",
    "Heure,Nombre RDV",
    ...data.peakHours.map((h) => `${h.hour},${h.count}`),
    "",
    "Jour,Nombre RDV",
    ...data.dayOfWeek.map((d) => `${d.day},${d.count}`),
    "",
    "Indicateur,Valeur",
    `Total RDV (tous),${data.totals.allTime}`,
    `Taux de complétion,${data.totals.completionRate}%`,
    `Taux d'absence,${data.totals.noShowRate}%`,
    `CA total (€),${data.totals.totalRevenue.toFixed(2)}`,
    `Moy. RDV/mois,${data.totals.avgPerMonth}`,
    `Patients nouveaux (période),${data.patientRetention.newPatients}`,
    `Patients récurrents (période),${data.patientRetention.returningPatients}`,
  ];

  const csv = rows.join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `statistiques-docflow-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(6);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", period],
    queryFn: () => getAnalyticsData(period),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Impossible de charger les données.</p>
        </div>
      </div>
    );
  }

  const { monthly, topServices, statusBreakdown, peakHours, weeklyFillRate, weekly, dayOfWeek, patientRetention, totals, variations } = data;
  const hasData = totals.allTime > 0;
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "6 mois";

  return (
    <div className="page-container max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="section-header">
          <div className="icon-container">
            <BarChart3 className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="section-title">Analyses</h2>
            <p className="section-subtitle">Performances de votre cabinet</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  period === p.value
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* CSV Export */}
          {hasData && (
            <button
              type="button"
              onClick={() => exportAnalyticsCsv(data)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter CSV
            </button>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Pas encore de données</p>
            <p className="text-sm text-muted-foreground mt-1">Vos statistiques apparaîtront ici après vos premiers rendez-vous.</p>
          </div>
          <Link href="/app/calendar" className="btn-primary text-sm px-4 py-2 rounded-xl">
            Gérer le calendrier
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Cards with M/M variation */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="RDV sur la période"
              value={variations.totalRdv.current}
              subtitle={`vs ${variations.totalRdv.previous} période préc.`}
              icon={Calendar}
              color="primary"
              variation={variations.totalRdv}
            />
            <StatCard
              title="Taux de complétion"
              value={`${variations.completionRate.current}%`}
              subtitle="des RDV terminés"
              icon={CheckCircle2}
              color="emerald"
              variation={variations.completionRate}
            />
            <StatCard
              title="Nouveaux patients"
              value={variations.newPatients.current}
              subtitle={`vs ${variations.newPatients.previous} période préc.`}
              icon={Users}
              color="primary"
              variation={variations.newPatients}
            />
            <StatCard
              title="Taux d'absence"
              value={`${totals.noShowRate}%`}
              subtitle="no-show (global)"
              icon={AlertTriangle}
              color="amber"
            />
          </div>

          {/* Revenue banner */}
          {totals.totalRevenue > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-sm font-medium">CA total (RDV terminés)</p>
                  <p className="text-3xl font-bold mt-0.5">
                    {totals.totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </p>
                </div>
              </div>

              {/* Patient retention */}
              <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rétention patients — {periodLabel}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Nouveaux</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{patientRetention.newPatients}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-muted-foreground">Récurrents</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{patientRetention.returningPatients}</span>
                    </div>
                    {patientRetention.newPatients + patientRetention.returningPatients > 0 && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex mt-1">
                        <div
                          className="h-full bg-primary rounded-l-full transition-all duration-500"
                          style={{ width: `${Math.round((patientRetention.newPatients / (patientRetention.newPatients + patientRetention.returningPatients)) * 100)}%` }}
                        />
                        <div className="h-full bg-emerald-500 flex-1 rounded-r-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly trend */}
          <div className="card-panel">
            <div className="card-panel-header">
              <h3 className="font-bold text-foreground">Rendez-vous par mois</h3>
              <span className="text-xs text-muted-foreground">{periodLabel}</span>
            </div>
            <div className="p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barGap={4} margin={{ bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="completed" name="Terminés" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Annulés" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="no_show" name="Absent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New patients trend */}
          <div className="card-panel">
            <div className="card-panel-header">
              <h3 className="font-bold text-foreground">Nouveaux patients par mois</h3>
              <span className="text-xs text-muted-foreground">{periodLabel}</span>
            </div>
            <div className="p-4 h-56">
              <ResponsiveContainer width="100%" height={224}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="new_patients"
                    name="Nouveaux patients"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: "#6366f1", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status breakdown */}
            {statusBreakdown.length > 0 && (
              <div className="card-panel">
                <div className="card-panel-header">
                  <h3 className="font-bold text-foreground">Répartition par statut</h3>
                  <span className="text-xs text-muted-foreground">Tous les RDV</span>
                </div>
                <div className="p-4 flex items-center gap-6">
                  <div className="h-52 w-52 flex-shrink-0">
                    <ResponsiveContainer width={208} height={208}>
                      <PieChart>
                        <Pie
                          data={statusBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {statusBreakdown.map((entry) => (
                            <Cell key={entry.status} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value, name]}
                          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {statusBreakdown.map((s) => (
                      <div key={s.status} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-xs text-muted-foreground">{s.label}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top services */}
            {topServices.length > 0 && (
              <div className="card-panel">
                <div className="card-panel-header">
                  <h3 className="font-bold text-foreground">Services les plus demandés</h3>
                  <span className="text-xs text-muted-foreground">{periodLabel}</span>
                </div>
                <div className="px-4 pb-4 space-y-3 pt-2">
                  {topServices.map((s, i) => {
                    const maxCount = topServices[0]?.count ?? 1;
                    const pct = (s.count / maxCount) * 100;
                    return (
                      <div key={s.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">{s.name}</span>
                          <div className="flex items-center gap-2">
                            {s.revenue > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {s.revenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                              </span>
                            )}
                            <span className="text-xs font-bold text-foreground">{s.count}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak hours */}
            <div className="card-panel">
              <div className="card-panel-header">
                <h3 className="font-bold text-foreground">Heures de pointe</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {periodLabel}
                </div>
              </div>
              <div className="p-4 h-52">
                <ResponsiveContainer width="100%" height={208}>
                  <BarChart data={peakHours} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="RDV" radius={[4, 4, 0, 0]}>
                      {peakHours.map((entry, i) => {
                        const maxCount = Math.max(...peakHours.map((h) => h.count));
                        const intensity = maxCount > 0 ? entry.count / maxCount : 0;
                        return <Cell key={i} fill={`rgba(99, 102, 241, ${0.3 + intensity * 0.7})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of week */}
            <div className="card-panel">
              <div className="card-panel-header">
                <h3 className="font-bold text-foreground">Activité par jour</h3>
                <span className="text-xs text-muted-foreground">{periodLabel}</span>
              </div>
              <div className="p-4 h-52">
                <ResponsiveContainer width="100%" height={208}>
                  <BarChart data={dayOfWeek} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="shortDay" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} labelFormatter={(label) => dayOfWeek.find((d) => d.shortDay === label)?.day ?? label} />
                    <Bar dataKey="count" name="RDV" radius={[4, 4, 0, 0]}>
                      {dayOfWeek.map((entry, i) => {
                        const maxCount = Math.max(...dayOfWeek.map((d) => d.count));
                        const intensity = maxCount > 0 ? entry.count / maxCount : 0;
                        return <Cell key={i} fill={`rgba(34, 197, 94, ${0.3 + intensity * 0.7})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly fill rate */}
          {weeklyFillRate.length > 0 && (
            <div className="card-panel">
              <div className="card-panel-header">
                <h3 className="font-bold text-foreground">Taux de remplissage</h3>
                <span className="text-xs text-muted-foreground">
                  Moy.{" "}
                  <span className="font-bold text-foreground">
                    {`${Math.round(weeklyFillRate.reduce((sum, w) => sum + w.rate, 0) / weeklyFillRate.length)}%`}
                  </span>{" "}
                  sur 8 semaines
                </span>
              </div>
              <div className="p-4 h-56">
                <ResponsiveContainer width="100%" height={224}>
                  <LineChart data={weeklyFillRate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Remplissage"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weekly trend */}
          {weekly.length > 0 && (
            <div className="card-panel">
              <div className="card-panel-header">
                <h3 className="font-bold text-foreground">Tendance hebdomadaire</h3>
                <span className="text-xs text-muted-foreground">8 dernières semaines</span>
              </div>
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} barGap={2} margin={{ bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="total" name="Total" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="completed" name="Terminés" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
