"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  CalendarCheck2,
  Users,
  HeartPulse,
  Settings2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserCircle2,
  Sparkles,
  Globe2,
  X,
  AlertTriangle,
  Clock,
  UsersRound,
  BarChart3,
  HeadphonesIcon,
  Building2,
  Plug,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSidebarStore } from "@/lib/store/sidebar-store";
import { differenceInDays, isPast, parseISO } from "date-fns";
import { useRole } from "@/lib/hooks/use-role";
import type { UserRole } from "@/lib/rbac";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  group: "main" | "config";
  minRole: UserRole;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard",      labelKey: "dashboard",      icon: LayoutGrid,      group: "main",   minRole: "receptionist" },
  { href: "/app/calendar",       labelKey: "calendar",       icon: CalendarDays,    group: "main",   minRole: "receptionist" },
  { href: "/app/appointments",   labelKey: "appointments",   icon: CalendarCheck2,  group: "main",   minRole: "receptionist" },
  { href: "/app/patients",       labelKey: "patients",       icon: Users,           group: "main",   minRole: "receptionist" },
  { href: "/app/diagnostics",    labelKey: "diagnostics",    icon: Stethoscope,     group: "main",   minRole: "receptionist" },
  { href: "/app/waitlist",       labelKey: "waitlist",       icon: Clock,           group: "main",   minRole: "receptionist" },
  { href: "/app/services",       labelKey: "services",       icon: HeartPulse,      group: "main",   minRole: "owner" },
  { href: "/app/analytics",      labelKey: "analytics",      icon: BarChart3,       group: "main",   minRole: "owner" },
  { href: "/app/team",           labelKey: "team",           icon: UsersRound,      group: "config", minRole: "owner" },
  { href: "/app/clinics",        labelKey: "clinics",        icon: Building2,       group: "config", minRole: "owner" },
  { href: "/app/integrations",   labelKey: "integrations",   icon: Plug,            group: "config", minRole: "owner" },
  { href: "/app/support",        labelKey: "support",        icon: HeadphonesIcon,  group: "config", minRole: "receptionist" },
  { href: "/app/ai-settings",    labelKey: "aiSettings",     icon: Sparkles,        group: "config", minRole: "owner" },
  { href: "/app/website-builder",labelKey: "websiteBuilder", icon: Globe2,          group: "config", minRole: "owner" },
  { href: "/app/settings",       labelKey: "settings",       icon: Settings2,       group: "config", minRole: "owner" },
  { href: "/app/billing",        labelKey: "billing",        icon: CreditCard,      group: "config", minRole: "owner" },
  { href: "/app/profile",        labelKey: "profile",        icon: UserCircle2,     group: "config", minRole: "receptionist" },
];

const ROLE_HIERARCHY: Record<UserRole, number> = {
  receptionist: 0,
  assistant: 0,
  owner: 1,
  super_admin: 2,
};

function canSeeItem(userRole: UserRole | null, minRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

interface SidebarProps {
  clinicName?: string;
}

interface SidebarAlertState {
  expiryDate: string | null;
  plan: string | null;
  apptCurrent: number;
  apptLimit: number | null;
}

function SidebarAlertBanner({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations("navigation");
  const [state, setState] = useState<SidebarAlertState>({
    expiryDate: null,
    plan: null,
    apptCurrent: 0,
    apptLimit: null,
  });

  useEffect(() => {
    const supabase = createClient() as ReturnType<typeof createClient>;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await (supabase as any)
        .from("users").select("clinic_id").eq("id", user.id).single();
      if (!userData) return;

      const clinicId = userData.clinic_id;

      const [{ data: sub }, { count: apptCount }] = await Promise.all([
        (supabase as any)
          .from("subscriptions")
          .select("current_period_end, plan, status, current_period_start")
          .eq("clinic_id", clinicId)
          .single(),
        (supabase as any)
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId)
          .neq("status", "cancelled"),
      ]);

      if (sub) {
        const planLimits: Record<string, number | null> = {
          free: 50, starter: 200, professional: null, enterprise: null,
        };
        setState({
          expiryDate: sub.current_period_end,
          plan: sub.plan,
          apptCurrent: apptCount ?? 0,
          apptLimit: planLimits[sub.plan] ?? 50,
        });
      }
    })();
  }, []);

  const { expiryDate, plan, apptCurrent, apptLimit } = state;

  const apptPct = apptLimit ? (apptCurrent / apptLimit) * 100 : 0;
  const isApptCritical = apptLimit !== null && apptCurrent >= apptLimit;
  const isApptWarning = apptLimit !== null && apptPct >= 80 && !isApptCritical;

  const showQuotaAlert = isApptCritical || isApptWarning;

  const showExpiryAlert = (() => {
    if (!expiryDate || plan === "free") return false;
    const expiry = parseISO(expiryDate);
    const daysLeft = differenceInDays(expiry, new Date());
    return isPast(expiry) || daysLeft <= 7;
  })();

  if (!showQuotaAlert && !showExpiryAlert) return null;

  // Collapsed: show a single icon badge
  if (collapsed) {
    const title = isApptCritical
      ? t("quotaApptLimitReached")
      : isApptWarning
        ? `${apptCurrent}/${apptLimit} RDV utilisés`
        : showExpiryAlert
          ? t("subscriptionRenew")
          : "";
    return (
      <Link href="/app/billing" title={title}
        className={cn("mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
          isApptCritical
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-amber-500/10 border-amber-500/30 text-amber-600")}>
        <AlertTriangle className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <div className="mx-3 mb-3 space-y-2">
      {/* Quota alert */}
      {showQuotaAlert && (
        <Link href="/app/billing"
          className={cn("flex items-start gap-2.5 rounded-xl border p-3 transition-all hover:opacity-90",
            isApptCritical
              ? "bg-destructive/8 border-destructive/25 text-destructive"
              : "bg-amber-500/8 border-amber-500/25 text-amber-700 dark:text-amber-400")}>
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold leading-tight">
              {isApptCritical ? t("quotaApptLimitReached") : `${apptCurrent} / ${apptLimit} RDV ce mois`}
            </p>
            <p className="text-[10px] opacity-75 mt-0.5 leading-snug">
              {isApptCritical ? t("quotaUpgradePlan") : t("quotaNearLimit")}
            </p>
            {apptLimit && (
              <div className="mt-1.5 h-1 bg-current/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current rounded-full transition-all"
                  style={{ width: `${Math.min(apptPct, 100)}%` }}
                />
              </div>
            )}
          </div>
        </Link>
      )}
      {/* Expiry alert */}
      {showExpiryAlert && expiryDate && (() => {
        const expiry = parseISO(expiryDate);
        const isExpired = isPast(expiry);
        const daysLeft = differenceInDays(expiry, new Date());
        return (
          <Link href="/app/billing"
            className={cn("flex items-start gap-2.5 rounded-xl border p-3 transition-all hover:opacity-90",
              isExpired
                ? "bg-destructive/8 border-destructive/25 text-destructive"
                : "bg-amber-500/8 border-amber-500/25 text-amber-700 dark:text-amber-400")}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-tight">
                {isExpired ? t("planExpired") : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`}
              </p>
              <p className="text-[10px] opacity-75 mt-0.5 leading-snug">
                {isExpired ? t("planRenewNow") : t("planRenewBefore")}
              </p>
            </div>
            <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60" />
          </Link>
        );
      })()}
    </div>
  );
}

export function Sidebar({ clinicName = "My Clinic" }: SidebarProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const { isOpenMobile, setIsOpenMobile } = useSidebarStore();
  const { role } = useRole();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t("signOut"));
    router.push("/login");
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpenMobile(false);
  }, [pathname, setIsOpenMobile]);

  const mainItems = NAV_ITEMS.filter((i) => i.group === "main" && canSeeItem(role, i.minRole));
  const configItems = NAV_ITEMS.filter((i) => i.group === "config" && canSeeItem(role, i.minRole));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-card border-r border-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isOpenMobile ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-[72px]" : "md:w-[260px]",
          "w-[280px]" // Fixed width for mobile
        )}
      >
        <div className={cn(
          "flex items-center gap-3 px-5 h-20 border-b border-border bg-card/50 backdrop-blur-md relative",
          collapsed && "md:justify-center md:px-2"
        )}>
          {collapsed ? (
            <Image src="/logo.png" alt="DocFlow IA" width={32} height={32} className="object-contain dark:brightness-0 dark:invert hidden md:block" />
          ) : (
            <div className="flex flex-col gap-0.5 truncate">
              <Image src="/logo.png" alt="DocFlow IA" width={110} height={28} className="object-contain dark:brightness-0 dark:invert" />
              <span className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase truncate mt-1 opacity-70">{clinicName}</span>
            </div>
          )}
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-muted rounded-full hover:bg-accent text-foreground"
            onClick={() => setIsOpenMobile(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto scrollbar-hide px-3">
          {/* Main group */}
          <div className={cn(collapsed && "md:hidden", "px-3 mb-3")}>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{t("main")}</p>
          </div>
          {mainItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3.5 px-3 py-3 text-sm rounded-xl transition-all duration-300 group font-medium relative",
                  collapsed && "md:justify-center md:px-2",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <div className={cn(
                  "flex items-center justify-center rounded-lg transition-transform duration-300 flex-shrink-0 group-hover:scale-110",
                  collapsed ? "md:w-9 md:h-9" : "w-8 h-8",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}>
                  <item.icon className={cn(
                    collapsed ? "md:w-5 md:h-5" : "w-[18px] h-[18px]",
                  )} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}

          {/* Config group */}
          <div className="pt-6 mt-6 border-t border-border/50">
            <div className={cn(collapsed && "md:hidden", "px-3 mb-3")}>
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{t("config")}</p>
            </div>
            {configItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const label = t(item.labelKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-3.5 px-3 py-3 text-sm rounded-xl transition-all duration-300 group font-medium relative",
                    collapsed && "md:justify-center md:px-2",
                    isActive
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <div className={cn(
                    "flex items-center justify-center rounded-lg transition-transform duration-300 flex-shrink-0 group-hover:scale-110",
                    collapsed ? "md:w-9 md:h-9" : "w-8 h-8",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    <item.icon className={cn(
                      collapsed ? "md:w-5 md:h-5" : "w-[18px] h-[18px]",
                    )} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quota & expiry alerts */}
        <SidebarAlertBanner collapsed={collapsed} />

        {/* AI badge */}
        <div className={cn("px-4 mb-4", collapsed && "md:hidden")}>
          <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest">AI ACTIVE</span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={cn(
          "p-4 border-t border-border/50 space-y-3 bg-muted/20",
          collapsed ? "md:items-center" : ""
        )}>
          {/* Controls */}
          <div className={cn("flex items-center gap-2", collapsed ? "md:flex-col md:justify-center md:gap-3" : "justify-between px-2")}>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-3 text-sm font-bold transition-all duration-300 w-full text-left group rounded-xl",
              collapsed && "md:justify-center md:px-2",
              "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
            )}
          >
            <LogOut strokeWidth={2.5} className="w-[18px] h-[18px] flex-shrink-0 transition-transform group-hover:-translate-x-1" />
            <span className={cn(collapsed && "md:hidden")}>{t("signOut")}</span>
          </button>
        </div>

        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-4 top-16 w-8 h-8 rounded-full bg-background border-2 border-primary/20 hover:border-primary shadow-xl items-center justify-center text-foreground hover:bg-primary/5 transition-all z-[100]"
        >
          {collapsed ? <ChevronRight strokeWidth={3} className="w-4 h-4 text-primary" /> : <ChevronLeft strokeWidth={3} className="w-4 h-4 text-primary" />}
        </button>
      </aside>
    </>
  );
}
