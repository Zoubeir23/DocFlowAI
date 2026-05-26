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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkAppointmentQuota(clinicId: string, db: any): Promise<QuotaResult> {
  const { data: sub } = await db
    .from("subscriptions")
    .select("plan, status, current_period_start, current_period_end")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  const rawPlan = sub?.plan as PlanName | undefined;
  const plan: PlanName = rawPlan && rawPlan in PLAN_LIMITS ? rawPlan : "free";

  const planLimits = PLAN_LIMITS[plan];
  const limit = planLimits.appointments;

  if (limit === null) {
    return { allowed: true, current: 0, limit: null, plan };
  }

  const periodStart =
    sub?.current_period_start ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd =
    sub?.current_period_end ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

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
    .select("plan")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  const rawPlan = sub?.plan as PlanName | undefined;
  const plan: PlanName = rawPlan && rawPlan in PLAN_LIMITS ? rawPlan : "free";

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
