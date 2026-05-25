export interface SmsResult {
  success: boolean;
  channel: "sms";
  messageId?: string;
  error?: string;
}

function getTwilioConfig(): { accountSid: string; authToken: string; fromNumber: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const config = getTwilioConfig();

  if (!config) {
    console.warn("[SMS] Twilio not configured — skipping SMS.");
    return { success: false, channel: "sms", error: "Twilio not configured" };
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(config.accountSid, config.authToken);

    const message = await client.messages.create({
      body,
      from: config.fromNumber,
      to,
    });

    return { success: true, channel: "sms", messageId: message.sid };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown SMS error";
    console.error("[SMS] Twilio error:", errorMessage);
    return { success: false, channel: "sms", error: errorMessage };
  }
}
