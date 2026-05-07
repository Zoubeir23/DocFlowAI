import nodemailer from "nodemailer";
import type { EmailPayload, EmailResult } from "./types";
import {
  buildPatientConfirmationSubject,
  buildPatientConfirmationHtml,
} from "./templates/patient-confirmation";
import {
  buildDoctorNotificationSubject,
  buildDoctorNotificationHtml,
} from "./templates/doctor-notification";

let transporterInstance: nodemailer.Transporter | null = null;

function getSmtpTransporter(): nodemailer.Transporter {
  if (!transporterInstance) {
    const googleUser = process.env.SMTP_GOOGLE_EMAIL;
    const googleAppPassword = process.env.GOOGLE_APP_PASSWORD;

    if (!googleUser || !googleAppPassword) {
      throw new Error(
        "SMTP_GOOGLE_EMAIL and GOOGLE_APP_PASSWORD must be configured"
      );
    }

    transporterInstance = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: googleUser,
        pass: googleAppPassword,
      },
    });
  }
  return transporterInstance;
}

const FROM_ADDRESS =
  process.env.NEXT_PUBLIC_EMAIL_FROM ?? process.env.SMTP_GOOGLE_EMAIL ?? "";

export async function sendConfirmationEmail(
  payload: EmailPayload
): Promise<EmailResult[]> {
  const transporter = getSmtpTransporter();
  const locale = payload.locale ?? "fr";
  const results: EmailResult[] = [];

  if (payload.patientEmail) {
    try {
      const info = await transporter.sendMail({
        from: FROM_ADDRESS,
        to: payload.patientEmail,
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

      results.push({
        success: true,
        channel: "email_patient",
        messageId: info.messageId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown SMTP error";
      console.error("[SMTP] Patient email error:", message);
      results.push({ success: false, channel: "email_patient", error: message });
    }
  }

  if (payload.doctorEmail) {
    try {
      const info = await transporter.sendMail({
        from: FROM_ADDRESS,
        to: payload.doctorEmail,
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

      results.push({
        success: true,
        channel: "email_doctor",
        messageId: info.messageId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown SMTP error";
      console.error("[SMTP] Doctor email error:", message);
      results.push({ success: false, channel: "email_doctor", error: message });
    }
  }

  return results;
}
