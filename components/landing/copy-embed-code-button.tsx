"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyEmbedCodeButtonProps {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}

/**
 * Bouton de copie du snippet d'intégration du widget. Le libellé revient à son
 * état initial après deux secondes, et le timer est nettoyé au démontage.
 */
export function CopyEmbedCodeButton({ code, copyLabel, copiedLabel }: CopyEmbedCodeButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!hasCopied) return;

    const resetTimeout = setTimeout(() => setHasCopied(false), 2000);
    return () => clearTimeout(resetTimeout);
  }, [hasCopied]);

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setHasCopied(true);
    } catch {
      // Clipboard indisponible (contexte non sécurisé ou permission refusée) :
      // on laisse le code visible à l'écran pour une sélection manuelle.
      setHasCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copyEmbedCode}
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80 hover:border-primary/40 hover:text-white transition-colors"
    >
      {hasCopied ? (
        <Check className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {hasCopied ? copiedLabel : copyLabel}
    </button>
  );
}
