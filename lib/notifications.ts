import type { NotificationPayload } from "@/types";
import { sendConfirmationEmail } from "./email/router";
import { formatDateTime } from "./utils";

export interface NotificationResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult[]> {
  if (payload.type !== "appointment_confirmation") {
    console.log(`[Notification] Skipping non-confirmation type: ${payload.type}`);
    return [{ success: true, channel: "skipped" }];
  }

  return sendConfirmationEmail({
    type: "appointment_confirmation",
    appointmentId: payload.appointmentId,
    patientName: payload.patientName,
    patientPhone: payload.patientPhone,
    patientEmail: payload.patientEmail,
    doctorEmail: payload.doctorEmail,
    clinicName: payload.clinicName,
    serviceName: payload.serviceName,
    startAt: payload.startAt,
    locale: "fr",
  });
}

export function buildNotificationMessage(payload: NotificationPayload): string {
  const { type, patientName, clinicName, serviceName, startAt } = payload;
  const formattedTime = formatDateTime(startAt);
  switch (type) {
    case "appointment_confirmation":
      return `Bonjour ${patientName}, votre rendez-vous pour ${serviceName} chez ${clinicName} est confirmé le ${formattedTime}.`;
    case "appointment_reminder":
      return `Rappel : ${patientName}, vous avez un rendez-vous pour ${serviceName} chez ${clinicName} demain à ${formattedTime}.`;
    case "appointment_cancellation":
      return `Bonjour ${patientName}, votre rendez-vous pour ${serviceName} chez ${clinicName} le ${formattedTime} a été annulé.`;
    default:
      return `Notification de ${clinicName}`;
  }
}
