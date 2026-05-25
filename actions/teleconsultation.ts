"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const JITSI_APP_ID = process.env.JITSI_APP_ID ?? "docflowai";

export interface TeleconsultationSession {
  room_id: string;
  room_url: string;
  status: "pending" | "active" | "ended";
}

function buildRoomUrl(roomId: string): string {
  return `https://meet.jit.si/${JITSI_APP_ID}-${roomId}`;
}

export async function createTeleconsultationRoom(
  appointmentId: string
): Promise<{ success: boolean; session?: TeleconsultationSession; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: userData } = await (supabase as any)
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string } | null };

  if (!userData) return { success: false, error: "Accès non autorisé" };

  const { data: appointment } = await (supabase as any)
    .from("appointments")
    .select("id, teleconsultation_room_id, teleconsultation_status, status")
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id)
    .single() as { data: {
      id: string;
      teleconsultation_room_id: string | null;
      teleconsultation_status: string | null;
      status: string;
    } | null };

  if (!appointment) return { success: false, error: "Rendez-vous introuvable" };

  if (appointment.status === "cancelled") {
    return { success: false, error: "Impossible de démarrer une téléconsultation pour un RDV annulé" };
  }

  if (appointment.teleconsultation_room_id && appointment.teleconsultation_status !== "ended") {
    return {
      success: true,
      session: {
        room_id: appointment.teleconsultation_room_id,
        room_url: buildRoomUrl(appointment.teleconsultation_room_id),
        status: (appointment.teleconsultation_status as "pending" | "active" | "ended") ?? "pending",
      },
    };
  }

  const roomId = crypto.randomUUID();

  const { error } = await (supabase as any)
    .from("appointments")
    .update({
      teleconsultation_room_id: roomId,
      teleconsultation_status: "pending",
    })
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/portail/dashboard`);
  revalidatePath(`/app/appointments`);

  return {
    success: true,
    session: {
      room_id: roomId,
      room_url: buildRoomUrl(roomId),
      status: "pending",
    },
  };
}

export async function activateTeleconsultation(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: userData } = await (supabase as any)
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string } | null };

  if (!userData) return { success: false, error: "Accès non autorisé" };

  const { error } = await (supabase as any)
    .from("appointments")
    .update({ teleconsultation_status: "active" })
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id)
    .eq("teleconsultation_status", "pending");

  if (error) return { success: false, error: error.message };

  revalidatePath(`/portail/dashboard`);
  return { success: true };
}

export async function endTeleconsultation(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: userData } = await (supabase as any)
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .single() as { data: { clinic_id: string } | null };

  if (!userData) return { success: false, error: "Accès non autorisé" };

  const { error } = await (supabase as any)
    .from("appointments")
    .update({ teleconsultation_status: "ended" })
    .eq("id", appointmentId)
    .eq("clinic_id", userData.clinic_id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/portail/dashboard`);
  return { success: true };
}

const teleRoomSchema = z.object({ appointmentId: z.string().uuid() });

export async function getPatientTeleconsultationSession(
  appointmentId: string
): Promise<TeleconsultationSession | null> {
  const parsed = teleRoomSchema.safeParse({ appointmentId });
  if (!parsed.success) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: patient } = await (supabase as any)
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single() as { data: { id: string } | null };

  if (!patient) return null;

  const { data } = await (supabase as any)
    .from("appointments")
    .select("teleconsultation_room_id, teleconsultation_status")
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .single() as { data: {
      teleconsultation_room_id: string | null;
      teleconsultation_status: string | null;
    } | null };

  if (!data?.teleconsultation_room_id || !data.teleconsultation_status) return null;

  return {
    room_id: data.teleconsultation_room_id,
    room_url: `https://meet.jit.si/${JITSI_APP_ID}-${data.teleconsultation_room_id}`,
    status: data.teleconsultation_status as "pending" | "active" | "ended",
  };
}
