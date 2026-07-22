export const PLAN_LIMITS = {
  free: { appointments: 50, staff: 1 },
  starter: { appointments: 200, staff: 3 },
  professional: { appointments: null, staff: 10 },
  enterprise: { appointments: null, staff: null },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export interface QuotaResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  plan: PlanName;
  reason?: string;
}

// Un essai 'trialing' non expiré donne accès aux quotas du plan payant
// souscrit ; un essai expiré (ou tout statut hors 'active') retombe sur le
// plan gratuit — même logique que le trigger DB enforce_appointment_quota
// (migration 021), qui protège les insertions faites hors de cette action.
function isSubscriptionEligible(status: string | undefined, currentPeriodEnd: string | undefined): boolean {
  if (status === "active") return true;
  if (status === "trialing" && currentPeriodEnd) {
    return new Date(currentPeriodEnd).getTime() > Date.now();
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkAppointmentQuota(clinicId: string, db: any): Promise<QuotaResult> {
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan, status, current_period_start, current_period_end")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  const rawPlan = sub?.plan as PlanName | undefined;
  // Un abonnement annulé/impayé ne conserve pas les quotas payants, quelle
  // que soit la valeur de `plan` restée en base tant qu'aucun downgrade
  // explicite n'a été appliqué.
  const isActive = sub?.status === "active";
  const plan: PlanName = isActive && rawPlan && rawPlan in PLAN_LIMITS ? rawPlan : "free";

  const planLimits = PLAN_LIMITS[plan];
  const limit = planLimits.appointments;

  if (limit === null) {
    return { allowed: true, current: 0, limit: null, plan };
  }

  // Le plan gratuit n'a pas de cycle de facturation qui se renouvelle : sa
  // current_period_end (fixée une fois à l'onboarding, +14 jours) reste figée
  // dans le passé indéfiniment, ce qui excluait tout RDV créé après coup du
  // comptage (.lte(periodEnd)) et désactivait silencieusement la limite.
  // On utilise donc une fenêtre glissante de 30 jours pour le plan gratuit.
  const periodStart =
    plan === "free"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      : sub?.current_period_start ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd =
    plan === "free"
      ? new Date().toISOString()
      : sub?.current_period_end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { count } = await db
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .neq("status", "cancelled")
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  const current = count ?? 0;
  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    plan,
    reason: allowed
      ? undefined
      : `Limite de ${limit} rendez-vous/mois atteinte (plan ${plan}). Passez à un plan supérieur pour continuer.`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkStaffQuota(clinicId: string, db: any): Promise<QuotaResult> {
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan, status")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  const rawPlan = sub?.plan as PlanName | undefined;
  const isActive = sub?.status === "active";
  const plan: PlanName = isActive && rawPlan && rawPlan in PLAN_LIMITS ? rawPlan : "free";

  const planLimits = PLAN_LIMITS[plan];
  const limit = planLimits.staff;

  if (limit === null) {
    return { allowed: true, current: 0, limit: null, plan };
  }

  const { count } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);

  const current = count ?? 0;
  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    plan,
    reason: allowed
      ? undefined
      : `Limite de ${limit} compte(s) staff atteinte (plan ${plan}). Passez à un plan supérieur pour ajouter des membres.`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getQuotaUsage(clinicId: string, db: any): Promise<{
  appointments: { current: number; limit: number | null; plan: PlanName };
  staff: { current: number; limit: number | null; plan: PlanName };
}> {
  const apptQuota = await checkAppointmentQuota(clinicId, db);
  const staffQuota = await checkStaffQuota(clinicId, db);

  return {
    appointments: { current: apptQuota.current, limit: apptQuota.limit, plan: apptQuota.plan },
    staff: { current: staffQuota.current, limit: staffQuota.limit, plan: staffQuota.plan },
  };
}
