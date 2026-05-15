"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ethers } from "ethers";
import { createStripeCheckoutSession, type StripePlan } from "@/actions/stripe-checkout";
import { sendEnterpriseContactRequest, type EnterpriseContactData } from "@/actions/enterprise-contact";
import { getClinicQuotaUsage, type QuotaUsage } from "@/actions/quota";
import {
  CheckCircle, Zap, Building2, ArrowRight, Copy, Check,
  ExternalLink, AlertCircle, X, Wallet, ShieldCheck,
  Loader2, RefreshCw, AlertTriangle, CreditCard, Send,
  Users, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { useTranslations } from "next-intl";

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
    nameKey: "plans.free",
    priceEur: 0,
    priceUsdc: 0,
    featureKeys: ["features.50appointments", "features.aiBooking", "features.basicCalendar", "features.1staff"],
    plan: "free" as const,
  },
  {
    nameKey: "plans.starter",
    priceEur: Number(process.env.NEXT_PUBLIC_PLAN_STARTER_PRICE_EUR || 45),
    priceUsdc: Number(process.env.NEXT_PUBLIC_PLAN_STARTER_PRICE || 49),
    featureKeys: ["features.200appointments", "features.allFreeFeatures", "features.fullCalendar", "features.patientCRM", "features.3staff"],
    plan: "starter" as StripePlan,
  },
  {
    nameKey: "plans.professional",
    priceEur: Number(process.env.NEXT_PUBLIC_PLAN_PROFESSIONAL_PRICE_EUR || 89),
    priceUsdc: Number(process.env.NEXT_PUBLIC_PLAN_PROFESSIONAL_PRICE || 99),
    featureKeys: ["features.unlimitedAppointments", "features.allStarterFeatures", "features.advancedAnalytics", "features.customAI", "features.10staff", "features.prioritySupport"],
    plan: "professional" as StripePlan,
    popular: true,
  },
  {
    nameKey: "plans.enterprise",
    priceEur: Number(process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE_EUR || 269),
    priceUsdc: Number(process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE || 299),
    featureKeys: ["features.multipleClinics", "features.allProFeatures", "features.customIntegrations", "features.dedicatedManager"],
    plan: "enterprise" as StripePlan,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchClinicId(): Promise<string | null> {
  const supabase = createClient() as ReturnType<typeof createClient>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await (supabase as unknown as { from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { single: () => Promise<{ data: { clinic_id: string } | null }> } } } }).from("users").select("clinic_id").eq("id", user.id).single();
  return data?.clinic_id ?? null;
}

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
  const t = useTranslations('billing');
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? t('copied') : t('copy')}
    </button>
  );
}

// ── Crypto Payment Modal (unchanged logic) ────────────────────────────────────
type TxStep = "idle" | "connecting" | "switching" | "approving" | "sending" | "success" | "error";

interface CryptoPaymentModalProps {
  plan: typeof PLANS[0];
  clinicId: string;
  onClose: () => void;
}

function CryptoPaymentModal({ plan, clinicId, onClose }: CryptoPaymentModalProps) {
  const t = useTranslations('billing');
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
      setError("MetaMask not found. Please install it from metamask.io");
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
      const message = e instanceof Error ? e.message : "Connection refused";
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
          const message = addErr instanceof Error ? addErr.message : "Could not add Polygon network";
          setError(message);
          setStep("error");
          return;
        }
      } else {
        const message = e instanceof Error ? e.message : "Network switch failed";
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
      const hash = receipt.hash;
      setTxHash(hash);

      // Verify on-chain and activate subscription in DB
      const verifyRes = await fetch("/api/webhooks/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: hash,
          plan: plan.plan,
          clinicId,
          expectedAmountUsdc: plan.priceUsdc,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Vérification échouée. Contactez le support avec votre txHash.");
      }

      setStep("success");
    } catch (e: unknown) {
      const rawMessage = (e as { reason?: string; message?: string })?.reason ?? (e instanceof Error ? e.message : "Transaction failed");
      setError(rawMessage.length > 120 ? rawMessage.slice(0, 120) + "..." : rawMessage);
      setStep("error");
    }
  };

  const isLoading = ["connecting", "switching", "approving", "sending"].includes(step);
  const hasInsufficientBalance = usdcBalance !== null && Number(usdcBalance) < plan.priceUsdc;

  const stepLabel: Record<TxStep, string> = {
    idle: "",
    connecting: t('connectingWallet'),
    switching: t('switchingToPolygon'),
    approving: t('waitingApproval'),
    sending: t('sendingTx'),
    success: "",
    error: "",
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-none w-full max-w-md">

        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{t(plan.nameKey)} — Crypto</h3>
              <p className="text-sm text-muted-foreground">{plan.priceUsdc} USDC/mo</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 hover:bg-muted rounded-xl transition-colors disabled:opacity-40">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === "success" ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-lg">{t('paymentSent')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t('paymentSentDesc', { plan: t(plan.nameKey) })}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl border border-border text-left space-y-1">
                <p className="text-xs text-muted-foreground">{t('txHash')}</p>
                <p className="text-xs font-mono text-foreground break-all">{txHash}</p>
                <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-3 h-3" /> {t('viewOnPolygonscan')}
                </a>
              </div>
              <Button className="w-full" onClick={onClose}>{t('close')}</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <span className="text-foreground text-xs font-medium">P</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('polygonNetwork')}</p>
                    <p className="text-xs text-muted-foreground">Chain ID: {REQUIRED_CHAIN_ID}</p>
                  </div>
                </div>
                {walletAddress && (
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${isCorrectChain ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isCorrectChain ? `✓ ${t('connected')}` : t('wrongNetwork')}
                  </div>
                )}
              </div>

              <div className="text-center py-3 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">{t('amountToPay')}</p>
                <p className="text-4xl font-medium text-foreground">{plan.priceUsdc} <span className="text-lg text-muted-foreground">USDC</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">≈ {plan.priceEur}€ · {t('monthly')}</p>
              </div>

              {walletAddress ? (
                <div className="p-3 bg-muted/50 rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{t('connectedWallet')}</p>
                    <CopyButton text={walletAddress} />
                  </div>
                  <p className="text-sm font-mono text-foreground">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
                  {usdcBalance !== null && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{t('usdcBalance')}</p>
                      <p className={`text-sm font-medium ${hasInsufficientBalance ? "text-destructive" : "text-primary"}`}>
                        {Number(usdcBalance).toFixed(2)} USDC
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-muted/50 rounded-xl border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground">{t('noWalletConnected')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('clickToConnect')}</p>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  <p className="text-sm text-primary">{stepLabel[step]}</p>
                </div>
              )}

              {step === "error" && error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              {hasInsufficientBalance && isCorrectChain && (
                <div className="flex items-start gap-2 p-3 bg-muted rounded-xl border border-border">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {t('insufficientBalance', { needed: plan.priceUsdc.toString(), balance: Number(usdcBalance).toFixed(2) })}
                    {' '}{t('getUsdc')} <a href="https://app.uniswap.org" target="_blank" rel="noopener noreferrer" className="underline font-medium">Uniswap</a>.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-1">
                {!walletAddress ? (
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11" onClick={connectWallet} disabled={isLoading}>
                    <Wallet className="w-4 h-4 mr-2" />{t('connectMetaMask')}
                  </Button>
                ) : !isCorrectChain ? (
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 h-11" onClick={switchToPolygon} disabled={isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />{t('switchToPolygon')}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                    onClick={sendPayment}
                    disabled={isLoading || hasInsufficientBalance}
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <ShieldCheck className="w-4 h-4 mr-2" />}
                    {isLoading ? stepLabel[step] : `Pay ${plan.priceUsdc} USDC`}
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={onClose} disabled={isLoading}>
                  {t('cancel')}
                </Button>
              </div>

              <div className="pt-1 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">{t('sendingTo')}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-muted-foreground">{RECIPIENT.slice(0, 10)}...{RECIPIENT.slice(-8)}</p>
                  <div className="flex items-center gap-2">
                    <CopyButton text={RECIPIENT} />
                    <a href={`https://polygonscan.com/address/${RECIPIENT}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-0.5 hover:underline">
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

// ── Quota Bar ─────────────────────────────────────────────────────────────────
function QuotaBar({ current, limit, label, icon: Icon }: {
  current: number;
  limit: number | null;
  label: string;
  icon: React.ElementType;
}) {
  const t = useTranslations('billing');
  if (limit === null) {
    return (
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-xs font-bold text-primary">{t('unlimited')}</span>
          </div>
          <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.min((current / limit) * 100, 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 100;

  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`text-xs font-bold ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-foreground"}`}>
            {current} / {limit}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Enterprise Contact Modal ───────────────────────────────────────────────────
function EnterpriseContactModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('billing');
  const [isPendingSubmit, startSubmitTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnterpriseContactData>({
    organizationName: "",
    contactName: "",
    contactRole: "",
    email: "",
    phone: "",
    numberOfDoctors: "",
    message: "",
  });

  const handleChange = (field: keyof EnterpriseContactData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    startSubmitTransition(async () => {
      const result = await sendEnterpriseContactRequest(formData);
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError(result.error ?? t('failedToSave') as string);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">{t('enterprisePlanTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('enterpriseResponseTime')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-xl font-bold text-foreground">{t('messageSent')}</h4>
            <p className="text-muted-foreground text-sm">
              {t('teamWillContact')} <strong>{formData.email}</strong>.
            </p>
            <Button onClick={onClose} className="btn-primary mt-4">{t('closeBtn')}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t('enterpriseFormOrganization')}</Label>
                <Input
                  required
                  placeholder={t('enterpriseFormOrgPlaceholder')}
                  value={formData.organizationName}
                  onChange={handleChange("organizationName")}
                  className="rounded-xl border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t('enterpriseFormDoctorCount')}</Label>
                <select
                  required
                  value={formData.numberOfDoctors}
                  onChange={handleChange("numberOfDoctors")}
                  className="w-full h-10 px-3 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('enterpriseFormDoctorCountPlaceholder')}</option>
                  <option value="11-25">11 – 25</option>
                  <option value="26-50">26 – 50</option>
                  <option value="51-100">51 – 100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t('enterpriseFormYourName')}</Label>
                <Input
                  required
                  placeholder={t('enterpriseFormNamePlaceholder')}
                  value={formData.contactName}
                  onChange={handleChange("contactName")}
                  className="rounded-xl border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t('enterpriseFormRole')}</Label>
                <Input
                  placeholder={t('enterpriseFormRolePlaceholder')}
                  value={formData.contactRole}
                  onChange={handleChange("contactRole")}
                  className="rounded-xl border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t('enterpriseFormProfessionalEmail')}</Label>
                <Input
                  required
                  type="email"
                  placeholder={t('enterpriseFormEmailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange("email")}
                  className="rounded-xl border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t('enterpriseFormPhone')}</Label>
                <Input
                  placeholder={t('enterpriseFormPhonePlaceholder')}
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  className="rounded-xl border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">{t('enterpriseFormNeed')}</Label>
              <Textarea
                rows={3}
                placeholder={t('enterpriseFormNeedPlaceholder')}
                value={formData.message}
                onChange={handleChange("message")}
                className="rounded-xl border-border resize-none"
              />
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl border-border">
                {t('enterpriseFormCancel')}
              </Button>
              <Button type="submit" disabled={isPendingSubmit} className="flex-1 btn-primary">
                {isPendingSubmit ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('enterpriseFormSending')}</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />{t('enterpriseFormSend')}</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const t = useTranslations('billing');
  const [selectedCryptoPlan, setSelectedCryptoPlan] = useState<typeof PLANS[0] | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [stripeLoadingPlan, setStripeLoadingPlan] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setHasMetaMask(typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum);
    const params = new URLSearchParams(window.location.search);
    setStripeStatus(params.get("stripe"));
  }, []);

  const { data: subscription } = useQuery({ queryKey: ["subscription"], queryFn: fetchSubscription });
  const { data: clinicId } = useQuery({ queryKey: ["clinicId"], queryFn: fetchClinicId });
  const { data: quotaUsage } = useQuery<QuotaUsage | null>({ queryKey: ["quotaUsage"], queryFn: getClinicQuotaUsage });

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
    <div className="page-container max-w-5xl">

      {/* Header */}
      <div className="section-header">
        <div className="icon-container">
          <Wallet className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="section-title">{t('title')}</h2>
          <p className="section-subtitle">{t('subtitle')}</p>
        </div>
      </div>

      {/* Stripe success / cancel banners */}
      {stripeStatus === "success" && (
        <div className="flex items-center gap-3 p-4 status-confirmed rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{t('stripeSuccess')}</p>
            <p className="text-xs opacity-80 mt-0.5">{t('stripeSuccessDesc')}</p>
          </div>
        </div>
      )}
      {stripeStatus === "cancelled" && (
        <div className="flex items-center gap-3 p-4 status-no_show rounded-xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{t('stripeCancelled')}</p>
        </div>
      )}
      {stripeError && (
        <div className="flex items-start gap-3 p-4 status-cancelled rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{stripeError}</p>
        </div>
      )}

      {/* Current subscription + quota */}
      {subscription && (() => {
        const expiry = parseISO(subscription.current_period_end);
        const isExpired = isPast(expiry);
        const daysLeft = differenceInDays(expiry, new Date());
        const isExpiringSoon = !isExpired && daysLeft <= 7;
        const isFree = subscription.plan === "free";

        return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">

          {/* Expiry warning banner — shown above the card when critical */}
          {!isFree && (isExpired || isExpiringSoon) && (
            <div className={`flex items-center gap-3 px-5 py-3 border-b ${
              isExpired
                ? "bg-red-500/10 border-red-500/30 text-red-500"
                : "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-400"
            }`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-semibold flex-1">
                {isExpired
                  ? t('subscriptionExpired')
                  : daysLeft === 0
                    ? t('subscriptionExpiresToday')
                    : t('subscriptionExpiresSoon', { days: daysLeft, plural: daysLeft > 1 ? 's' : '' })}
              </p>
              <span className="text-xs font-medium opacity-70 whitespace-nowrap">
                {format(expiry, "d MMM yyyy")}
              </span>
            </div>
          )}

          <div className="p-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                {subscription.payment_provider === "stripe"
                  ? <CreditCard className="w-6 h-6 text-primary" />
                  : <Wallet className="w-6 h-6 text-primary" />
                }
              </div>
              <div>
                <h3 className="font-semibold text-foreground capitalize">Plan {subscription.plan}</h3>
                <p className="text-sm text-muted-foreground">
                  {isFree
                    ? t('freePlanDesc')
                    : isExpired
                      ? <span className="text-red-500 font-medium">{t('expiredDate', { date: format(expiry, "d MMMM yyyy") })}</span>
                      : <>{t('renewsOn')} {format(expiry, "d MMMM yyyy")} · <span className="capitalize">{subscription.payment_provider === "stripe" ? "Stripe" : "Crypto"}</span></>
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Days remaining pill */}
              {!isFree && !isExpired && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  isExpiringSoon
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                    : "bg-primary/8 border-primary/20 text-primary"
                }`}>
                  {t('daysRemaining', { days: daysLeft })}
                </span>
              )}
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border capitalize ${
                isExpired ? "status-cancelled" : subscription.status === "active" ? "status-confirmed" : "status-cancelled"
              }`}>
                {isExpired ? t('expired') : subscription.status}
              </span>
            </div>
          </div>

          {quotaUsage && (() => {
            const apptFull = quotaUsage.appointments.limit !== null && quotaUsage.appointments.current >= quotaUsage.appointments.limit;
            const staffFull = quotaUsage.staff.limit !== null && quotaUsage.staff.current >= quotaUsage.staff.limit;
            const apptWarn = quotaUsage.appointments.limit !== null && !apptFull && (quotaUsage.appointments.current / quotaUsage.appointments.limit) >= 0.8;
            return (
              <div className="border-t border-border">
                {(apptFull || staffFull) && (
                  <div className="px-5 pt-4">
                    <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <p className="text-sm font-bold text-red-500">{t('limitReachedTitle')}</p>
                        <p className="text-xs mt-0.5 text-red-400">
                          {apptFull && t('apptLimitReachedDesc')}
                          {staffFull && t('staffLimitReachedDesc')}
                          {t('upgradeToContinue')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {apptWarn && !apptFull && (
                  <div className="px-5 pt-4">
                    <div className="flex items-center gap-2.5 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs font-semibold">
                        {t('apptLimitApproachingDesc', { current: quotaUsage.appointments.current, limit: quotaUsage.appointments.limit ?? '∞' })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="px-5 py-4 bg-muted/20 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('usageThisMonth')}</p>
                  <QuotaBar
                    current={quotaUsage.appointments.current}
                    limit={quotaUsage.appointments.limit}
                    label={t('appointmentsLabel')}
                    icon={Calendar}
                  />
                  <QuotaBar
                    current={quotaUsage.staff.current}
                    limit={quotaUsage.staff.limit}
                    label={t('staffAccountsLabel')}
                    icon={Users}
                  />
                </div>
              </div>
            );
          })()}
        </div>
        );
      })()}

      {/* MetaMask warning (only shown as info, not blocking) */}
      {!hasMetaMask && (
        <div className="flex items-start gap-3 p-4 bg-muted rounded-xl border border-border">
          <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{t('metamaskNotDetected')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('metamaskInstall')}{" "}
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                {t('metamaskDownload')}
              </a>
              {" "}{t('canStillPayStripe')}
            </p>
          </div>
        </div>
      )}

      {/* Payment method explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('payWithStripe')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('stripeCardDesc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-600 text-xs font-bold">P</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('payWithCrypto')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('cryptoFastLowFees')} · Chain ID: {REQUIRED_CHAIN_ID} ·{" "}
              <a href={`https://polygonscan.com/address/${RECIPIENT}`} target="_blank" rel="noopener noreferrer" className="underline font-medium text-primary hover:text-primary/80">
                {t('viewWallet')}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.plan;
          const isStripeLoading = stripeLoadingPlan === plan.plan;

          return (
            <div
              key={plan.plan}
              className={`relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                ${plan.popular
                  ? "border-primary/50 bg-gradient-to-b from-primary/[0.06] to-background shadow-lg shadow-primary/10"
                  : "border-border bg-background hover:border-primary/20"
                }
                ${isCurrentPlan && plan.popular ? "ring-2 ring-emerald-500/40" : isCurrentPlan ? "ring-2 ring-emerald-500/30" : ""}`}
            >
              {/* "Le plus populaire" — full-width top strip */}
              {plan.popular && (
                <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-1.5 flex items-center justify-center gap-1.5">
                  <Zap className="w-3 h-3 text-white fill-white" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                    {t('mostPopular')}
                  </span>
                </div>
              )}

              {/* "Plan actuel" badge — inside card, only when current */}
              <div className={`flex items-center px-5 min-h-[36px] ${plan.popular ? "pt-3 pb-0" : "pt-5 pb-0"}`}>
                {isCurrentPlan ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3 fill-emerald-500/20" />
                    {t('currentPlanBadge')}
                  </span>
                ) : <span />}
              </div>

              <div className="p-5 pt-3 flex flex-col flex-1">
                {/* Plan name */}
                <h4 className="text-lg font-semibold text-foreground tracking-tight">{t(plan.nameKey)}</h4>

                {/* Price */}
                <div className="mt-3 mb-5">
                  {plan.priceEur === 0 ? (
                    <div>
                      <span className="text-4xl font-bold text-foreground tracking-tight">{t('free')}</span>
                      <p className="text-xs text-muted-foreground mt-1">{t('startFree')}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground tracking-tight">{plan.priceEur}€</span>
                        <span className="text-muted-foreground text-sm font-medium">{t('perMonth')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.priceUsdc} USDC crypto</p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-5" />

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.featureKeys.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-2.5 text-sm text-foreground/80">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{t(featureKey)}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA buttons */}
                <div className="space-y-2.5 mt-auto">
                  {plan.priceEur === 0 ? (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl border-border font-semibold text-sm hover:bg-muted/80 transition-colors"
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? t('currentPlanBadge') : t('startFree')}
                    </Button>
                  ) : isCurrentPlan ? (
                    <Button
                      className="w-full h-11 rounded-xl font-semibold text-sm bg-muted text-muted-foreground cursor-default hover:bg-muted border-none shadow-none"
                      disabled
                    >
                      {t('currentPlanBadge')}
                    </Button>
                  ) : (
                    <>
                      {/* Stripe button */}
                      <Button
                        className={`w-full h-11 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 ${
                          plan.popular
                            ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20 hover:shadow-md hover:shadow-primary/30"
                            : "bg-card text-foreground border border-border hover:bg-muted"
                        }`}
                        onClick={() => handleStripeCheckout(plan.plan as StripePlan)}
                        disabled={isPending && isStripeLoading}
                      >
                        {isPending && isStripeLoading
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <CreditCard className="w-4 h-4 mr-2" />
                        }
                        {isPending && isStripeLoading ? t('redirecting') : `Stripe — ${plan.priceEur}€`}
                        {!(isPending && isStripeLoading) && <ArrowRight className="w-4 h-4 ml-auto" />}
                      </Button>

                      {/* Crypto button */}
                      <Button
                        variant="outline"
                        className={`w-full h-10 rounded-xl font-medium text-sm border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-200 ${
                          !hasMetaMask ? "opacity-40 cursor-not-allowed" : ""
                        }`}
                        onClick={() => setSelectedCryptoPlan(plan)}
                        disabled={!hasMetaMask}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Crypto — {plan.priceUsdc} USDC
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground">{t('customPlan')}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">{t('customPlanDescription')}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowEnterpriseModal(true)}
            className="rounded-xl border-primary/30 font-semibold text-primary hover:bg-primary hover:text-white transition-all duration-200 px-6"
          >
            <Building2 className="w-4 h-4 mr-2" />{t('contactEnterprise')}
          </Button>
        </div>
      </div>

      {selectedCryptoPlan && (
        <CryptoPaymentModal plan={selectedCryptoPlan} clinicId={clinicId ?? ""} onClose={() => setSelectedCryptoPlan(null)} />
      )}

      {showEnterpriseModal && (
        <EnterpriseContactModal onClose={() => setShowEnterpriseModal(false)} />
      )}
    </div>
  );
}
