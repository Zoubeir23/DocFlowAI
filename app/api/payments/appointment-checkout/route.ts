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
    .maybeSingle() as { data: { id: string; full_name: string; email: string | null } | null };

  if (!patient) {
    return NextResponse.json({ error: "Dossier patient introuvable" }, { status: 403 });
  }

  const { data: appointment } = await supabaseAny
    .from("appointments")
    .select("id, payment_status, start_at, services(name, price), clinics(name)")
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .in("status", ["booked", "confirmed"])
    .maybeSingle() as {
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
  if (appointment.payment_status !== "unpaid") {
    return NextResponse.json({ error: "Ce rendez-vous n'accepte pas de paiement en ligne" }, { status: 400 });
  }

  const price = appointment.services?.price;
  if (!price || price <= 0) {
    return NextResponse.json({ error: "Ce rendez-vous n'a pas de tarif défini" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  // Réserver le RDV AVANT de créer la session Stripe (pas après) : un update
  // sans ligne affectée ne remonte pas d'erreur côté Supabase, donc deux
  // requêtes concurrentes (double-clic, retry réseau) créaient auparavant
  // chacune leur propre session Stripe, et seule la première gagnait cette
  // même condition — si le patient payait sur la session "perdante", Stripe
  // encaissait mais aucune ligne ne correspondait plus au webhook
  // (stripe_checkout_session_id déjà écrasé par le gagnant), qui répondait
  // quand même succès sans jamais marquer le RDV payé. En réservant d'abord,
  // un seul appelant peut obtenir le droit de créer une session.
  const adminSupabase = await createAdminClient();
  const { data: claimed, error: claimError } = await (adminSupabase as any)
    .from("appointments")
    .update({ payment_status: "pending" })
    .eq("id", appointmentId)
    .eq("payment_status", "unpaid")
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("[Checkout] Failed to claim appointment for payment:", claimError.message);
    return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement" }, { status: 500 });
  }
  if (!claimed) {
    return NextResponse.json({ error: "Un paiement est déjà en cours pour ce rendez-vous" }, { status: 409 });
  }

  const stripe = getStripeServerClient();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
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
  } catch (err: unknown) {
    // Libérer la réservation : la création Stripe a échoué, le RDV ne doit
    // pas rester bloqué en "pending" sans session associée.
    await (adminSupabase as any)
      .from("appointments")
      .update({ payment_status: "unpaid" })
      .eq("id", appointmentId)
      .eq("payment_status", "pending");
    const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    console.error("[Checkout] Stripe session creation failed:", message);
    return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement" }, { status: 500 });
  }

  const { error: attachError } = await (adminSupabase as any)
    .from("appointments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", appointmentId)
    .eq("payment_status", "pending");

  if (attachError) {
    console.error("[Checkout] Failed to attach checkout session id:", attachError.message);
    return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
