"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Sparkles, Loader2, AlertCircle, FileText } from "lucide-react";
import { generateCarnetSummary, getPatientCarnetHistory } from "@/actions/patients";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

interface CarnetNumeriqueSectionProps {
  patientId: string;
}

export function CarnetNumeriqueSection({ patientId }: CarnetNumeriqueSectionProps) {
  const [showSummary, setShowSummary] = useState(false);

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["carnet-history", patientId],
    queryFn: () => getPatientCarnetHistory(patientId),
  });

  const { data: summaryResult, isLoading: isSummaryLoading, refetch: generateSummary } = useQuery({
    queryKey: ["carnet-summary", patientId],
    queryFn: () => generateCarnetSummary(patientId),
    enabled: false,
  });

  const handleGenerateSummary = () => {
    setShowSummary(true);
    generateSummary();
  };

  if (isHistoryLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  if (!history || history.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
        <h3 className="font-semibold text-foreground">Carnet Numérique</h3>
        <p className="text-sm text-muted-foreground mt-1">Aucun historique partagé n'a été trouvé pour ce carnet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="section-header">
          <div className="icon-container bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <BookOpen className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="section-title">Carnet Numérique</h2>
            <p className="text-xs text-muted-foreground">Historique partagé ({history.length} diagnostics)</p>
          </div>
        </div>
        {!showSummary && (
          <Button
            onClick={handleGenerateSummary}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm font-medium"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Générer une Synthèse IA
          </Button>
        )}
      </div>

      {showSummary && (
        <div className="mb-6 p-5 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Synthèse IA du Carnet</h3>
          </div>
          {isSummaryLoading ? (
            <div className="flex items-center gap-2 text-sm text-indigo-600/70 dark:text-indigo-400/70 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération de la synthèse en cours...
            </div>
          ) : summaryResult?.success ? (
            <div className="prose prose-sm dark:prose-invert prose-indigo max-w-none text-sm text-foreground/80">
              <ReactMarkdown>{summaryResult.data}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {summaryResult?.error || "Erreur lors de la génération."}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 border-l-2 border-border pl-4 ml-2">
        {history.map((record: any) => (
          <div key={record.id} className="relative">
            <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-border" />
            <div className="mb-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {new Date(record.created_at).toLocaleDateString()}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                • {record.clinic?.name || "Clinique Externe"}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{record.validated_diagnosis_name || "Consultation"}</p>
            {record.chief_complaint && (
              <p className="text-sm text-muted-foreground mt-1">Motif : {record.chief_complaint}</p>
            )}
            {record.treatments && record.treatments.length > 0 && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Prescriptions : {record.treatments.map((t: any) => t.drug_name).join(", ")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
