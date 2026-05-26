"use client";

import { useEffect, useState } from "react";
import { GitBranch, ExternalLink, BookOpen, Loader2 } from "lucide-react";

interface ComorbidityResult {
  id: string;
  title: string;
  theCode?: string;
}

interface IrisDocument {
  id: string;
  title: string;
  url: string;
  type: string;
  date?: string;
}

interface ComorbiditiesPanelProps {
  diagnosisCode: string;
  diagnosisName: string;
}

export function ComorbiditiesPanel({ diagnosisCode, diagnosisName }: ComorbiditiesPanelProps) {
  const [comorbidities, setComorbidities] = useState<ComorbidityResult[]>([]);
  const [irisDocuments, setIrisDocuments] = useState<IrisDocument[]>([]);
  const [loadingComorbidities, setLoadingComorbidities] = useState(false);
  const [loadingIris, setLoadingIris] = useState(false);

  useEffect(() => {
    if (!diagnosisCode) return;

    setLoadingComorbidities(true);
    fetch(`/api/icd/comorbidities?code=${encodeURIComponent(diagnosisCode)}`)
      .then((r) => r.json())
      .then((data: ComorbidityResult[]) => setComorbidities(data))
      .catch(() => setComorbidities([]))
      .finally(() => setLoadingComorbidities(false));
  }, [diagnosisCode]);

  useEffect(() => {
    if (!diagnosisName) return;

    setLoadingIris(true);
    fetch(`/api/who-iris/search?q=${encodeURIComponent(diagnosisName)}`)
      .then((r) => r.json())
      .then((data: IrisDocument[]) => setIrisDocuments(data))
      .catch(() => setIrisDocuments([]))
      .finally(() => setLoadingIris(false));
  }, [diagnosisName]);

  const hasContent = comorbidities.length > 0 || irisDocuments.length > 0;
  const isLoading = loadingComorbidities || loadingIris;

  if (!diagnosisCode) return null;

  return (
    <div className="border border-border bg-card rounded-2xl p-6 space-y-6 print:hidden">
      {/* Comorbidités */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Conditions associées (ICD-11)</h3>
          {loadingComorbidities && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        {comorbidities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {comorbidities.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-primary/5 border border-primary/20 rounded-lg text-foreground"
              >
                {c.theCode && (
                  <span className="font-mono text-primary font-semibold">{c.theCode}</span>
                )}
                {c.title}
              </span>
            ))}
          </div>
        ) : !loadingComorbidities ? (
          <p className="text-xs text-muted-foreground">Aucune condition associée trouvée</p>
        ) : null}
      </div>

      {/* Fiches éducatives WHO IRIS */}
      <div className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-foreground">Fiches patient OMS (WHO IRIS)</h3>
          {loadingIris && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        {irisDocuments.length > 0 ? (
          <div className="space-y-2">
            {irisDocuments.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 p-3 rounded-xl border border-border hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{doc.title}</p>
                  {doc.date && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{doc.date} · {doc.type}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : !loadingIris ? (
          <p className="text-xs text-muted-foreground">Aucune fiche éducative trouvée</p>
        ) : null}
      </div>

      {!hasContent && !isLoading && (
        <p className="text-xs text-center text-muted-foreground py-2">Aucune donnée disponible pour ce diagnostic</p>
      )}
    </div>
  );
}
