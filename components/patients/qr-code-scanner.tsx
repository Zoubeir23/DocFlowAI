"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrCodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QrCodeScanner({ onScan, onClose }: QrCodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scannerInstanceRef = useRef<{ clear: () => void } | null>(null);

  useEffect(() => {
    let stopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped || !scannerRef.current) return;

        const scanner = new Html5Qrcode("qr-scanner-container");
        scannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            const code = decodedText.trim().toUpperCase();
            void scanner.stop();
            onScan(code);
          },
          () => {}
        );
        setLoading(false);
      } catch (err: unknown) {
        if (!stopped) {
          setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
          setLoading(false);
        }
        console.error("[QrScanner]", err);
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (scannerInstanceRef.current) {
        void scannerInstanceRef.current.clear();
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-[300px] mx-auto">
        <div id="qr-scanner-container" ref={scannerRef} className="w-full h-full" />

        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-2">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm">Démarrage caméra…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-4 text-center">
            <Camera className="w-8 h-8 text-red-400" />
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {/* Scan frame overlay */}
        {!loading && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[220px] h-[220px] border-2 border-teal-400 rounded-xl opacity-80" />
          </div>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Pointez la caméra vers le QR code de la carte médicale du patient
      </p>

      <Button variant="outline" onClick={onClose} className="w-full rounded-xl gap-2">
        <X className="w-4 h-4" />
        Annuler
      </Button>
    </div>
  );
}
