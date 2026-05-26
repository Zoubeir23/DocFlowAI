"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { getQuotaUsage, PLAN_LIMITS, type PlanName } from "@/lib/subscription/quota";

export interface QuotaUsage {
  appointments: { current: number; limit: number | null; plan: PlanName };
  staff: { current: number; limit: number | null; plan: PlanName };
}

export async function getClinicQuotaUsage(): Promise<QuotaUsage | null> {
  try {
    const supabase = await createClient();
    const db = supabase as any;

    const { data: authData } = await db.auth.getUser();
    if (!authData.user) return null;

    const { data: userData } = await db
      .from("users")
      .select("clinic_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!userData) return null;

    return getQuotaUsage(userData.clinic_id, db);
  } catch (err) {
    console.error("[getClinicQuotaUsage] error:", err);
    return null;
  }
}

