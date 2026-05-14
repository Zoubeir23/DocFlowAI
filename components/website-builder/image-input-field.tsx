"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link2, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageInputFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
}

type InputMode = "url" | "upload";

export function ImageInputField({
  label,
  value,
  onChange,
  folder = "uploads",
  hint,
}: ImageInputFieldProps) {
  const [mode, setMode] = useState<InputMode>("url");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Erreur d'upload");
      }

      onChange(json.url);
      toast.success("Image uploadée avec succès");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      {/* Label + mode toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" />
          {label}
        </Label>

        <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
              mode === "url"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Link2 className="w-3 h-3" />
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
              mode === "upload"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
        </div>
      </div>

      {/* URL mode */}
      {mode === "url" && (
        <div className="relative">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="h-10 bg-muted/50 border-border font-mono text-sm pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            isUploading && "pointer-events-none opacity-70"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Upload en cours…</p>
            </div>
          ) : value ? (
            <div className="space-y-2">
              <img
                src={value}
                alt="Aperçu"
                className="w-full h-24 object-cover rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                Cliquer pour remplacer l'image
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <Upload className="w-6 h-6 text-muted-foreground/60" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Glisser une image ici
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ou cliquer pour parcourir
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                JPG, PNG, WebP, GIF — max 5 Mo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      {hint && (
        <p className="text-[10px] text-muted-foreground/70">{hint}</p>
      )}
    </div>
  );
}
