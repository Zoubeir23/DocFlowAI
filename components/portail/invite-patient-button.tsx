"use client";

import { useState } from "react";
import { invitePatientToPortal } from "@/actions/patient-portal";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvitePatientButtonProps {
  patientId: string;
  hasEmail: boolean;
  alreadyInvited: boolean;
}

export function InvitePatientButton({ patientId, hasEmail, alreadyInvited }: InvitePatientButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyInvited);

  if (!hasEmail) return null;

  async function handleInvite() {
    setLoading(true);
    const result = await invitePatientToPortal(patientId);
    setLoading(false);

    if (result.success) {
      toast.success("Invitation envoyée au patient");
      setDone(true);
    } else {
      toast.error(result.error ?? "Erreur lors de l'envoi");
    }
  }

  if (done) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Portail activé
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleInvite}
      disabled={loading}
      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5 shadow-sm"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      {loading ? "Envoi…" : "Inviter au portail"}
    </Button>
  );
}
