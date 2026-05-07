import type { EmailLocale } from "../types";
import { formatDateTime } from "@/lib/utils";

interface DoctorNotificationData {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  clinicName: string;
  serviceName: string;
  startAt: string;
  appointmentId: string;
  locale: EmailLocale;
}

const STRINGS = {
  fr: {
    subject: (patientName: string, serviceName: string) =>
      `Nouveau rendez-vous : ${patientName} — ${serviceName}`,
    heading: "🗓 Nouveau Rendez-vous",
    intro:
      "Un nouveau rendez-vous a été réservé via votre widget IA. Voici les détails :",
    sectionPatient: "Informations patient",
    sectionAppointment: "Détails du rendez-vous",
    labelName: "Nom",
    labelPhone: "Téléphone",
    labelEmail: "Email",
    labelEmailFallback: "Non renseigné",
    labelService: "Service",
    labelDateTime: "Date & Heure",
    labelAppointmentId: "ID Rendez-vous",
    dashboardLink: "Gérer ce rendez-vous dans votre tableau de bord →",
    footer:
      "Propulsé par <strong>MedBook AI</strong> · Notification automatique",
  },
  en: {
    subject: (patientName: string, serviceName: string) =>
      `New Appointment: ${patientName} — ${serviceName}`,
    heading: "🗓 New Appointment Booked",
    intro:
      "A new appointment has been booked through your AI widget. Here are the details:",
    sectionPatient: "Patient Details",
    sectionAppointment: "Appointment Details",
    labelName: "Name",
    labelPhone: "Phone",
    labelEmail: "Email",
    labelEmailFallback: "Not provided",
    labelService: "Service",
    labelDateTime: "Date & Time",
    labelAppointmentId: "Appointment ID",
    dashboardLink: "View and manage this appointment in your Dashboard →",
    footer:
      "Powered by <strong>MedBook AI</strong> · Automated notification",
  },
} as const;

export function buildDoctorNotificationSubject(
  patientName: string,
  serviceName: string,
  locale: EmailLocale
): string {
  return STRINGS[locale].subject(patientName, serviceName);
}

export function buildDoctorNotificationHtml(
  data: DoctorNotificationData
): string {
  const {
    patientName,
    patientPhone,
    patientEmail,
    clinicName,
    serviceName,
    startAt,
    appointmentId,
    locale,
  } = data;
  const s = STRINGS[locale];
  const formattedTime = formatDateTime(startAt);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <tr>
          <td style="background:#16a34a;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${s.heading}</h1>
            <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">${clinicName}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">${s.intro}</p>

            <p style="margin:0 0 8px;color:#374151;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${s.sectionPatient}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:20px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;border-bottom:1px solid #dcfce7;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelName}</span>
                      </td>
                      <td style="padding:5px 0;border-bottom:1px solid #dcfce7;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${patientName}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;border-bottom:1px solid #dcfce7;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelPhone}</span>
                      </td>
                      <td style="padding:5px 0;border-bottom:1px solid #dcfce7;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${patientPhone}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelEmail}</span>
                      </td>
                      <td style="padding:5px 0;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${patientEmail ?? s.labelEmailFallback}</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#374151;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${s.sectionAppointment}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;border-bottom:1px solid #e0f2fe;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelService}</span>
                      </td>
                      <td style="padding:5px 0;border-bottom:1px solid #e0f2fe;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${serviceName}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;border-bottom:1px solid #e0f2fe;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelDateTime}</span>
                      </td>
                      <td style="padding:5px 0;border-bottom:1px solid #e0f2fe;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${formattedTime}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelAppointmentId}</span>
                      </td>
                      <td style="padding:5px 0;text-align:right;">
                        <span style="color:#6b7280;font-size:12px;font-family:monospace;">${appointmentId}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;">
              <a href="${appUrl}/app/appointments" style="color:#2563eb;text-decoration:none;font-weight:600;">
                ${s.dashboardLink}
              </a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">${s.footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
