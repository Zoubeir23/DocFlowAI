"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, CheckCircle, XCircle, Clock, AlertCircle, Bot, Pencil } from "lucide-react";
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

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-teal-50 text-teal-700 border border-teal-100",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  completed: "bg-muted/50 text-foreground border border-border",
  cancelled: "bg-red-50 text-red-600 border border-red-100",
  no_show: "bg-amber-50 text-amber-700 border border-amber-100",
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
          <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/50/60">
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-3 pr-4">{t('columns.patient')}</th>
            <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-3 pr-4">{t('columns.service')}</th>
            <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-3 pr-4">{t('columns.date')}</th>
            <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-3 pr-4">{t('columns.source')}</th>
            <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider pb-3 pr-4">{t('columns.status')}</th>
            <th className="pb-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {appointments.map((appointment) => (
            <tr
              key={appointment.id}
              className="hover:bg-teal-50/30 transition-colors group"
            >
              {/* Patient */}
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {appointment.patient?.full_name?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-teal-700 transition-colors">
                      {appointment.patient?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{appointment.patient?.phone}</p>
                  </div>
                </div>
              </td>

              {/* Service */}
              <td className="py-3.5 pr-4">
                <p className="font-medium text-foreground">{appointment.service?.name}</p>
                <p className="text-xs text-muted-foreground">{appointment.service?.duration_minutes} min</p>
              </td>

              {/* Date & Time */}
              <td className="py-3.5 pr-4">
                <p className="font-medium text-foreground">
                  {format(parseISO(appointment.start_at), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(appointment.start_at), "h:mm a")} –{" "}
                  {format(parseISO(appointment.end_at), "h:mm a")}
                </p>
              </td>

              {/* Source */}
              <td className="py-3.5 pr-4">
                {appointment.source === "widget" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                    <Bot className="w-3 h-3" /> {t('source.widget')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">
                    <Pencil className="w-3 h-3" /> {t('source.manual')}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="py-3.5 pr-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[appointment.status] || "bg-muted/50 text-muted-foreground border border-border"}`}>
                  {t(`status.${appointment.status === 'no_show' ? 'noShow' : appointment.status}`)}
                </span>
              </td>

              {/* Actions */}
              <td className="py-3.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-50 hover:text-teal-700"
                      disabled={processingId === appointment.id}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border shadow-lg p-1 w-44">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "confirmed")}
                      disabled={appointment.status === "confirmed"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                      {t('actions.confirm')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "completed")}
                      disabled={appointment.status === "completed"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-teal-50 hover:text-teal-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-teal-500" />
                      {t('actions.complete')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "no_show")}
                      disabled={appointment.status === "no_show"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-amber-50 hover:text-amber-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                      {t('actions.noShow')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-muted" />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "cancelled")}
                      disabled={appointment.status === "cancelled"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-red-50 text-red-500 hover:text-red-600"
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
