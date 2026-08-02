"use client";

import { useEffect, useState } from "react";
import { Copy, Check, TriangleAlert } from "lucide-react";

type CopyStatus = "idle" | "copied" | "failed";

/** Durée d'affichage du retour visuel avant retour à l'état initial. */
const FEEDBACK_DURATION_MS = 2500;

interface CopyEmbedCodeButtonProps {
  code: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
}

/**
 * Bouton de copie du snippet d'intégration du widget.
 *
 * Le presse-papiers est indisponible hors contexte sécurisé ou si l'utilisateur
 * refuse la permission : l'échec est alors affiché explicitement, avec une
 * consigne de sélection manuelle, plutôt que de laisser le clic sans effet.
 */
export function CopyEmbedCodeButton({
  code,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
}: CopyEmbedCodeButtonProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (copyStatus === "idle") return;

    const resetTimeout = setTimeout(() => setCopyStatus("idle"), FEEDBACK_DURATION_MS);
    return () => clearTimeout(resetTimeout);
  }, [copyStatus]);

  const copyEmbedCode = async () => {
    if (!navigator.clipboard) {
      setCopyStatus("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const statusLabel: Record<CopyStatus, string> = {
    idle: copyLabel,
    copied: copiedLabel,
    failed: copyFailedLabel,
  };

  return (
    <button
      type="button"
      onClick={copyEmbedCode}
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
        copyStatus === "failed"
          ? "border-destructive/40 text-destructive"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {copyStatus === "copied" && <Check className="w-3.5 h-3.5 text-primary" />}
      {copyStatus === "failed" && <TriangleAlert className="w-3.5 h-3.5" />}
      {copyStatus === "idle" && <Copy className="w-3.5 h-3.5" />}
      {statusLabel[copyStatus]}
    </button>
  );
}
