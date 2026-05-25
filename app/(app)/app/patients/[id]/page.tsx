"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getPatient, getPatientAppointments, updatePatient } from "@/actions/patients";
import { updateAppointmentMedicalNotes } from "@/actions/appointments";
import { InvitePatientButton } from "@/components/portail/invite-patient-button";
import { StartTeleconsultationButton } from "@/components/teleconsultation/start-teleconsultation-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ApiResponse } from "@/types";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface AppointmentWithService {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  medical_notes: string | null;
  teleconsultation_room_id: string | null;
  teleconsultation_status: "pending" | "active" | "ended" | null;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const AVATAR_GRADIENT_CLASSES = [
  "from-teal-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-blue-500 to-indigo-500",
];

function buildAvatarGradient(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_GRADIENT_CLASSES.length;
  return AVATAR_GRADIENT_CLASSES[index];
}

function buildStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "secondary";
    case "cancelled": return "destructive";
    default: return "default";
  }
}

function buildStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    booked: "Booked",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
  };
  return labels[status] ?? status;
}

function buildStatusIcon(status: string) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === "cancelled") return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  return <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />;
}

function calculateDurationMinutes(startAt: string, endAt: string): number {
  return Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
}

function findLastCompletedAppointment(appointments: AppointmentWithService[]): AppointmentWithService | undefined {
  return appointments.find((appointment) => appointment.status === "completed");
}

function findNextUpcomingAppointment(appointments: AppointmentWithService[]): AppointmentWithService | undefined {
  const now = new Date();
  return [...appointments]
    .reverse()
    .find(
      (appointment) =>
        new Date(appointment.start_at) > now &&
        (appointment.status === "booked" || appointment.status === "confirmed")
    );
}

/* ─── Edit patient form schema ───────────────────────────────────────────── */

const editPatientSchema = z.object({
  phone: z.string().min(7, "Valid phone number required"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  date_of_birth: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type EditPatientFormValues = z.infer<typeof editPatientSchema>;

/* ─── Sub-components ─────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="icon-container flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

interface AppointmentRowProps {
  appointment: AppointmentWithService;
  patientName: string;
  onSaveMedicalNotes: (appointmentId: string, notes: string) => Promise<void>;
  isSavingNotes: boolean;
}

function AppointmentRow({ appointment, patientName, onSaveMedicalNotes, isSavingNotes }: AppointmentRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [medicalNotesValue, setMedicalNotesValue] = useState(appointment.medical_notes ?? "");
  const durationMinutes = calculateDurationMinutes(appointment.start_at, appointment.end_at);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Row header — always visible */}
      <button
        onClick={() => setIsExpanded((previous) => !previous)}
        className="w-full flex items-center gap-4 p-4 bg-card hover:bg-accent transition-colors text-left"
      >
        {buildStatusIcon(appointment.status)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {appointment.service?.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(appointment.start_at), "MMM d, yyyy · h:mm a")}
            {" · "}
            {durationMinutes} min
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={buildStatusBadgeVariant(appointment.status)}>
            {buildStatusLabel(appointment.status)}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable detail panel */}
      {isExpanded && (
        <div className="p-4 bg-muted/20 border-t border-border space-y-4">
          {/* Téléconsultation */}
          {["booked", "confirmed"].includes(appointment.status) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Téléconsultation
              </p>
              <StartTeleconsultationButton
                appointmentId={appointment.id}
                patientName={patientName}
                doctorName="Médecin"
                existingSession={
                  appointment.teleconsultation_room_id && appointment.teleconsultation_status
                    ? {
                        room_id: appointment.teleconsultation_room_id,
                        room_url: `https://meet.jit.si/docflowai-${appointment.teleconsultation_room_id}`,
                        status: appointment.teleconsultation_status,
                      }
                    : null
                }
              />
            </div>
          )}

          {/* Booking notes */}
          {appointment.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Booking note
              </p>
              <p className="text-sm text-foreground leading-relaxed">{appointment.notes}</p>
            </div>
          )}

          {/* Medical notes */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Medical notes
              </p>
            </div>
            <Textarea
              value={medicalNotesValue}
              onChange={(event) => setMedicalNotesValue(event.target.value)}
              placeholder="Add clinical observations, diagnosis, treatment plan..."
              className="rounded-xl border-border focus:ring-primary focus:border-primary resize-none text-sm"
              rows={4}
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={() => onSaveMedicalNotes(appointment.id, medicalNotesValue)}
                disabled={isSavingNotes}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-medium"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSavingNotes ? "Saving..." : "Save medical notes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const patientId = params.id as string;

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [savingNotesForAppointmentId, setSavingNotesForAppointmentId] = useState<string | null>(null);

  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
    enabled: !!patientId,
  });

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: () => getPatientAppointments(patientId),
    enabled: !!patientId,
  });

  const typedAppointments = (appointments ?? []) as AppointmentWithService[];

  /* ─ Stats ─ */
  const totalConsultationCount = typedAppointments.length;
  const completedConsultationCount = typedAppointments.filter((a) => a.status === "completed").length;
  const lastCompletedAppointment = findLastCompletedAppointment(typedAppointments);
  const nextUpcomingAppointment = findNextUpcomingAppointment(typedAppointments);

  /* ─ Edit patient form ─ */
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditPatientFormValues>({
    resolver: zodResolver(editPatientSchema),
    values: {
      phone: patient?.phone ?? "",
      email: patient?.email ?? "",
      date_of_birth: (patient as any)?.date_of_birth ?? "",
      notes: patient?.notes ?? "",
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: (formData: EditPatientFormValues) => updatePatient(patientId, formData as any),
    onSuccess: (result: ApiResponse) => {
      if (result.success) {
        toast.success("Patient updated");
        queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
        setShowEditDialog(false);
      } else {
        toast.error(result.error ?? "Failed to update patient");
      }
    },
  });

  /* ─ Medical notes save ─ */
  async function handleSaveMedicalNotes(appointmentId: string, notes: string): Promise<void> {
    setSavingNotesForAppointmentId(appointmentId);
    try {
      const result = await updateAppointmentMedicalNotes(appointmentId, notes);
      if (result.success) {
        toast.success("Medical notes saved");
        queryClient.invalidateQueries({ queryKey: ["patient-appointments", patientId] });
      } else {
        toast.error(result.error ?? "Failed to save notes");
      }
    } finally {
      setSavingNotesForAppointmentId(null);
    }
  }

  /* ─ Loading state ─ */
  if (isLoadingPatient) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <div className="glass-card p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-2xl flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48 rounded-xl" />
              <Skeleton className="h-4 w-36 rounded-xl" />
              <Skeleton className="h-4 w-44 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container text-center py-20">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-foreground font-medium">Patient not found</p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl"
          onClick={() => router.push("/app/patients")}
        >
          Back to patients
        </Button>
      </div>
    );
  }

  const avatarGradient = buildAvatarGradient(patient.full_name);
  const patientInitials = patient.full_name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div className="page-container space-y-6">

      {/* ─ Back navigation ─ */}
      <button
        onClick={() => router.push("/app/patients")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Patients
      </button>

      {/* ─ Patient header card ─ */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md`}
          >
            {patientInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{patient.full_name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5 text-primary" />
                {patient.phone}
              </span>
              {patient.email && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {patient.email}
                </span>
              )}
              {(patient as any).date_of_birth && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {format(parseISO((patient as any).date_of_birth), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─ Stat cards ─ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total consultations"
          value={totalConsultationCount}
          icon={<Calendar className="w-5 h-5 text-primary" strokeWidth={1.8} />}
        />
        <StatCard
          label="Completed"
          value={completedConsultationCount}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" strokeWidth={1.8} />}
        />
        <StatCard
          label="Last visit"
          value={
            lastCompletedAppointment
              ? formatDistanceToNow(parseISO(lastCompletedAppointment.start_at), { addSuffix: true })
              : "None"
          }
          icon={<Clock className="w-5 h-5 text-primary" strokeWidth={1.8} />}
        />
        <StatCard
          label="Next appointment"
          value={
            nextUpcomingAppointment
              ? format(parseISO(nextUpcomingAppointment.start_at), "MMM d")
              : "None"
          }
          icon={<Calendar className="w-5 h-5 text-violet-500" strokeWidth={1.8} />}
        />
      </div>

      {/* ─ Patient information card ─ */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="section-header">
            <div className="icon-container">
              <FileText className="w-5 h-5 text-primary" strokeWidth={1.8} />
            </div>
            <h2 className="section-title">Patient information</h2>
          </div>
          <div className="flex items-center gap-2">
            <InvitePatientButton
              patientId={patient.id}
              hasEmail={!!patient.email}
              alreadyInvited={!!(patient as any).portal_invited_at}
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border text-sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</p>
            <p className="text-sm text-foreground">{patient.phone}</p>
          </div>
          {patient.email && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="text-sm text-foreground">{patient.email}</p>
            </div>
          )}
          {(patient as any).date_of_birth && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date of birth</p>
              <p className="text-sm text-foreground">
                {format(parseISO((patient as any).date_of_birth), "MMM d, yyyy")}
              </p>
            </div>
          )}
          {patient.notes && (
            <div className="sm:col-span-2 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">General notes</p>
              <p className="text-sm text-foreground leading-relaxed">{patient.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ─ Consultation history ─ */}
      <div className="glass-card p-6">
        <div className="section-header mb-5">
          <div className="icon-container">
            <Stethoscope className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <h2 className="section-title">Consultation history</h2>
        </div>

        {isLoadingAppointments ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : typedAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No consultations recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {typedAppointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                patientName={patient?.full_name ?? "Patient"}
                onSaveMedicalNotes={handleSaveMedicalNotes}
                isSavingNotes={savingNotesForAppointmentId === appointment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─ Edit patient dialog ─ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-xl border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <div className="icon-container-sm">
                <Edit className="w-4 h-4 text-primary" />
              </div>
              Edit patient
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((formData) => updatePatientMutation.mutate(formData))}
            className="space-y-4 mt-1"
          >
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Phone</Label>
              <Input
                placeholder="+1 555 000 0000"
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Email{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="email"
                placeholder="patient@example.com"
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                {...register("email")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Date of birth{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="date"
                className="rounded-xl border-border focus:ring-primary focus:border-primary"
                {...register("date_of_birth")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                General notes{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                placeholder="Allergies, chronic conditions, preferences..."
                className="rounded-xl border-border focus:ring-primary focus:border-primary resize-none"
                rows={3}
                {...register("notes")}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-border"
                onClick={() => { setShowEditDialog(false); reset(); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium"
                disabled={updatePatientMutation.isPending}
              >
                {updatePatientMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
