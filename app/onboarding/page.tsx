'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Building2, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { onboardingSchema, type OnboardingInput } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'
import { createOnboarding } from '@/actions/clinic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Abidjan',
  'Africa/Algiers',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Dakar',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Indian/Mauritius',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  )
}

const TRIAL_PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
}

function OnboardingForm() {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const trialPlanLabel = TRIAL_PLAN_LABELS[searchParams.get('plan') ?? '']

  const BENEFITS = [
    t('benefit1'),
    t('benefit2'),
    t('benefit3'),
    t('benefit4'),
  ]

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      timezone: 'America/New_York',
    },
  })

  const handleClinicNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setValue('clinicName', name)
    setValue('slug', generateSlug(name))
  }

  const onSubmit = async (data: OnboardingInput) => {
    setLoading(true)
    try {
      const result = await createOnboarding(data)
      if (result.success) {
        toast.success(
          result.data?.trial
            ? `Essai gratuit de 14 jours démarré — profitez du plan ${TRIAL_PLAN_LABELS[result.data.plan] ?? result.data.plan} !`
            : t('setupSuccess')
        )
        router.push('/app/dashboard')
      } else {
        toast.error(result.error || t('setupFailed'))
      }
    } catch {
      toast.error(t('setupError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[440px] gradient-hero flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-foreground/[0.02] rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-foreground/[0.02] rounded-full translate-y-1/3 -translate-x-1/3" />

        {/* Logo */}
        <div className="relative flex items-center">
          <Image src="/logo.png" alt="DocFlow IA" width={150} height={41} className="object-contain brightness-0 invert" />
        </div>

        {/* Center */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-medium text-foreground leading-snug">
              {t('brandHeading')}
              <br />
              {t('brandHeadingHighlight')}
            </h2>
            <p className="text-teal-100/80 mt-3 leading-relaxed text-sm">
              {t('brandSubtitle')}
            </p>
          </div>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />
                </div>
                <span className="text-sm text-teal-100/90 font-medium leading-snug">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-teal-200/50">{t('copyright')}</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain" />
          </div>

          {/* Icon + heading */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-brand rounded-none flex items-center justify-center mx-auto mb-4 shadow-none">
              <Building2 className="w-8 h-8 text-foreground" />
            </div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">{t('pageHeading')}</h1>
            <p className="text-foreground/60 mt-1 text-sm">{t('pageSubheading')}</p>
          </div>

          <div className="glass-card rounded-none p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="clinicName" className="text-sm font-medium text-foreground/80">
                  {t('clinicNameLabel')}
                </Label>
                <Input
                  id="clinicName"
                  type="text"
                  placeholder={t('clinicNamePlaceholder')}
                  className="h-10 rounded-none border-foreground/10 bg-foreground/[0.02] focus:bg-background focus:ring-0 focus:border-[#14b8a6] transition-colors"
                  {...register('clinicName')}
                  onChange={handleClinicNameChange}
                />
                {errors.clinicName && (
                  <p className="text-xs text-red-500">{errors.clinicName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-medium text-foreground/80">
                  {t('bookingUrlLabel')}
                </Label>
                <div className="flex items-center rounded-none border border-foreground/10 overflow-hidden focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400 bg-foreground/[0.02] focus-within:bg-background transition-colors">
                  <span className="bg-slate-100/80 border-r border-foreground/10 px-3 py-2 text-sm text-foreground/60 whitespace-nowrap h-10 flex items-center">
                    docflow.ai/widget/
                  </span>
                  <Input
                    id="slug"
                    className="border-0 rounded-none focus-visible:ring-0 bg-transparent h-10"
                    placeholder={t('bookingUrlSlugPlaceholder')}
                    {...register('slug')}
                  />
                </div>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                <p className="text-xs text-foreground/50">
                  {t('bookingUrlNote')}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-sm font-medium text-foreground/80">
                  {t('timezone')}
                </Label>
                <select
                  id="timezone"
                  className="w-full h-10 px-3 py-2 text-sm border border-foreground/10 rounded-none bg-foreground/[0.02] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-[#14b8a6] transition-colors"
                  {...register('timezone')}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="text-xs text-red-500">{errors.timezone.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 text-foreground border-none font-medium shadow-none hover: transition-all mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                {loading ? t('submitLoading') : t('submitButton')}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-foreground/50 mt-5">
            {t('settingsNote')}
          </p>
        </div>
      </div>
    </div>
  )
}
