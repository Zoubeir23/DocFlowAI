interface SectionLabelProps {
  children: React.ReactNode;
}

/**
 * Micro-libellé typographique partagé par toutes les sections de la landing :
 * mono, majuscules, interlettrage large — la signature éditoriale DocFlow.
 */
export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
      <span className="h-px w-8 bg-current opacity-50" aria-hidden="true" />
      {children}
    </span>
  );
}
