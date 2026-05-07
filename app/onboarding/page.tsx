'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Building2, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
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
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const BENEFITS = [
  '24/7 AI appointment booking — no staff needed',
  'Auto email confirmations sent to every patient',
  'Drag-and-drop calendar management',
  'HIPAA-ready, secure patient records',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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
        toast.success('Clinic setup complete! Welcome to DocFlow IA.')
        router.push('/app/dashboard')
      } else {
        toast.error(result.error || 'Failed to set up clinic')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[440px] gradient-hero flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        {/* Logo */}
        <div className="relative flex items-center">
          <Image src="/logo.png" alt="DocFlow IA" width={150} height={41} className="object-contain brightness-0 invert" />
        </div>

        {/* Center */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug">
              Your clinic,
              <br />
              supercharged by AI.
            </h2>
            <p className="text-teal-100/80 mt-3 leading-relaxed text-sm">
              Set up takes under 2 minutes. Your AI booking assistant will be live and handling
              appointments immediately after.
            </p>
          </div>
          <div className="space-y-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />
                </div>
                <span className="text-sm text-teal-100/90 font-medium leading-snug">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-teal-200/50">© 2025 DocFlow IA · All rights reserved</p>
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
            <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200/40">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Set up your clinic</h1>
            <p className="text-slate-500 mt-1 text-sm">Just a few details to get you started</p>
          </div>

          <div className="glass-card rounded-2xl p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="clinicName" className="text-sm font-semibold text-slate-700">
                  Clinic / Practice Name
                </Label>
                <Input
                  id="clinicName"
                  type="text"
                  placeholder="CityCare Medical Clinic"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                  {...register('clinicName')}
                  onChange={handleClinicNameChange}
                />
                {errors.clinicName && (
                  <p className="text-xs text-red-500">{errors.clinicName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-semibold text-slate-700">
                  Booking URL
                </Label>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400 bg-slate-50/60 focus-within:bg-white transition-colors">
                  <span className="bg-slate-100/80 border-r border-slate-200 px-3 py-2 text-sm text-slate-500 whitespace-nowrap h-10 flex items-center">
                    medbook.ai/widget/
                  </span>
                  <Input
                    id="slug"
                    className="border-0 rounded-none focus-visible:ring-0 bg-transparent h-10"
                    placeholder="citycare-clinic"
                    {...register('slug')}
                  />
                </div>
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                <p className="text-xs text-slate-400">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-sm font-semibold text-slate-700">
                  Timezone
                </Label>
                <select
                  id="timezone"
                  className="w-full h-10 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
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
                className="w-full h-11 rounded-xl gradient-brand text-white border-none font-semibold shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.01] transition-all mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                {loading ? 'Setting up...' : 'Launch My Clinic'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            You can change all these settings later in your dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
