import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { ReceiptDocument, type ReceiptData } from "@/lib/pdf/receipt-document";
import React, { type ReactElement } from "react";

export const dynamic = "force-dynamic";

interface AppointmentRow {
  id: string;
  patient_id: string;
  clinic_id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  patients: { full_name: string; phone: string | null; email: string | null } | null;
  services: { name: string; price: number | null; duration_minutes: number | null } | null;
  clinics: { name: string } | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const db = supabase as any;

  const { data: appt, error } = await db
    .from("appointments")
    .select("id, patient_id, clinic_id, start_at, end_at, status, notes, patients(full_name, phone, email), services(name, price, duration_minutes), clinics(name)")
    .eq("id", appointmentId)
    .single() as { data: AppointmentRow | null; error: { message: string } | null };

  if (error || !appt) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }
  if (appt.status !== "completed") {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }

  // Accès : staff de la clinique OU patient propriétaire
  const { data: staffCheck } = await db
    .from("users")
    .select("id")
    .eq("id", user.id)
    .eq("clinic_id", appt.clinic_id)
    .single() as { data: { id: string } | null };

  if (!staffCheck) {
    const { data: patientCheck } = await db
      .from("patients")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("id", appt.patient_id)
      .single() as { data: { id: string } | null };

    if (!patientCheck) {
      return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
    }
  }

  const receiptData: ReceiptData = {
    appointmentId: appt.id,
    clinicName: appt.clinics?.name ?? "DocFlow",
    patientFullName: appt.patients?.full_name ?? "Patient",
    patientPhone: appt.patients?.phone ?? null,
    patientEmail: appt.patients?.email ?? null,
    serviceName: appt.services?.name ?? "Consultation",
    servicePrice: appt.services?.price ?? null,
    serviceDurationMinutes: appt.services?.duration_minutes ?? null,
    startAt: appt.start_at,
    endAt: appt.end_at,
    notes: appt.notes,
    emittedAt: new Date().toISOString(),
  };

  const pdfBuffer = await renderToBuffer(
    React.createElement(ReceiptDocument, { data: receiptData }) as ReactElement<DocumentProps>
  );

  const patientSlug = receiptData.patientFullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filenameBase = patientSlug || `recu-${appointmentId.slice(0, 8)}`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
