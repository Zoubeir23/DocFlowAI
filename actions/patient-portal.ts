"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPortalInvitationEmail({
  patientName,
  clinicName,
  magicLink,
  loginUrl,
}: {
  patientName: string;
  clinicName: string;
  magicLink: string;
  loginUrl: string;
}): string {
  const safePatientName = escapeHtml(patientName);
  const safeClinicName = escapeHtml(clinicName);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeMagicLink = escapeHtml(magicLink);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#0d9488;padding:32px 40px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">Votre espace patient</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${safeClinicName}</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour <strong>${safePatientName}</strong>,</p>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
        Votre médecin vous a ouvert un accès à votre espace patient. Vous pouvez y consulter
        vos rendez-vous, votre historique de consultations et vos documents médicaux.
      </p>
      <a href="${safeMagicLink}" style="display:inline-block;background:#0d9488;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Accéder à mon espace →
      </a>
      <p style="margin:24px 0 8px;color:#94a3b8;font-size:12px;">Ce lien est valable 24 heures.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="margin:0 0 8px;color:#334155;font-size:13px;font-weight:600;">Première connexion :</p>
      <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">
        Cliquez sur le bouton ci-dessus pour accéder à votre espace. Vous serez invité à créer
        un mot de passe personnel pour vos prochaines connexions.
      </p>
      <p style="margin:0 0 8px;color:#334155;font-size:13px;font-weight:600;">Pour vous reconnecter à l'avenir :</p>
      <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">
        Rendez-vous sur votre page de connexion patient et utilisez votre email et mot de passe.
      </p>
      <a href="${safeLoginUrl}" style="color:#0d9488;font-size:13px;word-break:break-all;">${safeLoginUrl}</a>
    </div>
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">DocFlow IA · Système de gestion médicale</p>
    </div>
  </div>
</body>
</html>`;
}

export async function invitePatientToPortal(patientId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autorisé" };

  const { data: patient } = await supabase
    .from("patients")
    .select("id, email, full_name, clinic_id, portal_invited_at")
    .eq("id", patientId)
    .maybeSingle() as { data: { id: string; email: string | null; full_name: string; clinic_id: string; portal_invited_at: string | null } | null; error: unknown };

  if (!patient) return { success: false, error: "Patient introuvable" };
  if (!patient.email) return { success: false, error: "Ce patient n'a pas d'email enregistré" };

  // Rate limiting : empêcher les invitations répétées dans les 5 minutes
  if (patient.portal_invited_at) {
    const lastInvitedAt = new Date(patient.portal_invited_at).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (lastInvitedAt > fiveMinutesAgo) {
      return { success: false, error: "Une invitation a déjà été envoyée récemment. Veuillez patienter 5 minutes." };
    }
  }

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name")
    .eq("id", patient.clinic_id)
    .maybeSingle() as { data: { name: string } | null };

  const adminSupabase = await createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectTo = `${appUrl}/portail/callback`;

  // Tenter invite d'abord ; si l'email est déjà enregistré → fallback magiclink
  let linkResult = await (adminSupabase.auth.admin as any).generateLink({
    type: "invite",
    email: patient.email,
    options: { redirectTo },
  }) as { data: { properties?: { action_link?: string } } | null; error: { message: string } | null };

  if (linkResult.error?.message?.toLowerCase().includes("already been registered")) {
    linkResult = await (adminSupabase.auth.admin as any).generateLink({
      type: "magiclink",
      email: patient.email,
      options: { redirectTo },
    }) as { data: { properties?: { action_link?: string } } | null; error: { message: string } | null };
  }

  if (linkResult.error) return { success: false, error: linkResult.error.message };
  const { data: linkData } = linkResult;

  const magicLink = linkData?.properties?.action_link ?? redirectTo;
  const clinicName = clinic?.name ?? "votre médecin";
  const loginUrl = `${appUrl}/portail/login`;

  // Envoi de l'email d'invitation via SMTP Google
  try {
    const nodemailer = await import("nodemailer");
    const googleUser = process.env.SMTP_GOOGLE_EMAIL;
    const googleAppPassword = process.env.GOOGLE_APP_PASSWORD;
    const fromAddress = process.env.NEXT_PUBLIC_EMAIL_FROM ?? googleUser ?? "";

    if (googleUser && googleAppPassword) {
      const transporter = nodemailer.default.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: googleUser, pass: googleAppPassword },
      });
      await transporter.sendMail({
        from: fromAddress,
        to: patient.email,
        subject: `Votre espace patient — ${clinicName}`,
        html: buildPortalInvitationEmail({
          patientName: patient.full_name,
          clinicName,
          magicLink,
          loginUrl,
        }),
      });
    } else {
      console.warn("[Portal] SMTP_GOOGLE_EMAIL ou GOOGLE_APP_PASSWORD non configuré — email non envoyé.");
    }
  } catch (err) {
    console.error("[Portal] Erreur envoi email invitation:", err);
  }

  await (supabase as any)
    .from("patients")
    .update({ portal_invited_at: new Date().toISOString() })
    .eq("id", patientId);

  revalidatePath(`/app/patients/${patientId}`);
  return { success: true };
}

export async function linkPatientToAuth(): Promise<{ success: boolean; patientId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: "Non authentifié" };

  // Déjà lié ?
  const { data: existing } = await (supabase as any)
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle() as { data: { id: string } | null };

  if (existing) return { success: true, patientId: existing.id };

  // Lier par email
  const adminSupabase = await createAdminClient();
  const { data: patient, error } = await (adminSupabase as any)
    .from("patients")
    .update({ auth_user_id: user.id })
    .eq("email", user.email)
    .select("id")
    .maybeSingle() as { data: { id: string } | null; error: unknown };

  if (error || !patient) {
    return { success: false, error: "Aucun dossier patient trouvé pour cet email" };
  }

  // Marquer que le mot de passe a été défini
  await supabase.auth.updateUser({
    data: { portal_password_set: true },
  });

  return { success: true, patientId: patient.id };
}

export interface PortalPatient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  clinic_id: string;
  clinics: { name: string; slug: string } | null;
  carnet: { public_code: string }[] | null;
}

export interface PortalAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  cancel_token: string | null;
  payment_status: string;
  preconsultation_submitted_at: string | null;
  services: { name: string; duration_minutes: number; price: number | null } | null;
  teleconsultation_room_id: string | null;
  teleconsultation_status: "pending" | "active" | "ended" | null;
}

export async function getPatientPortalData(): Promise<{ patient: PortalPatient; appointments: PortalAppointment[] } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id, full_name, phone, email, clinic_id, clinics(name, slug), carnet:patient_carnets(public_code)")
    .eq("auth_user_id", user.id)
    .maybeSingle() as { data: PortalPatient | null };

  if (!patient) return null;

  const { data: appointments } = await (supabase as any)
    .from("appointments")
    .select("id, start_at, end_at, status, notes, cancel_token, payment_status, preconsultation_submitted_at, teleconsultation_room_id, teleconsultation_status, services(name, duration_minutes, price)")
    .eq("patient_id", patient.id)
    .order("start_at", { ascending: false }) as { data: PortalAppointment[] | null };

  return {
    patient,
    appointments: appointments ?? [],
  };
}

export async function cancelAppointmentAsPatient(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle() as { data: { id: string } | null };

  if (!patient) return { success: false, error: "Patient introuvable" };

  const { error } = await (supabase as any)
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .in("status", ["booked", "confirmed"]);

  if (error) return { success: false, error: error.message };

  revalidatePath("/portail/dashboard");
  return { success: true };
}
