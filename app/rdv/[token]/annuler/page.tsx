import { cancelAppointmentByToken } from "@/actions/appointments";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, Calendar, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function AppointmentCancellationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ confirm?: string }>;
}) {
  const { token } = await params;
  const { confirm } = await searchParams;

  const { data: appointment, error } = await getAppointmentByToken(token);

  if (error || !appointment) {
    notFound();
  }

  const alreadyCancelled = appointment.status === "cancelled";
  const isPast = new Date(appointment.start_at) < new Date();

  if (confirm === "1" && !alreadyCancelled && !isPast) {
    await cancelAppointmentByToken(token);
    return <CancellationConfirmed appointment={appointment} />;
  }

  if (alreadyCancelled) {
    return <AlreadyCancelled />;
  }

  if (isPast) {
    return <AppointmentPast />;
  }

  return <CancellationPrompt token={token} appointment={appointment} />;
}

async function getAppointmentByToken(token: string) {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const db = await createAdminClient() as any;

  const { data, error } = await db
    .from("appointments")
    .select(`
      id, status, start_at,
      patients ( full_name ),
      services ( name ),
      clinics ( name, slug )
    `)
    .eq("cancel_token", token)
    .maybeSingle();

  return { data, error };
}

function CancellationPrompt({
  token,
  appointment,
}: {
  token: string;
  appointment: any;
}) {
  return (
    <PageShell>
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
        <Calendar className="w-8 h-8 text-amber-500" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">
        Annuler votre rendez-vous
      </h1>
      <p className="text-slate-500 mb-8 text-sm leading-relaxed">
        Vous êtes sur le point d&apos;annuler le rendez-vous suivant :
      </p>

      <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left space-y-3">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700 font-medium">
            {formatDateTime(appointment.start_at)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700">
            {appointment.services?.name} — {appointment.clinics?.name}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={`/rdv/${token}/annuler?confirm=1`}
          className="w-full py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full text-sm text-center transition-colors"
        >
          Confirmer l&apos;annulation
        </Link>
        {appointment.clinics?.slug && (
          <Link
            href={`/clinique/${appointment.clinics.slug}`}
            className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full text-sm text-center transition-colors"
          >
            Non, garder mon rendez-vous
          </Link>
        )}
      </div>
    </PageShell>
  );
}

function CancellationConfirmed({ appointment }: { appointment: any }) {
  return (
    <PageShell>
      <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">
        Rendez-vous annulé
      </h1>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">
        Votre rendez-vous du{" "}
        <strong className="text-slate-700">{formatDateTime(appointment.start_at)}</strong>{" "}
        a bien été annulé. Vous pouvez reprendre rendez-vous à tout moment.
      </p>
      {appointment.clinics?.slug && (
        <Link
          href={`/clinique/${appointment.clinics.slug}`}
          className="inline-flex items-center gap-2 py-3 px-6 bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-full text-sm transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Reprendre un rendez-vous
        </Link>
      )}
    </PageShell>
  );
}

function AlreadyCancelled() {
  return (
    <PageShell>
      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-8 h-8 text-slate-400" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">
        Déjà annulé
      </h1>
      <p className="text-slate-500 text-sm">
        Ce rendez-vous a déjà été annulé.
      </p>
    </PageShell>
  );
}

function AppointmentPast() {
  return (
    <PageShell>
      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-8 h-8 text-slate-400" />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">
        Rendez-vous passé
      </h1>
      <p className="text-slate-500 text-sm">
        Ce rendez-vous est déjà passé et ne peut plus être annulé.
      </p>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="DocFlow IA"
            width={120}
            height={32}
            className="object-contain mx-auto opacity-60"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
