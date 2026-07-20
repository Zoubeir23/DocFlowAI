import { format, parseISO, isBefore, isAfter } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import type { AvailabilityRule, BlockedDate, Appointment } from "@/types";
import { timeToMinutes, minutesToTime } from "./utils";

export interface SlotInput {
  date: string;
  serviceDurationMinutes: number;
  availabilityRules: AvailabilityRule[];
  blockedDates: BlockedDate[];
  existingAppointments: Pick<Appointment, "start_at" | "end_at" | "status">[];
  timezone: string;
}

export interface Slot {
  start: string;
  end: string;
  label: string;
}

export function generateAvailableSlots(input: SlotInput): Slot[] {
  const {
    date,
    serviceDurationMinutes,
    availabilityRules,
    blockedDates,
    existingAppointments,
    timezone,
  } = input;

  // parseISO(date).getDay() dépend du fuseau du serveur d'exécution : on dérive
  // le jour de semaine directement des composants UTC pour rester déterministe.
  const [year, month, day] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const isBlocked = blockedDates.some((bd) => bd.date === date);
  if (isBlocked) return [];

  const rule = availabilityRules.find(
    (r) => r.day_of_week === dayOfWeek && r.is_active
  );
  if (!rule) return [];

  const startMinutes = timeToMinutes(rule.start_time);
  const endMinutes = timeToMinutes(rule.end_time);
  const breakStart = rule.break_start ? timeToMinutes(rule.break_start) : null;
  const breakEnd = rule.break_end ? timeToMinutes(rule.break_end) : null;

  const slots: Slot[] = [];
  let current = startMinutes;

  const activeAppointments = existingAppointments.filter(
    (a) => a.status !== "cancelled"
  );

  while (current + serviceDurationMinutes <= endMinutes) {
    const slotEnd = current + serviceDurationMinutes;

    const inBreak =
      breakStart !== null &&
      breakEnd !== null &&
      current < breakEnd &&
      slotEnd > breakStart;

    if (inBreak) {
      current = breakEnd!;
      continue;
    }

    const slotStartTime = `${date}T${minutesToTime(current)}:00`;
    const slotEndTime = `${date}T${minutesToTime(slotEnd)}:00`;

    // Le créneau est exprimé en heure locale de la clinique : on le convertit
    // en instant UTC réel avant toute comparaison (fuseau serveur ≠ fuseau clinique).
    const slotStartDate = fromZonedTime(slotStartTime, timezone);
    const slotEndDate = fromZonedTime(slotEndTime, timezone);

    const now = new Date();
    if (isBefore(slotStartDate, now)) {
      current += 15;
      continue;
    }

    const hasConflict = activeAppointments.some((appt) => {
      const apptStart = parseISO(appt.start_at);
      const apptEnd = parseISO(appt.end_at);
      return isBefore(slotStartDate, apptEnd) && isAfter(slotEndDate, apptStart);
    });

    if (!hasConflict) {
      const startFormatted = formatInTimeZone(slotStartDate, timezone, "h:mm a");
      const endFormatted = formatInTimeZone(slotEndDate, timezone, "h:mm a");
      slots.push({
        start: slotStartTime,
        end: slotEndTime,
        label: `${startFormatted} - ${endFormatted}`,
      });
    }

    current += 15;
  }

  return slots;
}

export function getNextAvailableDates(
  availabilityRules: AvailabilityRule[],
  blockedDates: BlockedDate[],
  daysToCheck = 30,
  timezone = "UTC"
): string[] {
  const available: string[] = [];
  // "Aujourd'hui" doit être la date calendaire côté clinique, pas côté serveur.
  const todayInClinicTz = toZonedTime(new Date(), timezone);
  const activeDays = availabilityRules
    .filter((r) => r.is_active)
    .map((r) => r.day_of_week);

  const blockedSet = new Set(blockedDates.map((b) => b.date));

  for (let i = 0; i < daysToCheck; i++) {
    const d = new Date(todayInClinicTz);
    d.setDate(d.getDate() + i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dow = d.getDay();

    if (activeDays.includes(dow) && !blockedSet.has(dateStr)) {
      available.push(dateStr);
    }
  }

  return available;
}
