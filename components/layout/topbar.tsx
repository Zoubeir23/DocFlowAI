"use client";

import { Search, ChevronDown, Settings2, CreditCard, LogOut, Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useSidebarStore } from "@/lib/store/sidebar-store";

interface TopbarProps {
  title: string;
  userName?: string;
  userEmail?: string;
}

export function Topbar({ title, userName = "Doctor", userEmail }: TopbarProps) {
  const t = useTranslations("topbar");
  const router = useRouter();
  const supabase = createClient();
  const { toggleMobile } = useSidebarStore();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left side: Hamburger (Mobile) + Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMobile}
            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-1.5 h-6 rounded-full bg-primary" />
            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{title}</h1>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9 w-72 h-10 bg-muted/30 border-border text-sm font-medium rounded-xl focus:ring-primary focus:border-primary placeholder:text-muted-foreground shadow-sm transition-all hover:bg-muted/50 focus:bg-background"
            />
          </div>

          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {/* Theme switcher */}
          <div className="flex items-center">
            <ThemeSwitcher />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-2 pr-2 md:pr-3 py-1.5 rounded-xl hover:bg-accent/50 border border-transparent transition-all duration-200 focus:outline-none group">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 shadow-sm transition-all group-hover:ring-primary/40">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-bold text-foreground leading-tight">{userName}</div>
                  {userEmail && (
                    <div className="text-xs text-muted-foreground font-medium truncate max-w-[150px]">{userEmail}</div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border shadow-xl p-1.5 font-medium">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-bold px-2 py-2 tracking-wider uppercase">{t("myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => router.push("/app/settings")}
                className="rounded-lg text-sm text-foreground hover:bg-accent hover:text-primary cursor-pointer py-2 px-3 transition-colors"
              >
                <Settings2 className="w-4 h-4 mr-3" />
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/app/billing")}
                className="rounded-lg text-sm text-foreground hover:bg-accent hover:text-primary cursor-pointer py-2 px-3 transition-colors"
              >
                <CreditCard className="w-4 h-4 mr-3" />
                {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="rounded-lg text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer py-2 px-3 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
