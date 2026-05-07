/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { WidgetChat } from "@/components/widget/widget-chat";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = (await createAdminClient()) as any;
  const { data: clinic } = await db
    .from("clinics")
    .select("name")
    .eq("slug", slug)
    .single() as { data: { name: string } | null };

  return {
    title: clinic ? `Book Appointment - ${clinic.name}` : "Book Appointment",
  };
}

export default async function WidgetPage({ params }: Props) {
  const { slug } = await params;
  const db = (await createAdminClient()) as any;

  const { data: clinic } = await db
    .from("clinics")
    .select("id, name, slug, timezone")
    .eq("slug", slug)
    .single() as { data: { id: string; name: string; slug: string; timezone: string } | null };

  if (!clinic) notFound();

  const [settingsRes, servicesRes] = await Promise.all([
    db.from("clinic_settings").select("widget_color, welcome_message").eq("clinic_id", clinic.id).single(),
    db.from("services").select("id, name, duration_minutes, price").eq("clinic_id", clinic.id).eq("is_active", true),
  ]);

  const settings = settingsRes.data as { widget_color: string; welcome_message: string } | null;
  const services = (servicesRes.data || []) as Array<{ id: string; name: string; duration_minutes: number; price?: number | null }>;

  return (
    <WidgetChat
      clinicSlug={slug}
      clinicName={clinic.name}
      widgetColor={settings?.widget_color || "#2563eb"}
      welcomeMessage={settings?.welcome_message || `Welcome to ${clinic.name}! How can I help you today?`}
      services={services}
    />
  );
}
