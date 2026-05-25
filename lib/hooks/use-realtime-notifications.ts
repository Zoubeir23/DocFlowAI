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

export function useRealtimeNotifications(clinicId: string | null) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = createClient();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!clinicId) return;

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
          const raw = payload.new as { id: string; start_at: string; patient_id: string; service_id: string; source: string };

          const { data } = await (supabase as any)
            .from("appointments")
            .select("id, start_at, patients(full_name), services(name)")
            .eq("id", raw.id)
            .single() as { data: RawAppointment | null };

          if (!data) return;

          const patientName = data.patients?.full_name ?? "Patient";
          const serviceName = data.services?.name ?? "Consultation";
          const formattedTime = format(new Date(data.start_at), "EEE d MMM 'à' HH:mm", { locale: fr });
          const isWidget = raw.source === "widget";

          const notification: RealtimeNotification = {
            id: crypto.randomUUID(),
            appointmentId: data.id,
            patientName,
            serviceName,
            startAt: data.start_at,
            receivedAt: new Date(),
            read: false,
          };

          setNotifications((prev) => [notification, ...prev].slice(0, 50));

          toast.success(
            isWidget ? `Nouveau RDV via le widget` : `Nouveau RDV`,
            {
              description: `${patientName} — ${serviceName} le ${formattedTime}`,
              duration: 6000,
              action: {
                label: "Voir",
                onClick: () => {
                  window.location.href = "/app/appointments";
                },
              },
            }
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId]);

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
