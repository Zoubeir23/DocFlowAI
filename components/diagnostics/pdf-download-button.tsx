"use client";

import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagnosticRecord } from "@/types";

interface PdfDownloadButtonProps {
  diagnostic: DiagnosticRecord;
  clinicName?: string;
}

export function PdfDownloadButton({ diagnostic, clinicName }: PdfDownloadButtonProps) {
  const [isReady, setIsReady] = useState(false);
  const [BlobProvider, setBlobProvider] = useState<any>(null);
  const [PdfDocument, setPdfDocument] = useState<any>(null);

  // Lazy-load react-pdf (lourd, ~500kb) seulement au montage
  useEffect(() => {
    Promise.all([
      import("@react-pdf/renderer"),
      import("./prescription-pdf-document"),
    ]).then(([reactPdf, { PrescriptionPdfDocument }]) => {
      setBlobProvider(() => reactPdf.BlobProvider);
      setPdfDocument(() => PrescriptionPdfDocument);
      setIsReady(true);
    });
  }, []);

  const fileName = `ordonnance-${diagnostic.patient_full_name.toLowerCase().replace(/\s+/g, "-")}-${diagnostic.id.slice(0, 8)}.pdf`;

  if (!isReady || !BlobProvider || !PdfDocument) {
    return (
      <Button variant="outline" className="rounded-xl gap-2" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement PDF...
      </Button>
    );
  }

  return (
    <BlobProvider
      document={<PdfDocument diagnostic={diagnostic} clinicName={clinicName} />}
    >
      {({ url, loading, error }: { url: string | null; loading: boolean; error: Error | null }) => {
        if (error) {
          return (
            <Button variant="outline" className="rounded-xl gap-2 border-destructive/40 text-destructive" disabled>
              Erreur PDF
            </Button>
          );
        }

        return (
          <a
            href={url ?? "#"}
            download={fileName}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors ${
              loading || !url
                ? "opacity-50 pointer-events-none"
                : "hover:bg-accent"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {loading ? "Génération..." : "Télécharger PDF"}
          </a>
        );
      }}
    </BlobProvider>
  );
}
