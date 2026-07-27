/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateAvailableSlots, getNextAvailableDates } from "@/lib/slots";
import type { AvailabilityRule, BlockedDate, Appointment } from "@/types";

export interface ClinicDaySlots {
  date: string;
  slots: Array<{ start: string; end: string; label: string }>;
}

export async function computeAvailableSlotsForClinic(
  db: any,
  clinicId: string,
  clinicTimezone: string,
  availabilityRules: AvailabilityRule[],
  blockedDates: BlockedDate[],
  defaultDuration: number
): Promise<ClinicDaySlots[]> {
  const nextDates = getNextAvailableDates(
    availabilityRules,
    blockedDates,
    14,
    clinicTimezone
  ).slice(0, 5);

  return Promise.all(
    nextDates.map(async (date) => {
      const { data: existingAppts } = await db
        .from("appointments")
        .select("start_at, end_at, status")
        .eq("clinic_id", clinicId)
        .gte("start_at", `${date}T00:00:00`)
        .lt("start_at", `${date}T23:59:59`)
        .neq("status", "cancelled");

      const slots = generateAvailableSlots({
        date,
        serviceDurationMinutes: defaultDuration,
        availabilityRules,
        blockedDates,
        existingAppointments: (existingAppts || []) as Pick<Appointment, "start_at" | "end_at" | "status">[],
        timezone: clinicTimezone,
      });

      return { date, slots: slots.slice(0, 6) };
    })
  );
}
