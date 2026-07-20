"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { serviceSchema } from "@/lib/validations";
import type { ApiResponse, Service } from "@/types";
import type { z } from "zod";

type ServiceInput = z.infer<typeof serviceSchema>;

async function getDB() {
  return (await createClient()) as any;
}

async function getAuthenticatedClinicId(db: any): Promise<string | null> {
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).maybeSingle();
  return userData?.clinic_id ?? null;
}

export async function getServices(clinicId: string) {
  const db = await getDB();
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { data: [] as Service[], error: { message: "Unauthorized" } };
  }
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at");
  return { data: (data || []) as Service[], error };
}

export async function createService(
  clinicId: string,
  data: ServiceInput
): Promise<ApiResponse<{ id: string }>> {
  const db = await getDB();
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }
  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { data: service, error } = await db
    .from("services")
    .insert({ ...validated.data, clinic_id: clinicId })
    .select()
    .maybeSingle();

  if (error || !service) return { success: false, error: error?.message ?? "Service creation failed" };
  return { success: true, data: { id: service.id } };
}

export async function updateService(
  serviceId: string,
  data: Partial<ServiceInput>
): Promise<ApiResponse> {
  const db = await getDB();
  const { error } = await db.from("services").update(data).eq("id", serviceId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteService(serviceId: string): Promise<ApiResponse> {
  const db = await getDB();
  const { error } = await db.from("services").delete().eq("id", serviceId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
