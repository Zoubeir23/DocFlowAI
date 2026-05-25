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

interface PatientConfirmationData {
  patientName: string;
  clinicName: string;
  serviceName: string;
  startAt: string;
  locale: EmailLocale;
  cancelToken?: string;
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
      "Merci d'arriver 5 à 10 minutes avant l'heure prévue. En cas d'annulation, utilisez le lien ci-dessous au moins 24 heures à l'avance.",
    cancelLabel: "Annuler mon rendez-vous",
    footer: "Propulsé par <strong>DocFlow AI</strong> · Message automatique",
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
      "Please arrive 5–10 minutes early. To cancel, use the link below at least 24 hours in advance.",
    cancelLabel: "Cancel my appointment",
    footer: "Powered by <strong>DocFlow AI</strong> · Automated message",
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
  const { patientName, clinicName, serviceName, startAt, locale, cancelToken } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";
  const cancelUrl = cancelToken ? `${appUrl}/rdv/${cancelToken}/annuler` : null;
  const s = STRINGS[locale];
  const formattedTime = formatDateTime(startAt);

  // H1 fix: escape all user-supplied values before HTML interpolation
  const safePatientName = escapeHtml(patientName);
  const safeClinicName = escapeHtml(clinicName);
  const safeServiceName = escapeHtml(serviceName);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:60px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px -10px rgba(0,0,0,0.08);border:1px solid #f1f5f9;">

        <tr>
          <td style="background:#0f172a;padding:48px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:600;font-family:Georgia, serif;letter-spacing:0.5px;">${s.heading}</h1>
            <div style="width:40px;height:2px;background:#e2e8f0;margin:16px auto;opacity:0.3;"></div>
            <p style="margin:0;color:#cbd5e1;font-size:15px;letter-spacing:1px;text-transform:uppercase;">${safeClinicName}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px;">
            <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">${s.greeting(safePatientName)}</p>
            <p style="margin:0 0 32px;color:#64748b;font-size:15px;line-height:1.6;">${s.intro}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #f1f5f9;border-radius:16px;margin-bottom:32px;">
              <tr>
                <td style="padding:24px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #f8fafc;">
                        <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${s.labelService}</span>
                      </td>
                      <td style="padding:12px 0;border-bottom:1px solid #f8fafc;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${safeServiceName}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid #f8fafc;">
                        <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${s.labelDateTime}</span>
                      </td>
                      <td style="padding:12px 0;border-bottom:1px solid #f8fafc;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${formattedTime}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0;">
                        <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${s.labelClinic}</span>
                      </td>
                      <td style="padding:12px 0;text-align:right;">
                        <strong style="color:#0f172a;font-size:14px;font-weight:600;">${safeClinicName}</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#64748b;font-size:14px;line-height:1.7;">${s.instructions}</p>

            ${cancelUrl ? `
            <div style="margin-top:24px;text-align:center;">
              <a href="${cancelUrl}" style="display:inline-block;padding:12px 28px;background:#f1f5f9;border-radius:50px;color:#64748b;font-size:13px;font-weight:600;text-decoration:none;border:1px solid #e2e8f0;">
                ${s.cancelLabel}
              </a>
            </div>` : ""}
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
