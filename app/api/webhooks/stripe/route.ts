import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeServerClient, STRIPE_PLAN_PRICE_IDS } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[StripeWebhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = getStripeServerClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[StripeWebhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Chaque handler renvoie false en cas d'échec d'écriture DB : on répond alors
  // 500 pour que Stripe considère la livraison échouée et retente l'événement
  // plus tard, au lieu de le perdre silencieusement (voir handlers ci-dessous).
  let handled = true;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    handled = session.metadata?.type === "appointment_payment"
      ? await handleAppointmentPaymentCompleted(session)
      : await handleCheckoutSessionCompleted(session);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.type === "appointment_payment") {
      handled = await handleAppointmentPaymentExpired(session);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    handled = await handleSubscriptionDeleted(subscription);
  }

  if (event.type === "customer.subscription.updated") {
    // invoice.payment_succeeded a été retiré de ce chemin : son event.data.object
    // est un Stripe.Invoice (metadata de facture vide, id de facture ≠ id
    // d'abonnement), pas un Stripe.Subscription — le cast précédent faisait
    // échouer silencieusement le .update() (0 ligne affectée). Le renouvellement
    // est déjà couvert par customer.subscription.updated.
    const sub = event.data.object as Stripe.Subscription;
    handled = await handleSubscriptionRenewed(sub);
  }

  if (!handled) {
    return NextResponse.json({ error: "Processing failed, retry requested" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleAppointmentPaymentCompleted(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const appointmentId = session.metadata?.appointment_id;
  if (!appointmentId) {
    console.error("[StripeWebhook] Missing appointment_id in session metadata");
    return true; // métadonnées absentes : un retry ne changera rien
  }

  const supabase = await createAdminClient();
  const db = supabase as any;

  const { error } = await db
    .from("appointments")
    .update({ payment_status: "paid" })
    .eq("id", appointmentId)
    .eq("stripe_checkout_session_id", session.id);

  if (error) {
    console.error("[StripeWebhook] Failed to mark appointment as paid:", error.message);
    return false;
  }

  console.log(`[StripeWebhook] Appointment paid — id: ${appointmentId}`);
  return true;
}

async function handleAppointmentPaymentExpired(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const appointmentId = session.metadata?.appointment_id;
  if (!appointmentId) return true;

  const supabase = await createAdminClient();
  const db = supabase as any;

  // Ne réinitialise que si le paiement est toujours en attente pour cette
  // session précise — évite d'écraser un paiement déjà confirmé entre-temps.
  const { error } = await db
    .from("appointments")
    .update({ payment_status: "unpaid", stripe_checkout_session_id: null })
    .eq("id", appointmentId)
    .eq("stripe_checkout_session_id", session.id)
    .eq("payment_status", "pending");

  if (error) {
    console.error("[StripeWebhook] Failed to reset expired appointment payment:", error.message);
    return false;
  }

  console.log(`[StripeWebhook] Appointment payment session expired — id: ${appointmentId}`);
  return true;
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const clinicId = session.metadata?.clinic_id;
  const plan = session.metadata?.plan as "starter" | "professional" | "enterprise" | undefined;

  if (!clinicId || !plan) {
    console.error("[StripeWebhook] Missing clinic_id or plan in session metadata");
    return true; // métadonnées absentes : un retry ne changera rien
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer as Stripe.Customer | Stripe.DeletedCustomer | null)?.id ?? null;

  const stripe = getStripeServerClient();
  let periodStart: string;
  let periodEnd: string;

  if (stripeSubscriptionId) {
    const rawSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    // Access billing cycle dates from the first subscription item (Stripe SDK v15+)
    const firstItem = rawSubscription.items?.data?.[0];
    const itemPeriod = firstItem?.current_period_start && firstItem?.current_period_end
      ? { start: firstItem.current_period_start, end: firstItem.current_period_end }
      : null;

    if (itemPeriod) {
      periodStart = new Date(itemPeriod.start * 1000).toISOString();
      periodEnd = new Date(itemPeriod.end * 1000).toISOString();
    } else {
      // Fallback: subscription-level period fields (older API versions)
      const subAny = rawSubscription as unknown as { current_period_start: number; current_period_end: number };
      periodStart = new Date(subAny.current_period_start * 1000).toISOString();
      periodEnd = new Date(subAny.current_period_end * 1000).toISOString();
    }
  } else {
    const now = new Date();
    periodStart = now.toISOString();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    periodEnd = nextMonth.toISOString();
  }

  // Use the admin client without generic type to avoid Supabase v2 type inference issues
  // with manually-extended schemas. Security is ensured by webhook signature verification above.
  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existingSubscription } = await db
    .from("subscriptions")
    .select("id")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (existingSubscription) {
    const { error } = await db
      .from("subscriptions")
      .update({
        plan,
        status: "active",
        current_period_start: periodStart,
        current_period_end: periodEnd,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        payment_provider: "stripe",
      })
      .eq("clinic_id", clinicId);

    if (error) {
      console.error("[StripeWebhook] Failed to update subscription:", error.message);
      return false;
    }
  } else {
    const { error } = await db.from("subscriptions").insert({
      clinic_id: clinicId,
      plan,
      status: "active",
      current_period_start: periodStart,
      current_period_end: periodEnd,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      payment_provider: "stripe",
    });

    if (error) {
      console.error("[StripeWebhook] Failed to insert subscription:", error.message);
      return false;
    }
  }

  console.log(`[StripeWebhook] Subscription activated — clinic: ${clinicId}, plan: ${plan}`);
  return true;
}

// Mappe le statut Stripe (plus fin) vers les valeurs acceptées par la colonne
// subscriptions.status (CHECK 'active' | 'inactive' | 'cancelled' | 'past_due').
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): "active" | "inactive" | "cancelled" | "past_due" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    default:
      return "inactive";
  }
}

// Retrouve le plan à partir du price Stripe de l'abonnement — la metadata
// peut être absente (ex: modification manuelle dans le Dashboard Stripe).
function resolvePlanFromPriceId(priceId: string | undefined): "starter" | "professional" | "enterprise" | undefined {
  if (!priceId) return undefined;
  const entry = Object.entries(STRIPE_PLAN_PRICE_IDS).find(([, id]) => id === priceId);
  return entry?.[0] as "starter" | "professional" | "enterprise" | undefined;
}

async function handleSubscriptionRenewed(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const clinicId = stripeSubscription.metadata?.clinic_id;
  if (!clinicId) return;

  const firstItem = stripeSubscription.items?.data?.[0];
  const itemPeriod = firstItem?.current_period_start && firstItem?.current_period_end
    ? { start: firstItem.current_period_start, end: firstItem.current_period_end }
    : null;

  const subAny = stripeSubscription as unknown as { current_period_start: number; current_period_end: number };
  const periodStart = itemPeriod
    ? new Date(itemPeriod.start * 1000).toISOString()
    : new Date(subAny.current_period_start * 1000).toISOString();
  const periodEnd = itemPeriod
    ? new Date(itemPeriod.end * 1000).toISOString()
    : new Date(subAny.current_period_end * 1000).toISOString();

  // Resynchronise `plan` : couvre les changements faits hors de l'app
  // (Dashboard Stripe, dunning) que le flux applicatif ne verrait jamais.
  const plan =
    (stripeSubscription.metadata?.plan as "starter" | "professional" | "enterprise" | undefined) ??
    resolvePlanFromPriceId(firstItem?.price?.id);

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("subscriptions")
    .update({
      ...(plan ? { plan } : {}),
      status: mapStripeStatus(stripeSubscription.status),
      current_period_start: periodStart,
      current_period_end: periodEnd,
    })
    .eq("stripe_subscription_id", stripeSubscription.id);

  if (error) {
    console.error("[StripeWebhook] Failed to renew subscription:", error.message);
  }
}

async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const subscriptionId = stripeSubscription.id;
  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("[StripeWebhook] Failed to cancel subscription:", error.message);
    return;
  }

  console.log(`[StripeWebhook] Subscription cancelled — stripe_id: ${subscriptionId}`);
}
