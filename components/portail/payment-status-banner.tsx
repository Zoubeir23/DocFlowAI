"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface PaymentStatusBannerProps {
  status: string;
}

export function PaymentStatusBanner({ status }: PaymentStatusBannerProps) {
  if (status === "success") {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span>Paiement confirmé — merci ! Votre rendez-vous est bien enregistré.</span>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-sm">
        <XCircle className="w-4 h-4 flex-shrink-0" />
        <span>Paiement annulé. Vous pouvez réessayer depuis la liste de vos rendez-vous.</span>
      </div>
    );
  }

  return null;
}
