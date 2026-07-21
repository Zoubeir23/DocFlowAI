/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { widgetCorsResponse, withWidgetCors } from "@/lib/cors";
import { checkWidgetChatRateLimit, checkWidgetBookRateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
  return widgetCorsResponse();
}
import { createAdminClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { generateAIResponse } from "@/lib/ai/router";
import type { AIMessage } from "@/lib/ai/types";
import { generateAvailableSlots, getNextAvailableDates } from "@/lib/slots";
import { sendNotification } from "@/lib/notifications";
import type { AvailabilityRule, BlockedDate, Appointment } from "@/types";

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  patientTempId: z.string(),
  clinicSlug: z.string(),
  locale: z.enum(["fr", "en"]).optional().default("fr"),
});

// Même contrat que /api/widget/book : les données d'action renvoyées par le
// LLM ne sont pas plus dignes de confiance qu'une entrée utilisateur brute.
const bookingActionSchema = z.object({
  patientName: z.string().min(1).max(200),
  patientPhone: z.string().min(1).max(30),
  patientEmail: z.string().email().optional().or(z.literal("")),
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!(await checkWidgetChatRateLimit(ip))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { message, conversationId, patientTempId, clinicSlug, locale } = parsed.data;

  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics")
    .select("id, name, timezone")
    .eq("slug", clinicSlug)
    .maybeSingle() as { data: { id: string; name: string; timezone: string } | null };

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const [settingsRes, servicesRes, availabilityRes, blockedRes] = await Promise.all([
    db.from("clinic_settings").select("*").eq("clinic_id", clinic.id).maybeSingle(),
    db.from("services").select("*").eq("clinic_id", clinic.id).eq("is_active", true),
    db.from("availability_rules").select("*").eq("clinic_id", clinic.id),
    db.from("blocked_dates").select("*").eq("clinic_id", clinic.id).gte("date", new Date().toISOString().split("T")[0]),
  ]);

  const settings = settingsRes.data;
  const services = servicesRes.data || [];
  const availabilityRules = availabilityRes.data || [];
  const blockedDates = blockedRes.data || [];

  const defaultDuration = services[0]?.duration_minutes || 30;
  const nextDates = getNextAvailableDates(
    availabilityRules as AvailabilityRule[],
    blockedDates as BlockedDate[],
    14,
    clinic.timezone
  ).slice(0, 5);

  const slotsPerDate = await Promise.all(
    nextDates.map(async (date) => {
      const { data: existingAppts } = await db
        .from("appointments")
        .select("start_at, end_at, status")
        .eq("clinic_id", clinic.id)
        .gte("start_at", `${date}T00:00:00`)
        .lt("start_at", `${date}T23:59:59`)
        .neq("status", "cancelled");

      const slots = generateAvailableSlots({
        date,
        serviceDurationMinutes: defaultDuration,
        availabilityRules: availabilityRules as AvailabilityRule[],
        blockedDates: blockedDates as BlockedDate[],
        existingAppointments: (existingAppts || []) as Pick<Appointment, "start_at" | "end_at" | "status">[],
        timezone: clinic.timezone,
      });

      return { date, slots: slots.slice(0, 6) };
    })
  );

  let conversation: { id: string; messages: unknown[] } | null = null;

  if (conversationId) {
    const { data } = await db
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("clinic_id", clinic.id)
      // Empêche un visiteur qui devinerait/récupérerait un conversationId de
      // reprendre la conversation d'un autre patient de la même clinique.
      .eq("patient_temp_id", patientTempId)
      .maybeSingle();
    if (data) {
      conversation = { id: data.id, messages: data.messages as unknown[] };
    }
  }

  if (!conversation) {
    const { data } = await db
      .from("ai_conversations")
      .insert({
        clinic_id: clinic.id,
        patient_temp_id: patientTempId,
        messages: [],
      })
      .select()
      .maybeSingle();
    if (data) {
      conversation = { id: data.id, messages: [] };
    }
  }

  if (!conversation) {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }

  const historyMessages = (conversation.messages as AIMessage[]).slice(-20);
  const allMessages: AIMessage[] = [
    ...historyMessages,
    { role: "user", content: message },
  ];

  const systemPrompt = buildSystemPrompt({
    clinicId: clinic.id,
    clinicName: clinic.name,
    timezone: clinic.timezone,
    tone: settings?.tone || "professional and friendly",
    welcomeMessage: settings?.welcome_message || `Welcome to ${clinic.name}!`,
    faq: (settings?.faq as Array<{ question: string; answer: string }>) || [],
    services: (services as any[]).map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration_minutes,
      price: s.price || undefined,
    })),
    availableSlots: slotsPerDate.filter((d) => d.slots.length > 0),
    bookingBehavior: settings?.booking_behavior || "",
    locale,
  });

  try {
    const { text, action } = await generateAIResponse(allMessages, systemPrompt);

    let bookingResult: { success: boolean; appointmentId?: string; patientId?: string; error?: string } | null = null;

    if (action && action.intent === "create_booking" && action.data) {
      const data = action.data as Record<string, string>;
      // M6 fix: never log patient PII — log intent only
      console.log("[booking] create_booking action received");

      if (data.patientName && data.patientPhone && data.startAt && data.endAt) {
        const service = (services as any[]).find(
          (s) =>
            s.id === data.serviceId ||
            s.name.toLowerCase() === (data.serviceName || "").toLowerCase()
        );

        if (service) {
          const { data: result, error } = await db.rpc("create_booking_from_widget", {
            p_clinic_id: clinic.id,
            p_patient_name: data.patientName,
            p_patient_phone: data.patientPhone,
            p_patient_email: data.patientEmail || null,
            p_service_id: service.id,
            p_start_at: data.startAt,
            p_end_at: data.endAt,
            p_notes: null,
          });

          if (!error && result) {
            const resultData = result as { appointment_id: string; patient_id: string };
            bookingResult = {
              success: true,
              appointmentId: resultData.appointment_id,
              patientId: resultData.patient_id,
            };

            await sendNotification({
              type: "appointment_confirmation",
              appointmentId: resultData.appointment_id,
              patientName: data.patientName,
              patientPhone: data.patientPhone,
              patientEmail: data.patientEmail || undefined,
              clinicName: clinic.name,
              serviceName: service.name,
              startAt: data.startAt,
            });
          } else {
            bookingResult = { success: false, error: error?.message || "Booking failed" };
          }
        } else {
          bookingResult = { success: false, error: "Service not found" };
        }
      }
    }

    const updatedMessages: AIMessage[] = [
      ...historyMessages,
      { role: "user", content: message },
      { role: "assistant", content: text },
    ];

    await db
      .from("ai_conversations")
      .update({ messages: updatedMessages })
      .eq("id", conversation.id);

    return withWidgetCors(NextResponse.json({
      message: text,
      conversationId: conversation.id,
      action,
      bookingResult,
    }));
  } catch (error: any) {
    console.error("[WidgetChat] Error in chat route:", error);
    return withWidgetCors(NextResponse.json({ error: "Internal error" }, { status: 500 }));
  }
}
