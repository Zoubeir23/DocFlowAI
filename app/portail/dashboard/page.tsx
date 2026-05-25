import { redirect } from "next/navigation";
import { getPatientPortalData } from "@/actions/patient-portal";
import { createClient } from "@/lib/supabase/server";
import { format, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, FileText, LogOut, CalendarPlus } from "lucide-react";
import { CancelAppointmentButton } from "@/components/portail/cancel-appointment-button";
import { JoinTeleconsultationButton } from "@/components/teleconsultation/join-teleconsultation-button";
import { PayAppointmentButton } from "@/components/portail/pay-appointment-button";
import { PaymentStatusBanner } from "@/components/portail/payment-status-banner";
import { PreconsultationForm } from "@/components/portail/preconsultation-form";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  booked:     { label: "Confirmé",  color: "text-blue-600 bg-blue-50 border-blue-200",    icon: Calendar },
  confirmed:  { label: "Confirmé",  color: "text-blue-600 bg-blue-50 border-blue-200",    icon: Calendar },
  completed:  { label: "Terminé",   color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  cancelled:  { label: "Annulé",    color: "text-red-600 bg-red-50 border-red-200",       icon: XCircle },
  no_show:    { label: "Absent",    color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle },
};

export default async function PortailDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portail/login");

  const portalData = await getPatientPortalData();
  if (!portalData) redirect("/portail/login");

  const { patient, appointments } = portalData;
  const { payment } = await searchParams;
  const upcoming = appointments.filter((a) => a.status !== "cancelled" && a.status !== "no_show" && isFuture(new Date(a.start_at)));
  const past = appointments.filter((a) => a.status === "completed" || a.status === "no_show" || (a.status === "cancelled") || isPast(new Date(a.start_at)));

  const clinicName = (patient.clinics as any)?.name ?? "Votre clinique";

  return (
    <div className="space-y-8">
      {["success", "cancelled"].includes(payment ?? "") && <PaymentStatusBanner status={payment!} />}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonjour, {patient.full_name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivi de vos soins — <span className="font-medium text-foreground">{clinicName}</span>
          </p>
        </div>
        <form action="/api/auth/signout?from=portail" method="POST">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </form>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">RDV au total</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {appointments.filter((a) => a.status === "completed").length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Consultations terminées</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-primary">{upcoming.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">À venir</p>
        </div>
      </div>

      {/* Prochains RDV */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Prochains rendez-vous
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
            Aucun rendez-vous à venir
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appointment) => {
              const service = appointment.services as any;
              const config = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.booked;
              const StatusIcon = config.icon;
              const canCancel = ["booked", "confirmed"].includes(appointment.status) && isFuture(new Date(appointment.start_at));
              const canPay = (service?.price ?? 0) > 0 && appointment.payment_status !== "paid" && appointment.payment_status !== "not_required" && appointment.payment_status !== "pending";

              return (
                <div key={appointment.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{service?.name ?? "Consultation"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(appointment.start_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                        {service?.price && (
                          <p className="text-xs text-muted-foreground">
                            {Number(service.price).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      {canPay && (
                        <PayAppointmentButton
                          appointmentId={appointment.id}
                          price={Number(service.price)}
                          paymentStatus={appointment.payment_status}
                        />
                      )}
                      {canCancel && (
                        <CancelAppointmentButton appointmentId={appointment.id} />
                      )}
                      <a
                        href={`/api/calendar/appointment/${appointment.id}`}
                        download
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <CalendarPlus className="w-3 h-3" />
                        Ajouter au calendrier
                      </a>
                      {appointment.teleconsultation_room_id && appointment.teleconsultation_status !== "ended" && (
                        <JoinTeleconsultationButton
                          session={{
                            room_id: appointment.teleconsultation_room_id,
                            room_url: `https://meet.jit.si/docflowai-${appointment.teleconsultation_room_id}`,
                            status: appointment.teleconsultation_status ?? "pending",
                          }}
                          patientName={patient.full_name}
                        />
                      )}
                    </div>
                  </div>
                  <PreconsultationForm
                    appointmentId={appointment.id}
                    alreadySubmitted={!!appointment.preconsultation_submitted_at}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Historique */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Historique
          </h2>
          <div className="space-y-2">
            {past.slice(0, 10).map((appointment) => {
              const service = appointment.services as any;
              const config = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.completed;
              const StatusIcon = config.icon;

              return (
                <div key={appointment.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{service?.name ?? "Consultation"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appointment.start_at), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
