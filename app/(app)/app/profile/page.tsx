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
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update'),
  })

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setPasswordLoading(true)
    try {
      const supabase = createClient() as any
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      toast.success('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
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
    owner: { label: 'Owner', color: 'bg-teal-50 text-teal-700 border border-teal-100' },
    receptionist: {
      label: 'Receptionist',
      color: 'bg-violet-50 text-violet-700 border border-violet-100',
    },
    assistant: { label: 'Assistant', color: 'bg-cyan-50 text-cyan-700 border border-cyan-100' },
  }
  const role = roleConfig[userData?.role] || {
    label: userData?.role || 'owner',
    color: 'bg-slate-50 text-slate-600 border border-slate-200',
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
          <UserCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">My Profile</h2>
        </div>
      </div>

      {/* Hero card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="gradient-brand px-6 py-5">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-white">{userData?.full_name || 'Doctor'}</h3>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30`}
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
              <p className="text-xs text-teal-200/60">Member since</p>
              <p className="text-sm font-bold text-white">
                {userData?.created_at ? format(parseISO(userData.created_at), 'MMM yyyy') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
          {[
            {
              label: 'Total Appointments',
              value: stats?.totalAppts ?? 0,
              icon: Calendar,
              color: 'text-teal-600',
            },
            {
              label: 'Completed',
              value: stats?.completedAppts ?? 0,
              icon: CheckCircle,
              color: 'text-emerald-600',
            },
            {
              label: 'This Month',
              value: stats?.thisMonthAppts ?? 0,
              icon: TrendingUp,
              color: 'text-violet-600',
            },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-5">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                <stat.icon
                  className={`w-4.5 h-4.5 ${stat.color}`}
                  style={{ width: 18, height: 18 }}
                />
              </div>
              <div>
                <p className="stat-number text-xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal information */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Personal Information</h3>
            <p className="text-xs text-slate-400">Update your name and clinic details</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9 rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. John Smith"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9 rounded-xl border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                  value={userData?.email || ''}
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400">Email cannot be changed here</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Clinic Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9 rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="CityCare Clinic"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Timezone</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <select
                  className="w-full pl-9 h-10 pr-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 text-slate-700"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Booking Widget Slug</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9 rounded-xl border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed font-mono text-xs"
                  value={clinic?.slug || ''}
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400">Change slug in AI Settings</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Account Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9 rounded-xl border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed capitalize"
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
              className="rounded-xl gradient-brand text-white border-none shadow-md shadow-teal-200/40 font-semibold px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Account Details</h3>
            <p className="text-xs text-slate-400">Read-only account identifiers</p>
          </div>
        </div>
        <div className="divide-y divide-slate-50 px-6">
          {[
            { label: 'User ID', value: userData?.id, mono: true },
            { label: 'Clinic ID', value: data?.userData?.clinic_id, mono: true },
            { label: 'Account Role', value: userData?.role, capitalize: true },
            {
              label: 'Member Since',
              value: userData?.created_at
                ? format(parseISO(userData.created_at), 'MMMM d, yyyy')
                : '—',
            },
            {
              label: 'Clinic Created',
              value: clinic?.created_at ? format(parseISO(clinic.created_at), 'MMMM d, yyyy') : '—',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500">{item.label}</span>
              <span
                className={`text-sm font-medium text-slate-700 truncate max-w-[260px] ${item.mono ? 'font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg' : ''} ${item.capitalize ? 'capitalize' : ''}`}
              >
                {item.value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Key className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Change Password</h3>
            <p className="text-xs text-slate-400">Update your login password</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
              />
            </div>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 font-medium">Passwords do not match</p>
          )}
          {newPassword && newPassword.length < 8 && (
            <p className="text-xs text-amber-500 font-medium">
              Password must be at least 8 characters
            </p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handlePasswordChange}
              disabled={passwordLoading || !newPassword || !confirmPassword}
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 px-6 font-semibold"
            >
              <Key className="w-4 h-4 mr-2" />
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
