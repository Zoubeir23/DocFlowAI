import { formatDateTime } from "@/lib/utils";

interface SmsConfirmationData {
  patientName: string;
  clinicName: string;
  serviceName: string;
  startAt: string;
  cancelToken?: string;
}

interface SmsReminderData {
  patientName: string;
  clinicName: string;
  serviceName: string;
  startAt: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export function buildSmsConfirmationMessage(data: SmsConfirmationData): string {
  const { patientName, clinicName, serviceName, startAt, cancelToken } = data;
  const dateFormatted = formatDateTime(startAt);
  const firstName = patientName.split(" ")[0];

  let message = `Bonjour ${firstName}, votre RDV pour ${serviceName} chez ${clinicName} est confirmé le ${dateFormatted}.`;

  if (cancelToken) {
    const cancelUrl = `${APP_URL}/rdv/${cancelToken}/annuler`;
    message += ` Pour annuler : ${cancelUrl}`;
  }

  return message;
}

export function buildSmsReminderMessage(data: SmsReminderData): string {
  const { patientName, clinicName, serviceName, startAt } = data;
  const dateFormatted = formatDateTime(startAt);
  const firstName = patientName.split(" ")[0];

  return `Rappel : ${firstName}, vous avez un RDV pour ${serviceName} chez ${clinicName} demain à ${dateFormatted}. En cas d'empêchement, contactez la clinique.`;
}
