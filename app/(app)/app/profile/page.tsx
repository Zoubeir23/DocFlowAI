'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Building2,
  Globe,
  Clock,
  Shield,
  Save,
  Key,
  CheckCircle,
  Calendar,
  TrendingUp,
  UserCircle,
  Activity,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO } from 'date-fns'
import { useTranslations } from 'next-intl'

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

async function fetchProfileData() {
  const supabase = createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [userRes, statsRes] = await Promise.all([
    supabase
      .from('users')
      .select(
        'id, full_name, email, role, clinic_id, created_at, clinic:clinics(id, name, slug, timezone, created_at)'
      )
      .eq('id', user.id)
      .single(),
    supabase
      .from('appointments')
      .select('id, status, created_at')
      .eq(
        'clinic_id',
        (await supabase.from('users').select('clinic_id').eq('id', user.id).single()).data
          ?.clinic_id
      ),
  ])

  const userData = userRes.data
  const appointments = statsRes.data || []
  const totalAppts = appointments.length
  const completedAppts = appointments.filter((a: any) => a.status === 'completed').length
  const thisMonthAppts = appointments.filter((a: any) => {
    const d = new Date(a.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return { user, userData, stats: { totalAppts, completedAppts, thisMonthAppts } }
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfileData })

  useEffect(() => {
    if (data?.userData) {
      setFullName(data.userData.full_name || '')
      setClinicName(data.userData.clinic?.name || '')
      setTimezone(data.userData.clinic?.timezone || 'America/New_York')
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient() as any
      const [userUpdate, clinicUpdate] = await Promise.all([
        supabase.from('users').update({ full_name: fullName }).eq('id', data?.user?.id),
        supabase
          .from('clinics')
          .update({ name: clinicName, timezone })
          .eq('id', data?.userData?.clinic_id),
      ])
      if (userUpdate.error) throw new Error(userUpdate.error.message)
      if (clinicUpdate.error) throw new Error(clinicUpdate.error.message)
    },
    onSuccess: () => {
      toast.success(t('profileUpdated'))
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err: Error) => toast.error(err.message || t('failedToUpdate')),
  })

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t('fillAllFields'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'))
      return
    }
    if (newPassword.length < 8) {
      toast.error(t('passwordMinLength'))
      return
    }
    setPasswordLoading(true)
    try {
      const supabase = createClient() as any
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      toast.success(t('passwordUpdated'))
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || t('failedToUpdatePassword'))
    } finally {
      setPasswordLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48 rounded-none" />
        <Skeleton className="h-40 w-full rounded-none" />
        <Skeleton className="h-32 w-full rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    )
  }

  const userData = data?.userData
  const clinic = userData?.clinic
  const stats = data?.stats

  const initials = (fullName || userData?.full_name || 'D')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleConfig: Record<string, { label: string; color: string }> = {
    owner: { label: t('roles.owner'), color: 'bg-teal-50 text-teal-700 border border-foreground/10' },
    receptionist: {
      label: t('roles.receptionist'),
      color: 'bg-violet-50 text-violet-700 border border-violet-100',
    },
    assistant: { label: t('roles.assistant'), color: 'bg-cyan-50 text-cyan-700 border border-cyan-100' },
  }
  const role = roleConfig[userData?.role] || {
    label: userData?.role || 'owner',
    color: 'bg-background text-foreground/70 border border-foreground/10',
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 flex items-center justify-center">
          <UserCircle className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-foreground tracking-tight">{t('title')}</h2>
        </div>
      </div>

      {/* Hero card */}
      <div className="glass-card rounded-none overflow-hidden">
        <div className="border-b border-foreground/10 bg-foreground/[0.02] px-6 py-5">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-none bg-foreground/[0.06] backdrop-blur flex items-center justify-center text-foreground text-2xl font-medium shadow-none">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-background rounded-full" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-medium text-foreground">{userData?.full_name || 'Doctor'}</h3>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full bg-foreground/[0.06] text-foreground border border-white/30`}
                >
                  {role.label}
                </span>
              </div>
              <p className="text-teal-100/80 text-sm mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {userData?.email}
              </p>
              <p className="text-teal-100/80 text-sm mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {clinic?.name}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-teal-200/60">{t('memberSince')}</p>
              <p className="text-sm font-medium text-foreground">
                {userData?.created_at ? format(parseISO(userData.created_at), 'MMM yyyy') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-foreground/10 bg-background">
          {[
            {
              label: t('totalAppointments'),
              value: stats?.totalAppts ?? 0,
              icon: Calendar,
              color: 'text-teal-600',
            },
            {
              label: t('completed'),
              value: stats?.completedAppts ?? 0,
              icon: CheckCircle,
              color: 'text-emerald-600',
            },
            {
              label: t('thisMonth'),
              value: stats?.thisMonthAppts ?? 0,
              icon: TrendingUp,
              color: 'text-violet-600',
            },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-5">
              <div className="w-9 h-9 rounded-none bg-background flex items-center justify-center flex-shrink-0">
                <stat.icon
                  className={`w-4.5 h-4.5 ${stat.color}`}
                  style={{ width: 18, height: 18 }}
                />
              </div>
              <div>
                <p className="stat-number text-xl font-medium text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/50">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal information */}
      <div className="glass-card rounded-none overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-foreground/10">
          <div className="w-7 h-7 rounded-none bg-teal-50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">{t('personalInfo')}</h3>
            <p className="text-xs text-foreground/50">{t('personalInfoDesc')}</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  className="pl-9 rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6]"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. John Smith"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  className="pl-9 rounded-none border-foreground/10 bg-background text-foreground/50 cursor-not-allowed"
                  value={userData?.email || ''}
                  disabled
                />
              </div>
              <p className="text-xs text-foreground/50">{t('emailCannotChange')}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('clinicName')}</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  className="pl-9 rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6]"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="CityCare Clinic"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('timezone')}</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 z-10" />
                <select
                  className="w-full pl-9 h-10 pr-3 text-sm border border-foreground/10 rounded-none bg-background focus:outline-none focus:ring-2 focus:ring-0 focus:border-[#14b8a6] text-foreground/80"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-foreground/10">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('widgetSlug')}</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  className="pl-9 rounded-none border-foreground/10 bg-background text-foreground/50 cursor-not-allowed font-mono text-xs"
                  value={clinic?.slug || ''}
                  disabled
                />
              </div>
              <p className="text-xs text-foreground/50">{t('changeSlugInAI')}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('accountRole')}</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  className="pl-9 rounded-none border-foreground/10 bg-background text-foreground/50 cursor-not-allowed capitalize"
                  value={userData?.role || 'owner'}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 text-foreground border-none shadow-none font-medium px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? t('saving') : t('saveChanges')}
            </Button>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="glass-card rounded-none overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-foreground/10">
          <div className="w-7 h-7 rounded-none bg-background flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-foreground/60" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">{t('accountDetails')}</h3>
            <p className="text-xs text-foreground/50">{t('accountDetailsDesc')}</p>
          </div>
        </div>
        <div className="divide-y divide-slate-50 px-6">
          {[
            { label: t('userId'), value: userData?.id, mono: true },
            { label: t('clinicId'), value: data?.userData?.clinic_id, mono: true },
            { label: t('accountRole'), value: userData?.role, capitalize: true },
            {
              label: t('memberSince'),
              value: userData?.created_at
                ? format(parseISO(userData.created_at), 'MMMM d, yyyy')
                : '—',
            },
            {
              label: t('clinicCreated'),
              value: clinic?.created_at ? format(parseISO(clinic.created_at), 'MMMM d, yyyy') : '—',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <span className="text-sm text-foreground/60">{item.label}</span>
              <span
                className={`text-sm font-medium text-foreground/80 truncate max-w-[260px] ${item.mono ? 'font-mono text-xs text-foreground/60 bg-background px-2 py-0.5 rounded-none' : ''} ${item.capitalize ? 'capitalize' : ''}`}
              >
                {item.value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card rounded-none overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-foreground/10">
          <div className="w-7 h-7 rounded-none bg-amber-50 flex items-center justify-center">
            <Key className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">{t('changePassword')}</h3>
            <p className="text-xs text-foreground/50">{t('changePasswordDesc')}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('newPassword')}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('minChars')}
                className="rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/80">{t('confirmPassword')}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('repeatPassword')}
                className="rounded-none border-foreground/10 focus:ring-0 focus:border-[#14b8a6]"
              />
            </div>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 font-medium">{t('passwordsDoNotMatch')}</p>
          )}
          {newPassword && newPassword.length < 8 && (
            <p className="text-xs text-amber-500 font-medium">
              {t('passwordMinLength')}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handlePasswordChange}
              disabled={passwordLoading || !newPassword || !confirmPassword}
              variant="outline"
              className="rounded-none border-foreground/10 text-foreground/80 hover:bg-[#14b8a6]/[0.03] hover:border-[#14b8a6]/40 hover:text-teal-700 px-6 font-medium"
            >
              <Key className="w-4 h-4 mr-2" />
              {passwordLoading ? t('updating') : t('updatePassword')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
