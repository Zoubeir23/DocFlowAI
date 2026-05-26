"use client";

import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import type { DrugInteractionPair } from "@/types";

interface DrugInteractionWarningProps {
  interactions: DrugInteractionPair[];
}

const SEVERITY_CONFIG = {
  high: {
    Icon: ShieldAlert,
    containerClass: "bg-red-50 border-red-200",
    iconClass: "text-red-600",
    textClass: "text-red-800",
    badgeClass: "bg-red-100 text-red-700",
    label: "Interaction majeure",
  },
  moderate: {
    Icon: AlertTriangle,
    containerClass: "bg-amber-50 border-amber-200",
    iconClass: "text-amber-600",
    textClass: "text-amber-800",
    badgeClass: "bg-amber-100 text-amber-700",
    label: "Interaction modérée",
  },
  low: {
    Icon: Info,
    containerClass: "bg-blue-50 border-blue-200",
    iconClass: "text-blue-600",
    textClass: "text-blue-800",
    badgeClass: "bg-blue-100 text-blue-700",
    label: "Interaction mineure",
  },
} as const;

export function DrugInteractionWarning({ interactions }: DrugInteractionWarningProps) {
  if (interactions.length === 0) return null;

  const sortedInteractions = [...interactions].sort((first, second) => {
    const severityOrder = { high: 0, moderate: 1, low: 2 };
    return severityOrder[first.severity] - severityOrder[second.severity];
  });

  return (
    <div className="space-y-2">
      {sortedInteractions.map((interaction, index) => {
        const config = SEVERITY_CONFIG[interaction.severity];
        const { Icon } = config;
        return (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-xl border ${config.containerClass}`}
          >
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconClass}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${config.badgeClass}`}>
                  {config.label}
                </span>
                <span className={`text-xs font-semibold ${config.textClass}`}>
                  {interaction.drug1Name} + {interaction.drug2Name}
                </span>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${config.textClass} opacity-90`}>
                {interaction.description}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Source: {interaction.source}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
