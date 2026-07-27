/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { checkWidgetBookRateLimit } from "@/lib/rate-limit";
import { sendNotification } from "@/lib/notifications";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import type { ClinicDaySlots } from "./compute-available-slots";

// Même contrat que /api/widget/book : les données d'action renvoyées par le
// LLM ne sont pas plus dignes de confiance qu'une entrée utilisateur brute.
export const bookingActionSchema = z.object({
  patientName: z.string().min(1).max(200),
  patientPhone: z.string().min(1).max(30),
  patientEmail: z.string().email().optional().or(z.literal("")),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
});

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  patientId?: string;
  error?: string;
}

export async function executeBookingAction(
  db: any,
  actionData: unknown,
  ip: string,
  clinic: { id: string; name: string },
  services: any[],
  slotsPerDate: ClinicDaySlots[]
): Promise<BookingResult> {
  // M6 fix: never log patient PII — log intent only
  console.log("[booking] create_booking action received");

  const validated = bookingActionSchema.safeParse(actionData);
  // Le LLM n'est pas plus digne de confiance qu'un input utilisateur brut :
  // en plus de la validation Zod, on impose la même limite dédiée aux
  // réservations que /api/widget/book, et on vérifie que le créneau
  // proposé correspond exactement à un créneau réellement disponible
  // calculé côté serveur (pas seulement la règle textuelle du prompt).
  if (!validated.success) {
    return { success: false, error: "Données de réservation invalides" };
  }

  if (!(await checkWidgetBookRateLimit(ip))) {
    return { success: false, error: "Trop de tentatives de réservation. Réessayez dans une minute." };
  }

  const data = validated.data;
  const service = services.find(
    (s) =>
      s.id === data.serviceId ||
      s.name.toLowerCase() === (data.serviceName || "").toLowerCase()
  );

  if (!service) {
    return { success: false, error: "Service not found" };
  }

  const slotIsReallyAvailable = slotsPerDate.some((d) =>
    d.slots.some((slot) => slot.start === data.startAt && slot.end === data.endAt)
  );

  if (!slotIsReallyAvailable) {
    return { success: false, error: "Ce créneau n'est plus disponible." };
  }

  const { data: result, error } = await db.rpc("create_booking_from_widget", {
    p_clinic_id: clinic.id,
    p_patient_name: data.patientName,
    p_patient_phone: data.patientPhone,
    p_patient_email: data.patientEmail || null,
    p_service_id: service.id,
    p_start_at: data.startAt,
    p_end_at: data.endAt,
    p_notes: null,
  });

  if (error || !result) {
    return { success: false, error: error?.message || "Booking failed" };
  }

  const resultData = result as { appointment_id: string; patient_id: string };

  await sendNotification({
    type: "appointment_confirmation",
    appointmentId: resultData.appointment_id,
    patientName: data.patientName,
    patientPhone: data.patientPhone,
    patientEmail: data.patientEmail || undefined,
    clinicName: clinic.name,
    serviceName: service.name,
    startAt: data.startAt,
  });

  dispatchWebhookEvent(clinic.id, "appointment.created", {
    id: resultData.appointment_id,
    start_at: data.startAt,
    end_at: data.endAt,
    status: "booked",
    patient_name: data.patientName,
    patient_phone: data.patientPhone,
    service_name: service.name,
  }).catch(() => {});

  return {
    success: true,
    appointmentId: resultData.appointment_id,
    patientId: resultData.patient_id,
  };
}
