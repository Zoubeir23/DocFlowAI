"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { dispatchWebhookEvent, type WebhookEvent } from "@/lib/webhooks";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

export type { WebhookEvent };

export interface WebhookRecord {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_status_code: number | null;
  failure_count: number;
}


async function getOwnerClinicId(): Promise<{ clinicId: string } | null> {
  const db = (await createClient()) as any;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData) return null;
  if (userData.role !== "owner" && userData.role !== "super_admin") return null;
  return { clinicId: userData.clinic_id };
}

export async function listWebhooks(): Promise<WebhookRecord[]> {
  const auth = await getOwnerClinicId();
  if (!auth) return [];

  const db = (await createClient()) as any;
  const { data } = await db
    .from("webhooks")
    .select("id, name, url, events, is_active, created_at, last_triggered_at, last_status_code, failure_count")
    .eq("clinic_id", auth.clinicId)
    .order("created_at", { ascending: false });

  return (data ?? []) as WebhookRecord[];
}

export async function createWebhook(input: {
  name: string;
  url: string;
  events: WebhookEvent[];
}): Promise<ApiResponse<{ id: string; secret: string }>> {
  const auth = await getOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const trimmedName = input.name?.trim() ?? "";
  const trimmedUrl = input.url?.trim() ?? "";

  if (!trimmedName || trimmedName.length > 100) {
    return { success: false, error: "Nom invalide (1-100 caractères)" };
  }
  if (!trimmedUrl.startsWith("https://")) {
    return { success: false, error: "L'URL doit utiliser HTTPS" };
  }
  if (!input.events.length) {
    return { success: false, error: "Sélectionnez au moins un événement" };
  }

  const db = (await createClient()) as any;

  const { count } = await db
    .from("webhooks")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", auth.clinicId);

  if ((count ?? 0) >= 10) {
    return { success: false, error: "Maximum 10 webhooks par clinique" };
  }

  const secret = "whsec_" + crypto.randomBytes(32).toString("hex");

  const { data, error } = await db
    .from("webhooks")
    .insert({
      clinic_id: auth.clinicId,
      name: trimmedName,
      url: trimmedUrl,
      events: input.events,
      secret,
    })
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: "Erreur lors de la création" };

  return { success: true, data: { id: data.id, secret } };
}

export async function deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
  const auth = await getOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createClient()) as any;
  const { error } = await db
    .from("webhooks")
    .delete()
    .eq("id", webhookId)
    .eq("clinic_id", auth.clinicId);

  if (error) return { success: false, error: "Erreur lors de la suppression" };
  return { success: true };
}

export async function toggleWebhook(
  webhookId: string,
  isActive: boolean
): Promise<ApiResponse<void>> {
  const auth = await getOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createClient()) as any;
  const { error } = await db
    .from("webhooks")
    .update({ is_active: isActive, failure_count: isActive ? 0 : undefined })
    .eq("id", webhookId)
    .eq("clinic_id", auth.clinicId);

  if (error) return { success: false, error: "Erreur" };
  return { success: true };
}

export async function testWebhook(webhookId: string): Promise<ApiResponse<{ statusCode: number }>> {
  const auth = await getOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createClient()) as any;
  const { data: hook } = await db
    .from("webhooks")
    .select("url, secret")
    .eq("id", webhookId)
    .eq("clinic_id", auth.clinicId)
    .maybeSingle();

  if (!hook) return { success: false, error: "Webhook introuvable" };

  await dispatchWebhookEvent(auth.clinicId, "appointment.created", {
    id: "test-" + Date.now(),
    test: true,
    message: "Ceci est un test de webhook DocFlow",
  });

  return { success: true, data: { statusCode: 200 } };
}

export async function regenerateWebhookSecret(
  webhookId: string
): Promise<ApiResponse<{ secret: string }>> {
  const auth = await getOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const newSecret = "whsec_" + crypto.randomBytes(32).toString("hex");
  const adminDb = (await createAdminClient()) as any;

  const { error } = await adminDb
    .from("webhooks")
    .update({ secret: newSecret })
    .eq("id", webhookId)
    .eq("clinic_id", auth.clinicId);

  if (error) return { success: false, error: "Erreur" };
  return { success: true, data: { secret: newSecret } };
}
