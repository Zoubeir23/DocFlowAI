"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripeServerClient, STRIPE_PLAN_PRICE_IDS } from "@/lib/stripe/client";
import { isOwnerOrAbove, type UserRole } from "@/lib/rbac";

export type StripePlan = "starter" | "professional" | "enterprise";

export interface CreateStripeBillingPortalSessionResult {
  portalUrl: string | null;
  error: string | null;
}

// Point d'entrée self-service pour résilier/gérer un abonnement Stripe —
// jusqu'ici, seul le support pouvait le faire manuellement dans le dashboard
// Stripe (audit paiements/abonnements 2026-07-23). Le portail Stripe gère
// nativement l'annulation, le changement de moyen de paiement et l'historique
// des factures ; aucune écriture DB n'est nécessaire ici, le webhook
// customer.subscription.deleted/updated existant reflète déjà les changements.
export async function createStripeBillingPortalSession(): Promise<CreateStripeBillingPortalSessionResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { portalUrl: null, error: "Utilisateur non authentifié" };
  }

  const { data: userData, error: userError } = await db
    .from("users")
    .select("clinic_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (userError || !userData) {
    return { portalUrl: null, error: "Données utilisateur introuvables" };
  }

  if (!isOwnerOrAbove(userData.role as UserRole)) {
    return { portalUrl: null, error: "Non autorisé" };
  }

  const { data: subscription } = await db
    .from("subscriptions")
    .select("stripe_customer_id, payment_provider")
    .eq("clinic_id", userData.clinic_id)
    .maybeSingle();

  if (!subscription?.stripe_customer_id || subscription.payment_provider !== "stripe") {
    return { portalUrl: null, error: "Aucun abonnement Stripe actif à gérer." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripeServerClient();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/app/billing`,
    });
    return { portalUrl: session.url, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    console.error("[Stripe] createBillingPortalSession error:", message);
    return { portalUrl: null, error: message };
  }
}

export interface CreateStripeCheckoutSessionResult {
  checkoutUrl: string | null;
  error: string | null;
  /** true si le plan a été changé immédiatement sur l'abonnement Stripe existant (pas de redirection nécessaire). */
  updatedDirectly?: boolean;
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
    .select("clinic_id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (userError || !userData) {
    return { checkoutUrl: null, error: "Données utilisateur introuvables" };
  }

  // Défense en profondeur : ne pas dépendre uniquement de la protection de
  // route middleware (canAccessRoute sur /app/billing) — cette action modifie
  // directement la facturation de la clinique et doit revérifier le rôle
  // elle-même, comme le fait déjà actions/team.ts pour les opérations
  // sensibles équivalentes.
  if (!isOwnerOrAbove(userData.role as UserRole)) {
    return { checkoutUrl: null, error: "Non autorisé" };
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

  // Changement de plan sur un abonnement Stripe déjà actif : on modifie
  // l'abonnement existant au lieu de créer une nouvelle session checkout,
  // qui créerait un second abonnement Stripe facturé en parallèle du premier.
  const { data: existingSubscription } = await db
    .from("subscriptions")
    .select("stripe_subscription_id, status, payment_provider")
    .eq("clinic_id", userData.clinic_id)
    .maybeSingle();

  if (
    existingSubscription?.stripe_subscription_id &&
    existingSubscription.payment_provider === "stripe" &&
    existingSubscription.status === "active"
  ) {
    try {
      const currentSubscription = await stripe.subscriptions.retrieve(
        existingSubscription.stripe_subscription_id
      );
      const currentItem = currentSubscription.items.data[0];
      if (!currentItem) {
        return { checkoutUrl: null, error: "Abonnement Stripe introuvable ou invalide." };
      }

      const updatedSubscription = await stripe.subscriptions.update(
        existingSubscription.stripe_subscription_id,
        {
          items: [{ id: currentItem.id, price: priceId }],
          proration_behavior: "create_prorations",
          metadata: { clinic_id: userData.clinic_id as string, plan },
        }
      );

      const updatedItem = updatedSubscription.items.data[0];
      const periodStart = new Date(updatedItem.current_period_start * 1000).toISOString();
      const periodEnd = new Date(updatedItem.current_period_end * 1000).toISOString();

      // Écriture via le client admin : la policy RLS staff n'autorise que la
      // lecture sur subscriptions (voir migration 008), toute écriture doit
      // passer par le service role.
      const adminDb = (await createAdminClient()) as any;
      await adminDb
        .from("subscriptions")
        .update({ plan, status: "active", current_period_start: periodStart, current_period_end: periodEnd })
        .eq("clinic_id", userData.clinic_id);

      return { checkoutUrl: null, error: null, updatedDirectly: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
      console.error("[Stripe] updateSubscription error:", message);
      return { checkoutUrl: null, error: message };
    }
  }

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
