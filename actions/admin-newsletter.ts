"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/actions/admin-shared";
import { sendRawEmail } from "@/lib/email/router";
import type { ApiResponse } from "@/types";

export interface NewsletterCampaignRow {
  id: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  target_roles: string[] | null;
  status: "draft" | "sending" | "sent" | "failed";
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

const NEWSLETTER_SEND_BATCH_SIZE = 50;
const NEWSLETTER_MAX_RECIPIENTS = 5000;

export async function listNewsletterCampaigns(): Promise<NewsletterCampaignRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;
  const { data } = await db
    .from("newsletter_campaigns")
    .select("id, subject, body_html, body_text, target_roles, status, recipients_count, sent_count, failed_count, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as NewsletterCampaignRow[];
}

export async function sendNewsletter(input: {
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  targetRoles: string[] | null;
}): Promise<ApiResponse<{ campaignId: string; sentCount: number; failedCount: number }>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  let usersQuery = db
    .from("users")
    .select("email, full_name, role")
    .eq("is_active", true)
    .limit(NEWSLETTER_MAX_RECIPIENTS);

  if (input.targetRoles && input.targetRoles.length > 0) {
    usersQuery = usersQuery.in("role", input.targetRoles);
  }

  const { data: recipients } = await usersQuery;
  if (!recipients?.length) {
    return { success: false, error: "Aucun destinataire trouvé pour ce segment" };
  }

  const { data: campaign, error: campaignError } = await db
    .from("newsletter_campaigns")
    .insert({
      subject: input.subject,
      body_html: input.bodyHtml,
      body_text: input.bodyText ?? null,
      target_roles: input.targetRoles,
      status: "sending",
      recipients_count: recipients.length,
      created_by: auth.userId,
    })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    return { success: false, error: "Erreur de création de campagne" };
  }

  let sentCount = 0;
  let failedCount = 0;

  for (let batchStart = 0; batchStart < recipients.length; batchStart += NEWSLETTER_SEND_BATCH_SIZE) {
    const batch = recipients.slice(batchStart, batchStart + NEWSLETTER_SEND_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((recipient: any) => {
        const personalizedHtml = input.bodyHtml.replace(/\{\{name\}\}/g, recipient.full_name ?? "Docteur");
        return sendRawEmail({
          to: recipient.email,
          subject: input.subject,
          html: personalizedHtml,
        });
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        sentCount++;
      } else {
        failedCount++;
      }
    }
  }

  await db
    .from("newsletter_campaigns")
    .update({
      status: failedCount === recipients.length ? "failed" : "sent",
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  return {
    success: true,
    data: { campaignId: campaign.id, sentCount, failedCount },
  };
}
