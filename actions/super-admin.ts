"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendRawEmail } from "@/lib/email/router";
import type { ApiResponse } from "@/types";

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireSuperAdmin(): Promise<{ userId: string } | null> {
  const db = (await createClient()) as any;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const { data: userData } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "super_admin") return null;
  return { userId: user.id };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminClinicRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  plan: string;
  subscription_status: string;
  user_count: number;
  appointment_count: number;
  owner_email: string;
  owner_name: string;
}

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  clinic_id: string;
  clinic_name: string;
  plan: string;
}

export interface PlatformStats {
  total_clinics: number;
  active_clinics: number;
  total_users: number;
  total_appointments: number;
  plans: Record<string, number>;
}

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

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getPlatformStats(): Promise<PlatformStats | null> {
  const auth = await requireSuperAdmin();
  if (!auth) return null;

  const db = (await createAdminClient()) as any;

  const [clinicsResult, activeResult, usersResult, appointmentsResult, subsResult] =
    await Promise.all([
      db.from("clinics").select("id", { count: "exact", head: true }),
      db.from("clinics").select("id", { count: "exact", head: true }).eq("is_active", true),
      db.from("users").select("id", { count: "exact", head: true }),
      db.from("appointments").select("id", { count: "exact", head: true }),
      db.from("subscriptions").select("plan"),
    ]);

  const planCounts: Record<string, number> = {};
  for (const sub of subsResult.data ?? []) {
    planCounts[sub.plan] = (planCounts[sub.plan] ?? 0) + 1;
  }

  return {
    total_clinics: clinicsResult.count ?? 0,
    active_clinics: activeResult.count ?? 0,
    total_users: usersResult.count ?? 0,
    total_appointments: appointmentsResult.count ?? 0,
    plans: planCounts,
  };
}

export async function listAllClinics(options?: {
  search?: string;
  plan?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AdminClinicRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  const { data: clinics } = await db
    .from("clinics")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!clinics?.length) return [];

  const clinicIds = clinics.map((c: any) => c.id);

  const [subsResult, ownersResult, userCountsResult, apptCountsResult] = await Promise.all([
    db.from("subscriptions").select("clinic_id, plan, status").in("clinic_id", clinicIds),
    db.from("users").select("clinic_id, full_name, email").eq("role", "owner").in("clinic_id", clinicIds),
    db.from("users").select("clinic_id").in("clinic_id", clinicIds),
    db.from("appointments").select("clinic_id").in("clinic_id", clinicIds),
  ]);

  const subsByClinic = Object.fromEntries(
    (subsResult.data ?? []).map((s: any) => [s.clinic_id, s])
  );
  const ownersByClinic = Object.fromEntries(
    (ownersResult.data ?? []).map((u: any) => [u.clinic_id, u])
  );
  const userCountByClinic: Record<string, number> = {};
  for (const u of userCountsResult.data ?? []) {
    userCountByClinic[u.clinic_id] = (userCountByClinic[u.clinic_id] ?? 0) + 1;
  }
  const apptCountByClinic: Record<string, number> = {};
  for (const a of apptCountsResult.data ?? []) {
    apptCountByClinic[a.clinic_id] = (apptCountByClinic[a.clinic_id] ?? 0) + 1;
  }

  let rows: AdminClinicRow[] = clinics.map((clinic: any) => ({
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    is_active: clinic.is_active,
    created_at: clinic.created_at,
    plan: subsByClinic[clinic.id]?.plan ?? "free",
    subscription_status: subsByClinic[clinic.id]?.status ?? "active",
    user_count: userCountByClinic[clinic.id] ?? 0,
    appointment_count: apptCountByClinic[clinic.id] ?? 0,
    owner_email: ownersByClinic[clinic.id]?.email ?? "",
    owner_name: ownersByClinic[clinic.id]?.full_name ?? "",
  }));

  if (options?.search) {
    const q = options.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.owner_email.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q)
    );
  }
  if (options?.plan) rows = rows.filter((r) => r.plan === options.plan);
  if (options?.activeOnly) rows = rows.filter((r) => r.is_active);

  return rows;
}

export async function listAllUsers(options?: {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminUserRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  const { data: users } = await db
    .from("users")
    .select("id, full_name, email, role, is_active, created_at, clinic_id, clinic:clinics(name)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!users?.length) return [];

  const clinicIds = [...new Set(users.map((u: any) => u.clinic_id).filter(Boolean))];
  const { data: subs } = await db
    .from("subscriptions")
    .select("clinic_id, plan")
    .in("clinic_id", clinicIds);

  const planByClinic = Object.fromEntries(
    (subs ?? []).map((s: any) => [s.clinic_id, s.plan])
  );

  let rows: AdminUserRow[] = users.map((u: any) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at,
    clinic_id: u.clinic_id,
    clinic_name: u.clinic?.name ?? "",
    plan: planByClinic[u.clinic_id] ?? "free",
  }));

  if (options?.search) {
    const q = options.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.clinic_name.toLowerCase().includes(q)
    );
  }
  if (options?.role) rows = rows.filter((r) => r.role === options.role);

  return rows;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function toggleUserActive(userId: string): Promise<ApiResponse<{ is_active: boolean }>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: user } = await db
    .from("users").select("is_active, role").eq("id", userId).single();

  if (!user) return { success: false, error: "Utilisateur introuvable" };
  if (user.role === "super_admin") return { success: false, error: "Impossible de désactiver un super admin" };

  const newValue = !user.is_active;
  const { error } = await db.from("users").update({ is_active: newValue }).eq("id", userId);
  if (error) return { success: false, error: "Erreur lors de la mise à jour" };

  return { success: true, data: { is_active: newValue } };
}

export async function updateUserRole(
  userId: string,
  role: "owner" | "receptionist" | "assistant" | "super_admin"
): Promise<ApiResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: target } = await db.from("users").select("role").eq("id", userId).single();
  if (!target) return { success: false, error: "Utilisateur introuvable" };

  if (target.role === "super_admin" && auth.userId !== userId) {
    return { success: false, error: "Impossible de modifier le rôle d'un super admin" };
  }

  const { error } = await db.from("users").update({ role }).eq("id", userId);
  if (error) return { success: false, error: "Erreur lors de la mise à jour du rôle" };

  return { success: true };
}

export async function toggleClinicActive(clinicId: string): Promise<ApiResponse<{ is_active: boolean }>> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics").select("is_active").eq("id", clinicId).single();

  if (!clinic) return { success: false, error: "Clinique introuvable" };

  const newValue = !clinic.is_active;
  const { error } = await db.from("clinics").update({ is_active: newValue }).eq("id", clinicId);
  if (error) return { success: false, error: "Erreur lors de la mise à jour" };

  return { success: true, data: { is_active: newValue } };
}

export async function updateClinicPlan(
  clinicId: string,
  plan: "free" | "starter" | "professional" | "enterprise"
): Promise<ApiResponse> {
  const auth = await requireSuperAdmin();
  if (!auth) return { success: false, error: "Non autorisé" };

  const db = (await createAdminClient()) as any;

  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await db
    .from("subscriptions")
    .update({
      plan,
      status: "active",
      current_period_start: periodStart,
      current_period_end: periodEnd,
    })
    .eq("clinic_id", clinicId);

  if (error) {
    const { error: insertError } = await db
      .from("subscriptions")
      .insert({
        clinic_id: clinicId,
        plan,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
      });

    if (insertError) return { success: false, error: "Erreur lors de la mise à jour du plan" };
  }

  return { success: true };
}

// ── Inbox admin_messages ──────────────────────────────────────────────────────

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
    .single();

  if (!message) return { success: false, error: "Message introuvable" };

  // Envoi de la réponse par email
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
            <p style="color:#475569;font-size:14px;white-space:pre-wrap">${replyText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#94a3b8;font-size:12px">Ceci est une réponse à votre message : <em>${message.subject}</em></p>
          </div>
        </div>
      `,
      replyTo: supportEmail,
    });
  } catch (err) {
    console.error("[replyToMessage] email error:", err);
  }

  // Mise à jour en DB
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

// ── Newsletter ────────────────────────────────────────────────────────────────

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

  // Récupérer les destinataires selon les rôles ciblés
  let usersQuery = db.from("users").select("email, full_name, role").eq("is_active", true);

  if (input.targetRoles && input.targetRoles.length > 0) {
    usersQuery = usersQuery.in("role", input.targetRoles);
  }

  const { data: recipients } = await usersQuery;
  if (!recipients?.length) {
    return { success: false, error: "Aucun destinataire trouvé pour ce segment" };
  }

  // Créer la campagne en DB
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

  // Envoi en batch
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    const personalizedHtml = input.bodyHtml.replace(/{{name}}/g, recipient.full_name ?? "Docteur");
    try {
      await sendRawEmail({
        to: recipient.email,
        subject: input.subject,
        html: personalizedHtml,
      });
      sentCount++;
    } catch {
      failedCount++;
    }
  }

  // Mettre à jour la campagne avec les stats
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

// ── Monitoring intégrations ───────────────────────────────────────────────────

export interface AdminApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  clinic_id: string;
  clinic_name: string;
  owner_email: string;
}

export interface AdminWebhookRow {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_status_code: number | null;
  failure_count: number;
  clinic_id: string;
  clinic_name: string;
  owner_email: string;
}

export async function listAllApiKeys(): Promise<AdminApiKeyRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;

  const { data: keys } = await db
    .from("api_keys")
    .select("id, name, key_prefix, is_active, created_at, last_used_at, clinic_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!keys?.length) return [];

  const clinicIds = [...new Set(keys.map((k: any) => k.clinic_id).filter(Boolean))];
  const [clinicsResult, ownersResult] = await Promise.all([
    db.from("clinics").select("id, name").in("id", clinicIds),
    db.from("users").select("clinic_id, email").eq("role", "owner").in("clinic_id", clinicIds),
  ]);

  const clinicById = Object.fromEntries((clinicsResult.data ?? []).map((c: any) => [c.id, c.name]));
  const ownerByClinic = Object.fromEntries((ownersResult.data ?? []).map((u: any) => [u.clinic_id, u.email]));

  return keys.map((k: any) => ({
    ...k,
    clinic_name: clinicById[k.clinic_id] ?? "—",
    owner_email: ownerByClinic[k.clinic_id] ?? "—",
  }));
}

export async function listAllWebhooks(): Promise<AdminWebhookRow[]> {
  const auth = await requireSuperAdmin();
  if (!auth) return [];

  const db = (await createAdminClient()) as any;

  const { data: hooks } = await db
    .from("webhooks")
    .select("id, name, url, events, is_active, created_at, last_triggered_at, last_status_code, failure_count, clinic_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!hooks?.length) return [];

  const clinicIds = [...new Set(hooks.map((h: any) => h.clinic_id).filter(Boolean))];
  const [clinicsResult, ownersResult] = await Promise.all([
    db.from("clinics").select("id, name").in("id", clinicIds),
    db.from("users").select("clinic_id, email").eq("role", "owner").in("clinic_id", clinicIds),
  ]);

  const clinicById = Object.fromEntries((clinicsResult.data ?? []).map((c: any) => [c.id, c.name]));
  const ownerByClinic = Object.fromEntries((ownersResult.data ?? []).map((u: any) => [u.clinic_id, u.email]));

  return hooks.map((h: any) => ({
    ...h,
    clinic_name: clinicById[h.clinic_id] ?? "—",
    owner_email: ownerByClinic[h.clinic_id] ?? "—",
  }));
}
