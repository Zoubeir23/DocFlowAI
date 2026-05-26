"use client";

import { useRef, useState } from "react";
import { Upload, Download, CheckCircle2, AlertTriangle, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parsePatientsCSV, generatePatientsCsvTemplate, type PatientCsvRow } from "@/lib/csv/parse-patients-csv";
import type { ImportPatientsResult } from "@/app/api/patients/import/route";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type ImportStep = "select" | "preview" | "result";

export function CsvImportDialog({ open, onOpenChange, onImportComplete }: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("patients");
  const [step, setStep] = useState<ImportStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PatientCsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<{ line: number; message: string }[]>([]);
  const [importResult, setImportResult] = useState<ImportPatientsResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function reset() {
    setStep("select");
    setSelectedFile(null);
    setPreviewRows([]);
    setParseErrors([]);
    setImportResult(null);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error(t("csv.invalidFormat"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const text = await file.text();
    const { rows, errors } = parsePatientsCSV(text);

    setSelectedFile(file);
    setPreviewRows(rows);
    setParseErrors(errors);
    setStep("preview");
  }

  async function handleImport() {
    if (!selectedFile || previewRows.length === 0) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/patients/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? t("csv.importError"));
        return;
      }

      const result: ImportPatientsResult = await response.json();
      setImportResult(result);
      setStep("result");

      if (result.inserted > 0 || result.updated > 0) {
        onImportComplete();
      }
    } catch {
      toast.error(t("csv.networkError"));
    } finally {
      setIsImporting(false);
    }
  }

  function handleDownloadTemplate() {
    const csv = generatePatientsCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele-import-patients.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("importCsv")}
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              Importez plusieurs patients en une seule fois. Les patients dont le téléphone existe déjà seront mis à jour.
            </p>

            <div className="bg-muted/40 rounded-xl border border-dashed border-border p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t("csv.selectFileTitle")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("csv.columnsHint")}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl"
              >
                {t("csv.chooseFile")}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("csv.downloadTemplate")}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownloadTemplate}
                className="rounded-lg gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                {t("csv.templateLabel")}
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                {previewRows.length} patient{previewRows.length > 1 ? "s" : ""} valide{previewRows.length > 1 ? "s" : ""}
                {parseErrors.length > 0 && (
                  <span className="text-amber-600 ml-2">• {parseErrors.length} erreur{parseErrors.length > 1 ? "s" : ""} ignorée{parseErrors.length > 1 ? "s" : ""}</span>
                )}
              </span>
              <button type="button" onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">
                {t("csv.changeFile")}
              </button>
            </div>

            {parseErrors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 max-h-28 overflow-y-auto">
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Ligne {err.line} — {err.message}
                  </p>
                ))}
              </div>
            )}

            {previewRows.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 gap-0 bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span>{t("csv.columnName")}</span>
                  <span>{t("csv.columnPhone")}</span>
                  <span>{t("csv.columnEmail")}</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {previewRows.slice(0, 50).map((row, i) => (
                    <div key={i} className="grid grid-cols-3 gap-0 px-3 py-2 text-xs">
                      <span className="font-medium text-foreground truncate pr-2">{row.full_name}</span>
                      <span className="text-muted-foreground truncate pr-2">{row.phone}</span>
                      <span className="text-muted-foreground truncate">{row.email ?? "—"}</span>
                    </div>
                  ))}
                  {previewRows.length > 50 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground italic">
                      … et {previewRows.length - 50} autre{previewRows.length - 50 > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} className="rounded-xl">
                {t("csv.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleImport}
                disabled={isImporting || previewRows.length === 0}
                className="rounded-xl"
              >
                {isImporting ? t("csv.importing") : (previewRows.length > 1 ? t("csv.importButtonPlural", { count: previewRows.length }) : t("csv.importButton", { count: previewRows.length }))}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{importResult.inserted}</p>
                <p className="text-xs text-emerald-700 mt-0.5 font-medium">{t("csv.newLabel")}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                <p className="text-xs text-blue-700 mt-0.5 font-medium">{t("csv.updatedLabel")}</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-amber-800 mb-1">{t("csv.skippedLines")}</p>
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                    <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {err.message}
                  </p>
                ))}
              </div>
            )}

            {importResult.inserted === 0 && importResult.updated === 0 ? (
              <p className="text-sm text-center text-muted-foreground">{t("csv.noImported")}</p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {t("csv.success")}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={reset} className="rounded-xl">
                {t("csv.newImport")}
              </Button>
              <Button type="button" size="sm" onClick={handleClose} className="rounded-xl">
                {t("csv.close")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
