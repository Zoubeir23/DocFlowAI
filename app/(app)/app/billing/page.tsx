"use client";

import { useState, useEffect, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { createStripeCheckoutSession, type StripePlan } from "@/actions/stripe-checkout";
import { getClinicQuotaUsage, type QuotaUsage } from "@/actions/quota";
import { CryptoPaymentModal, type CryptoPlan } from "@/components/billing/crypto-payment-modal";
import { EnterpriseContactModal } from "@/components/billing/enterprise-contact-modal";
import { QuotaBar } from "@/components/billing/quota-bar";
import {
  CheckCircle, Zap, Building2, ArrowRight,
  ExternalLink, AlertCircle, Wallet,
  Loader2, AlertTriangle, CreditCard,
  Users, Calendar, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { useTranslations } from "next-intl";

// Traduit un statut brut de subscriptions.status (snake_case côté DB pour
// past_due) vers la clé camelCase de billing.planStatus.
const PLAN_STATUS_KEYS: Record<string, string> = {
  active: "active",
  trialing: "trialing",
  inactive: "inactive",
  cancelled: "cancelled",
  past_due: "pastDue",
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

// ── Data fetchers ─────────────────────────────────────────────────────────────
async function fetchSubscription() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: userData } = await db.from("users").select("clinic_id").eq("id", user.id).maybeSingle();
  if (!userData) return null;
  const { data } = await db.from("subscriptions").select("*").eq("clinic_id", userData.clinic_id).maybeSingle();
  return data as {
    plan: string;
    status: string;
    current_period_end: string;
    payment_provider: string;
  } | null;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const t = useTranslations("billing");
  const queryClient = useQueryClient();
  const [planChangedMessage, setPlanChangedMessage] = useState<string | null>(null);
  const [selectedCryptoPlan, setSelectedCryptoPlan] = useState<CryptoPlan | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [stripeLoadingPlan, setStripeLoadingPlan] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const REQUIRED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CRYPTO_CHAIN_ID || 137);
  const RECIPIENT = process.env.NEXT_PUBLIC_CRYPTO_WALLET_ADDRESS!;

  useEffect(() => {
    setHasMetaMask(typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum);
    const params = new URLSearchParams(window.location.search);
    setStripeStatus(params.get("stripe"));
  }, []);

  // Plafonne le polling déclenché par un retour "success" : au bout de 15s
  // le webhook a largement eu le temps d'arriver, inutile de continuer.
  useEffect(() => {
    if (stripeStatus !== "success") return;
    const timer = setTimeout(() => setStripeStatus(null), 15000);
    return () => clearTimeout(timer);
  }, [stripeStatus]);

  // Stripe redirige vers success_url avant l'arrivée du webhook
  // checkout.session.completed qui met réellement à jour la subscription :
  // on poll brièvement tant que le retour est "success" pour éviter d'afficher
  // un bandeau de succès à côté d'un plan encore périmé.
  const { data: subscription, isSuccess: subscriptionLoaded } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    refetchInterval: stripeStatus === "success" ? 2000 : false,
  });
  const { data: quotaUsage } = useQuery<QuotaUsage | null>({ queryKey: ["quotaUsage"], queryFn: getClinicQuotaUsage });

  const effectivePlan = subscriptionLoaded
    ? (subscription?.plan ?? "free")
    : null;

  const handleStripeCheckout = (plan: StripePlan) => {
    setStripeError(null);
    setPlanChangedMessage(null);
    setStripeLoadingPlan(plan);
    startTransition(async () => {
      const result = await createStripeCheckoutSession(plan);
      setStripeLoadingPlan(null);
      if (result.error) {
        setStripeError(result.error);
        return;
      }
      if (result.updatedDirectly) {
        setPlanChangedMessage(t("planChangedSuccess"));
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
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
          <h2 className="section-title">{t("title")}</h2>
          <p className="section-subtitle">{t("subtitle")}</p>
        </div>
      </div>

      {/* Stripe status banners */}
      {stripeStatus === "success" && (
        <div className="flex items-center gap-3 p-4 status-confirmed rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{t("stripeSuccess")}</p>
            <p className="text-xs opacity-80 mt-0.5">{t("stripeSuccessDesc")}</p>
          </div>
        </div>
      )}
      {stripeStatus === "cancelled" && (
        <div className="flex items-center gap-3 p-4 status-no_show rounded-xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{t("stripeCancelled")}</p>
        </div>
      )}
      {stripeError && (
        <div className="flex items-start gap-3 p-4 status-cancelled rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{stripeError}</p>
        </div>
      )}
      {planChangedMessage && (
        <div className="flex items-center gap-3 p-4 status-confirmed rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{planChangedMessage}</p>
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
            {!isFree && (isExpired || isExpiringSoon) && (
              <div className={`flex items-center gap-3 px-5 py-3 border-b ${
                isExpired
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-400"
              }`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-semibold flex-1">
                  {isExpired
                    ? t("subscriptionExpired")
                    : daysLeft === 0
                      ? t("subscriptionExpiresToday")
                      : t("subscriptionExpiresSoon", { days: daysLeft, plural: daysLeft > 1 ? "s" : "" })}
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
                      ? t("freePlanDesc")
                      : isExpired
                        ? <span className="text-red-500 font-medium">{t("expiredDate", { date: format(expiry, "d MMMM yyyy") })}</span>
                        : <>{t("renewsOn")} {format(expiry, "d MMMM yyyy")} · <span className="capitalize">{subscription.payment_provider === "stripe" ? "Stripe" : "Crypto"}</span></>
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isFree && !isExpired && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isExpiringSoon
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                      : "bg-primary/8 border-primary/20 text-primary"
                  }`}>
                    {t("daysRemaining", { days: daysLeft })}
                  </span>
                )}
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border capitalize ${
                  isExpired
                    ? "status-cancelled"
                    : subscription.status === "active" || subscription.status === "trialing"
                      ? "status-confirmed"
                      : "status-cancelled"
                }`}>
                  {isExpired ? t("expired") : PLAN_STATUS_KEYS[subscription.status] ? t(`planStatus.${PLAN_STATUS_KEYS[subscription.status]}`) : subscription.status}
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
                          <p className="text-sm font-bold text-red-500">{t("limitReachedTitle")}</p>
                          <p className="text-xs mt-0.5 text-red-400">
                            {apptFull && t("apptLimitReachedDesc")}
                            {staffFull && t("staffLimitReachedDesc")}
                            {t("upgradeToContinue")}
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
                          {t("apptLimitApproachingDesc", { current: quotaUsage.appointments.current, limit: quotaUsage.appointments.limit ?? "∞" })}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="px-5 py-4 bg-muted/20 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("usageThisMonth")}</p>
                    <QuotaBar current={quotaUsage.appointments.current} limit={quotaUsage.appointments.limit} label={t("appointmentsLabel")} icon={Calendar} />
                    <QuotaBar current={quotaUsage.staff.current} limit={quotaUsage.staff.limit} label={t("staffAccountsLabel")} icon={Users} />
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* MetaMask info */}
      {!hasMetaMask && (
        <div className="flex items-start gap-3 p-4 bg-muted rounded-xl border border-border">
          <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{t("metamaskNotDetected")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("metamaskInstall")}{" "}
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                {t("metamaskDownload")}
              </a>
              {" "}{t("canStillPayStripe")}
            </p>
          </div>
        </div>
      )}

      {/* Payment method info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("payWithStripe")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("stripeCardDesc")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-600 text-xs font-bold">P</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("payWithCrypto")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("cryptoFastLowFees")} · Chain ID: {REQUIRED_CHAIN_ID} ·{" "}
              <a href={`https://polygonscan.com/address/${RECIPIENT}`} target="_blank" rel="noopener noreferrer" className="underline font-medium text-primary hover:text-primary/80">
                <ExternalLink className="w-3 h-3 inline mr-0.5" />{t("viewWallet")}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const isCurrentPlan = effectivePlan === plan.plan;
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
              {/* "Le plus populaire" strip */}
              {plan.popular && (
                <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-1.5 flex items-center justify-center gap-1.5">
                  <Zap className="w-3 h-3 text-white fill-white" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white">
                    {t("mostPopular")}
                  </span>
                </div>
              )}

              {/* "Plan actuel" badge */}
              <div className={`flex items-center px-5 min-h-[36px] ${plan.popular ? "pt-3 pb-0" : "pt-5 pb-0"}`}>
                {isCurrentPlan ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3 fill-emerald-500/20" />
                    {t("currentPlanBadge")}
                  </span>
                ) : <span />}
              </div>

              <div className="p-5 pt-3 flex flex-col flex-1">
                <h4 className="text-lg font-semibold text-foreground tracking-tight">{t(plan.nameKey)}</h4>

                <div className="mt-3 mb-5">
                  {plan.priceEur === 0 ? (
                    <div>
                      <span className="text-4xl font-bold text-foreground tracking-tight">{t("free")}</span>
                      <p className="text-xs text-muted-foreground mt-1">{t("startFree")}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground tracking-tight">{plan.priceEur}€</span>
                        <span className="text-muted-foreground text-sm font-medium">{t("perMonth")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.priceUsdc} USDC crypto</p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border mb-5" />

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
                    // Free plan — disabled if already on free or on a paid plan
                    (() => {
                      const isOnPaidPlan = !!effectivePlan && effectivePlan !== "free";
                      const isDisabled = isCurrentPlan || isOnPaidPlan;
                      return (
                        <Button
                          className={`w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            isDisabled
                              ? "bg-muted text-muted-foreground cursor-default hover:bg-muted border border-border shadow-none overflow-hidden"
                              : "bg-gradient-to-r from-primary/90 to-primary text-white hover:from-primary hover:to-primary/90 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 border-none"
                          }`}
                          disabled={isDisabled}
                        >
                          {isCurrentPlan ? (
                            t("currentPlanBadge")
                          ) : isOnPaidPlan ? (
                            <><CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-500 flex-shrink-0" /><span className="truncate text-xs">Inclus dans votre plan</span></>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {t("startFree")}
                              <ArrowRight className="w-4 h-4 ml-auto" />
                            </>
                          )}
                        </Button>
                      );
                    })()
                  ) : isCurrentPlan ? (
                    // Paid plan — currently active
                    <Button
                      className="w-full h-11 rounded-xl font-semibold text-sm bg-muted text-muted-foreground cursor-default hover:bg-muted border-none shadow-none"
                      disabled
                    >
                      {t("currentPlanBadge")}
                    </Button>
                  ) : (
                    // Paid plan — not active, show upgrade buttons
                    <>
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
                        {isPending && isStripeLoading ? t("redirecting") : `Stripe — ${plan.priceEur}€`}
                        {!(isPending && isStripeLoading) && <ArrowRight className="w-4 h-4 ml-auto" />}
                      </Button>

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
            <h4 className="font-semibold text-foreground">{t("customPlan")}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">{t("customPlanDescription")}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowEnterpriseModal(true)}
            className="rounded-xl border-primary/30 font-semibold text-primary hover:bg-primary hover:text-white transition-all duration-200 px-6"
          >
            <Building2 className="w-4 h-4 mr-2" />{t("contactEnterprise")}
          </Button>
        </div>
      </div>

      {selectedCryptoPlan && (
        <CryptoPaymentModal plan={selectedCryptoPlan} onClose={() => setSelectedCryptoPlan(null)} />
      )}

      {showEnterpriseModal && (
        <EnterpriseContactModal onClose={() => setShowEnterpriseModal(false)} />
      )}
    </div>
  );
}
