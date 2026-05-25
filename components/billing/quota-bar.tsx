"use client";

import { useTranslations } from "next-intl";

interface QuotaBarProps {
  current: number;
  limit: number | null;
  label: string;
  icon: React.ElementType;
}

export function QuotaBar({ current, limit, label, icon: Icon }: QuotaBarProps) {
  const t = useTranslations("billing");

  if (limit === null) {
    return (
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-xs font-bold text-primary">{t("unlimited")}</span>
          </div>
          <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.min((current / limit) * 100, 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 100;

  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`text-xs font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-foreground"}`}>
            {current} / {limit}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
