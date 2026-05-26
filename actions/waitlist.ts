"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ApiResponse } from "@/types";

export type WaitlistStatus = "waiting" | "notified" | "booked" | "cancelled";

export interface WaitlistEntry {
  id: string;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  service_id: string | null;
  notes: string | null;
  status: WaitlistStatus;
  created_at: string;
  notified_at: string | null;
  service?: { name: string } | null;
}

export interface WaitlistInput {
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  service_id?: string;
  notes?: string;
}

const waitlistInputSchema = z.object({
  patient_name: z.string().min(1).max(200),
  patient_phone: z.string().min(1).max(30),
  patient_email: z.string().email().optional().or(z.literal("")),
  service_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
});

async function getDB() {
  return (await createClient()) as any;
}

async function getAuthenticatedClinicId(db: any): Promise<string | null> {
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;
  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();
  return userData?.clinic_id ?? null;
}

export async function getWaitlist(status?: string): Promise<WaitlistEntry[]> {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return [];

  let query = db
    .from("waitlist")
    .select("*, service:services(name)")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: true });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return (data || []) as WaitlistEntry[];
}

export async function addToWaitlist(
  data: WaitlistInput
): Promise<ApiResponse<{ id: string }>> {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return { success: false, error: "Unauthorized" };

  const validated = waitlistInputSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const insertPayload = {
    clinic_id: clinicId,
    patient_name: validated.data.patient_name,
    patient_phone: validated.data.patient_phone,
    patient_email: validated.data.patient_email || null,
    service_id: validated.data.service_id || null,
    notes: validated.data.notes || null,
  };

  const { data: entry, error } = await db
    .from("waitlist")
    .insert(insertPayload)
    .select()
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: entry.id } };
}

export async function updateWaitlistStatus(
  id: string,
  status: WaitlistStatus
): Promise<ApiResponse> {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return { success: false, error: "Unauthorized" };

  const updatePayload: Record<string, unknown> = { status };
  if (status === "notified") {
    updatePayload.notified_at = new Date().toISOString();
  }

  const { error } = await db
    .from("waitlist")
    .update(updatePayload)
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteWaitlistEntry(id: string): Promise<ApiResponse> {
  const db = await getDB();
  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) return { success: false, error: "Unauthorized" };

  const { error } = await db
    .from("waitlist")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
