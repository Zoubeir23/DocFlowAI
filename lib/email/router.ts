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
