'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Save, CalendarDays, Clock, Settings2 } from 'lucide-react'
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
import { useTranslations } from 'next-intl'

async function fetchClinicId() {
  const supabase = createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('clinic_id').eq('id', user.id).single()
  return { clinicId: data?.clinic_id || null, userId: user.id }
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const DAY_SHORT_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function AvailabilityRow({
  day,
  label,
  dayShort,
  rule,
  clinicId,
  onSaved,
}: {
  day: number
  label: string
  dayShort: string
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
  const t = useTranslations('settings')
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
      toast.success(`${label} ${t('scheduleSaved')}`)
      onSaved()
    } else {
      toast.error(result.error || t('failedToSave'))
    }
  }

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${isActive ? 'bg-card border-border' : 'bg-muted/30 border-border'}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            className="data-[state=checked]:bg-primary"
          />
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center border border-primary/15">
              {dayShort}
            </span>
            <span
              className={`font-medium text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
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
          className="h-8 rounded-lg text-xs border-border hover:bg-accent hover:text-foreground font-medium"
        >
          <Save className="w-3 h-3 mr-1" />
          {saving ? t('saving') : t('save')}
        </Button>
      </div>
      {isActive && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 border-t border-border pt-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{t('open')}</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-9 text-sm rounded-lg border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{t('close')}</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-9 text-sm rounded-lg border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('breakStart')} <span className="text-muted-foreground">({t('optional')})</span>
            </Label>
            <Input
              type="time"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              className="h-9 text-sm rounded-lg border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('breakEnd')} <span className="text-muted-foreground">({t('optional')})</span>
            </Label>
            <Input
              type="time"
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="h-9 text-sm rounded-lg border-border focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const t = useTranslations('settings')
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
        toast.success(t('dateBlocked'))
        queryClient.invalidateQueries({ queryKey: ['blocked-dates', userId, clinicId] })
        setNewBlockedDate('')
        setNewBlockedReason('')
      } else {
        toast.error(result.error || t('failedToBlock'))
      }
    },
  })

  const removeBlockedMutation = useMutation({
    mutationFn: removeBlockedDate,
    onSuccess: () => {
      toast.success(t('dateUnblocked'))
      queryClient.invalidateQueries({ queryKey: ['blocked-dates', userId, clinicId] })
    },
  })

  const getRuleForDay = (day: number) => rules.find((r) => r.day_of_week === day)

  return (
    <div className="page-container">
      <div className="section-header">
        <div className="icon-container">
          <Settings2 className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="section-title">{t('title')}</h2>
          <p className="section-subtitle">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="availability">
        <TabsList className="bg-muted/50 rounded-xl p-1 h-auto gap-1">
          <TabsTrigger
            value="availability"
            className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground px-4 py-2"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {t('availability')}
          </TabsTrigger>
          <TabsTrigger
            value="blocked"
            className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground px-4 py-2"
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
            {t('blockedDates')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="mt-5">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{t('weeklySchedule')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('weeklyScheduleDesc')}
              </p>
            </div>
            <div className="p-4 space-y-2.5">
              {DAY_KEYS.map((dayKey, idx) => (
                <AvailabilityRow
                  key={idx}
                  day={idx}
                  label={t(`days.${dayKey}`)}
                  dayShort={t(`daysShort.${DAY_SHORT_KEYS[idx]}`)}
                  rule={getRuleForDay(idx) as Parameters<typeof AvailabilityRow>[0]['rule']}
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
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{t('blockedDatesHolidays')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('blockedDatesDesc')}
              </p>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex gap-3 flex-wrap">
                <Input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-auto rounded-xl border-border focus:ring-primary focus:border-primary"
                />
                <Input
                  placeholder={t('reasonOptional')}
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="flex-1 min-w-[160px] rounded-xl border-border focus:ring-primary focus:border-primary"
                />
                <Button
                  onClick={() => addBlockedMutation.mutate()}
                  disabled={!newBlockedDate || addBlockedMutation.isPending}
                  className="btn-void-primary"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t('blockDate')}
                </Button>
              </div>
              {blockedDates.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{t('noBlockedDates')}</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">{t('noBlockedDatesDesc')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedDates.map((bd) => (
                    <div
                      key={bd.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 group hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {new Date(bd.date + 'T12:00:00').toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {bd.reason && <p className="text-xs text-muted-foreground mt-0.5">{bd.reason}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
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
