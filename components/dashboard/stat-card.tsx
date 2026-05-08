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
    <div className="p-5 group cursor-default bg-card">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="w-9 h-9 flex items-center justify-center bg-primary/10 rounded-lg">
          <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="text-3xl font-semibold text-foreground leading-none mb-2 tracking-tight">
        {value}
      </div>
      
      {change && (
        <p className={cn(
          "text-xs font-medium uppercase tracking-wide",
          change.trend === "up" ? "text-primary" : 
          change.trend === "down" ? "text-destructive" : "text-muted-foreground"
        )}>
          {change.trend === "up" ? "+" : change.trend === "down" ? "-" : ""}{change.value}
        </p>
      )}
    </div>
  );
}
