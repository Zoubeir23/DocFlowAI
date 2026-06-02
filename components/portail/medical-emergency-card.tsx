"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import { Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MedicalEmergencyCardProps {
  patientName: string;
  publicCode: string;
  clinicName: string;
}

export function MedicalEmergencyCard({ patientName, publicCode, clinicName }: MedicalEmergencyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleDownload() {
    const { default: html2canvas } = await import("html2canvas");
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `carte-urgence-${publicCode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="space-y-4">
      {/* Printable card */}
      <div
        ref={cardRef}
        className="w-[340px] rounded-2xl border-2 border-teal-600 bg-white p-5 shadow-lg"
        style={{ fontFamily: "sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Carte médicale d'urgence</p>
            <p className="text-[10px] text-gray-500">DocFlow IA</p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          {/* QR Code */}
          <div className="flex-shrink-0 p-1.5 border border-gray-200 rounded-xl bg-white">
            <QRCode value={publicCode} size={96} level="H" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{patientName}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">{clinicName}</p>
            <div className="mt-3">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest">Code carnet</p>
              <p className="font-mono font-bold text-teal-700 text-sm tracking-wider">{publicCode}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[9px] text-gray-400 leading-relaxed">
            En cas d'urgence, scannez ce QR code ou saisissez le code dans DocFlow IA pour accéder à l'historique médical complet de ce patient.
          </p>
        </div>
      </div>

      {/* Download button */}
      <Button
        onClick={handleDownload}
        className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2"
      >
        <Download className="w-4 h-4" />
        Télécharger ma carte d'urgence
      </Button>
    </div>
  );
}
