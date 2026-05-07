'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, Sparkles, Shield, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen gradient-mesh flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] gradient-hero flex-col justify-between p-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="absolute bottom-40 right-10 w-32 h-32 bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative flex items-center">
          <Image src="/logo.png" alt="DocFlow IA" width={150} height={41} className="object-contain brightness-0 invert" />
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug">
              The future of clinic
              <br />
              booking is here.
            </h2>
            <p className="text-teal-100/80 mt-3 leading-relaxed text-sm">
              Your AI-powered assistant handles appointments 24/7, so you can focus on what matters
              most — your patients.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: Brain, text: 'Claude-powered AI booking assistant' },
              { icon: Shield, text: 'HIPAA-ready, secure patient data' },
              { icon: Sparkles, text: 'Auto email notifications on booking' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-teal-200" />
                </div>
                <span className="text-sm text-teal-100/90 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-xs text-teal-200/50">© 2024 DocFlow IA · All rights reserved</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your clinic dashboard</p>
          </div>

          <div className="glass-card rounded-2xl p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinic.com"
                  autoComplete="email"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl gradient-brand text-white border-none font-semibold shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.01] transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  Start free trial
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
