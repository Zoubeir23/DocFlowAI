import type { EmailLocale } from "../types";
import { formatDateTime } from "@/lib/utils";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

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
      `Nouveau rendez-vous : ${escapeHtml(patientName)} — ${escapeHtml(serviceName)}`,
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
      "Propulsé par <strong>DocFlow AI</strong> · Notification automatique",
  },
  en: {
    subject: (patientName: string, serviceName: string) =>
      `New Appointment: ${escapeHtml(patientName)} — ${escapeHtml(serviceName)}`,
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
      "Powered by <strong>DocFlow AI</strong> · Automated notification",
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

  // H1 fix: escape all user-supplied values before HTML interpolation
  const safePatientName = escapeHtml(patientName);
  const safePatientPhone = escapeHtml(patientPhone);
  const safePatientEmail = patientEmail ? escapeHtml(patientEmail) : undefined;
  const safeClinicName = escapeHtml(clinicName);
  const safeServiceName = escapeHtml(serviceName);
  const safeAppointmentId = escapeHtml(appointmentId);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:60px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px -10px rgba(0,0,0,0.08);border:1px solid #f1f5f9;">

        <tr>
          <td style="background:linear-gradient(135deg, #0f172a, #1e293b);padding:48px 40px;text-align:center;">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.1);border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px;">🗓</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:600;font-family:Georgia, serif;letter-spacing:0.5px;">Nouveau Rendez-vous</h1>
            <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;letter-spacing:1px;text-transform:uppercase;">${safeClinicName}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px;">
            <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.6;text-align:center;">${s.intro}</p>

            <p style="margin:0 0 12px;color:#0f172a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">${s.sectionPatient}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;">
                        <span style="color:#64748b;font-size:13px;font-weight:500;">${s.labelName}</span>
                      </td>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${safePatientName}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;">
                        <span style="color:#64748b;font-size:13px;font-weight:500;">${s.labelPhone}</span>
                      </td>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${safePatientPhone}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;">
                        <span style="color:#64748b;font-size:13px;font-weight:500;">${s.labelEmail}</span>
                      </td>
                      <td style="padding:10px 0;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${safePatientEmail ?? s.labelEmailFallback}</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 12px;color:#0f172a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">${s.sectionAppointment}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;">
                        <span style="color:#64748b;font-size:13px;font-weight:500;">${s.labelService}</span>
                      </td>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${safeServiceName}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;">
                        <span style="color:#64748b;font-size:13px;font-weight:500;">${s.labelDateTime}</span>
                      </td>
                      <td style="padding:10px 0;border-bottom:1px solid #f8fafc;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${formattedTime}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;">
                        <span style="color:#64748b;font-size:13px;font-weight:500;">${s.labelAppointmentId}</span>
                      </td>
                      <td style="padding:10px 0;text-align:right;">
                        <span style="color:#94a3b8;font-size:11px;font-family:monospace;background:#f1f5f9;padding:4px 8px;border-radius:6px;">${safeAppointmentId}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="text-align:center;">
              <a href="${appUrl}/app/appointments" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;box-shadow:0 4px 12px rgba(15,23,42,0.15);">
                ${s.dashboardLink}
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:12px;letter-spacing:0.5px;">${s.footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
