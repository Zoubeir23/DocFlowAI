import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
}: StatCardProps) {
  return (
    <div className="card-stat group flex flex-col justify-between">
      <div className="flex items-start justify-between mb-8">
        <div className="icon-box group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary/10">
          <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
            change.trend === "up" ? "bg-primary/10 text-primary border border-primary/20" : 
            change.trend === "down" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground border border-border"
          )}>
            {change.trend === "up" ? "↗" : change.trend === "down" ? "↘" : "→"}
            <span className="ml-0.5">{change.value}</span>
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <div className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2" style={{ fontFeatureSettings: '"tnum" 1' }}>
          {value}
        </div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      </div>
    </div>
  );
}
