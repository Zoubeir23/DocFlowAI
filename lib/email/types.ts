export type EmailLocale = "fr" | "en";

export interface EmailPayload {
  type: "appointment_confirmation" | "appointment_reminder";
  appointmentId: string;
  cancelToken?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorEmail?: string;
  clinicName: string;
  serviceName: string;
  startAt: string;
  locale?: EmailLocale;
}

export interface EmailResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  sendConfirmationEmail(payload: EmailPayload): Promise<EmailResult[]>;
}
