"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkStaffQuota } from "@/lib/subscription/quota";

export type StaffRole = "receptionist" | "assistant";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: "owner" | "receptionist" | "assistant";
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: StaffRole;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
}

async function getAuthenticatedOwnerClinicId(): Promise<{ clinicId: string; userId: string } | null> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;

  const { data: userData } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData || (userData.role !== "owner" && userData.role !== "super_admin")) return null;

  return { clinicId: userData.clinic_id, userId: authData.user.id };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return [];

  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData) return [];

  const { data } = await db
    .from("users")
    .select("id, full_name, email, role, created_at")
    .eq("clinic_id", userData.clinic_id)
    .order("created_at");

  return (data ?? []) as TeamMember[];
}

export async function listPendingInvitations(): Promise<StaffInvitation[]> {
  const auth = await getAuthenticatedOwnerClinicId();
  if (!auth) return [];

  const supabase = await createClient();
  const db = supabase as any;

  const { data } = await db
    .from("staff_invitations")
    .select("id, email, role, status, created_at, expires_at")
    .eq("clinic_id", auth.clinicId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as StaffInvitation[];
}

export async function inviteTeamMember(
  email: string,
  role: StaffRole
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthenticatedOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();
  const adminClient = await createAdminClient();
  const db = supabase as any;
  const adminDb = adminClient as any;

  // Check quota before inviting
  const quota = await checkStaffQuota(auth.clinicId, db);
  if (!quota.allowed) {
    return { success: false, error: quota.reason ?? "Limite de comptes staff atteinte" };
  }

  // Check if user already exists in this clinic
  const { data: existingUser } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .eq("clinic_id", auth.clinicId)
    .maybeSingle();

  if (existingUser) {
    return { success: false, error: "Cet email est déjà membre de votre équipe" };
  }

  // Upsert invitation (reset if previously expired/cancelled)
  const { data: invitation, error: inviteError } = await db
    .from("staff_invitations")
    .upsert({
      clinic_id: auth.clinicId,
      email: email.toLowerCase().trim(),
      role,
      status: "pending",
      invited_by: auth.userId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "clinic_id,email" })
    .select("token")
    .maybeSingle();

  if (inviteError || !invitation) {
    console.error("[inviteTeamMember] upsert error:", inviteError);
    return { success: false, error: "Erreur lors de la création de l'invitation" };
  }

  // Get clinic name for the email
  const { data: clinicData } = await db
    .from("clinics")
    .select("name")
    .eq("id", auth.clinicId)
    .maybeSingle();

  const clinicName = clinicData?.name ?? "DocFlow IA";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const joinUrl = `${appUrl}/join/${invitation.token}`;

  // Send invitation email via Supabase admin (magic-link style) or fallback to our email system
  try {
    await adminDb.auth.admin.inviteUserByEmail(email, {
      redirectTo: joinUrl,
      data: {
        clinic_id: auth.clinicId,
        role,
        invitation_token: invitation.token,
        clinic_name: clinicName,
      },
    });
  } catch (emailError) {
    // Non-blocking: invitation is created even if email fails
    console.error("[inviteTeamMember] email send error:", emailError);
  }

  return { success: true };
}

export async function cancelInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthenticatedOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  const supabase = await createClient();
  const db = supabase as any;

  const { error } = await db
    .from("staff_invitations")
    .update({ status: "expired" })
    .eq("id", invitationId)
    .eq("clinic_id", auth.clinicId);

  if (error) return { success: false, error: "Erreur lors de l'annulation" };
  return { success: true };
}

export async function removeTeamMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthenticatedOwnerClinicId();
  if (!auth) return { success: false, error: "Non autorisé" };

  if (memberId === auth.userId) {
    return { success: false, error: "Vous ne pouvez pas vous retirer vous-même" };
  }

  const adminClient = await createAdminClient();
  const adminDb = adminClient as any;

  // Verify the member belongs to this clinic
  const supabase = await createClient();
  const db = supabase as any;
  const { data: member } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (!member || member.clinic_id !== auth.clinicId) {
    return { success: false, error: "Membre introuvable" };
  }

  if (member.role === "owner" || member.role === "super_admin") {
    return { success: false, error: "Impossible de retirer le propriétaire" };
  }

  // Delete from users table (auth user remains but loses clinic access)
  const { error } = await db
    .from("users")
    .delete()
    .eq("id", memberId)
    .eq("clinic_id", auth.clinicId);

  if (error) {
    console.error("[removeTeamMember] delete error:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }

  // Also delete auth user via admin (optional, keeps it clean)
  try {
    await adminDb.auth.admin.deleteUser(memberId);
  } catch {
    // Non-blocking
  }

  return { success: true };
}

export async function acceptInvitation(
  token: string,
  fullName: string
): Promise<{ success: boolean; error?: string; clinicId?: string; role?: string }> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return { success: false, error: "Non authentifié" };

  // Look up invitation
  const { data: invitation } = await db
    .from("staff_invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!invitation) {
    return { success: false, error: "Invitation introuvable ou expirée" };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await db.from("staff_invitations").update({ status: "expired" }).eq("id", invitation.id);
    return { success: false, error: "Cette invitation a expiré" };
  }

  if (invitation.email.toLowerCase() !== authData.user.email?.toLowerCase()) {
    return { success: false, error: "Cette invitation ne correspond pas à votre email" };
  }

  // Create user profile in the clinic
  const { error: userError } = await db.from("users").upsert({
    id: authData.user.id,
    clinic_id: invitation.clinic_id,
    role: invitation.role,
    full_name: fullName || authData.user.email?.split("@")[0] || "Staff",
    email: authData.user.email,
  });

  if (userError) {
    console.error("[acceptInvitation] user upsert error:", userError);
    return { success: false, error: "Erreur lors de l'activation du compte" };
  }

  // Mark invitation as accepted
  await db
    .from("staff_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  return { success: true, clinicId: invitation.clinic_id, role: invitation.role };
}

export async function getMyRole(): Promise<{ role: string; clinicId: string } | null> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data: authData } = await db.auth.getUser();
  if (!authData.user) return null;

  const { data: userData } = await db
    .from("users")
    .select("role, clinic_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!userData) return null;
  return { role: userData.role, clinicId: userData.clinic_id };
}

// Returns only non-PII fields — email is withheld and verified server-side in acceptInvitation
export async function getInvitationByToken(
  token: string
): Promise<{ role: StaffRole; clinic_name: string; expires_at: string } | null> {
  const supabase = await createClient();
  const db = supabase as any;

  const { data } = await db
    .from("staff_invitations")
    .select("role, expires_at, clinic:clinics(name)")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!data) return null;

  return {
    role: data.role,
    clinic_name: data.clinic?.name ?? "DocFlow IA",
    expires_at: data.expires_at,
  };
}
