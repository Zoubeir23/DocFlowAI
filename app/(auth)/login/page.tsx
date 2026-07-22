'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, Bell, Shield, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const t = useTranslations('auth.login')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Welcome back!')
      router.push('/app/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground selection:bg-teal-500/30 selection:text-teal-100">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-background border-r border-foreground/15 flex-col justify-between p-12 relative overflow-hidden">
        {/* Logo */}
        <div className="relative flex items-center">
          <Link href="/">
            <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain dark:brightness-0 dark:invert" />
          </Link>
        </div>

        {/* Center content */}
        <div className="relative space-y-12">
          <div>
            <h2 className="font-cormorant font-normal text-[40px] text-foreground leading-tight mb-4">
              {t('brandPanel')}
            </h2>
            <p className="font-sans font-normal text-[14px] text-foreground/80 leading-relaxed max-w-[320px]">
              {t('brandSubtitle')}
            </p>
          </div>
          <div className="space-y-6">
            {[
              { icon: MessageSquare, text: t('featureAI') },
              { icon: Shield, text: t('featureSecurity') },
              { icon: Bell, text: t('featureNotifications') },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-none border border-[#14b8a6]/20 bg-transparent flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-[#14b8a6]/5">
                  <item.icon strokeWidth={1.5} className="w-4 h-4 text-[#14b8a6]" />
                </div>
                <span className="font-sans font-normal text-[15px] text-foreground/60 group-hover:text-foreground transition-colors">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-[1px] bg-gradient-to-r from-[#14b8a6] to-transparent"></div>
          <p className="font-mono text-[15px] uppercase tracking-widest text-foreground/60">© 2026 DocFlow IA</p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-12">
            <Link href="/">
              <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain dark:brightness-0 dark:invert" />
            </Link>
          </div>

          <div className="mb-10 text-center">
            <h1 className="font-cormorant font-normal text-[32px] text-foreground tracking-tight mb-2">{t('welcomeBack')}</h1>
            <p className="font-sans font-normal text-foreground/80 text-[14px]">{t('dashboardSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block font-mono text-[14px] uppercase tracking-[0.1em] text-foreground/80">
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                className="w-full h-12 bg-foreground/[0.05] border border-foreground/20 rounded-none px-4 font-sans text-[14px] text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-[#14b8a6] focus:bg-[#14b8a6]/5 transition-colors"
                {...register('email')}
              />
              {errors.email && <p className="text-[15px] font-sans text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block font-mono text-[14px] uppercase tracking-[0.1em] text-foreground/80">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  autoComplete="current-password"
                  className="w-full h-12 bg-foreground/[0.05] border border-foreground/20 rounded-none px-4 font-sans text-[14px] text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-[#14b8a6] focus:bg-[#14b8a6]/5 transition-colors"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-[#14b8a6] transition-colors"
                >
                  {showPassword ? <EyeOff strokeWidth={1.5} className="w-4 h-4" /> : <Eye strokeWidth={1.5} className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[15px] font-sans text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-void-primary w-full h-12 flex items-center justify-center gap-2 mt-4"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? '...' : t('submit')}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-foreground/15" />
            <span className="font-mono text-[12px] uppercase tracking-widest text-foreground/40">{t('orContinueWith')}</span>
            <div className="flex-1 h-[1px] bg-foreground/15" />
          </div>

          <div className="mt-4">
            <GoogleOAuthButton label={t('continueWithGoogle')} />
          </div>

          <div className="mt-8 pt-8 border-t border-foreground/15 text-center space-y-3">
            <p className="font-sans font-normal text-foreground/70 text-[15px]">
              {t('dontHaveAccount')}{' '}
              <Link
                href="/signup"
                className="text-[#14b8a6] hover:text-foreground transition-colors ml-1"
              >
                {t('startFreeTrial')}
              </Link>
            </p>
            <p className="font-sans text-[13px] text-foreground/40">
              Vous êtes patient ?{' '}
              <Link
                href="/portail/login"
                className="text-foreground/60 hover:text-[#14b8a6] transition-colors underline underline-offset-2"
              >
                Accéder à votre espace patient
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
