"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, CheckCircle, XCircle, Clock, AlertCircle, Bot, Pencil, FileText } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentWithRelations } from "@/types";
import { getStatusColor } from "@/lib/utils";
import { updateAppointmentStatus, cancelAppointment } from "@/actions/appointments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentTableProps {
  appointments: AppointmentWithRelations[];
  loading?: boolean;
  onRefresh?: () => void;
}

/* Dark-mode safe status badge classes using CSS variables */
const STATUS_STYLES: Record<string, string> = {
  booked: "status-booked",
  confirmed: "status-confirmed",
  completed: "status-completed",
  cancelled: "status-cancelled",
  no_show: "status-no_show",
};

export function AppointmentTable({ appointments, loading, onRefresh }: AppointmentTableProps) {
  const t = useTranslations("appointments");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleStatusChange = async (
    appointmentId: string,
    status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show"
  ) => {
    setProcessingId(appointmentId);
    try {
      const result =
        status === "cancelled"
          ? await cancelAppointment(appointmentId)
          : await updateAppointmentStatus(appointmentId, status);

      if (result.success) {
        toast.success(`${t('markedAs')} ${t(`status.${status === 'no_show' ? 'noShow' : status}`)}`);
        onRefresh?.();
      } else {
        toast.error(result.error || t('failedToUpdate'));
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/30">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded-lg" />
              <Skeleton className="h-3 w-52 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3">
          <Clock className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-semibold text-sm">{t('noAppointmentsFound')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('appointmentsAppearHere')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-widest pb-4 px-4">{t('columns.patient')}</th>
            <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-widest pb-4 px-4">{t('columns.service')}</th>
            <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-widest pb-4 px-4">{t('columns.date')}</th>
            <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-widest pb-4 px-4 hidden md:table-cell">{t('columns.practitioner')}</th>
            <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-widest pb-4 px-4">{t('columns.source')}</th>
            <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-widest pb-4 px-4">{t('columns.status')}</th>
            <th className="pb-4 w-12" />
            <th className="pb-4 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {appointments.map((appointment) => (
            <tr
              key={appointment.id}
              className="hover:bg-muted/30 transition-colors group"
            >
              {/* Patient */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                    {appointment.patient?.full_name?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors text-[15px]">
                      {appointment.patient?.full_name}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">{appointment.patient?.phone}</p>
                  </div>
                </div>
              </td>

              {/* Service */}
              <td className="py-4 px-4">
                <p className="font-bold text-foreground">{appointment.service?.name}</p>
                <p className="text-xs font-medium text-muted-foreground">{appointment.service?.duration_minutes} min</p>
              </td>

              {/* Date & Time */}
              <td className="py-4 px-4">
                <p className="font-bold text-foreground">
                  {format(parseISO(appointment.start_at), "MMM d, yyyy")}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {format(parseISO(appointment.start_at), "h:mm a")} –{" "}
                  {format(parseISO(appointment.end_at), "h:mm a")}
                </p>
              </td>

              {/* Praticien */}
              <td className="py-4 px-4 hidden md:table-cell">
                {appointment.practitioner ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {appointment.practitioner.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                      {appointment.practitioner.full_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>

              {/* Source */}
              <td className="py-4 px-4">
                {appointment.source === "widget" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full status-booked">
                    <Bot className="w-3.5 h-3.5" /> {t('source.widget')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full status-completed">
                    <Pencil className="w-3.5 h-3.5" /> {t('source.manual')}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="py-4 px-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[appointment.status] || "status-completed"}`}>
                  {t(`status.${appointment.status === 'no_show' ? 'noShow' : appointment.status}`)}
                </span>
              </td>

              {/* Receipt */}
              <td className="py-4 px-2">
                {appointment.status === "completed" && (
                  <a
                    href={`/api/receipts/${appointment.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Générer le reçu"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-primary"
                  >
                    <FileText className="w-4 h-4" />
                  </a>
                )}
              </td>

              {/* Actions */}
              <td className="py-4 px-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted border border-transparent hover:border-border"
                      disabled={processingId === appointment.id}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border shadow-lg p-1 w-44">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "confirmed")}
                      disabled={appointment.status === "confirmed"}
                      className="rounded-lg text-sm font-medium cursor-pointer hover:bg-accent py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                      {t('actions.confirm')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "completed")}
                      disabled={appointment.status === "completed"}
                      className="rounded-lg text-sm font-medium cursor-pointer hover:bg-accent py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                      {t('actions.complete')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "no_show")}
                      disabled={appointment.status === "no_show"}
                      className="rounded-lg text-sm font-medium cursor-pointer hover:bg-accent py-2"
                    >
                      <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                      {t('actions.noShow')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "cancelled")}
                      disabled={appointment.status === "cancelled"}
                      className="rounded-lg text-sm font-medium cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive py-2"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('actions.cancel')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
