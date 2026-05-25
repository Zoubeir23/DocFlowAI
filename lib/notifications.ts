import type { NotificationPayload } from "@/types";
import { sendConfirmationEmail } from "./email/router";
import { sendSms } from "./sms/twilio";
import { buildSmsConfirmationMessage, buildSmsReminderMessage } from "./sms/messages";
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
  if (
    payload.type !== "appointment_confirmation" &&
    payload.type !== "appointment_reminder"
  ) {
    console.log(`[Notification] Skipping unsupported type: ${payload.type}`);
    return [{ success: true, channel: "skipped" }];
  }

  const emailPromise = sendConfirmationEmail({
    type: payload.type,
    appointmentId: payload.appointmentId,
    cancelToken: payload.cancelToken,
    patientName: payload.patientName,
    patientPhone: payload.patientPhone,
    patientEmail: payload.patientEmail,
    doctorEmail: payload.type === "appointment_confirmation" ? payload.doctorEmail : undefined,
    clinicName: payload.clinicName,
    serviceName: payload.serviceName,
    startAt: payload.startAt,
    locale: "fr",
  });

  const smsBody =
    payload.type === "appointment_confirmation"
      ? buildSmsConfirmationMessage({
          patientName: payload.patientName,
          clinicName: payload.clinicName,
          serviceName: payload.serviceName,
          startAt: payload.startAt,
          cancelToken: payload.cancelToken,
        })
      : buildSmsReminderMessage({
          patientName: payload.patientName,
          clinicName: payload.clinicName,
          serviceName: payload.serviceName,
          startAt: payload.startAt,
        });

  const smsPromise = sendSms(payload.patientPhone, smsBody);

  const [emailResults, smsResult] = await Promise.all([emailPromise, smsPromise]);

  return [...emailResults, smsResult];
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
