"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  Stethoscope,
  Settings,
  Bot,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserCircle,
  Activity,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const NAV_ITEMS = [
  { href: "/app/dashboard", labelKey: "dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/app/calendar", labelKey: "calendar", icon: Calendar, group: "main" },
  { href: "/app/appointments", labelKey: "appointments", icon: CalendarCheck, group: "main" },
  { href: "/app/patients", labelKey: "patients", icon: Users, group: "main" },
  { href: "/app/services", labelKey: "services", icon: Stethoscope, group: "main" },
  { href: "/app/ai-settings", labelKey: "aiSettings", icon: Bot, group: "config" },
  { href: "/app/settings", labelKey: "settings", icon: Settings, group: "config" },
  { href: "/app/billing", labelKey: "billing", icon: CreditCard, group: "config" },
  { href: "/app/profile", labelKey: "profile", icon: UserCircle, group: "config" },
] as const;

interface SidebarProps {
  clinicName?: string;
}

export function Sidebar({ clinicName = "My Clinic" }: SidebarProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t("signOut"));
    router.push("/login");
  };

  const mainItems = NAV_ITEMS.filter((i) => i.group === "main");
  const configItems = NAV_ITEMS.filter((i) => i.group === "config");

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen glass-sidebar transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-teal-50",
        collapsed && "justify-center px-2"
      )}>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-md shadow-teal-200/50">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-white pulse-dot" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm text-slate-800 tracking-tight">MedBook AI</div>
            <div className="text-[11px] text-teal-600 font-medium truncate max-w-[140px]">{clinicName}</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {/* Main group */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">{t("main")}</p>
        )}
        {mainItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                collapsed && "justify-center px-2",
                isActive
                  ? "nav-active text-teal-700"
                  : "text-slate-500 hover:bg-teal-50/60 hover:text-teal-700"
              )}
            >
              <item.icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                collapsed ? "w-5 h-5" : "w-4.5 h-4.5",
                isActive ? "text-teal-600" : "text-slate-400 group-hover:text-teal-500"
              )} style={{ width: collapsed ? 20 : 18, height: collapsed ? 20 : 18 }} />
              {!collapsed && <span className="truncate">{label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
              )}
            </Link>
          );
        })}

        {/* Config group */}
        <div className={cn("pt-3 mt-3 border-t border-slate-100/80", collapsed && "border-t")}>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">{t("config")}</p>
          )}
          {configItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "nav-active text-teal-700"
                    : "text-slate-500 hover:bg-teal-50/60 hover:text-teal-700"
                )}
              >
                <item.icon className={cn(
                  "flex-shrink-0 transition-colors duration-200",
                  isActive ? "text-teal-600" : "text-slate-400 group-hover:text-teal-500"
                )} style={{ width: collapsed ? 20 : 18, height: collapsed ? 20 : 18 }} />
                {!collapsed && <span className="truncate">{label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI badge */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-teal-700">{t("aiPowered")}</p>
          </div>
          <p className="text-[10px] text-teal-500 mt-0.5">{t("aiDescription")}</p>
        </div>
      )}

      {/* Sign out */}
      <div className="px-2 pb-4 border-t border-slate-100/80 pt-2">
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
            collapsed && "justify-center px-2",
            "text-slate-400 hover:bg-red-50 hover:text-red-500"
          )}
        >
          <LogOut style={{ width: collapsed ? 20 : 18, height: collapsed ? 20 : 18 }} className="flex-shrink-0" />
          {!collapsed && <span>{t("signOut")}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-white border border-teal-100 rounded-full flex items-center justify-center text-teal-500 hover:bg-teal-50 hover:border-teal-200 transition-all shadow-sm z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
