"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { sendRawEmail } from "@/lib/email/router";

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
  // Cette action est désormais aussi accessible depuis /pricing, une page
  // publique sans authentification — sans limite de débit, elle pourrait être
  // spammée pour inonder ADMIN_EMAIL et la table admin_messages.
  const { headers } = await import("next/headers");
  const { checkRateLimit } = await import("@/lib/rate-limit");
  const headersList = await headers();
  const ip = headersList.get("x-real-ip") ?? headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`enterprise-contact:${ip}`, { requests: 5, windowSeconds: 3600 }))) {
    return { success: false, error: "Trop de demandes envoyées. Réessayez plus tard ou écrivez-nous directement." };
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.SUPPORT_EMAIL;
  if (!adminEmail) {
    console.error("[EnterpriseContact] ADMIN_EMAIL not configured");
    return { success: false, error: "Service de contact non disponible. Écrivez-nous directement." };
  }

  const subject = `[DocFlow Enterprise] ${escapeHtml(data.organizationName)} — ${data.numberOfDoctors} médecins`;

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

  // Sauvegarde en DB (non-bloquant)
  try {
    const adminDb = (await createAdminClient()) as any;
    await adminDb.from("admin_messages").insert({
      type: "enterprise",
      status: "open",
      sender_name: data.contactName,
      sender_email: data.email,
      subject: `Demande enterprise — ${data.organizationName}`,
      body: data.message,
      metadata: {
        organizationName: data.organizationName,
        contactRole: data.contactRole,
        phone: data.phone,
        numberOfDoctors: data.numberOfDoctors,
      },
    });
  } catch (err) {
    console.error("[EnterpriseContact] db save error:", err);
  }

  // Envoi email
  try {
    await sendRawEmail({
      to: adminEmail,
      subject,
      html,
      replyTo: data.email,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[EnterpriseContact] email error:", message);
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
