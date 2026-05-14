"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { sendRawEmail } from "@/lib/email/router";

export type SupportPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicketData {
  subject: string;
  message: string;
  priority: SupportPriority;
}

export interface SupportTicketResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

async function getAuthenticatedUserContext(): Promise<{
  userId: string;
  email: string;
  fullName: string;
  clinicName: string;
  plan: string;
} | null> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, full_name, email, clinic:clinics(name)")
    .eq("id", authData.user.id)
    .single();

  if (!userData) return null;

  const { data: sub } = await db
    .from("subscriptions")
    .select("plan")
    .eq("clinic_id", userData.clinic_id)
    .single();

  return {
    userId: authData.user.id,
    email: userData.email,
    fullName: userData.full_name,
    clinicName: userData.clinic?.name ?? "Clinique",
    plan: sub?.plan ?? "free",
  };
}

export async function sendSupportTicket(
  data: SupportTicketData
): Promise<SupportTicketResult> {
  const context = await getAuthenticatedUserContext();
  if (!context) return { success: false, error: "Non authentifié" };

  const isPriority = ["professional", "enterprise"].includes(context.plan);
  const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_EMAIL_FROM ?? "support@docflow.ai";

  const priorityLabel: Record<SupportPriority, string> = {
    low: "Faible",
    normal: "Normal",
    high: "Élevée",
    urgent: "Urgent",
  };

  const subjectLine = isPriority
    ? `[PRIORITAIRE][${context.plan.toUpperCase()}] ${data.subject} — #${ticketId}`
    : `[Support] ${data.subject} — #${ticketId}`;

  const htmlBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:${isPriority ? "#7c3aed" : "#2563eb"};padding:20px 24px;border-radius:12px 12px 0 0">
        <h2 style="color:white;margin:0;font-size:18px">
          ${isPriority ? "🚨 Ticket Support Prioritaire" : "📩 Ticket Support"} — ${ticketId}
        </h2>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:140px">Médecin</td><td style="padding:6px 0;font-weight:600;font-size:13px">${context.fullName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Email</td><td style="padding:6px 0;font-size:13px">${context.email}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Cabinet</td><td style="padding:6px 0;font-size:13px">${context.clinicName}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Plan</td><td style="padding:6px 0"><span style="background:${isPriority ? "#f3e8ff" : "#dbeafe"};color:${isPriority ? "#7c3aed" : "#2563eb"};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700">${context.plan.toUpperCase()}</span></td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Priorité</td><td style="padding:6px 0;font-size:13px;font-weight:600">${priorityLabel[data.priority]}</td></tr>
        </table>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
          <p style="margin:0 0 8px;font-weight:700;color:#1e293b">${data.subject}</p>
          <p style="margin:0;color:#475569;font-size:14px;white-space:pre-wrap">${data.message}</p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendRawEmail({
      to: supportEmail,
      subject: subjectLine,
      html: htmlBody,
      replyTo: context.email,
    });
  } catch (err) {
    console.error("[sendSupportTicket] email error:", err);
    // Non-blocking — ticket is still "submitted" from user's perspective
  }

  return { success: true, ticketId };
}

export async function getUserPlanForSupport(): Promise<{
  plan: string;
  fullName: string;
  email: string;
  clinicName: string;
} | null> {
  const context = await getAuthenticatedUserContext();
  if (!context) return null;
  return {
    plan: context.plan,
    fullName: context.fullName,
    email: context.email,
    clinicName: context.clinicName,
  };
}
