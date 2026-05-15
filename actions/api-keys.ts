"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/api-auth";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

export interface ApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

async function getOwnerClinicId(): Promise<{ clinicId: string } | null> {
  const db = (await createClient()) as any;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) return null;
  if (userData.role !== "owner" && userData.role !== "super_admin") return null;
  return { clinicId: userData.clinic_id };
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const auth = await getOwnerClinicId();
  if (!auth) return [];

  const db = (await createClient()) as any;
  const { data } = await db
    .from("api_keys")
    .select("id, name, key_prefix, is_active, created_at, last_used_at")
    .eq("clinic_id", auth.clinicId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ApiKeyRecord[];
}

export async function createApiKey(
  name: string
): Promise<ApiResponse<{ id: string; rawKey: string }>> {
  const auth = await getOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const trimmedName = name?.trim() ?? "";
  if (!trimmedName || trimmedName.length > 80) {
    return { success: false, error: "Nom invalide (1-80 caractères)" };
  }

  const db = (await createClient()) as any;

  const { count } = await db
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", auth.clinicId)
    .eq("is_active", true);

  if ((count ?? 0) >= 5) {
    return { success: false, error: "Maximum 5 clés API actives par clinique" };
  }

  const rawKey = "dfk_" + crypto.randomBytes(32).toString("hex");
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12) + "...";

  const { data, error } = await db
    .from("api_keys")
    .insert({
      clinic_id: auth.clinicId,
      name: trimmedName,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Erreur lors de la création" };

  return { success: true, data: { id: data.id, rawKey } };
}

export async function revokeApiKey(keyId: string): Promise<ApiResponse<void>> {
  const auth = await getOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createClient()) as any;
  const { error } = await db
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", keyId)
    .eq("clinic_id", auth.clinicId);

  if (error) return { success: false, error: "Erreur" };
  return { success: true };
}
