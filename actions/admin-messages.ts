"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/actions/admin-shared";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
import { sendRawEmail } from "@/lib/email/router";
import type { ApiResponse } from "@/types";

export interface AdminMessageRow {
  id: string;
  type: "support" | "enterprise";
  status: "open" | "in_progress" | "closed";
  sender_name: string;
  sender_email: string;
  sender_plan: string | null;
  subject: string;
  body: string;
  metadata: Record<string, unknown>;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export async function listAdminMessages(options?: {
  type?: "support" | "enterprise";
  status?: "open" | "in_progress" | "closed";
  limit?: number;
  offset?: number;
}): Promise<AdminMessageRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  let query = db
    .from("admin_messages")
    .select("id, type, status, sender_name, sender_email, sender_plan, subject, body, metadata, admin_reply, replied_at, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.type) query = query.eq("type", options.type);
  if (options?.status) query = query.eq("status", options.status);

  const { data } = await query;
  return (data ?? []) as AdminMessageRow[];
}

export async function getUnreadMessagesCount(): Promise<number> {
  const auth = await requireSuperAdmin();
  if (!auth) return 0;

  const db = (await createAdminClient()) as any;
  const { count } = await db
    .from("admin_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return count ?? 0;
}

export async function updateMessageStatus(
  messageId: string,
  status: "open" | "in_progress" | "closed"
): Promise<ApiResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;
  const { error } = await db
    .from("admin_messages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) return { success: false, error: "Erreur de mise à jour" };
  return { success: true };
}

export async function replyToMessage(
  messageId: string,
  replyText: string
): Promise<ApiResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: message } = await db
    .from("admin_messages")
    .select("sender_email, sender_name, subject")
    .eq("id", messageId)
    .maybeSingle();

  if (!message) return { success: false, error: "Message introuvable" };

  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_EMAIL_FROM ?? "support@docflow.ai";
  try {
    await sendRawEmail({
      to: message.sender_email,
      subject: `Re: ${message.subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#2563eb;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="color:white;margin:0;font-size:18px">Réponse de l'équipe DocFlow</h2>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
            <p style="color:#475569;font-size:14px;white-space:pre-wrap">${escapeHtml(replyText)}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#94a3b8;font-size:12px">Ceci est une réponse à votre message : <em>${escapeHtml(message.subject)}</em></p>
          </div>
        </div>
      `,
      replyTo: supportEmail,
    });
  } catch (err) {
    console.error("[replyToMessage] email error:", err);
  }

  const { error } = await db
    .from("admin_messages")
    .update({
      admin_reply: replyText,
      replied_at: new Date().toISOString(),
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) return { success: false, error: "Erreur de sauvegarde" };
  return { success: true };
}
