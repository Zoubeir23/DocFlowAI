import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/client";
import { checkAuthenticatedRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const POLYGON_RPC_URLS = [
  "https://polygon-rpc.com/",
  "https://rpc.ankr.com/polygon",
  "https://rpc-mainnet.matic.quorum.to",
];

const USDC_CONTRACT = process.env.NEXT_PUBLIC_CRYPTO_USDC_CONTRACT!;
const RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS!;
const USDC_DECIMALS = 6;

const ERC20_TRANSFER_EVENT_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// C3 fix: server-side price map — never trust client-supplied amounts
const PLAN_PRICES_USDC: Record<string, number> = {
  starter: Number(process.env.NEXT_PUBLIC_PLAN_STARTER_PRICE || 49),
  professional: Number(process.env.NEXT_PUBLIC_PLAN_PROFESSIONAL_PRICE || 99),
  enterprise: Number(process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE || 299),
};

interface VerifyRequestBody {
  txHash: string;
  plan: "starter" | "professional" | "enterprise";
  // clinicId intentionally omitted — derived from authenticated session server-side
}

async function getProviderWithFallback(): Promise<ethers.JsonRpcProvider> {
  for (const url of POLYGON_RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch {
      continue;
    }
  }
  throw new Error("Tous les RPC Polygon sont indisponibles. Réessayez dans quelques instants.");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!RECIPIENT_ADDRESS || RECIPIENT_ADDRESS === "0x...") {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS n'est pas configuré sur le serveur." },
      { status: 503 }
    );
  }

  let body: VerifyRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { txHash, plan } = body;

  if (!txHash || !plan) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Derive clinicId from the authenticated session — never trust the client
  const userClient = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userDb = userClient as any;
  const { data: { user } } = await userDb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Chaque appel déclenche jusqu'à 3 requêtes RPC vers des noeuds Polygon
  // publics (getBlockNumber + getTransactionReceipt) : sans limite, un spam
  // authentifié peut faire blacklister l'IP du serveur auprès de ces
  // fournisseurs gratuits et casser le paiement crypto pour toutes les cliniques.
  if (!(await checkAuthenticatedRateLimit(user.id, "crypto-webhook"))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 });
  }

  const { data: userData } = await userDb
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!userData?.clinic_id) {
    return NextResponse.json({ error: "Clinique introuvable" }, { status: 403 });
  }
  const clinicId: string = userData.clinic_id;

  if (!["starter", "professional", "enterprise"].includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  // C3 fix: price determined server-side, not from client
  const expectedAmountUsdc = PLAN_PRICES_USDC[plan];
  if (!expectedAmountUsdc) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // C4 fix: reject txHash already used in any subscription
  const { data: existingTx } = await db
    .from("subscriptions")
    .select("id")
    .eq("crypto_tx_hash", txHash)
    .maybeSingle();

  if (existingTx) {
    return NextResponse.json(
      { error: "Cette transaction a déjà été utilisée pour activer un abonnement." },
      { status: 409 }
    );
  }

  let provider: ethers.JsonRpcProvider;
  try {
    provider = await getProviderWithFallback();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "RPC unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  let receipt: ethers.TransactionReceipt | null;
  try {
    receipt = await provider.getTransactionReceipt(txHash);
  } catch {
    return NextResponse.json(
      { error: "Impossible de récupérer la transaction sur Polygon. Vérifiez le txHash." },
      { status: 400 }
    );
  }

  if (!receipt) {
    return NextResponse.json(
      { error: "Transaction introuvable sur Polygon. Elle est peut-être encore en attente." },
      { status: 400 }
    );
  }

  if (receipt.status !== 1) {
    return NextResponse.json(
      { error: "La transaction a échoué sur la blockchain. Vérifiez sur Polygonscan." },
      { status: 400 }
    );
  }

  const usdcContractLower = USDC_CONTRACT.toLowerCase();
  const recipientLower = RECIPIENT_ADDRESS.toLowerCase();

  let transferVerified = false;
  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() !== usdcContractLower ||
      log.topics[0] !== ERC20_TRANSFER_EVENT_TOPIC ||
      log.topics.length < 3
    ) {
      continue;
    }

    const toAddress = "0x" + log.topics[2].slice(26).toLowerCase();
    if (toAddress !== recipientLower) continue;

    const transferredAmount = ethers.toBigInt(log.data);
    // C3 fix: use server-side price, not client-supplied value
    const expectedRaw = BigInt(Math.round(expectedAmountUsdc * 10 ** USDC_DECIMALS));

    if (transferredAmount >= expectedRaw) {
      transferVerified = true;
      break;
    }
  }

  if (!transferVerified) {
    return NextResponse.json(
      { error: `Paiement USDC non vérifié. Assurez-vous d'avoir envoyé ${expectedAmountUsdc} USDC à l'adresse correcte.` },
      { status: 400 }
    );
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existing } = await db
    .from("subscriptions")
    .select("id, stripe_subscription_id, payment_provider")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  // La clinique passe au paiement crypto : annuler l'abonnement Stripe actif
  // pour éviter un double prélèvement (carte + crypto) en parallèle.
  if (existing?.payment_provider === "stripe" && existing.stripe_subscription_id) {
    try {
      const stripe = getStripeServerClient();
      await stripe.subscriptions.cancel(existing.stripe_subscription_id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
      console.error("[CryptoWebhook] Failed to cancel existing Stripe subscription:", message);
    }
  }

  const subscriptionData = {
    plan,
    status: "active",
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    payment_provider: "crypto",
    crypto_tx_hash: txHash,
  };

  let dbError: { message: string } | null = null;

  if (existing) {
    const { error } = await db
      .from("subscriptions")
      .update(subscriptionData)
      .eq("clinic_id", clinicId);
    dbError = error;
  } else {
    const { error } = await db
      .from("subscriptions")
      .insert({ clinic_id: clinicId, ...subscriptionData });
    dbError = error;
  }

  if (dbError) {
    // 23505 = violation de la contrainte UNIQUE sur crypto_tx_hash : deux
    // requêtes concurrentes ont tenté d'activer un abonnement avec la même
    // transaction. La première a gagné, on rejette proprement la seconde.
    if ((dbError as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "Cette transaction a déjà été utilisée pour activer un abonnement." },
        { status: 409 }
      );
    }
    console.error("[CryptoWebhook] DB error:", dbError.message);
    return NextResponse.json(
      { error: "Paiement vérifié mais erreur base de données. Contactez le support avec votre txHash." },
      { status: 500 }
    );
  }

  console.log(`[CryptoWebhook] Subscription activated — clinic: ${clinicId}, plan: ${plan}, tx: ${txHash}`);

  return NextResponse.json({ success: true, plan, txHash });
}
