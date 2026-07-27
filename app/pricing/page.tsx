import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Star } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { PricingPlanCta } from '@/components/pricing/pricing-plan-cta'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs Logiciel Médical IA — Gratuit à 99€/mois · DocFlow',
  description:
    'Comparez les plans DocFlow IA : gratuit (50 RDV/mois), Starter 49€, Pro 99€, Entreprise. Logiciel médical IA sans engagement. Démarrez gratuitement en 2 minutes.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://docflow.ia'}/pricing`,
    languages: {
      fr: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://docflow.ia'}/pricing`,
      en: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://docflow.ia'}/pricing`,
    },
  },
  openGraph: {
    title: 'Tarifs DocFlow IA — Plans logiciel médical dès 0€',
    description: 'Plan gratuit, Starter 49€/mois, Pro 99€/mois. Logiciel de gestion de cabinet médical avec IA. Sans engagement.',
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://docflow.ia'}/pricing`,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Tarifs DocFlow IA — Logiciel médical IA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs DocFlow IA — dès 0€/mois',
    description: 'Gratuit, Starter 49€, Pro 99€. Logiciel médical IA sans engagement.',
    images: ['/og-image.jpg'],
  },
}

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Plans DocFlow IA',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Plan Gratuit', description: 'Jusqu\'à 50 rendez-vous/mois, 1 compte utilisateur', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } },
    { '@type': 'ListItem', position: 2, name: 'Plan Starter', description: '200 rendez-vous/mois, 3 comptes staff', offers: { '@type': 'Offer', price: '49', priceCurrency: 'EUR' } },
    { '@type': 'ListItem', position: 3, name: 'Plan Professionnel', description: 'Rendez-vous illimités, 10 comptes staff', offers: { '@type': 'Offer', price: '99', priceCurrency: 'EUR' } },
    { '@type': 'ListItem', position: 4, name: 'Plan Entreprise', description: 'Illimité, support dédié, SSO', offers: { '@type': 'Offer', price: '299', priceCurrency: 'EUR' } },
  ],
}

const PLAN_KEYS = ['free', 'starter', 'professional', 'enterprise'] as const
const PRICES = { free: 0, starter: 49, professional: 99, enterprise: 299 }
const HIGHLIGHTED = { free: false, starter: false, professional: true, enterprise: false }
const HREFS = { free: '/signup', starter: '/signup?plan=starter', professional: '/signup?plan=professional', enterprise: '/signup' }

export default async function PricingPage() {
  const t = await getTranslations('pricing')

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-teal-500/30 selection:text-teal-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />

      {/* Navbar (Same as landing page) */}
      <nav className="sticky top-0 z-50 bg-background border-b border-foreground/15 h-16 flex items-center">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-4">
            <div className="teal-line w-8 hidden sm:block"></div>
            <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain dark:brightness-0 dark:invert" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            <Link href="/#features" className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-foreground/70 hover:text-foreground transition-colors">{t('nav.features')}</Link>
            <Link href="/pricing" className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-[#14b8a6] transition-colors">{t('nav.pricing')}</Link>
            <Link href="/#how-it-works" className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-foreground/70 hover:text-foreground transition-colors">{t('nav.howItWorks')}</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <button className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-foreground/70 hover:text-foreground transition-colors">
                {t('nav.signIn')}
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn-void-primary !py-2.5 !px-5 !text-[14px]">
                {t('nav.getStarted')}
              </button>
            </Link>
          </div>

        </div>
      </nav>

      <div className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        
        {/* Hero */}
        <div className="text-center mb-24 space-y-6 fade-in-up">
          <div className="font-mono text-[14px] text-[#14b8a6] uppercase tracking-[0.15em] mb-4">
            {t('badge')}
          </div>
          <h1 className="font-cormorant font-normal text-[56px] lg:text-[72px] text-foreground leading-tight mb-6">
            {t('title1')} <br />
            <em className="italic text-[#14b8a6]">{t('titleHighlight')}</em>
          </h1>
          <p className="font-sans font-normal text-[15px] text-foreground/80 max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Plan cards */}
        <div className="void-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 fade-in-up" style={{ animationDelay: "0.2s" }}>
          {PLAN_KEYS.map((key) => {
            const highlighted = HIGHLIGHTED[key]
            const price = PRICES[key]
            const period = price === 0 ? t('forever') : t('perMonth')
            const features = t.raw(`plans.${key}.features`) as string[]

            return (
              <div
                key={key}
                className={`p-10 flex flex-col relative group ${
                  highlighted
                    ? 'bg-[#14b8a6]/[0.03]'
                    : 'bg-background'
                }`}
              >
                {highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14b8a6] to-transparent"></div>
                )}

                <div className="mb-10">
                  {highlighted && (
                    <div className="font-mono text-[15px] text-[#14b8a6] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                      <Star className="w-3 h-3 fill-[#14b8a6]" /> {t('mostPopular')}
                    </div>
                  )}
                  <h3 className="font-cormorant font-normal text-[28px] text-foreground mb-2">
                    {t(`plans.${key}.name`)}
                  </h3>
                  <p className="font-sans font-normal text-[15px] text-foreground/70 mb-8 h-10">
                    {t(`plans.${key}.description`)}
                  </p>
                  
                  <div className="flex items-end gap-2">
                    <span className="font-cormorant font-normal text-[56px] leading-none text-foreground">
                      {price === 0 ? t('free') : `${price}€`}
                    </span>
                    <span className="font-mono text-[14px] uppercase tracking-widest text-foreground/70 mb-2">
                      /{period}
                    </span>
                  </div>
                  {(key === 'starter' || key === 'professional') && (
                    <p className="font-sans font-normal text-[13px] text-[#14b8a6] mt-2">
                      {t('trialNote')}
                    </p>
                  )}
                </div>

                <ul className="flex-1 space-y-4 mb-10">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#14b8a6] flex-shrink-0"></div>
                      <span className="font-sans font-normal text-[14px] text-foreground/60 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <PricingPlanCta
                  plan={key}
                  href={HREFS[key]}
                  label={t(`plans.${key}.cta`)}
                  highlighted={highlighted}
                />
              </div>
            )
          })}
        </div>

        {/* Included in all plans */}
        <div className="mt-24 border border-foreground/15 bg-foreground/[0.05] p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[#14b8a6]/50 to-transparent"></div>
          
          <h2 className="font-cormorant font-normal text-[32px] text-foreground mb-3">{t('includedTitle')}</h2>
          <p className="font-sans font-normal text-[14px] text-foreground/70 mb-12">{t('includedSubtitle')}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
            {(t.raw('included') as string[]).map((item) => (
              <div key={item} className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-[#14b8a6]/20 flex items-center justify-center bg-[#14b8a6]/5">
                  <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-[#14b8a6]" />
                </div>
                <span className="font-mono text-[14px] uppercase tracking-wider text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div className="mt-24 pb-12 text-center border-b border-foreground/15">
          <p className="font-sans font-normal text-[14px] text-foreground/80">
            {t('questions')}{' '}
            <Link href="/login" className="text-[#14b8a6] hover:text-foreground transition-colors">
              {t('talkToUs')}
            </Link>{' '}
            {t('wereHappy')}
          </p>
        </div>

      </div>
    </div>
  )
}
