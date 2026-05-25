"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalyticsData } from "@/actions/analytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart,
  Line, Legend,
} from "recharts";
import {
  TrendingUp, Users, Calendar, CheckCircle2, AlertTriangle,
  Loader2, BarChart3, Clock, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function StatCard({
  title, value, subtitle, icon: Icon, color = "primary",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: "primary" | "emerald" | "amber" | "destructive";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

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

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalyticsData,
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

  const { monthly, topServices, statusBreakdown, peakHours, weeklyFillRate, weekly, totals } = data;
  const hasData = totals.allTime > 0;

  return (
    <div className="page-container max-w-6xl space-y-8">
      {/* Header */}
      <div className="section-header">
        <div className="icon-container">
          <BarChart3 className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="section-title">Analyses</h2>
          <p className="section-subtitle">Performances de votre cabinet sur les 6 derniers mois</p>
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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total RDV"
              value={totals.allTime}
              subtitle="depuis le début"
              icon={Calendar}
              color="primary"
            />
            <StatCard
              title="Taux de complétion"
              value={`${totals.completionRate}%`}
              subtitle="des RDV terminés"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Taux d'absence"
              value={`${totals.noShowRate}%`}
              subtitle="no-show"
              icon={AlertTriangle}
              color="amber"
            />
            <StatCard
              title="Moy. / mois"
              value={totals.avgPerMonth}
              subtitle="rendez-vous"
              icon={TrendingUp}
              color="primary"
            />
          </div>

          {totals.totalRevenue > 0 && (
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm font-medium">Chiffre d'affaires estimé (RDV terminés)</p>
                <p className="text-3xl font-bold mt-0.5">
                  {totals.totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </p>
              </div>
            </div>
          )}

          {/* Monthly trend */}
          <div className="card-panel">
            <div className="card-panel-header">
              <h3 className="font-bold text-foreground">Rendez-vous par mois</h3>
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
                          {statusBreakdown.map((entry, i) => (
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
                  <span className="text-xs text-muted-foreground">6 derniers mois</span>
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

          {/* Peak hours */}
          <div className="card-panel">
            <div className="card-panel-header">
              <h3 className="font-bold text-foreground">Heures de pointe</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                6 derniers mois
              </div>
            </div>
            <div className="p-4 h-52">
              <ResponsiveContainer width="100%" height={208}>
                <BarChart data={peakHours} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="RDV" radius={[4, 4, 0, 0]}>
                    {peakHours.map((entry, i) => {
                      const maxCount = Math.max(...peakHours.map((h) => h.count));
                      const intensity = maxCount > 0 ? entry.count / maxCount : 0;
                      const opacity = 0.3 + intensity * 0.7;
                      return <Cell key={i} fill={`rgba(99, 102, 241, ${opacity})`} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
                    {weeklyFillRate.length > 0
                      ? `${Math.round(weeklyFillRate.reduce((sum, w) => sum + w.rate, 0) / weeklyFillRate.length)}%`
                      : "—"}
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
                      tickFormatter={(value: number) => `${value}%`}
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
