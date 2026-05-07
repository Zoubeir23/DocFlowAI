import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Zap, Star } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 clinic',
      'Up to 50 appointments/month',
      'AI booking assistant',
      'Basic calendar',
      'Patient management',
      'Email support',
    ],
    cta: 'Start Free',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: 49,
    period: 'per month',
    description: 'For growing practices',
    features: [
      '1 clinic',
      'Up to 200 appointments/month',
      'AI booking assistant',
      'Full calendar (day/week/month)',
      'Patient CRM',
      'Services management',
      'Availability settings',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: 99,
    period: 'per month',
    description: 'Most popular for established clinics',
    features: [
      '1 clinic',
      'Unlimited appointments',
      'AI booking assistant',
      'Full calendar with drag & drop',
      'Complete Patient CRM',
      'Staff role management',
      'Advanced analytics',
      'Custom AI personality',
      'Widget customization',
      'Priority 24/7 support',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 299,
    period: 'per month',
    description: 'For large practices and groups',
    features: [
      'Multiple clinics',
      'Unlimited appointments',
      'All Professional features',
      'Multi-location management',
      'Custom integrations',
      'Dedicated account manager',
      'Custom SLA',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    href: '/signup',
    highlighted: false,
  },
]

const INCLUDED = [
  'SSL Security',
  '99.9% Uptime',
  'Data Export',
  'Row Level Security',
  'GDPR Ready',
  'API Access',
  'Mobile Responsive',
  'Widget Embedding',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen gradient-mesh">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="DocFlow IA" width={130} height={36} className="object-contain" />
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="gradient-brand text-white border-none rounded-lg shadow-sm shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.02] transition-all"
                >
                  Get Started
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
              <Zap className="w-3.5 h-3.5" />
              Simple, transparent pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
              Plans that scale with{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">
                your practice
              </span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Start free. Upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col relative ${
                  plan.highlighted
                    ? 'gradient-hero text-white shadow-2xl shadow-teal-300/30 scale-[1.03]'
                    : 'glass-card hover-lift'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                      <Star className="w-3 h-3 fill-amber-900" /> Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-800'}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 ${plan.highlighted ? 'text-teal-100/80' : 'text-slate-500'}`}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-end gap-1">
                    <span
                      className={`text-4xl font-bold tracking-tight ${plan.highlighted ? 'text-white' : 'text-slate-800'}`}
                    >
                      ${plan.price}
                    </span>
                    <span
                      className={`text-sm mb-1.5 ${plan.highlighted ? 'text-teal-100/70' : 'text-slate-400'}`}
                    >
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.highlighted ? 'text-teal-200' : 'text-teal-500'
                        }`}
                      />
                      <span
                        className={`text-sm ${plan.highlighted ? 'text-teal-100/90' : 'text-slate-600'}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    className={`w-full rounded-xl font-semibold transition-all ${
                      plan.highlighted
                        ? 'bg-white text-teal-700 hover:bg-teal-50 border-none shadow-sm'
                        : 'gradient-brand text-white border-none shadow-sm shadow-teal-200/40 hover:shadow-teal-300/50 hover:scale-[1.01]'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Included in all plans */}
          <div className="mt-16 glass-card rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">All plans include</h2>
            <p className="text-slate-500 text-sm mb-8">Core features available across every tier</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INCLUDED.map((item) => (
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
              Questions?{' '}
              <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700">
                Talk to us
              </Link>{' '}
              — we&apos;re happy to help.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
