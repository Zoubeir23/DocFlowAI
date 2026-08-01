import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { headers } from "next/headers";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { AnnouncementBar } from "@/components/landing/announcement-bar";
import { TechStackBand } from "@/components/landing/tech-stack-band";
import { FeaturesSection } from "@/components/landing/features-section";
import { MedicalRecordSection } from "@/components/landing/medical-record-section";
import { EmbedWidgetSection } from "@/components/landing/embed-widget-section";
import { PricingPreviewSection } from "@/components/landing/pricing-preview-section";
import { SecuritySection } from "@/components/landing/security-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata = {
  title: "Gestion Cabinet Médical par IA — Gratuit · DocFlow IA",
  description:
    "Automatisez la prise de rendez-vous médicaux avec l'IA. Agenda intelligent, dossier patient ICD-11, téléconsultation, site vitrine et widget intégrable. Plan gratuit — sans carte bancaire.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia",
    languages: {
      fr: process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia",
      en: process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia",
    },
  },
  openGraph: {
    title: "Gestion Cabinet Médical par IA — DocFlow IA",
    description:
      "Automatisez la prise de rendez-vous médicaux 24h/24 avec l'IA. Plan gratuit, sans carte bancaire.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "DocFlow IA — Logiciel gestion cabinet médical avec IA" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Gestion Cabinet Médical par IA — DocFlow IA",
    description: "Automatisez la prise de rendez-vous médicaux 24h/24 avec l'IA. Plan gratuit.",
    images: ["/og-image.jpg"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocFlow IA",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Logiciel de gestion de clinique avec intelligence artificielle. Automatisation de la prise de rendez-vous, gestion des dossiers patients et agenda intelligent pour médecins et cabinets médicaux.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Plan gratuit disponible",
  },
  featureList: [
    "Prise de rendez-vous automatique 24h/24",
    "Assistant IA pour la gestion de cabinet",
    "Agenda médical intelligent",
    "Dossiers patients numériques",
    "Codage diagnostic WHO ICD-11 et contrôle d'interactions OpenFDA",
    "Téléconsultation vidéo sécurisée",
    "Site vitrine no-code et widget de réservation intégrable",
    "Paiements Stripe et USDC, serveur MCP et API REST publique",
    "Notifications SMS et email",
    "Conformité HIPAA",
  ],
};

export default async function HomePage() {
  const t = await getTranslations("landing");

  const isLoggedIn = (await headers()).get('x-user-authenticated') === 'true';

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30 selection:text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      
      {/* ── HEADER (annonce + navigation) ────────────────────────────────── */}
      <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <nav className="bg-background/80 backdrop-blur-xl border-b border-border transition-all">
        <div className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          <Link href="/" className="flex items-center group">
            <div className="group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="DocFlow IA" width={140} height={36} className="object-contain dark:brightness-0 dark:invert" priority />
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            <Link href="#features" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.features")}</Link>
            <Link href="#medical-record" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.medicalRecord")}</Link>
            <Link href="#widget" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.widget")}</Link>
            <Link href="#pricing" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
            <Link href="#security" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.security")}</Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {isLoggedIn ? (
              <Link href="/app/dashboard">
                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <button className="text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-2">
                    {t("nav.signIn")}
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                    {t("nav.startFreeTrial")}
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main>
      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-32 overflow-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold tracking-wide uppercase mb-8">
                <Sparkles className="w-4 h-4" />
                <span>Next-Gen Medical OS</span>
              </div>
              
              <h1 className="text-5xl lg:text-[72px] font-cormorant font-medium leading-[1.1] mb-6 text-foreground">
                {t("hero.titlePart1")} <br/>
                <span className="text-primary italic pr-2">
                  {t("hero.titleHighlight")}
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t("hero.subtitle")} {t("hero.titlePart2")}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {isLoggedIn ? (
                  <Link href="/app/dashboard">
                    <button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-full text-base font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-105">
                      <LayoutDashboard className="w-5 h-5" />
                      Voir mon tableau de bord
                    </button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-full text-base font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-105">
                      {t("hero.ctaPrimary")} <ArrowRight className="w-5 h-5" />
                    </button>
                  </Link>
                )}
                <Link href="#how-it-works">
                  <button className="w-full sm:w-auto bg-transparent border-2 border-border hover:border-primary/50 hover:bg-primary/5 text-foreground px-8 py-4 rounded-full text-base font-bold transition-all">
                    Découvrir comment
                  </button>
                </Link>
              </div>
              
              {/* Trust badges */}
              <div className="mt-12 pt-8 border-t border-border flex flex-wrap justify-center lg:justify-start items-center gap-8 opacity-70">
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider"><CheckCircle2 className="w-4 h-4 text-primary" /> {t("proof.hipaa")}</div>
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider"><CheckCircle2 className="w-4 h-4 text-primary" /> {t("proof.uptime")}</div>
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider"><CheckCircle2 className="w-4 h-4 text-primary" /> 24/7 AI</div>
              </div>
            </div>

            {/* Right Interactive Mockup */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative fade-in-up" role="img" aria-label="Interface tableau de bord DocFlow IA — agenda médical et prise de rendez-vous automatique" style={{ animationDelay: "0.2s" }}>
              <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-background/50 backdrop-blur-xl aspect-square lg:aspect-[4/3] flex flex-col">
                {/* Header */}
                <div className="h-14 border-b border-border/50 bg-muted/30 flex items-center px-4 justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-xs font-mono font-medium text-muted-foreground px-3 py-1 bg-background rounded-md border border-border">docflow.ai/dashboard</div>
                  <div className="w-12" />
                </div>
                
                {/* Body Mockup */}
                <div className="p-6 flex-1 bg-gradient-to-br from-background via-muted/20 to-primary/5 relative">
                  
                  {/* Floating Elements */}
                  <div className="absolute top-8 left-8 right-8 bg-card rounded-2xl p-4 shadow-lg border border-border flex items-center justify-between animate-pulse" style={{ animationDuration: '4s' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">DZ</div>
                      <div>
                        <div className="text-sm font-bold text-foreground">Nouveau RDV via IA</div>
                        <div className="text-xs text-muted-foreground">À l&apos;instant • Consultation générale</div>
                      </div>
                    </div>
                    <div className="text-primary font-bold">14:30</div>
                  </div>

                  {/* Calendar Mock */}
                  <div className="absolute top-32 left-8 right-8 bottom-8 bg-card rounded-2xl border border-border shadow-md overflow-hidden flex flex-col">
                    <div className="flex border-b border-border">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(d => (
                        <div key={d} className="flex-1 text-center py-2 text-xs font-bold text-muted-foreground border-r border-border last:border-0">{d}</div>
                      ))}
                    </div>
                    <div className="flex-1 relative p-2">
                      <div className="absolute top-4 left-2 right-2/3 h-16 bg-primary/20 border-l-4 border-primary rounded-r-md p-2">
                        <div className="w-1/2 h-2 bg-primary/40 rounded mb-1" />
                        <div className="w-1/3 h-2 bg-primary/30 rounded" />
                      </div>
                      <div className="absolute top-12 left-1/3 right-1/3 h-20 bg-blue-500/20 border-l-4 border-blue-500 rounded-r-md p-2">
                        <div className="w-2/3 h-2 bg-blue-500/40 rounded mb-1" />
                        <div className="w-1/2 h-2 bg-blue-500/30 rounded" />
                      </div>
                      <div className="absolute top-24 left-2/3 right-2 h-12 bg-emerald-500/20 border-l-4 border-emerald-500 rounded-r-md p-2">
                         <div className="w-1/2 h-2 bg-emerald-500/40 rounded" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/10 relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          <div className="p-8 text-center hover:bg-card/50 transition-colors">
            <div className="text-4xl md:text-5xl font-cormorant font-bold text-primary mb-2">24/7</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("stats.available")}</div>
          </div>
          <div className="p-8 text-center hover:bg-card/50 transition-colors">
            <div className="text-4xl md:text-5xl font-cormorant font-bold text-foreground mb-2">30 min</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("stats.setup")}</div>
          </div>
          <div className="p-8 text-center hover:bg-card/50 transition-colors">
            <div className="text-4xl md:text-5xl font-cormorant font-bold text-foreground mb-2">0€</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("stats.free")}</div>
          </div>
          <div className="p-8 text-center hover:bg-card/50 transition-colors">
            <div className="text-4xl md:text-5xl font-cormorant font-bold text-foreground mb-2">14j</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("stats.trial")}</div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ───────────────────────────────────────────────────── */}
      <TechStackBand />

      {/* ── BENTO FEATURES ───────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── DOSSIER & IA ─────────────────────────────────────────────────── */}
      <MedicalRecordSection />

      {/* ── WIDGET IA EMBARQUABLE ────────────────────────────────────────── */}
      <EmbedWidgetSection />


      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-32 py-32 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            
            <div className="flex-1 space-y-8">
              <div className="inline-block px-4 py-2 rounded-full bg-background border border-border text-sm font-bold uppercase tracking-widest text-primary shadow-sm">
                {t("howItWorks.sectionLabel")}
              </div>
              <h2 className="text-4xl md:text-5xl font-cormorant font-bold text-foreground leading-tight">
                {t("howItWorks.title")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t("howItWorks.subtitle")}
              </p>
            </div>

            <div className="flex-1 w-full space-y-6">
              {[
                { step: "01", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
                { step: "02", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
                { step: "03", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
              ].map((s) => (
                <div key={s.step} className="bg-card rounded-2xl p-6 border border-border shadow-sm flex gap-6 items-start hover:-translate-y-1 transition-transform">
                  <div className="text-3xl font-cormorant font-bold text-primary/70">{s.step}</div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                    <p className="text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── TARIFS ───────────────────────────────────────────────────────── */}
      <PricingPreviewSection />

      {/* ── SÉCURITÉ ─────────────────────────────────────────────────────── */}
      <SecuritySection />

      {/* ── EARLY ADOPTERS ───────────────────────────────────────────────── */}
      <section className="py-32 overflow-hidden" aria-labelledby="early-adopters-heading">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t("earlyAdopters.badge")}
          </div>
          <h2 id="early-adopters-heading" className="text-4xl md:text-6xl font-cormorant font-medium text-foreground mb-6 leading-tight">
            {t("earlyAdopters.title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-16 max-w-xl mx-auto leading-relaxed">
            {t("earlyAdopters.subtitle")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-4 bg-card border border-dashed border-border rounded-3xl p-10 hover:border-primary/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <svg className="w-6 h-6 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-muted-foreground text-sm uppercase tracking-widest">{t("earlyAdopters.spot")}</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">{t("earlyAdopters.available")}</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/signup">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-full text-base font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              {t("earlyAdopters.cta")}
            </button>
          </Link>
          <p className="text-sm text-muted-foreground mt-5">{t("earlyAdopters.noCreditCard")}</p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary dark:bg-primary/20" />
        <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-white/10 dark:bg-primary/20 blur-[100px] rounded-full" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-5xl md:text-7xl font-cormorant font-medium leading-tight mb-8">
            {t("cta.titlePart1")} <em className="italic font-light">{t("cta.titleHighlight")}</em>
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
            {t("cta.subtitle")}
          </p>
          {isLoggedIn ? (
            <Link href="/app/dashboard">
              <button className="bg-white text-primary dark:bg-foreground dark:text-background px-10 py-5 rounded-full text-lg font-bold shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5" />
                Voir mon tableau de bord
              </button>
            </Link>
          ) : (
            <Link href="/signup">
              <button className="bg-white text-primary dark:bg-foreground dark:text-background px-10 py-5 rounded-full text-lg font-bold shadow-2xl hover:scale-105 transition-transform">
                {t("cta.button")}
              </button>
            </Link>
          )}
        </div>
      </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <LandingFooter />

    </div>
  );
}
