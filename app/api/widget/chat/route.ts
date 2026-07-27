/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { widgetCorsResponse, withWidgetCors } from "@/lib/cors";
import { checkWidgetChatRateLimit, checkWidgetChatClinicRateLimit, getClientIp } from "@/lib/rate-limit";

export async function OPTIONS() {
  return widgetCorsResponse();
}
import { createAdminClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { generateAIResponse } from "@/lib/ai/router";
import type { AIMessage } from "@/lib/ai/types";
import { computeAvailableSlotsForClinic } from "@/lib/widget-chat/compute-available-slots";
import { resolveOrCreateConversation } from "@/lib/widget-chat/resolve-conversation";
import { executeBookingAction, type BookingResult } from "@/lib/widget-chat/execute-booking-action";
import type { AvailabilityRule, BlockedDate } from "@/types";

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  patientTempId: z.string(),
  clinicSlug: z.string(),
  locale: z.enum(["fr", "en"]).optional().default("fr"),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await checkWidgetChatRateLimit(ip))) {
    return withWidgetCors(NextResponse.json({ error: "Too many requests" }, { status: 429 }));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withWidgetCors(NextResponse.json({ error: "Invalid JSON" }, { status: 400 }));
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return withWidgetCors(NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 }));
  }

  const { message, conversationId, patientTempId, clinicSlug, locale } = parsed.data;

  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics")
    .select("id, name, timezone, is_active")
    .eq("slug", clinicSlug)
    .maybeSingle() as { data: { id: string; name: string; timezone: string; is_active: boolean } | null };

  if (!clinic || !clinic.is_active) {
    return withWidgetCors(NextResponse.json({ error: "Clinic not found" }, { status: 404 }));
  }

  if (!(await checkWidgetChatClinicRateLimit(clinic.id))) {
    return withWidgetCors(NextResponse.json({ error: "Trop de requêtes pour cette clinique. Réessayez plus tard." }, { status: 429 }));
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
  const slotsPerDate = await computeAvailableSlotsForClinic(
    db,
    clinic.id,
    clinic.timezone,
    availabilityRules as AvailabilityRule[],
    blockedDates as BlockedDate[],
    defaultDuration
  );

  const conversation = await resolveOrCreateConversation(db, clinic.id, conversationId, patientTempId);

  if (!conversation) {
    return withWidgetCors(NextResponse.json({ error: "Failed to create conversation" }, { status: 500 }));
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

    let bookingResult: BookingResult | null = null;

    if (action && action.intent === "create_booking" && action.data) {
      bookingResult = await executeBookingAction(db, action.data, ip, clinic, services as any[], slotsPerDate);
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
