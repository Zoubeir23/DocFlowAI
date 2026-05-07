"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { updateAppointmentStatus, cancelAppointment } from "@/actions/appointments";
import type { AppointmentWithRelations } from "@/types";
import { toast } from "sonner";

async function fetchAppointments(
  clinicId: string,
  options: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  } = {}
) {
  const supabase = createClient() as any;
  let query = supabase
    .from("appointments")
    .select("*, patient:patients(*), service:services(*)")
    .eq("clinic_id", clinicId)
    .order("start_at", { ascending: false });

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options.fromDate) {
    query = query.gte("start_at", options.fromDate);
  }
  if (options.toDate) {
    query = query.lt("start_at", options.toDate);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return (data || []) as unknown as AppointmentWithRelations[];
}

export function useAppointments(
  clinicId: string | undefined,
  options: Parameters<typeof fetchAppointments>[1] = {}
) {
  return useQuery({
    queryKey: ["appointments", clinicId, options],
    queryFn: () => fetchAppointments(clinicId!, options),
    enabled: !!clinicId,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Parameters<typeof updateAppointmentStatus>[1];
    }) => updateAppointmentStatus(id, status),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Appointment updated");
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
      } else {
        toast.error(result.error || "Failed to update");
      }
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Appointment cancelled");
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
      } else {
        toast.error(result.error || "Failed to cancel");
      }
    },
  });
}
