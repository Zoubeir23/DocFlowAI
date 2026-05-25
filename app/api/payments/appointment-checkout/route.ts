import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { appointmentId } = await request.json() as { appointmentId?: string };
  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId requis" }, { status: 400 });
  }

  const supabaseAny = supabase as any;

  // Vérifier que le patient authentifié est propriétaire du RDV
  const { data: patient } = await supabaseAny
    .from("patients")
    .select("id, full_name, email")
    .eq("auth_user_id", user.id)
    .single() as { data: { id: string; full_name: string; email: string | null } | null };

  if (!patient) {
    return NextResponse.json({ error: "Dossier patient introuvable" }, { status: 403 });
  }

  const { data: appointment } = await supabaseAny
    .from("appointments")
    .select("id, payment_status, start_at, services(name, price), clinics(name)")
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .in("status", ["booked", "confirmed"])
    .single() as {
      data: {
        id: string;
        payment_status: string;
        start_at: string;
        services: { name: string; price: number | null } | null;
        clinics: { name: string } | null;
      } | null;
    };

  if (!appointment) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }

  if (appointment.payment_status === "paid") {
    return NextResponse.json({ error: "Ce rendez-vous est déjà payé" }, { status: 400 });
  }
  if (appointment.payment_status === "pending") {
    return NextResponse.json({ error: "Un paiement est déjà en cours pour ce rendez-vous" }, { status: 400 });
  }

  const price = appointment.services?.price;
  if (!price || price <= 0) {
    return NextResponse.json({ error: "Ce rendez-vous n'a pas de tarif défini" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  const stripe = getStripeServerClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: patient.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(price * 100),
          product_data: {
            name: appointment.services?.name ?? "Consultation",
            description: `${appointment.clinics?.name ?? ""} — ${new Date(appointment.start_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`,
          },
        },
      },
    ],
    metadata: {
      appointment_id: appointmentId,
      patient_id: patient.id,
      type: "appointment_payment",
    },
    success_url: `${appUrl}/portail/dashboard?payment=success`,
    cancel_url: `${appUrl}/portail/dashboard?payment=cancelled`,
  });

  // Marquer le RDV en attente de paiement (atomic — condition sur payment_status actuel)
  const adminSupabase = await createAdminClient();
  const { error: updateError } = await (adminSupabase as any)
    .from("appointments")
    .update({
      payment_status: "pending",
      stripe_checkout_session_id: session.id,
    })
    .eq("id", appointmentId)
    .eq("payment_status", "not_required");

  if (updateError) {
    console.error("[Checkout] Failed to update appointment payment status:", updateError.message);
    return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
