'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Calendar, Clock, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getAvailabilityRules,
  upsertAvailabilityRule,
  getBlockedDates,
  addBlockedDate,
  removeBlockedDate,
} from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

async function fetchClinicId() {
  const supabase = createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('clinic_id').eq('id', user.id).single()
  return { clinicId: data?.clinic_id || null, userId: user.id }
}

const DAYS = [
  { day: 0, label: 'Sunday' },
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
]

const DAY_ABBR: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

function AvailabilityRow({
  day,
  label,
  rule,
  clinicId,
  onSaved,
}: {
  day: number
  label: string
  rule?: {
    id?: string
    is_active: boolean
    start_time: string
    end_time: string
    break_start?: string | null
    break_end?: string | null
  }
  clinicId: string
  onSaved: () => void
}) {
  const [isActive, setIsActive] = useState(rule?.is_active ?? false)
  const [startTime, setStartTime] = useState(rule?.start_time ?? '09:00')
  const [endTime, setEndTime] = useState(rule?.end_time ?? '17:00')
  const [breakStart, setBreakStart] = useState(rule?.break_start ?? '')
  const [breakEnd, setBreakEnd] = useState(rule?.break_end ?? '')
  const [saving, setSaving] = useState(false)

  // Sync state when rule loads from server
  useEffect(() => {
    if (rule) {
      setIsActive(rule.is_active)
      setStartTime(rule.start_time)
      setEndTime(rule.end_time)
      setBreakStart(rule.break_start ?? '')
      setBreakEnd(rule.break_end ?? '')
    }
  }, [rule?.id])

  const handleSave = async () => {
    setSaving(true)
    const result = await upsertAvailabilityRule(clinicId, {
      id: rule?.id,
      day_of_week: day,
      start_time: startTime || '09:00',
      end_time: endTime || '17:00',
      break_start: breakStart || null,
      break_end: breakEnd || null,
      is_active: isActive,
    })
    setSaving(false)
    if (result.success) {
      toast.success(`${label} schedule saved`)
      onSaved()
    } else {
      toast.error(result.error || 'Failed to save')
    }
  }

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/60 border-slate-100'}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            className="data-[state=checked]:bg-teal-500"
          />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center border border-teal-100">
              {DAY_ABBR[day]}
            </span>
            <span
              className={`font-semibold text-sm ${isActive ? 'text-slate-700' : 'text-slate-400'}`}
            >
              {label}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
          className="h-7 rounded-lg text-xs border-slate-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 font-semibold"
        >
          <Save className="w-3 h-3 mr-1" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      {isActive && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 border-t border-slate-100 pt-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Open</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-8 text-sm rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Close</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-8 text-sm rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">
              Break Start <span className="text-slate-300">(opt)</span>
            </Label>
            <Input
              type="time"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              className="h-8 text-sm rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">
              Break End <span className="text-slate-300">(opt)</span>
            </Label>
            <Input
              type="time"
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="h-8 text-sm rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [newBlockedReason, setNewBlockedReason] = useState('')

  const { data: clinicData } = useQuery({ queryKey: ['clinicId-settings'], queryFn: fetchClinicId })
  const clinicId = clinicData?.clinicId
  const userId = clinicData?.userId

  const { data: rules = [] } = useQuery({
    queryKey: ['availability-rules', userId, clinicId],
    queryFn: () => getAvailabilityRules(clinicId!),
    enabled: !!clinicId,
  })

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates', userId, clinicId],
    queryFn: () => getBlockedDates(clinicId!),
    enabled: !!clinicId,
  })

  const addBlockedMutation = useMutation({
    mutationFn: () => addBlockedDate(clinicId!, { date: newBlockedDate, reason: newBlockedReason }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Date blocked')
        queryClient.invalidateQueries({ queryKey: ['blocked-dates', userId, clinicId] })
        setNewBlockedDate('')
        setNewBlockedReason('')
      } else {
        toast.error(result.error || 'Failed to block date')
      }
    },
  })

  const removeBlockedMutation = useMutation({
    mutationFn: removeBlockedDate,
    onSuccess: () => {
      toast.success('Date unblocked')
      queryClient.invalidateQueries({ queryKey: ['blocked-dates', userId, clinicId] })
    },
  })

  const getRuleForDay = (day: number) => rules.find((r) => r.day_of_week === day)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h2>
          <p className="text-slate-500 text-sm">Manage clinic availability and blocked dates</p>
        </div>
      </div>

      <Tabs defaultValue="availability">
        <TabsList className="bg-slate-100/80 rounded-xl p-1 h-auto gap-1">
          <TabsTrigger
            value="availability"
            className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm text-slate-500 px-4 py-2"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Availability
          </TabsTrigger>
          <TabsTrigger
            value="blocked"
            className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm text-slate-500 px-4 py-2"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Blocked Dates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="mt-5">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Weekly Schedule</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set the days and hours your clinic is open for bookings
              </p>
            </div>
            <div className="p-4 space-y-2.5">
              {DAYS.map(({ day, label }) => (
                <AvailabilityRow
                  key={day}
                  day={day}
                  label={label}
                  rule={getRuleForDay(day) as Parameters<typeof AvailabilityRow>[0]['rule']}
                  clinicId={clinicId!}
                  onSaved={() =>
                    queryClient.invalidateQueries({
                      queryKey: ['availability-rules', userId, clinicId],
                    })
                  }
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="mt-5">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Blocked Dates & Holidays</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Block dates when your clinic will be closed
              </p>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex gap-3 flex-wrap">
                <Input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-auto rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                />
                <Input
                  placeholder="Reason (optional)"
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="flex-1 min-w-[160px] rounded-xl border-slate-200 focus:ring-teal-500 focus:border-teal-400"
                />
                <Button
                  onClick={() => addBlockedMutation.mutate()}
                  disabled={!newBlockedDate || addBlockedMutation.isPending}
                  className="rounded-xl gradient-brand text-white border-none shadow-sm font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Block Date
                </Button>
              </div>
              {blockedDates.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium">No dates blocked</p>
                  <p className="text-xs mt-0.5 text-slate-300">Block holidays and days off above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedDates.map((bd) => (
                    <div
                      key={bd.id}
                      className="flex items-center justify-between p-3.5 bg-red-50/60 border border-red-100 rounded-xl group hover:bg-red-50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-800">
                          {new Date(bd.date + 'T12:00:00').toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {bd.reason && <p className="text-xs text-slate-500 mt-0.5">{bd.reason}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => removeBlockedMutation.mutate(bd.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
