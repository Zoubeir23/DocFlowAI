"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface RealtimeNotification {
  id: string;
  appointmentId: string;
  patientName: string;
  serviceName: string;
  startAt: string;
  receivedAt: Date;
  read: boolean;
}

interface RawAppointment {
  id: string;
  start_at: string;
  patients: { full_name: string } | null;
  services: { name: string } | null;
}

export function useRealtimeNotifications(
  clinicId: string | null,
  onNavigate?: (path: string) => void
) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const supabaseRef = useRef(createClient());

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!clinicId) return;

    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`clinic-appointments-${clinicId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `clinic_id=eq.${clinicId}`,
        },
        async (payload) => {
          const raw = payload.new as {
            id: string;
            start_at: string;
            source: string;
          };

          const { data, error } = await supabase
            .from("appointments")
            .select("id, start_at, patients(full_name), services(name)")
            .eq("id", raw.id)
            .maybeSingle();

          if (error || !data) return;

          const appointment = data as unknown as RawAppointment;
          const patientName = appointment.patients?.full_name ?? "Patient";
          const serviceName = appointment.services?.name ?? "Consultation";
          const formattedTime = format(
            new Date(appointment.start_at),
            "EEE d MMM 'à' HH:mm",
            { locale: fr }
          );

          const notification: RealtimeNotification = {
            id: crypto.randomUUID(),
            appointmentId: appointment.id,
            patientName,
            serviceName,
            startAt: appointment.start_at,
            receivedAt: new Date(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev].slice(0, 50));

          toast.success(
            raw.source === "widget" ? "Nouveau RDV via le widget" : "Nouveau RDV",
            {
              description: `${patientName} — ${serviceName} le ${formattedTime}`,
              duration: 6000,
              action: {
                label: "Voir",
                onClick: () => onNavigate?.("/app/appointments"),
              },
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId, onNavigate]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }

  return { notifications, unreadCount, markAllRead, markRead };
}
