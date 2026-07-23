"use client";

import { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { sendSupportTicket, getUserPlanForSupport, type SupportPriority } from "@/actions/support";
import {
  HeadphonesIcon, Zap, CheckCircle, Loader2,
  Send, Clock, Shield, BookOpen, MessageSquare, ChevronRight,
  Crown, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PLAN_SLA: Record<string, { label: string; response: string; color: string; badge: string }> = {
  free: {
    label: "Free",
    response: "5-7 jours ouvrés",
    color: "text-muted-foreground",
    badge: "bg-muted border-border text-muted-foreground",
  },
  starter: {
    label: "Starter",
    response: "2-3 jours ouvrés",
    color: "text-blue-600",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-600",
  },
  professional: {
    label: "Professionnel",
    response: "< 24h",
    color: "text-violet-600",
    badge: "bg-violet-500/10 border-violet-500/20 text-violet-600",
  },
  enterprise: {
    label: "Entreprise",
    response: "< 4h (prioritaire)",
    color: "text-emerald-600",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
  },
};

const PRIORITY_OPTIONS: { value: SupportPriority; label: string; desc: string }[] = [
  { value: "low", label: "Faible", desc: "Question générale" },
  { value: "normal", label: "Normal", desc: "Problème mineur" },
  { value: "high", label: "Élevée", desc: "Fonctionnalité bloquée" },
  { value: "urgent", label: "Urgent", desc: "Service inaccessible" },
];

const FAQ_ITEMS = [
  {
    question: "Comment configurer le widget de réservation ?",
    href: "/app/ai-settings",
    icon: MessageSquare,
  },
  {
    question: "Comment inviter un membre de l'équipe ?",
    href: "/app/team",
    icon: Shield,
  },
  {
    question: "Comment mettre à jour mon abonnement ?",
    href: "/app/billing",
    icon: Crown,
  },
  {
    question: "Comment personnaliser mon site web ?",
    href: "/app/website-builder",
    icon: BookOpen,
  },
];

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<SupportPriority>("normal");
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: userContext } = useQuery({
    queryKey: ["support-context"],
    queryFn: getUserPlanForSupport,
  });

  const plan = userContext?.plan ?? "free";
  const isPriority = ["professional", "enterprise"].includes(plan);
  const sla = PLAN_SLA[plan] ?? PLAN_SLA.free;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendSupportTicket({ subject, message, priority });
      if (result.success) {
        setTicketId(result.ticketId ?? null);
        setSubmitted(true);
      } else {
        toast.error(result.error ?? "Erreur lors de l'envoi");
      }
    });
  };

  return (
    <div className="page-container max-w-4xl space-y-8">
      {/* Header */}
      <div className="section-header">
        <div className="icon-container">
          <HeadphonesIcon className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <h2 className="section-title">Support</h2>
          <p className="section-subtitle">Nous sommes là pour vous aider</p>
        </div>
        {/* SLA badge */}
        {userContext && (
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold", sla.badge)}>
            {isPriority && <Zap className="w-3.5 h-3.5" />}
            <Clock className="w-3.5 h-3.5" />
            Réponse : {sla.response}
          </div>
        )}
      </div>

      {/* Priority banner for Pro/Enterprise */}
      {isPriority && (
        <div className="flex items-center gap-3 px-5 py-4 bg-violet-500/8 border border-violet-500/20 rounded-2xl">
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Support prioritaire activé</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan {sla.label} · Temps de réponse garanti : <span className="font-semibold text-violet-600">{sla.response}</span>
            </p>
          </div>
        </div>
      )}

      {/* Dedicated account manager — Enterprise only */}
      {plan === "enterprise" && (
        <div className="flex items-center gap-4 px-5 py-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Gestionnaire de compte dédié</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Votre contact prioritaire pour l&apos;onboarding, la configuration avancée et les questions stratégiques.
            </p>
          </div>
          <a
            href={`mailto:${process.env.NEXT_PUBLIC_ACCOUNT_MANAGER_EMAIL ?? "enterprise@docflow.ai"}`}
            className="flex-shrink-0 text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            Contacter <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Upsell for free/starter */}
      {!isPriority && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-muted/50 border border-border rounded-2xl">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Obtenez un support prioritaire</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Plan Professionnel : réponse en moins de 24h · Entreprise : moins de 4h
              </p>
            </div>
          </div>
          <Link href="/app/billing" className="flex-shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Voir les plans <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: FAQ */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Aide rapide</h3>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item.question}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>

          {/* Response times */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Délais de réponse</p>
            {Object.entries(PLAN_SLA).map(([p, info]) => (
              <div key={p} className="flex items-center justify-between">
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-md border",
                  info.badge
                )}>{info.label}</span>
                <span className="text-xs text-muted-foreground">{info.response}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Ticket form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="card-panel flex flex-col items-center gap-4 py-16 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Ticket envoyé !</h3>
                {ticketId && (
                  <p className="text-sm text-muted-foreground mt-1">Référence : <span className="font-mono font-bold text-primary">{ticketId}</span></p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Nous vous répondrons par email sous <span className="font-semibold">{sla.response}</span>.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); setPriority("normal"); }}
                className="rounded-xl"
              >
                Nouveau ticket
              </Button>
            </div>
          ) : (
            <div className="card-panel">
              <div className="card-panel-header">
                <h3 className="font-bold text-foreground">Ouvrir un ticket</h3>
                {isPriority && (
                  <span className="text-xs font-bold text-violet-600 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                    Prioritaire
                  </span>
                )}
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Sujet</Label>
                  <Input
                    placeholder="Décrivez brièvement votre problème"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>

                {/* Priority selector — only for paid plans */}
                {isPriority && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Priorité</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRIORITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPriority(opt.value)}
                          className={cn(
                            "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all",
                            priority === opt.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className="text-[10px] opacity-70 mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Message</Label>
                  <Textarea
                    placeholder="Décrivez votre problème en détail : étapes pour reproduire, comportement attendu, captures d'écran si possible..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="rounded-xl resize-none"
                  />
                </div>

                {userContext && (
                  <p className="text-xs text-muted-foreground">
                    Envoyé depuis : <span className="font-semibold">{userContext.email}</span> · {userContext.clinicName}
                  </p>
                )}

                <Button type="submit" disabled={isPending} className="w-full btn-primary">
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Envoyer le ticket</>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
