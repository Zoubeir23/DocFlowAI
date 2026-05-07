"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ethers } from "ethers";
import { createStripeCheckoutSession, type StripePlan } from "@/actions/stripe-checkout";
import {
  CheckCircle, Zap, Building2, ArrowRight, Copy, Check,
  ExternalLink, AlertCircle, X, Wallet, ShieldCheck,
  Loader2, RefreshCw, AlertTriangle, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

// ── Crypto config ─────────────────────────────────────────────────────────────
const RECIPIENT = process.env.NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS!;
const USDC_CONTRACT = process.env.NEXT_PUBLIC_CRYPTO_USDC_CONTRACT!;
const REQUIRED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CRYPTO_CHAIN_ID || 137);
const USDC_DECIMALS = 6;

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const POLYGON_PARAMS = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://polygon-rpc.com/"],
  blockExplorerUrls: ["https://polygonscan.com/"],
};

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    priceEur: 0,
    priceUsdc: 0,
    features: ["50 rendez-vous/mois", "Assistant IA de réservation", "Calendrier basique", "1 compte staff"],
    plan: "free" as const,
  },
  {
    name: "Starter",
    priceEur: Number(process.env.NEXT_PUBLIC_PLAN_STARTER_PRICE_EUR || 45),
    priceUsdc: Number(process.env.NEXT_PUBLIC_PLAN_STARTER_PRICE || 49),
    features: ["200 rendez-vous/mois", "Toutes les fonctions Free", "Calendrier complet", "CRM patients", "3 comptes staff"],
    plan: "starter" as StripePlan,
  },
  {
    name: "Professional",
    priceEur: Number(process.env.NEXT_PUBLIC_PLAN_PROFESSIONAL_PRICE_EUR || 89),
    priceUsdc: Number(process.env.NEXT_PUBLIC_PLAN_PROFESSIONAL_PRICE || 99),
    features: ["Rendez-vous illimités", "Toutes les fonctions Starter", "Analyses avancées", "IA personnalisée", "10 comptes staff", "Support prioritaire"],
    plan: "professional" as StripePlan,
    popular: true,
  },
  {
    name: "Enterprise",
    priceEur: Number(process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE_EUR || 269),
    priceUsdc: Number(process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE || 299),
    features: ["Plusieurs cliniques", "Toutes les fonctions Pro", "Intégrations sur mesure", "Responsable de compte dédié"],
    plan: "enterprise" as StripePlan,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchSubscription() {
  const supabase = createClient() as ReturnType<typeof createClient>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: userData } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { single: () => Promise<{ data: { clinic_id: string } | null }> } } } }).from("users").select("clinic_id").eq("id", user.id).single();
  if (!userData) return null;
  const { data } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { single: () => Promise<{ data: unknown }> } } } }).from("subscriptions").select("*").eq("clinic_id", userData.clinic_id).single();
  return data as {
    plan: string;
    status: string;
    current_period_end: string;
    payment_provider: string;
  } | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copié !" : "Copier"}
    </button>
  );
}

// ── Crypto Payment Modal (unchanged logic) ────────────────────────────────────
type TxStep = "idle" | "connecting" | "switching" | "approving" | "sending" | "success" | "error";

interface CryptoPaymentModalProps {
  plan: typeof PLANS[0];
  onClose: () => void;
}

function CryptoPaymentModal({ plan, onClose }: CryptoPaymentModalProps) {
  const [step, setStep] = useState<TxStep>("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const isCorrectChain = chainId === REQUIRED_CHAIN_ID;

  const getProvider = () => {
    if (typeof window === "undefined" || !(window as unknown as { ethereum?: unknown }).ethereum) return null;
    return new ethers.BrowserProvider((window as unknown as { ethereum: ethers.Eip1193Provider }).ethereum);
  };

  const fetchWalletInfo = useCallback(async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
      if (Number(network.chainId) === REQUIRED_CHAIN_ID) {
        const usdc = new ethers.Contract(USDC_CONTRACT, ERC20_ABI, provider);
        const bal = await usdc.balanceOf(address);
        setUsdcBalance(ethers.formatUnits(bal, USDC_DECIMALS));
      }
    } catch {
      // ignore
    }
  }, []);

  const connectWallet = async () => {
    const provider = getProvider();
    if (!provider) {
      setError("MetaMask introuvable. Veuillez l'installer depuis metamask.io");
      return;
    }
    setStep("connecting");
    setError("");
    try {
      const eth = (window as unknown as { ethereum: { request: (p: { method: string }) => Promise<string[]> } }).ethereum;
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      setWalletAddress(address);
      await fetchWalletInfo(address, provider);
      setStep("idle");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Connexion refusée";
      setError(message);
      setStep("error");
    }
  };

  const switchToPolygon = async () => {
    setStep("switching");
    setError("");
    const eth = (window as unknown as { ethereum: { request: (p: { method: string; params?: unknown[] }) => Promise<void> } }).ethereum;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON_PARAMS.chainId }] });
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      if (code === 4902) {
        try {
          await eth.request({ method: "wallet_addEthereumChain", params: [POLYGON_PARAMS] });
        } catch (addErr: unknown) {
          const message = addErr instanceof Error ? addErr.message : "Impossible d'ajouter le réseau Polygon";
          setError(message);
          setStep("error");
          return;
        }
      } else {
        const message = e instanceof Error ? e.message : "Échec du changement de réseau";
        setError(message);
        setStep("error");
        return;
      }
    }
    const provider = getProvider()!;
    await fetchWalletInfo(walletAddress, provider);
    setStep("idle");
  };

  const sendPayment = async () => {
    const provider = getProvider();
    if (!provider || !walletAddress) return;
    setStep("approving");
    setError("");
    try {
      const signer = await provider.getSigner();
      const usdc = new ethers.Contract(USDC_CONTRACT, ERC20_ABI, signer);
      const amount = ethers.parseUnits(plan.priceUsdc.toString(), USDC_DECIMALS);
      setStep("sending");
      const tx = await usdc.transfer(RECIPIENT, amount);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStep("success");
    } catch (e: unknown) {
      const rawMessage = (e as { reason?: string; message?: string })?.reason ?? (e instanceof Error ? e.message : "Transaction échouée");
      setError(rawMessage.length > 120 ? rawMessage.slice(0, 120) + "..." : rawMessage);
      setStep("error");
    }
  };

  const isLoading = ["connecting", "switching", "approving", "sending"].includes(step);
  const hasInsufficientBalance = usdcBalance !== null && Number(usdcBalance) < plan.priceUsdc;

  const stepLabel: Record<TxStep, string> = {
    idle: "",
    connecting: "Connexion du portefeuille...",
    switching: "Changement vers Polygon...",
    approving: "En attente d'approbation dans MetaMask...",
    sending: "Envoi de la transaction...",
    success: "",
    error: "",
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Plan {plan.name} — Crypto</h3>
              <p className="text-sm text-gray-500">{plan.priceUsdc} USDC / mois</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === "success" ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Paiement envoyé !</h3>
                <p className="text-gray-500 text-sm mt-1">Votre plan {plan.name} sera activé sous quelques minutes après confirmation on-chain.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left space-y-1">
                <p className="text-xs text-gray-400">Hash de transaction</p>
                <p className="text-xs font-mono text-gray-700 break-all">{txHash}</p>
                <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Voir sur Polygonscan
                </a>
              </div>
              <Button className="w-full" onClick={onClose}>Fermer</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Réseau Polygon · USDC</p>
                    <p className="text-xs text-purple-500">Chain ID : {REQUIRED_CHAIN_ID}</p>
                  </div>
                </div>
                {walletAddress && (
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${isCorrectChain ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isCorrectChain ? "✓ Connecté" : "Mauvais réseau"}
                  </div>
                )}
              </div>

              <div className="text-center py-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Montant à payer</p>
                <p className="text-4xl font-bold text-gray-900">{plan.priceUsdc} <span className="text-lg text-gray-400">USDC</span></p>
                <p className="text-xs text-gray-400 mt-0.5">≈ {plan.priceEur}€ · mensuel</p>
              </div>

              {walletAddress ? (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Portefeuille connecté</p>
                    <CopyButton text={walletAddress} />
                  </div>
                  <p className="text-sm font-mono text-gray-700">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
                  {usdcBalance !== null && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Solde USDC</p>
                      <p className={`text-sm font-semibold ${hasInsufficientBalance ? "text-red-500" : "text-green-600"}`}>
                        {Number(usdcBalance).toFixed(2)} USDC
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                  <p className="text-sm text-gray-500">Aucun portefeuille connecté</p>
                  <p className="text-xs text-gray-400 mt-0.5">Cliquez ci-dessous pour connecter MetaMask</p>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-700">{stepLabel[step]}</p>
                </div>
              )}

              {step === "error" && error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {hasInsufficientBalance && isCorrectChain && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Solde USDC insuffisant. Vous avez besoin de {plan.priceUsdc} USDC mais votre solde est {Number(usdcBalance).toFixed(2)} USDC.
                    Obtenez des USDC sur Polygon via <a href="https://app.uniswap.org" target="_blank" rel="noopener noreferrer" className="underline font-medium">Uniswap</a>.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-1">
                {!walletAddress ? (
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11" onClick={connectWallet} disabled={isLoading}>
                    <Wallet className="w-4 h-4 mr-2" />Connecter MetaMask
                  </Button>
                ) : !isCorrectChain ? (
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11" onClick={switchToPolygon} disabled={isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />Passer sur le réseau Polygon
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
                    onClick={sendPayment}
                    disabled={isLoading || hasInsufficientBalance}
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <ShieldCheck className="w-4 h-4 mr-2" />}
                    {isLoading ? stepLabel[step] : `Payer ${plan.priceUsdc} USDC`}
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={onClose} disabled={isLoading}>
                  Annuler
                </Button>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Envoi vers</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-gray-600">{RECIPIENT.slice(0, 10)}...{RECIPIENT.slice(-8)}</p>
                  <div className="flex items-center gap-2">
                    <CopyButton text={RECIPIENT} />
                    <a href={`https://polygonscan.com/address/${RECIPIENT}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center gap-0.5 hover:underline">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [selectedCryptoPlan, setSelectedCryptoPlan] = useState<typeof PLANS[0] | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [stripeLoadingPlan, setStripeLoadingPlan] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => {
    setHasMetaMask(typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum);
  }, []);

  const stripeStatus = searchParams.get("stripe");

  const { data: subscription } = useQuery({ queryKey: ["subscription"], queryFn: fetchSubscription });

  const handleStripeCheckout = (plan: StripePlan) => {
    setStripeError(null);
    setStripeLoadingPlan(plan);
    startTransition(async () => {
      const result = await createStripeCheckoutSession(plan);
      setStripeLoadingPlan(null);
      if (result.error) {
        setStripeError(result.error);
        return;
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Facturation & Abonnement</h2>
          <p className="text-slate-500 text-sm">Payez par carte bancaire (Stripe) ou en crypto (USDC sur Polygon)</p>
        </div>
      </div>

      {/* Stripe success / cancel banners */}
      {stripeStatus === "success" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Paiement Stripe réussi !</p>
            <p className="text-xs text-green-600 mt-0.5">Votre abonnement sera activé sous quelques secondes.</p>
          </div>
        </div>
      )}
      {stripeStatus === "cancelled" && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">Paiement annulé. Vous pouvez réessayer à tout moment.</p>
        </div>
      )}
      {stripeError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{stripeError}</p>
        </div>
      )}

      {/* Current subscription */}
      {subscription && (
        <div className="glass-card rounded-2xl p-5 border-l-4 border-teal-500">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center shadow-md shadow-teal-200/50">
                {subscription.payment_provider === "stripe"
                  ? <CreditCard className="w-6 h-6 text-white" />
                  : <Wallet className="w-6 h-6 text-white" />
                }
              </div>
              <div>
                <h3 className="font-bold text-slate-800 capitalize">Plan {subscription.plan}</h3>
                <p className="text-sm text-slate-500">
                  Renouvellement le {format(parseISO(subscription.current_period_end), "d MMMM yyyy")}
                  {" · "}
                  <span className="capitalize">{subscription.payment_provider === "stripe" ? "Stripe" : "Crypto"}</span>
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${subscription.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
              {subscription.status}
            </span>
          </div>
        </div>
      )}

      {/* MetaMask warning (only shown as info, not blocking) */}
      {!hasMetaMask && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">MetaMask non détecté</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Installez l&apos;extension MetaMask pour payer en crypto.{" "}
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                Télécharger MetaMask →
              </a>
              {" "}Vous pouvez toujours payer par carte Stripe.
            </p>
          </div>
        </div>
      )}

      {/* Payment method explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Stripe — Carte bancaire</p>
            <p className="text-xs text-blue-600 mt-0.5">Visa, Mastercard, SEPA · Prix en Euros · Facturation mensuelle automatique</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <div>
            <p className="text-sm font-bold text-violet-900">Crypto — USDC sur Polygon</p>
            <p className="text-xs text-violet-500 mt-0.5">Rapide · Faibles frais · Chain ID : {REQUIRED_CHAIN_ID} ·{" "}
              <a href={`https://polygonscan.com/address/${RECIPIENT}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                Voir le wallet
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.plan;
          const isStripeLoading = stripeLoadingPlan === plan.plan;

          return (
            <div
              key={plan.plan}
              className={`glass-card rounded-2xl flex flex-col relative hover-lift transition-all
                ${plan.popular ? "ring-2 ring-violet-400 shadow-lg shadow-violet-100" : ""}
                ${isCurrentPlan ? "ring-2 ring-teal-400" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Le plus populaire</span>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-3 z-10">
                  <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Actuel</span>
                </div>
              )}

              <div className="p-5 flex flex-col flex-1">
                <h4 className="font-bold text-slate-800 mb-1">{plan.name}</h4>

                {/* Price display */}
                <div className="mb-4">
                  {plan.priceEur === 0 ? (
                    <span className="text-3xl font-bold text-slate-800 stat-number">Gratuit</span>
                  ) : (
                    <div>
                      <div>
                        <span className="text-3xl font-bold text-slate-800 stat-number">{plan.priceEur}€</span>
                        <span className="text-slate-400 text-sm ml-1">/mois</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.priceUsdc} USDC en crypto</p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />{feature}
                    </li>
                  ))}
                </ul>

                {/* CTA buttons */}
                {plan.priceEur === 0 ? (
                  <Button variant="outline" className="w-full rounded-xl border-slate-200 font-semibold" disabled={isCurrentPlan}>
                    {isCurrentPlan ? "Plan actuel" : "Commencer gratuitement"}
                  </Button>
                ) : isCurrentPlan ? (
                  <Button
                    className="w-full rounded-xl font-semibold bg-slate-100 text-slate-400 cursor-default hover:bg-slate-100 shadow-none border-none"
                    disabled
                  >
                    Plan actuel
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {/* Stripe button */}
                    <Button
                      className={`w-full rounded-xl font-semibold border-none shadow-md ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50"
                          : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-100/50"
                      }`}
                      onClick={() => handleStripeCheckout(plan.plan as StripePlan)}
                      disabled={isPending && isStripeLoading}
                    >
                      {isPending && isStripeLoading
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <CreditCard className="w-4 h-4 mr-1.5" />
                      }
                      {isPending && isStripeLoading ? "Redirection..." : `Stripe — ${plan.priceEur}€`}
                      {!(isPending && isStripeLoading) && <ArrowRight className="w-4 h-4 ml-1.5" />}
                    </Button>

                    {/* Crypto button */}
                    <Button
                      variant="outline"
                      className={`w-full rounded-xl font-semibold border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 ${
                        !hasMetaMask ? "opacity-50" : ""
                      }`}
                      onClick={() => setSelectedCryptoPlan(plan)}
                      disabled={!hasMetaMask}
                      title={!hasMetaMask ? "MetaMask requis pour payer en crypto" : undefined}
                    >
                      <Wallet className="w-4 h-4 mr-1.5" />
                      Crypto — {plan.priceUsdc} USDC
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-200/50">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Besoin d&apos;un plan sur mesure ?</h4>
            <p className="text-sm text-slate-500 mt-1">Pour les grands cabinets ou groupes hospitaliers — contactez-nous pour une offre personnalisée.</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-xl border-slate-200 font-semibold text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700">
              <Building2 className="w-4 h-4 mr-2" />Contacter l&apos;équipe Enterprise
            </Button>
          </div>
        </div>
      </div>

      {selectedCryptoPlan && (
        <CryptoPaymentModal plan={selectedCryptoPlan} onClose={() => setSelectedCryptoPlan(null)} />
      )}
    </div>
  );
}
