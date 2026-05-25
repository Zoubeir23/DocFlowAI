'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { CalendarDays, Clock, User, HeartPulse, Lock, Zap, Users, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateAppointmentTime, updateAppointmentStatus } from '@/actions/appointments'
import { Button } from '@/components/ui/button'
import { AppointmentCreateModal } from '@/components/appointments/appointment-create-modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations, useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AppointmentWithRelations } from '@/types'
import type { TeamMember } from '@/actions/team'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import Link from 'next/link'

const PRACTITIONER_COLORS = [
  '#6366f1',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0284c7',
  '#65a30d',
]

async function fetchTeamMembers(clinicId: string): Promise<TeamMember[]> {
  const supabase = createClient() as any
  const { data } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at')
    .eq('clinic_id', clinicId)
    .order('created_at')
  return (data ?? []) as TeamMember[]
}

async function fetchClinicInfo(): Promise<{ clinicId: string; plan: string } | null> {
  const supabase = createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: userData } = await supabase.from('users').select('clinic_id').eq('id', user.id).single()
  if (!userData) return null
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('clinic_id', userData.clinic_id)
    .single()
  return { clinicId: userData.clinic_id, plan: sub?.plan ?? 'free' }
}

async function fetchCalendarAppointments(clinicId: string) {
  const supabase = createClient() as any
  const { data } = await supabase
    .from('appointments')
    .select('*, patient:patients(*), service:services(*), practitioner:users(id,full_name,email)')
    .eq('clinic_id', clinicId)
    .neq('status', 'cancelled')

  return (data || []) as unknown as AppointmentWithRelations[]
}

const STATUS_COLORS = {
  booked: '#0891b2',
  confirmed: '#0d9488',
  completed: '#64748b',
  cancelled: '#ef4444',
  no_show: '#f59e0b',
}

const STATUS_LABELS: Record<string, { labelKey: any; className: string }> = {
  booked: { labelKey: 'statusBooked', className: 'status-booked' },
  confirmed: { labelKey: 'statusConfirmed', className: 'status-confirmed' },
  completed: { labelKey: 'statusCompleted', className: 'status-completed' },
  cancelled: { labelKey: 'statusCancelled', className: 'status-cancelled' },
  no_show: { labelKey: 'statusNoShow', className: 'status-no_show' },
}

export default function CalendarPage() {
  const t = useTranslations('calendar')
  const locale = useLocale()
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithRelations | null>(null)
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: clinicInfo } = useQuery({
    queryKey: ['clinicInfo'],
    queryFn: fetchClinicInfo,
  })

  const clinicId = clinicInfo?.clinicId
  const isPaidPlan = clinicInfo?.plan !== undefined && clinicInfo.plan !== 'free'

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['calendar-appointments', clinicId],
    queryFn: () => fetchCalendarAppointments(clinicId!),
    enabled: !!clinicId,
  })

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['calendar-team-members', clinicId],
    queryFn: () => fetchTeamMembers(clinicId!),
    enabled: !!clinicId,
  })

  const practitionerColorMap: Record<string, string> = Object.fromEntries(
    teamMembers.map((member, index) => [
      member.id,
      PRACTITIONER_COLORS[index % PRACTITIONER_COLORS.length],
    ])
  )

  const visibleAppointments = selectedPractitionerId
    ? appointments.filter((a) => a.practitioner?.id === selectedPractitionerId)
    : appointments

  const updateTimeMutation = useMutation({
    mutationFn: ({ id, startAt, endAt }: { id: string; startAt: string; endAt: string }) =>
      updateAppointmentTime(id, startAt, endAt),
    onSuccess: () => {
      toast.success('Appointment rescheduled')
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })
    },
    onError: () => toast.error('Failed to reschedule appointment'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentWithRelations['status'] }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })
      setSelectedAppt(null)
    },
  })

  const events = visibleAppointments.map((appt) => {
    const practitionerColor = appt.practitioner?.id
      ? practitionerColorMap[appt.practitioner.id]
      : null
    const eventColor = practitionerColor ?? STATUS_COLORS[appt.status] ?? STATUS_COLORS.booked
    return {
      id: appt.id,
      title: `${appt.patient?.full_name} — ${appt.service?.name}`,
      start: appt.start_at,
      end: appt.end_at,
      backgroundColor: eventColor,
      borderColor: eventColor,
      textColor: '#ffffff',
      extendedProps: { appointment: appt },
    }
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── BOLD HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-card border-b border-border px-4 py-8 md:px-6 md:py-12 lg:px-10 lg:py-16 fade-in-up flex-shrink-0">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 md:mb-4">
              <CalendarDays className="w-5 h-5 text-primary" strokeWidth={2} />
              <span className="font-semibold text-xs text-primary uppercase tracking-[0.2em]">{t('agenda')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-2 md:mb-3">
              {t('title')}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              {t('subtitle')}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <a
                href="/api/calendar/export"
                download
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Exporter l'agenda (.ics)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export iCal</span>
              </a>
              <AppointmentCreateModal onCreated={() => queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })} />
            </div>
            {/* Plan badge */}
            {!isPaidPlan && clinicInfo && (
              <Link href="/app/billing"
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors">
                <Lock className="w-3.5 h-3.5" />
                <span className="underline">{t('basicCalendarBadge')}</span>
              </Link>
            )}
            {isPaidPlan && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                {t('fullCalendarBadge')}
              </div>
            )}

            {/* Practitioner filter */}
            {teamMembers.length > 0 && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <Select
                    value={selectedPractitionerId ?? 'all'}
                    onValueChange={(value) =>
                      setSelectedPractitionerId(value === 'all' ? null : value)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-44 border-border bg-background">
                      <SelectValue placeholder="All practitioners" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        All practitioners
                      </SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="text-xs">
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Practitioner color legend */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {teamMembers.map((member, index) => (
                    <button
                      key={member.id}
                      onClick={() =>
                        setSelectedPractitionerId(
                          selectedPractitionerId === member.id ? null : member.id
                        )
                      }
                      className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border transition-all ${
                        selectedPractitionerId === member.id
                          ? 'border-transparent opacity-100 shadow-sm'
                          : 'border-border opacity-70 hover:opacity-100'
                      }`}
                      style={
                        selectedPractitionerId === member.id
                          ? {
                              backgroundColor: `${PRACTITIONER_COLORS[index % PRACTITIONER_COLORS.length]}20`,
                              borderColor: PRACTITIONER_COLORS[index % PRACTITIONER_COLORS.length],
                            }
                          : {}
                      }
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: PRACTITIONER_COLORS[index % PRACTITIONER_COLORS.length],
                        }}
                      />
                      <span className="text-foreground">{member.full_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status legend */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap bg-background/50 backdrop-blur border border-border p-2 md:p-3 rounded-2xl">
              {Object.entries(STATUS_LABELS).map(([status, { labelKey, className }]) => (
                <div key={status} className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm ${className}`}>
                  <span>{t(labelKey as any)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT BODY ──────────────────────────────────────────────────────── */}
      <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 fade-in-up flex-1 w-full" style={{ animationDelay: "0.1s" }}>
        
        {/* Mobile Swipe Hint */}
        <div className="md:hidden flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 py-2 rounded-xl border border-border">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          {t('swipeHint')}
        </div>

        {/* Calendar card */}
        <div className="card-panel overflow-hidden w-full">
          <div className="p-4 md:p-6 fc-wrapper overflow-x-auto scrollbar-hide">
            <div className="min-w-[800px] md:min-w-0">
              {!isLoading && (
                <FullCalendarWrapper
                  events={events}
                  onEventClick={(appt) => setSelectedAppt(appt)}
                  onEventDrop={({ id, startAt, endAt }) =>
                    updateTimeMutation.mutate({ id, startAt, endAt })
                  }
                  locale={locale}
                  isPaidPlan={isPaidPlan}
                />
              )}
              {isLoading && (
                <div className="h-96 flex items-center justify-center text-muted-foreground font-semibold">
                  {t('loading')}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedAppt} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent className="glass-card border-border p-0 overflow-hidden max-w-md">
          {selectedAppt && (
            <>
              <DialogHeader className="border-b border-border bg-muted/30 p-6 pb-5">
                <DialogTitle className="text-foreground text-lg font-semibold">
                  {t('detailsTitle')}
                </DialogTitle>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {format(parseISO(selectedAppt.start_at), 'EEEE, MMM d, yyyy')}
                </p>
              </DialogHeader>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <User className="w-3 h-3" /> {t('patient')}
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {selectedAppt.patient?.full_name}
                    </p>
                    <p className="text-muted-foreground text-xs">{selectedAppt.patient?.phone}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <HeartPulse className="w-3 h-3" /> {t('service')}
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {selectedAppt.service?.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {selectedAppt.service?.duration_minutes} min
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Clock className="w-3 h-3" /> {t('time')}
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {format(parseISO(selectedAppt.start_at), 'h:mm a')} &mdash;{' '}
                      {format(parseISO(selectedAppt.end_at), 'h:mm a')}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('status')}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold status-${selectedAppt.status}`}
                    >
                      {getStatusLabel(selectedAppt.status)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {selectedAppt.status !== 'confirmed' && (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs px-4 rounded-lg font-medium"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedAppt.id,
                          status: 'confirmed',
                        })
                      }
                    >
                      {t('confirm')}
                    </Button>
                  )}
                  {selectedAppt.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 text-xs border-border text-foreground hover:bg-accent font-medium"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedAppt.id,
                          status: 'completed',
                        })
                      }
                    >
                      {t('markCompleted')}
                    </Button>
                  )}
                  {selectedAppt.status !== 'no_show' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-9 text-xs border-border text-foreground hover:bg-accent font-medium"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedAppt.id,
                          status: 'no_show',
                        })
                      }
                    >
                      {t('noShow')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-lg h-9 text-xs font-medium"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedAppt.id,
                        status: 'cancelled',
                      })
                    }
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'

function FullCalendarWrapper({
  events,
  onEventClick,
  onEventDrop,
  locale,
  isPaidPlan,
}: {
  events: Record<string, unknown>[]
  onEventClick: (appt: AppointmentWithRelations) => void
  onEventDrop: (args: { id: string; startAt: string; endAt: string }) => void
  locale: string
  isPaidPlan: boolean
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground text-sm font-semibold">
        Loading...
      </div>
    )
  }

  // Basique (Free) : vue mois uniquement, lecture seule
  if (!isPaidPlan) {
    return (
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        locales={[frLocale]}
        locale={locale.includes('fr') ? 'fr' : 'en'}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        events={events}
        editable={false}
        droppable={false}
        eventClick={(info) => {
          const appt = info.event.extendedProps?.appointment as AppointmentWithRelations
          if (appt) onEventClick(appt)
        }}
        height="auto"
        nowIndicator={true}
      />
    )
  }

  // Complet (Starter+) : toutes les vues + drag & drop
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      locales={[frLocale]}
      locale={locale.includes('fr') ? 'fr' : 'en'}
      initialView="timeGridWeek"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      events={events}
      editable={true}
      droppable={true}
      eventClick={(info) => {
        const appt = info.event.extendedProps?.appointment as AppointmentWithRelations
        if (appt) onEventClick(appt)
      }}
      eventDrop={(info) => {
        const start = info.event.start?.toISOString()
        const end = info.event.end?.toISOString()
        if (start && end) {
          onEventDrop({ id: info.event.id, startAt: start, endAt: end })
        }
      }}
      height="auto"
      slotMinTime="08:00:00"
      slotMaxTime="19:00:00"
      allDaySlot={false}
      nowIndicator={true}
      businessHours={{
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:00',
      }}
    />
  )
}
