"use client";

import { useState } from "react";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PayAppointmentButtonProps {
  appointmentId: string;
  price: number;
  paymentStatus: string;
}

export function PayAppointmentButton({ appointmentId, price, paymentStatus }: PayAppointmentButtonProps) {
  const [loading, setLoading] = useState(false);

  if (paymentStatus === "paid") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Payé
      </span>
    );
  }

  async function handlePay() {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/appointment-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Impossible d'accéder au paiement");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-primary px-2.5 py-1 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
      {loading ? "Redirection…" : `Payer ${price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`}
    </button>
  );
}
