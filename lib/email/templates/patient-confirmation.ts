import type { EmailLocale } from "../types";
import { formatDateTime } from "@/lib/utils";

interface PatientConfirmationData {
  patientName: string;
  clinicName: string;
  serviceName: string;
  startAt: string;
  locale: EmailLocale;
}

const STRINGS = {
  fr: {
    subject: (serviceName: string, clinicName: string) =>
      `Rendez-vous confirmé — ${serviceName} chez ${clinicName}`,
    heading: "Rendez-vous Confirmé ✓",
    greeting: (name: string) => `Bonjour <strong>${name}</strong>,`,
    intro:
      "Votre rendez-vous a bien été enregistré. Voici le récapitulatif :",
    labelService: "Service",
    labelDateTime: "Date & Heure",
    labelClinic: "Clinique",
    instructions:
      "Merci d'arriver 5 à 10 minutes avant l'heure prévue. En cas d'annulation ou de report, veuillez nous contacter au moins 24 heures à l'avance.",
    footer: "Propulsé par <strong>MedBook AI</strong> · Message automatique",
  },
  en: {
    subject: (serviceName: string, clinicName: string) =>
      `Appointment Confirmed — ${serviceName} at ${clinicName}`,
    heading: "Appointment Confirmed ✓",
    greeting: (name: string) => `Hi <strong>${name}</strong>,`,
    intro:
      "Your appointment has been successfully booked. Here are your details:",
    labelService: "Service",
    labelDateTime: "Date & Time",
    labelClinic: "Clinic",
    instructions:
      "Please arrive 5–10 minutes early. If you need to cancel or reschedule, please contact us at least 24 hours in advance.",
    footer: "Powered by <strong>MedBook AI</strong> · Automated message",
  },
} as const;

export function buildPatientConfirmationSubject(
  serviceName: string,
  clinicName: string,
  locale: EmailLocale
): string {
  return STRINGS[locale].subject(serviceName, clinicName);
}

export function buildPatientConfirmationHtml(
  data: PatientConfirmationData
): string {
  const { patientName, clinicName, serviceName, startAt, locale } = data;
  const s = STRINGS[locale];
  const formattedTime = formatDateTime(startAt);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <tr>
          <td style="background:#2563eb;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${s.heading}</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">${clinicName}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">${s.greeting(patientName)}</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">${s.intro}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e0f2fe;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelService}</span>
                      </td>
                      <td style="padding:6px 0;border-bottom:1px solid #e0f2fe;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${serviceName}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e0f2fe;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelDateTime}</span>
                      </td>
                      <td style="padding:6px 0;border-bottom:1px solid #e0f2fe;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${formattedTime}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="color:#6b7280;font-size:13px;">${s.labelClinic}</span>
                      </td>
                      <td style="padding:6px 0;text-align:right;">
                        <strong style="color:#111827;font-size:13px;">${clinicName}</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.6;">${s.instructions}</p>
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
