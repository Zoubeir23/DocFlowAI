"use server";

import nodemailer from "nodemailer";

export interface EnterpriseContactData {
  organizationName: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  numberOfDoctors: string;
  message: string;
}

export async function sendEnterpriseContactRequest(
  data: EnterpriseContactData
): Promise<{ success: boolean; error?: string }> {
  const googleUser = process.env.SMTP_GOOGLE_EMAIL;
  const googleAppPassword = process.env.GOOGLE_APP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("[EnterpriseContact] ADMIN_EMAIL not configured");
    return { success: false, error: "Service de contact non disponible. Écrivez-nous directement." };
  }

  if (!googleUser || !googleAppPassword) {
    console.error("[EnterpriseContact] SMTP not configured");
    return { success: false, error: "Service email non disponible. Contactez-nous directement." };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: googleUser, pass: googleAppPassword },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <div style="background: linear-gradient(135deg, #0d9488, #0891b2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 22px;">🏥 Nouvelle demande Enterprise</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">DocFlow AI — Contact commercial</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <tr style="background: #f9fafb;">
          <td style="padding: 12px 16px; font-weight: 600; color: #374151; width: 40%; border-bottom: 1px solid #e5e7eb;">Organisation</td>
          <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.organizationName)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Contact</td>
          <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.contactName)} — ${escapeHtml(data.contactRole)}</td>
        </tr>
        <tr style="background: #f9fafb;">
          <td style="padding: 12px 16px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Email</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}" style="color: #0d9488;">${escapeHtml(data.email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Téléphone</td>
          <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.phone)}</td>
        </tr>
        <tr style="background: #f9fafb;">
          <td style="padding: 12px 16px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Nb. médecins</td>
          <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.numberOfDoctors)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: 600; color: #374151; vertical-align: top;">Message</td>
          <td style="padding: 12px 16px; color: #111827; white-space: pre-line;">${escapeHtml(data.message)}</td>
        </tr>
      </table>

      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;">
        Envoyé depuis DocFlow AI — ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}
      </p>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: googleUser,
      to: adminEmail,
      replyTo: data.email,
      subject: `[DocFlow Enterprise] ${escapeHtml(data.organizationName)} — ${data.numberOfDoctors} médecins`,
      html,
    });

    console.log(`[EnterpriseContact] Sent from ${data.email} (${data.organizationName})`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[EnterpriseContact] SMTP error:", message);
    return { success: false, error: "Impossible d'envoyer le message. Réessayez ou écrivez-nous directement." };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
