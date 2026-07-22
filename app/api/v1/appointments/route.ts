/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";
import { checkAppointmentQuota } from "@/lib/subscription/quota";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { checkApiIpRateLimit, getClientIp } from "@/lib/rate-limit";
import { parsePaginationParams } from "@/lib/api-pagination";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Provide a valid API key via Authorization: Bearer <key> or x-api-key header." },
    { status: 401 }
  );
}

function tooManyRequests() {
  return NextResponse.json(
    { error: "Trop de requêtes. Réessayez dans une minute." },
    { status: 429 }
  );
}

// GET /api/v1/appointments
export async function GET(req: NextRequest) {
  if (!(await checkApiIpRateLimit(getClientIp(req)))) return tooManyRequests();

  const ctx = await validateApiKey(extractApiKey(req));
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const pagination = parsePaginationParams(searchParams, { defaultLimit: 50, maxLimit: 100 });
  if ("error" in pagination) {
    return NextResponse.json({ error: pagination.error }, { status: 400 });
  }
  const { limit, offset } = pagination;

  const db = (await createAdminClient()) as any;

  let query = db
    .from("appointments")
    .select("id, start_at, end_at, status, notes, created_at, patient:patients(id, full_name, phone, email), service:services(id, name, duration_minutes, price)", { count: "exact" })
    .eq("clinic_id", ctx.clinicId)
    .order("start_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, limit, offset },
  });
}

const createAppointmentSchema = z.object({
  patient_name: z.string().min(1).max(200),
  patient_phone: z.string().min(1).max(30),
  patient_email: z.string().email().optional().or(z.literal("")),
  service_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["pending", "confirmed"]).optional().default("confirmed"),
});

// POST /api/v1/appointments
export async function POST(req: NextRequest) {
  if (!(await checkApiIpRateLimit(getClientIp(req)))) return tooManyRequests();

  const ctx = await validateApiKey(extractApiKey(req));
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const db = (await createAdminClient()) as any;

  const quota = await checkAppointmentQuota(ctx.clinicId, db);
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.reason ?? "Quota atteint" }, { status: 429 });
  }

  const { data: service } = await db
    .from("services")
    .select("id")
    .eq("id", parsed.data.service_id)
    .eq("clinic_id", ctx.clinicId)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  let patient;
  const { data: existingPatient } = await db
    .from("patients")
    .select("id")
    .eq("clinic_id", ctx.clinicId)
    .eq("phone", parsed.data.patient_phone)
    .maybeSingle();

  if (existingPatient) {
    patient = existingPatient;
  } else {
    const { data: newPatient, error: patientError } = await db
      .from("patients")
      .insert({
        clinic_id: ctx.clinicId,
        full_name: parsed.data.patient_name,
        phone: parsed.data.patient_phone,
        email: parsed.data.patient_email || null,
      })
      .select("id")
      .maybeSingle();

    if (patientError) {
      return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
    }
    patient = newPatient;
  }

  // "pending" est un statut de contrat API public ; la table appointments
  // n'accepte que 'booked' comme statut initial (CHECK constraint 001_schema.sql).
  const dbStatus = parsed.data.status === "pending" ? "booked" : parsed.data.status;

  const { data: appointment, error } = await db
    .from("appointments")
    .insert({
      clinic_id: ctx.clinicId,
      patient_id: patient.id,
      service_id: parsed.data.service_id,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      status: dbStatus,
      notes: parsed.data.notes ?? null,
    })
    .select("id, start_at, end_at, status, created_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23P01" || (error.message ?? "").includes("appointments_no_overlap")) {
      return NextResponse.json(
        { error: "Ce créneau chevauche un autre rendez-vous actif de la clinique." },
        { status: 409 }
      );
    }
    if ((error.message ?? "").includes("quota_exceeded")) {
      return NextResponse.json({ error: "Quota de rendez-vous atteint." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }

  dispatchWebhookEvent(ctx.clinicId, "appointment.created", {
    ...appointment,
    patient_name: parsed.data.patient_name,
    patient_phone: parsed.data.patient_phone,
    source: "api",
  }).catch(() => {});

  return NextResponse.json({ data: appointment }, { status: 201 });
}
