"use client";

import { useState } from "react";
import { X, Maximize2, Minimize2, Video } from "lucide-react";

interface VideoRoomProps {
  roomUrl: string;
  displayName: string;
  onClose?: () => void;
}

export function VideoRoom({ roomUrl, displayName, onClose }: VideoRoomProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const encodedName = encodeURIComponent(displayName);
  // M fix: prejoinPageEnabled reste à sa valeur par défaut (true) — la page
  // de pré-connexion est la seule barrière disponible sans déploiement Jitsi
  // JWT dédié contre un tiers qui rejoindrait directement une consultation
  // médicale avec la seule URL.
  const iframeSrc = `${roomUrl}#userInfo.displayName="${encodedName}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRAND_WATERMARK=false`;

  return (
    <div
      className={`${
        isFullscreen
          ? "fixed inset-0 z-50 bg-black"
          : "relative w-full rounded-2xl overflow-hidden border border-border bg-black shadow-2xl"
      }`}
    >
      {/* Controls bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">Téléconsultation</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <iframe
        src={iframeSrc}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className={isFullscreen ? "w-full h-full" : "w-full h-[520px]"}
        style={{ border: "none" }}
        title="Salle de téléconsultation"
      />
    </div>
  );
}
