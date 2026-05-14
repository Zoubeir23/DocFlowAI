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

async function getAuthenticatedClinicId(db: any): Promise<string | null> {
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", authData.user.id).single();
  return userData?.clinic_id ?? null;
}

export async function getPatients(
  clinicId: string,
  page = 1,
  pageSize = 20,
  search = ""
): Promise<PaginatedResult<Patient>> {
  const db = await getDB();
  // C5 fix: verify caller owns this clinic
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }
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
  // C5 fix: ownership check
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId || userClinicId !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }
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
  // C5 fix: scope update to caller's clinic
  const userClinicId = await getAuthenticatedClinicId(db);
  if (!userClinicId) return { success: false, error: "Not authenticated" };
  const { error } = await db.from("patients").update(data).eq("id", patientId).eq("clinic_id", userClinicId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
