"use client";

import { useState, useTransition } from "react";
import { Video, Loader2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createTeleconsultationRoom, activateTeleconsultation, endTeleconsultation } from "@/actions/teleconsultation";
import { VideoRoom } from "./video-room";
import type { TeleconsultationSession } from "@/actions/teleconsultation";

interface StartTeleconsultationButtonProps {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  existingSession?: TeleconsultationSession | null;
}

export function StartTeleconsultationButton({
  appointmentId,
  patientName,
  doctorName,
  existingSession,
}: StartTeleconsultationButtonProps) {
  const [session, setSession] = useState<TeleconsultationSession | null>(existingSession ?? null);
  const [showRoom, setShowRoom] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const result = await createTeleconsultationRoom(appointmentId);
      if (!result.success || !result.session) {
        toast.error(result.error ?? "Erreur lors de la création de la salle");
        return;
      }
      setSession(result.session);

      if (result.session.status === "pending") {
        const activateResult = await activateTeleconsultation(appointmentId);
        if (activateResult.success) {
          setSession({ ...result.session, status: "active" });
        }
      }
      setShowRoom(true);
    });
  }

  function handleClose() {
    setShowRoom(false);
    startTransition(async () => {
      await endTeleconsultation(appointmentId);
      setSession((previous) => previous ? { ...previous, status: "ended" } : null);
    });
  }

  if (showRoom && session) {
    return (
      <div className="space-y-3">
        <VideoRoom
          roomUrl={session.room_url}
          displayName={`Dr. ${doctorName}`}
          onClose={handleClose}
        />
        <p className="text-xs text-muted-foreground text-center">
          Consultez <span className="font-semibold text-foreground">{patientName}</span> — la salle est active
        </p>
      </div>
    );
  }

  const isEnded = session?.status === "ended";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleStart}
        disabled={isPending}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Video className="w-4 h-4" />
        )}
        {isEnded ? "Relancer la téléconsultation" : "Démarrer la téléconsultation"}
      </button>

      {session && !isEnded && session.status !== "pending" && (
        <a
          href={session.room_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Ouvrir dans un nouvel onglet
        </a>
      )}
    </div>
  );
}
