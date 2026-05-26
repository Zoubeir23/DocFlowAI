"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cancelAppointmentAsPatient } from "@/actions/patient-portal";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";

interface CancelAppointmentButtonProps {
  appointmentId: string;
}

export function CancelAppointmentButton({ appointmentId }: CancelAppointmentButtonProps) {
  const t = useTranslations("portal");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCancel() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setLoading(true);
    const result = await cancelAppointmentAsPatient(appointmentId);
    setLoading(false);

    if (result.success) {
      toast.success(t("toastCancelled"));
    } else {
      toast.error(result.error ?? t("toastCancelError"));
      setConfirmed(false);
    }
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t("confirm")}</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          {loading ? "…" : t("yesCancel")}
        </button>
        <button
          onClick={() => setConfirmed(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("no")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCancel}
      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
    >
      <XCircle className="w-3 h-3" />
      {t("cancelAppointment")}
    </button>
  );
}
