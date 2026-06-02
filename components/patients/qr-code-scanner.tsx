"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Html5QrcodeScanner {
  start: (
    constraints: object,
    config: object,
    onSuccess: (text: string) => void,
    onError: () => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => Promise<void>;
}

interface QrCodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QrCodeScanner({ onScan, onClose }: QrCodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerStartedRef = useRef(false);
  // Stable ref for onScan — avoids restarting the scanner on every render
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; });

  const handleScanSuccess = useCallback((decodedText: string) => {
    const code = decodedText.trim().toUpperCase();
    const instance = scannerInstanceRef.current;
    if (!instance) return;
    instance.stop()
      .then(() => {
        scannerInstanceRef.current = null;
        onScanRef.current(code);
      })
      .catch(() => {
        scannerInstanceRef.current = null;
        onScanRef.current(code);
      });
  }, []);

  useEffect(() => {
    let stopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;

        const scanner = new Html5Qrcode("qr-scanner-container");
        scannerInstanceRef.current = scanner as unknown as Html5QrcodeScanner;

        await (scanner as unknown as Html5QrcodeScanner).start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          handleScanSuccess,
          () => {}
        );

        if (!stopped) {
          scannerStartedRef.current = true;
          setLoading(false);
        } else {
          // Component unmounted during startup — stop immediately
          await (scanner as unknown as Html5QrcodeScanner).stop().catch(() => {});
          await (scanner as unknown as Html5QrcodeScanner).clear().catch(() => {});
        }
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
      const instance = scannerInstanceRef.current;
      if (!instance) return;
      const teardown = scannerStartedRef.current
        ? instance.stop().catch(() => {})
        : Promise.resolve();
      teardown.then(() => instance.clear().catch(() => {}));
      scannerInstanceRef.current = null;
      scannerStartedRef.current = false;
    };
  }, [handleScanSuccess]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-[300px] mx-auto">
        <div id="qr-scanner-container" className="w-full h-full" />

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
