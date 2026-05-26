"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Check, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  initialDataUrl?: string | null;
  onSave: (dataUrl: string) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export function SignaturePad({ initialDataUrl, onSave, onDelete, disabled }: SignaturePadProps) {
  const t = useTranslations("signature");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  function getContext() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.strokeStyle = "#1e293b";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    return { canvas, context };
  }

  const clearCanvas = useCallback(() => {
    const result = getContext();
    if (!result) return;
    result.context.clearRect(0, 0, result.canvas.width, result.canvas.height);
    setHasStrokes(false);
  }, []);

  useEffect(() => {
    if (!initialDataUrl) return;
    const result = getContext();
    if (!result) return;
    const img = new Image();
    img.onload = () => {
      result.context.drawImage(img, 0, 0, result.canvas.width, result.canvas.height);
      setHasStrokes(true);
    };
    img.src = initialDataUrl;
  }, [initialDataUrl]);

  function getCanvasPoint(event: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in event) {
      const touch = event.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(event: React.MouseEvent | React.TouchEvent) {
    if (disabled) return;
    event.preventDefault();
    const point = getCanvasPoint(event);
    if (!point) return;
    setIsDrawing(true);
    lastPoint.current = point;

    const result = getContext();
    if (!result) return;
    result.context.beginPath();
    result.context.arc(point.x, point.y, 1, 0, Math.PI * 2);
    result.context.fill();
    setHasStrokes(true);
  }

  function draw(event: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || disabled) return;
    event.preventDefault();
    const point = getCanvasPoint(event);
    if (!point || !lastPoint.current) return;

    const result = getContext();
    if (!result) return;
    result.context.beginPath();
    result.context.moveTo(lastPoint.current.x, lastPoint.current.y);
    result.context.lineTo(point.x, point.y);
    result.context.stroke();
    lastPoint.current = point;
  }

  function stopDrawing() {
    setIsDrawing(false);
    lastPoint.current = null;
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={560}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-40 rounded-xl border-2 bg-white touch-none ${
            disabled
              ? "cursor-not-allowed border-border opacity-60"
              : "cursor-crosshair border-primary/30 hover:border-primary/60 transition-colors"
          }`}
          style={{ touchAction: "none" }}
        />
        {!hasStrokes && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Pen className="w-4 h-4" />
              <span>{t("drawHere")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={disabled || !hasStrokes}
          className="flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t("clear")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={disabled || !hasStrokes}
          className="flex items-center gap-1.5 flex-1 justify-center"
        >
          <Check className="w-3.5 h-3.5" />
          {t("save")}
        </Button>
        {onDelete && initialDataUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={disabled}
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
          >
            {t("delete")}
          </Button>
        )}
      </div>
    </div>
  );
}
