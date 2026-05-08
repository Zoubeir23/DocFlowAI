"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarHeart,
  CalendarCheck,
  UsersRound,
  Stethoscope,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserCircle,
  Sparkles,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const NAV_ITEMS = [
  { href: "/app/dashboard", labelKey: "dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/app/calendar", labelKey: "calendar", icon: CalendarHeart, group: "main" },
  { href: "/app/appointments", labelKey: "appointments", icon: CalendarCheck, group: "main" },
  { href: "/app/patients", labelKey: "patients", icon: UsersRound, group: "main" },
  { href: "/app/services", labelKey: "services", icon: Stethoscope, group: "main" },
  { href: "/app/ai-settings", labelKey: "aiSettings", icon: Sparkles, group: "config" },
  { href: "/app/website-builder", labelKey: "websiteBuilder", icon: Globe, group: "config" },
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
        "relative flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 z-40",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo zone */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-16 border-b border-border",
        collapsed && "justify-center px-2"
      )}>
        {collapsed ? (
          <div className="w-8 h-[1px] bg-gradient-to-r from-primary to-transparent"></div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-[1px] bg-gradient-to-r from-primary to-transparent shrink-0"></div>
            <div className="flex flex-col gap-0.5 truncate">
              <Image src="/logo.png" alt="DocFlow IA" width={110} height={28} className="object-contain dark:brightness-0 dark:invert" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest truncate mt-1">{clinicName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {/* Main group */}
        {!collapsed && (
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-6 mb-3">{t("main")}</p>
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
                "flex items-center gap-3 px-6 py-2.5 text-sm transition-all duration-200 group",
                collapsed && "justify-center px-2",
                isActive
                  ? "text-primary font-medium bg-primary/10 border-r-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                collapsed ? "w-5 h-5" : "w-[18px] h-[18px]",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} strokeWidth={1.5} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}

        {/* Config group */}
        <div className={cn("pt-4 mt-4 border-t border-border")}>
          {!collapsed && (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-6 mb-3">{t("config")}</p>
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
                  "flex items-center gap-3 px-6 py-2.5 text-sm transition-all duration-200 group",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "text-primary font-medium bg-primary/10 border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className={cn(
                  "flex-shrink-0 transition-colors duration-200",
                  collapsed ? "w-5 h-5" : "w-[18px] h-[18px]",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} strokeWidth={1.5} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI badge */}
      {!collapsed && (
        <div className="px-6 mb-4">
          <div className="text-[11px] text-primary/60 uppercase tracking-widest flex items-center gap-2 font-medium">
            <Sparkles className="w-3 h-3" />
            AI ACTIVE
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className={cn(
        "p-4 border-t border-border space-y-2",
        collapsed ? "items-center" : ""
      )}>
        {/* Controls */}
        <div className={cn("flex items-center gap-2 mb-3", collapsed ? "flex-col justify-center gap-3" : "justify-start pl-2")}>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 w-full text-left group rounded-md",
            collapsed && "justify-center px-2",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          )}
        >
          <LogOut strokeWidth={1.5} className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>{t("signOut")}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-14 w-7 h-7 rounded-full bg-background border-2 border-primary/20 hover:border-primary shadow-lg flex items-center justify-center text-foreground hover:bg-primary/5 transition-all z-[100]"
      >
        {collapsed ? <ChevronRight strokeWidth={2.5} className="w-3.5 h-3.5 text-primary" /> : <ChevronLeft strokeWidth={2.5} className="w-3.5 h-3.5 text-primary" />}
      </button>
    </aside>
  );
}
