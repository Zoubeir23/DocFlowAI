import { Resend } from "resend";
import type { EmailPayload, EmailResult } from "./types";
import {
  buildPatientConfirmationSubject,
  buildPatientConfirmationHtml,
} from "./templates/patient-confirmation";
import {
  buildDoctorNotificationSubject,
  buildDoctorNotificationHtml,
} from "./templates/doctor-notification";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[Resend] RESEND_API_KEY is not configured. Email will be skipped.");
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_ADDRESS =
  process.env.NEXT_PUBLIC_EMAIL_FROM ?? "onboarding@resend.dev";
const DEV_OVERRIDE = process.env.RESEND_DEV_EMAIL ?? "";

export async function sendConfirmationEmail(
  payload: EmailPayload
): Promise<EmailResult[]> {
  const resend = getResendClient();
  const locale = payload.locale ?? "fr";
  const results: EmailResult[] = [];

  if (!resend) return [{ success: false, channel: "email", error: "Resend not configured" }];

  if (payload.patientEmail) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: DEV_OVERRIDE || payload.patientEmail,
        subject: buildPatientConfirmationSubject(
          payload.serviceName,
          payload.clinicName,
          locale
        ),
        html: buildPatientConfirmationHtml({
          patientName: payload.patientName,
          clinicName: payload.clinicName,
          serviceName: payload.serviceName,
          startAt: payload.startAt,
          locale,
        }),
      });

      if (error) {
        console.error("[Resend] Patient email error:", error);
        results.push({ success: false, channel: "email_patient", error: error.message });
      } else {
        results.push({ success: true, channel: "email_patient", messageId: data?.id });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Resend] Patient email exception:", message);
      results.push({ success: false, channel: "email_patient", error: message });
    }
  }

  if (payload.doctorEmail) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: DEV_OVERRIDE || payload.doctorEmail,
        subject: buildDoctorNotificationSubject(
          payload.patientName,
          payload.serviceName,
          locale
        ),
        html: buildDoctorNotificationHtml({
          patientName: payload.patientName,
          patientPhone: payload.patientPhone,
          patientEmail: payload.patientEmail,
          clinicName: payload.clinicName,
          serviceName: payload.serviceName,
          startAt: payload.startAt,
          appointmentId: payload.appointmentId,
          locale,
        }),
      });

      if (error) {
        console.error("[Resend] Doctor email error:", error);
        results.push({ success: false, channel: "email_doctor", error: error.message });
      } else {
        results.push({ success: true, channel: "email_doctor", messageId: data?.id });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Resend] Doctor email exception:", message);
      results.push({ success: false, channel: "email_doctor", error: message });
    }
  }

  return results;
}
