"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { availabilityRuleSchema, blockedDateSchema, clinicSettingsSchema } from "@/lib/validations";
import type { ApiResponse, AvailabilityRule, BlockedDate, ClinicSettings } from "@/types";
import type { z } from "zod";

async function getDB() {
  return (await createClient()) as any;
}

async function getAuthenticatedClinicId(db: any): Promise<string | null> {
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).maybeSingle();
  return userData?.clinic_id ?? null;
}

export async function getAvailabilityRules(clinicId: string): Promise<AvailabilityRule[]> {
  const db = await getDB();
  // C5 fix: ownership check
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) return [];
  const { data } = await db
    .from("availability_rules")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("day_of_week");
  return (data || []) as AvailabilityRule[];
}

export async function upsertAvailabilityRule(
  clinicId: string,
  data: z.infer<typeof availabilityRuleSchema> & { id?: string }
): Promise<ApiResponse> {
  const db = await getDB();
  // C5 fix: ownership check
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }
  const validated = availabilityRuleSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message + " | field: " + validated.error.errors[0].path.join(".") };
  }

  const payload = {
    ...validated.data,
    clinic_id: clinicId,
    start_time: validated.data.start_time || "09:00",
    end_time: validated.data.end_time || "17:00",
    break_start: validated.data.break_start || null,
    break_end: validated.data.break_end || null,
    is_active: validated.data.is_active,
  };

  let error;

  if (data.id) {
    // Existing rule — update by id
    ({ error } = await db.from("availability_rules").update(payload).eq("id", data.id));
  } else {
    // Check if rule already exists for this day
    const { data: existing } = await db
      .from("availability_rules")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("day_of_week", data.day_of_week)
      .maybeSingle();

    if (existing?.id) {
      ({ error } = await db.from("availability_rules").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await db.from("availability_rules").insert(payload));
    }
  }

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getBlockedDates(clinicId: string): Promise<BlockedDate[]> {
  const db = await getDB();
  const { data } = await db
    .from("blocked_dates")
    .select("*")
    .eq("clinic_id", clinicId)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date");
  return (data || []) as BlockedDate[];
}

export async function addBlockedDate(
  clinicId: string,
  data: z.infer<typeof blockedDateSchema>
): Promise<ApiResponse> {
  const db = await getDB();
  // C5 fix: ownership check
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }
  const validated = blockedDateSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { error } = await db
    .from("blocked_dates")
    .upsert({ ...validated.data, clinic_id: clinicId }, { onConflict: "clinic_id,date" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeBlockedDate(blockedDateId: string): Promise<ApiResponse> {
  const db = await getDB();
  // C5 fix: scope delete to caller's clinic to prevent IDOR
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId) return { success: false, error: "Not authenticated" };
  const { error } = await db.from("blocked_dates").delete().eq("id", blockedDateId).eq("clinic_id", userClinicId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getClinicSettings(clinicId: string): Promise<ClinicSettings | null> {
  const db = await getDB();
  const { data } = await db
    .from("clinic_settings")
    .select("*")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  return data as ClinicSettings | null;
}

export async function updateClinicSettings(
  clinicId: string,
  data: z.infer<typeof clinicSettingsSchema>
): Promise<ApiResponse> {
  const db = await getDB();
  // C5 fix: ownership check
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }
  const validated = clinicSettingsSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { error } = await db
    .from("clinic_settings")
    .upsert({ ...validated.data, clinic_id: clinicId }, { onConflict: "clinic_id" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
