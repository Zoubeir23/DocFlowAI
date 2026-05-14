"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient, STRIPE_PLAN_PRICE_IDS } from "@/lib/stripe/client";

export type StripePlan = "starter" | "professional" | "enterprise";

export interface CreateStripeCheckoutSessionResult {
  checkoutUrl: string | null;
  error: string | null;
}

export async function createStripeCheckoutSession(
  plan: StripePlan
): Promise<CreateStripeCheckoutSessionResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { checkoutUrl: null, error: "Utilisateur non authentifié" };
  }

  const { data: userData, error: userError } = await db
    .from("users")
    .select("clinic_id, email, full_name")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return { checkoutUrl: null, error: "Données utilisateur introuvables" };
  }

  const priceId = STRIPE_PLAN_PRICE_IDS[plan];
  if (!priceId || priceId.startsWith("price_...") || priceId === "price_") {
    return {
      checkoutUrl: null,
      error: "Le paiement en ligne n'est pas encore disponible. Contactez-nous pour souscrire à un abonnement.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripeServerClient();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userData.email as string,
      metadata: {
        clinic_id: userData.clinic_id as string,
        plan,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          clinic_id: userData.clinic_id as string,
          plan,
        },
      },
      success_url: `${appUrl}/app/billing?stripe=success`,
      cancel_url: `${appUrl}/app/billing?stripe=cancelled`,
    });

    return { checkoutUrl: session.url, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    console.error("[Stripe] createCheckoutSession error:", message);
    return { checkoutUrl: null, error: message };
  }
}
