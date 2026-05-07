"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, CheckCircle, XCircle, Clock, AlertCircle, Bot, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { AppointmentWithRelations } from "@/types";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import { updateAppointmentStatus, cancelAppointment } from "@/actions/appointments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  completed: "bg-slate-50 text-slate-600 border border-slate-200",
  cancelled: "bg-red-50 text-red-600 border border-red-100",
  no_show: "bg-amber-50 text-amber-700 border border-amber-100",
};

export function AppointmentTable({ appointments, loading, onRefresh }: AppointmentTableProps) {
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
        toast.success(`Appointment marked as ${getStatusLabel(status)}`);
        onRefresh?.();
      } else {
        toast.error(result.error || "Failed to update");
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50/60">
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
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-500 font-semibold text-sm">No appointments found</p>
        <p className="text-xs text-slate-400 mt-1">Appointments will appear here when booked via the AI widget</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Patient</th>
            <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Service</th>
            <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Date & Time</th>
            <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Source</th>
            <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-3 pr-4">Status</th>
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
                    <p className="font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">
                      {appointment.patient?.full_name}
                    </p>
                    <p className="text-xs text-slate-400">{appointment.patient?.phone}</p>
                  </div>
                </div>
              </td>

              {/* Service */}
              <td className="py-3.5 pr-4">
                <p className="font-medium text-slate-700">{appointment.service?.name}</p>
                <p className="text-xs text-slate-400">{appointment.service?.duration_minutes} min</p>
              </td>

              {/* Date & Time */}
              <td className="py-3.5 pr-4">
                <p className="font-medium text-slate-700">
                  {format(parseISO(appointment.start_at), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-slate-400">
                  {format(parseISO(appointment.start_at), "h:mm a")} –{" "}
                  {format(parseISO(appointment.end_at), "h:mm a")}
                </p>
              </td>

              {/* Source */}
              <td className="py-3.5 pr-4">
                {appointment.source === "widget" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                    <Bot className="w-3 h-3" /> AI Widget
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                    <Pencil className="w-3 h-3" /> Manual
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="py-3.5 pr-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[appointment.status] || "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                  {getStatusLabel(appointment.status)}
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
                  <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-lg p-1 w-44">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "confirmed")}
                      disabled={appointment.status === "confirmed"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                      Confirm
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "completed")}
                      disabled={appointment.status === "completed"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-teal-50 hover:text-teal-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-teal-500" />
                      Mark Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "no_show")}
                      disabled={appointment.status === "no_show"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-amber-50 hover:text-amber-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                      No-Show
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(appointment.id, "cancelled")}
                      disabled={appointment.status === "cancelled"}
                      className="rounded-lg text-sm cursor-pointer hover:bg-red-50 text-red-500 hover:text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
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
