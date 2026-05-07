import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  gradient?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-teal-600",
  iconBg = "bg-teal-50",
  gradient,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-3.5 w-24 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-16 rounded-lg mb-1.5" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 hover-lift group cursor-default">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight">{title}</p>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
          gradient ? "" : iconBg
        )}
          style={gradient ? { background: gradient } : undefined}
        >
          <Icon className={cn("w-5 h-5", gradient ? "text-white" : iconColor)} />
        </div>
      </div>
      <div className="stat-number text-2xl font-bold text-slate-800 mb-1">{value}</div>
      {change && (
        <p className={cn(
          "text-[11px] font-medium flex items-center gap-1",
          changeType === "positive" && "text-emerald-600",
          changeType === "negative" && "text-red-500",
          changeType === "neutral" && "text-slate-400"
        )}>
          {changeType === "positive" && <span className="text-emerald-500">↑</span>}
          {changeType === "negative" && <span className="text-red-500">↓</span>}
          {change}
        </p>
      )}
    </div>
  );
}
