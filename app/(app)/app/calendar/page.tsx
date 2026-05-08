'use client'

import { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { CalendarDays, Clock, User, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateAppointmentTime, updateAppointmentStatus } from '@/actions/appointments'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AppointmentWithRelations } from '@/types'
import { getStatusColor, getStatusLabel } from '@/lib/utils'

async function fetchClinicId() {
  const supabase = createClient() as any
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single()
  return data?.clinic_id || null
}

async function fetchCalendarAppointments(clinicId: string) {
  const supabase = createClient() as any
  const { data } = await supabase
    .from('appointments')
    .select('*, patient:patients(*), service:services(*)')
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

const STATUS_LABELS: Record<string, { label: string; dot: string }> = {
  booked: { label: 'Booked', dot: 'bg-cyan-500' },
  confirmed: { label: 'Confirmed', dot: 'bg-teal-500' },
  completed: { label: 'Completed', dot: 'bg-slate-400' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400' },
  no_show: { label: 'No Show', dot: 'bg-amber-400' },
}

export default function CalendarPage() {
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithRelations | null>(null)
  const queryClient = useQueryClient()

  const { data: clinicId } = useQuery({
    queryKey: ['clinicId'],
    queryFn: fetchClinicId,
  })

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['calendar-appointments', clinicId],
    queryFn: () => fetchCalendarAppointments(clinicId!),
    enabled: !!clinicId,
  })

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

  const events = appointments.map((appt) => ({
    id: appt.id,
    title: `${appt.patient?.full_name} — ${appt.service?.name}`,
    start: appt.start_at,
    end: appt.end_at,
    backgroundColor: STATUS_COLORS[appt.status] || STATUS_COLORS.booked,
    borderColor: STATUS_COLORS[appt.status] || STATUS_COLORS.booked,
    extendedProps: { appointment: appt },
  }))

  return (
    <div className="p-6 h-full space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-foreground" />
            </div>
            <h2 className="text-2xl font-medium text-foreground tracking-tight">Calendar</h2>
          </div>
          <p className="text-foreground/60 text-sm ml-10">
            Drag to reschedule · Click to view details
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([status, { label, dot }]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-foreground/60">
            <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div className="glass-card rounded-none overflow-hidden">
        <div className="p-4 fc-wrapper">
          {!isLoading && typeof window !== 'undefined' && (
            <FullCalendarWrapper
              events={events}
              onEventClick={(appt) => setSelectedAppt(appt)}
              onEventDrop={({ id, startAt, endAt }) =>
                updateTimeMutation.mutate({ id, startAt, endAt })
              }
            />
          )}
          {isLoading && (
            <div className="h-96 flex items-center justify-center text-foreground/50 text-sm">
              Loading calendar...
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selectedAppt} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent className="glass-card border-0 rounded-none p-0 overflow-hidden max-w-md">
          {selectedAppt && (
            <>
              <DialogHeader className="border-b border-foreground/10 bg-foreground/[0.02] p-6 pb-5">
                <DialogTitle className="text-foreground text-lg font-medium">
                  Appointment Details
                </DialogTitle>
                <p className="text-teal-100/80 text-sm mt-0.5">
                  {format(parseISO(selectedAppt.start_at), 'EEEE, MMM d, yyyy')}
                </p>
              </DialogHeader>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/50 uppercase tracking-wide">
                      <User className="w-3 h-3" /> Patient
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {selectedAppt.patient?.full_name}
                    </p>
                    <p className="text-foreground/60 text-xs">{selectedAppt.patient?.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/50 uppercase tracking-wide">
                      <Stethoscope className="w-3 h-3" /> Service
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {selectedAppt.service?.name}
                    </p>
                    <p className="text-foreground/60 text-xs">
                      {selectedAppt.service?.duration_minutes} min
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/50 uppercase tracking-wide">
                      <Clock className="w-3 h-3" /> Time
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {format(parseISO(selectedAppt.start_at), 'h:mm a')} &mdash;{' '}
                      {format(parseISO(selectedAppt.end_at), 'h:mm a')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAppt.status)}`}
                    >
                      {getStatusLabel(selectedAppt.status)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-foreground/10">
                  {selectedAppt.status !== 'confirmed' && (
                    <Button
                      size="sm"
                      className="bg-transparent border border-[#14b8a6] text-[#14b8a6] h-8 text-xs px-4 uppercase tracking-widest hover:bg-[#14b8a6]/10 transition-colors"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedAppt.id,
                          status: 'confirmed',
                        })
                      }
                    >
                      Confirm
                    </Button>
                  )}
                  {selectedAppt.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none h-8 text-xs border-foreground/10 text-foreground/70 hover:border-[#14b8a6]/50 hover:text-teal-700"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedAppt.id,
                          status: 'completed',
                        })
                      }
                    >
                      Mark Completed
                    </Button>
                  )}
                  {selectedAppt.status !== 'no_show' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none h-8 text-xs border-foreground/10 text-foreground/70 hover:border-amber-300 hover:text-amber-700"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedAppt.id,
                          status: 'no_show',
                        })
                      }
                    >
                      No Show
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-none h-8 text-xs"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedAppt.id,
                        status: 'cancelled',
                      })
                    }
                  >
                    Cancel
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

function FullCalendarWrapper({
  events,
  onEventClick,
  onEventDrop,
}: {
  events: Record<string, unknown>[]
  onEventClick: (appt: AppointmentWithRelations) => void
  onEventDrop: (args: { id: string; startAt: string; endAt: string }) => void
}) {
  const calendarModules = useCallback(async () => {
    const [
      { default: FC },
      { default: dayGridPlugin },
      { default: timeGridPlugin },
      { default: interactionPlugin },
    ] = await Promise.all([
      import('@fullcalendar/react'),
      import('@fullcalendar/daygrid'),
      import('@fullcalendar/timegrid'),
      import('@fullcalendar/interaction'),
    ])

    return { FC, dayGridPlugin, timeGridPlugin, interactionPlugin }
  }, [])

  const [modules, setModules] = useState<Awaited<ReturnType<typeof calendarModules>> | null>(null)

  if (typeof window !== 'undefined' && !modules) {
    calendarModules().then(setModules)
  }

  if (!modules) {
    return (
      <div className="h-96 flex items-center justify-center text-foreground/50 text-sm">
        Loading calendar...
      </div>
    )
  }

  const { FC, dayGridPlugin, timeGridPlugin, interactionPlugin } = modules

  return (
    <FC
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
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
