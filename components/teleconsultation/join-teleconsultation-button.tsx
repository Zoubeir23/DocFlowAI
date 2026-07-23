"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { VideoRoom } from "./video-room";
import type { TeleconsultationSession } from "@/actions/teleconsultation";

interface JoinTeleconsultationButtonProps {
  session: TeleconsultationSession;
  patientName: string;
}

export function JoinTeleconsultationButton({ session, patientName }: JoinTeleconsultationButtonProps) {
  const [showRoom, setShowRoom] = useState(false);

  if (session.status === "ended") return null;

  if (showRoom) {
    return (
      <div className="space-y-3">
        <VideoRoom
          roomUrl={session.room_url}
          displayName={patientName}
          onClose={() => setShowRoom(false)}
        />
      </div>
    );
  }

  const isActive = session.status === "active";

  return (
    <button
      type="button"
      onClick={() => setShowRoom(true)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isActive
          ? "bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse"
          : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
      }`}
    >
      <Video className="w-4 h-4" />
      {isActive ? "Rejoindre — Médecin en attente" : "Prêt pour la téléconsultation"}
    </button>
  );
}
