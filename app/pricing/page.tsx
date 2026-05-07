import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, CheckCircle, Star } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'

const PLAN_KEYS = ['free', 'starter', 'professional', 'enterprise'] as const
const PRICES = { free: 0, starter: 49, professional: 99, enterprise: 299 }
const HIGHLIGHTED = { free: false, starter: false, professional: true, enterprise: false }
const HREFS = { free: '/signup', starter: '/signup', professional: '/signup', enterprise: '/signup' }

export default async function PricingPage() {
  const t = await getTranslations('pricing')

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="DocFlow IA" width={130} height={36} className="object-contain" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">{t('nav.features')}</Link>
              <Link href="/pricing" className="text-teal-600 text-sm font-semibold transition-colors">{t('nav.pricing')}</Link>
              <Link href="/#how-it-works" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">{t('nav.howItWorks')}</Link>
              <Link href="/#testimonials" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">{t('nav.reviews')}</Link>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl font-semibold"
                >
                  {t('nav.signIn')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="gradient-brand text-white border-none rounded-xl font-semibold shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.02] transition-all"
                >
                  {t('nav.getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              {t('badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
              {t('title1')}{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {PLAN_KEYS.map((key) => {
              const highlighted = HIGHLIGHTED[key]
              const price = PRICES[key]
              const period = price === 0 ? t('forever') : t('perMonth')
              const features = t.raw(`plans.${key}.features`) as string[]

              return (
                <div
                  key={key}
                  className={`rounded-2xl p-6 flex flex-col relative ${
                    highlighted
                      ? 'gradient-hero text-white shadow-2xl shadow-teal-300/30 scale-[1.03]'
                      : 'glass-card hover-lift'
                  }`}
                >
                  {highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                        <Star className="w-3 h-3 fill-amber-900" /> {t('mostPopular')}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`text-xl font-bold mb-1 ${highlighted ? 'text-white' : 'text-slate-800'}`}>
                      {t(`plans.${key}.name`)}
                    </h3>
                    <p className={`text-sm mb-4 ${highlighted ? 'text-teal-100/80' : 'text-slate-500'}`}>
                      {t(`plans.${key}.description`)}
                    </p>
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-bold tracking-tight ${highlighted ? 'text-white' : 'text-slate-800'}`}>
                        ${price}
                      </span>
                      <span className={`text-sm mb-1.5 ${highlighted ? 'text-teal-100/70' : 'text-slate-400'}`}>
                        /{period}
                      </span>
                    </div>
                  </div>

                  <ul className="flex-1 space-y-2.5 mb-6">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? 'text-teal-200' : 'text-teal-500'}`}
                        />
                        <span className={`text-sm ${highlighted ? 'text-teal-100/90' : 'text-slate-600'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href={HREFS[key]}>
                    <Button
                      className={`w-full rounded-xl font-semibold transition-all ${
                        highlighted
                          ? 'bg-white text-teal-700 hover:bg-teal-50 border-none shadow-sm'
                          : 'gradient-brand text-white border-none shadow-sm shadow-teal-200/40 hover:shadow-teal-300/50 hover:scale-[1.01]'
                      }`}
                    >
                      {t(`plans.${key}.cta`)}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Included in all plans */}
          <div className="mt-16 glass-card rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('includedTitle')}</h2>
            <p className="text-slate-500 text-sm mb-8">{t('includedSubtitle')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(t.raw('included') as string[]).map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* CTA footer */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-sm">
              {t('questions')}{' '}
              <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700">
                {t('talkToUs')}
              </Link>{' '}
              {t('wereHappy')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
