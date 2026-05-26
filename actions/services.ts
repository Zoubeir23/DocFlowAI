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

export async function getServices(clinicId: string) {
  const db = await getDB();
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
  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { data: service, error } = await db
    .from("services")
    .insert({ ...validated.data, clinic_id: clinicId })
    .select()
    .maybeSingle();

  if (error) return { success: false, error: error.message };
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
