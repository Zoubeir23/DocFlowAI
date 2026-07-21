import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export interface ApiKeyContext {
  clinicId: string;
  keyId: string;
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export async function validateApiKey(
  rawKey: string | null
): Promise<ApiKeyContext | null> {
  if (!rawKey) return null;

  const hash = hashApiKey(rawKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createAdminClient()) as any;

  const { data: apiKey } = await db
    .from("api_keys")
    .select("id, clinic_id, expires_at")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (!apiKey) return null;
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return null;

  // Fire-and-forget last_used_at update
  db.from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  return { clinicId: apiKey.clinic_id, keyId: apiKey.id };
}

export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return request.headers.get("x-api-key");
}
