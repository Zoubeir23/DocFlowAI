"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";

export async function requireSuperAdmin(): Promise<{ userId: string } | null> {
  const db = (await createClient()) as any;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;

  const { data: userData } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData || userData.role !== "super_admin") return null;
  return { userId: user.id };
}
