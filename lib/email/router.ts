import type { EmailPayload, EmailResult } from "./types";

type ActiveEmailProvider = "resend" | "smtp";

function resolveActiveProvider(): ActiveEmailProvider {
  const configured = process.env.ACTIVE_EMAIL_PROVIDER?.toLowerCase();
  if (configured === "smtp" || configured === "resend") {
    return configured;
  }
  return "resend";
}

export async function sendConfirmationEmail(
  payload: EmailPayload
): Promise<EmailResult[]> {
  const provider = resolveActiveProvider();

  if (provider === "smtp") {
    const { sendConfirmationEmail: sendViaSMTP } = await import("./smtp");
    return sendViaSMTP(payload);
  }

  const { sendConfirmationEmail: sendViaResend } = await import("./resend");
  return sendViaResend(payload);
}

export interface RawEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendRawEmail(options: RawEmailOptions): Promise<void> {
  const provider = resolveActiveProvider();

  if (provider === "smtp") {
    const nodemailer = await import("nodemailer");
    const googleUser = process.env.SMTP_GOOGLE_EMAIL;
    const googleAppPassword = process.env.GOOGLE_APP_PASSWORD;
    if (!googleUser || !googleAppPassword) return;

    const transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: googleUser, pass: googleAppPassword },
    });

    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_EMAIL_FROM ?? googleUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });
    return;
  }

  // Resend path
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);
  const fromAddress = process.env.NEXT_PUBLIC_EMAIL_FROM ?? "onboarding@resend.dev";

  await resend.emails.send({
    from: fromAddress,
    to: [options.to],
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
  });
}
