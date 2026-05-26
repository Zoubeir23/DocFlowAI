"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeNotifications } from "@/lib/hooks/use-realtime-notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const markAllReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Single stable Supabase client instance
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("users")
        .select("clinic_id")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) setClinicId((data as { clinic_id: string }).clinic_id);
        });
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear pending markAllRead timer on unmount
  useEffect(() => {
    return () => {
      if (markAllReadTimerRef.current) clearTimeout(markAllReadTimerRef.current);
    };
  }, []);

  const handleNavigate = useCallback(
    (path: string) => router.push(path),
    [router]
  );

  const { notifications, unreadCount, markAllRead, markRead } =
    useRealtimeNotifications(clinicId, handleNavigate);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      if (markAllReadTimerRef.current) clearTimeout(markAllReadTimerRef.current);
      markAllReadTimerRef.current = setTimeout(markAllRead, 1500);
    }
  };

  const navigateToAppointments = () => {
    setOpen(false);
    router.push("/app/appointments");
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Aucune notification
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    markRead(notification.id);
                    navigateToAppointments();
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1.5 w-2 h-2 rounded-full flex-shrink-0",
                        !notification.read ? "bg-primary" : "bg-transparent"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        Nouveau RDV — {notification.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notification.serviceName} ·{" "}
                        {format(new Date(notification.startAt), "d MMM 'à' HH:mm", { locale: fr })}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {formatDistanceToNow(notification.receivedAt, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-center">
              <button
                onClick={navigateToAppointments}
                className="text-xs text-primary hover:underline"
              >
                Voir tous les rendez-vous →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
