import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export type WebhookEvent =
  | "appointment.created"
  | "appointment.updated"
  | "appointment.cancelled"
  | "appointment.completed"
  | "patient.created";

export interface WebhookPayload {
  event: WebhookEvent;
  clinic_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

function buildSignature(secret: string, payload: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function deliverToEndpoint(
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<{ statusCode: number; success: boolean }> {
  const body = JSON.stringify(payload);
  const signature = buildSignature(secret, body);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DocFlow-Signature": signature,
        "X-DocFlow-Event": payload.event,
        "User-Agent": "DocFlow-Webhook/1.0",
      },
      body,
      signal: controller.signal,
    });
    return { statusCode: response.status, success: response.ok };
  } catch {
    return { statusCode: 0, success: false };
  } finally {
    clearTimeout(timeout);
  }
}

export async function dispatchWebhookEvent(
  clinicId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createAdminClient()) as any;

  const { data: hooks } = await db
    .from("webhooks")
    .select("id, url, secret, failure_count")
    .eq("clinic_id", clinicId)
    .eq("is_active", true)
    .contains("events", [event]);

  if (!hooks || hooks.length === 0) return;

  const payload: WebhookPayload = {
    event,
    clinic_id: clinicId,
    timestamp: new Date().toISOString(),
    data,
  };

  await Promise.all(
    hooks.map(async (hook: { id: string; url: string; secret: string; failure_count: number }) => {
      const { statusCode, success } = await deliverToEndpoint(hook.url, hook.secret, payload);

      const newFailureCount = success ? 0 : hook.failure_count + 1;

      await db
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status_code: statusCode,
          failure_count: newFailureCount,
          // Disable after 10 consecutive failures
          is_active: newFailureCount < 10,
        })
        .eq("id", hook.id);
    })
  );
}
