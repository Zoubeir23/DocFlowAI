"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { OnboardingInput } from "@/lib/validations";
import type { ApiResponse, Clinic } from "@/types";

async function getDB() {
  return (await createClient()) as any;
}

export async function createOnboarding(
  data: OnboardingInput
): Promise<ApiResponse<{ clinicId: string }>> {
  // Use regular client only to verify the authenticated user
  const authDb = await getDB();
  const { data: authData, error: authError } = await authDb.auth.getUser();

  if (authError || !authData.user) {
    return { success: false, error: "Not authenticated" };
  }

  const user = authData.user;

  // Use admin client (service role) to bypass RLS for all inserts during onboarding
  const db = (await createAdminClient()) as any;

  const { data: clinic, error: clinicError } = await db
    .from("clinics")
    .insert({
      name: data.clinicName,
      slug: data.slug,
      timezone: data.timezone,
      owner_id: user.id,
    })
    .select()
    .single();

  if (clinicError) {
    if (clinicError.code === "23505") {
      return { success: false, error: "This clinic URL is already taken. Please choose another." };
    }
    return { success: false, error: clinicError.message };
  }

  await db.from("users").upsert({
    id: user.id,
    clinic_id: clinic.id,
    role: "owner",
    full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Doctor",
    email: user.email!,
  });

  await db.from("clinic_settings").insert({
    clinic_id: clinic.id,
    widget_color: "#2563eb",
    welcome_message: `Welcome to ${data.clinicName}! I'm your AI booking assistant. How can I help you today?`,
    faq: [],
    slot_duration_minutes: 15,
    tone: "professional and friendly",
    booking_behavior: "Guide patients through booking smoothly. Always suggest the nearest available slot.",
  });

  await db.from("subscriptions").insert({
    clinic_id: clinic.id,
    plan: "free",
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const defaultServices = [
    { name: "General Consultation", duration_minutes: 30, price: null, is_active: true },
    { name: "Follow Up Visit", duration_minutes: 15, price: null, is_active: true },
  ];

  await db.from("services").insert(
    defaultServices.map((s: any) => ({ ...s, clinic_id: clinic.id }))
  );

  const defaultAvailability = [1, 2, 3, 4, 5].map((day) => ({
    clinic_id: clinic.id,
    day_of_week: day,
    start_time: "09:00",
    end_time: "17:00",
    break_start: "12:00",
    break_end: "13:00",
    is_active: true,
  }));

  await db.from("availability_rules").insert(defaultAvailability);

  return { success: true, data: { clinicId: clinic.id } };
}

export async function getCurrentClinic() {
  const db = await getDB();

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", authData.user.id)
    .single();

  if (!userData) return null;

  const { data: clinic } = await db
    .from("clinics")
    .select("*")
    .eq("id", userData.clinic_id)
    .single();

  return clinic ? { ...(clinic as Clinic), userRole: userData.role } : null;
}

export async function updateClinic(
  clinicId: string,
  updates: { name?: string; timezone?: string; logo_url?: string }
): Promise<ApiResponse> {
  const db = await getDB();
  // C1 fix: auth guard + ownership check before update
  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Not authenticated" };

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .single();

  if (!userData || userData.clinic_id !== clinicId) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await db.from("clinics").update(updates).eq("id", clinicId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
