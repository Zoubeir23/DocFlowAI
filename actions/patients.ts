"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { patientSchema } from "@/lib/validations";
import type { ApiResponse, PaginatedResult, Patient } from "@/types";
import type { z } from "zod";

type PatientInput = z.infer<typeof patientSchema>;

async function getDB() {
  return (await createClient()) as any;
}

export async function getPatients(
  clinicId: string,
  page = 1,
  pageSize = 20,
  search = ""
): Promise<PaginatedResult<Patient>> {
  const db = await getDB();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("patients")
    .select("*", { count: "exact" })
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await query.range(from, to);

  return {
    data: (data || []) as Patient[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getPatient(patientId: string) {
  const db = await getDB();
  const { data } = await db.from("patients").select("*").eq("id", patientId).single();
  return data as Patient | null;
}

export async function getPatientAppointments(patientId: string) {
  const db = await getDB();
  const { data } = await db
    .from("appointments")
    .select("*, service:services(*)")
    .eq("patient_id", patientId)
    .order("start_at", { ascending: false });
  return data || [];
}

export async function createPatient(
  clinicId: string,
  data: PatientInput
): Promise<ApiResponse<{ id: string }>> {
  const db = await getDB();
  const validated = patientSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const { data: patient, error } = await db
    .from("patients")
    .insert({ ...validated.data, clinic_id: clinicId, email: validated.data.email || null })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: patient.id } };
}

export async function updatePatient(
  patientId: string,
  data: Partial<PatientInput>
): Promise<ApiResponse> {
  const db = await getDB();
  const { error } = await db.from("patients").update(data).eq("id", patientId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
