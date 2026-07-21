/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateAvailableSlots } from "@/lib/slots";
import type { AvailabilityRule, BlockedDate, Appointment } from "@/types";
import { widgetCorsResponse } from "@/lib/cors";
import { checkWidgetSlotsRateLimit, getClientIp } from "@/lib/rate-limit";

export async function OPTIONS() {
  return widgetCorsResponse();
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await checkWidgetSlotsRateLimit(ip))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const clinicSlug = searchParams.get("clinicSlug");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!clinicSlug || !serviceId || !date) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics")
    .select("id, timezone, is_active")
    .eq("slug", clinicSlug)
    .maybeSingle() as { data: { id: string; timezone: string; is_active: boolean } | null };

  if (!clinic || !clinic.is_active) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const { data: service } = await db
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .eq("clinic_id", clinic.id)
    .maybeSingle() as { data: { duration_minutes: number } | null };

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const [availabilityRes, blockedRes, appointmentsRes] = await Promise.all([
    db.from("availability_rules").select("*").eq("clinic_id", clinic.id),
    db.from("blocked_dates").select("*").eq("clinic_id", clinic.id).eq("date", date),
    db.from("appointments").select("start_at, end_at, status")
      .eq("clinic_id", clinic.id)
      .gte("start_at", `${date}T00:00:00`)
      .lt("start_at", `${date}T23:59:59`)
      .neq("status", "cancelled"),
  ]);

  const slots = generateAvailableSlots({
    date,
    serviceDurationMinutes: service.duration_minutes,
    availabilityRules: (availabilityRes.data || []) as AvailabilityRule[],
    blockedDates: (blockedRes.data || []) as BlockedDate[],
    existingAppointments: (appointmentsRes.data || []) as Pick<Appointment, "start_at" | "end_at" | "status">[],
    timezone: clinic.timezone,
  });

  return NextResponse.json({ slots });
}
