"use client";

import { Bell, Search, ChevronDown, Settings, CreditCard, LogOut } from "lucide-react";
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

interface TopbarProps {
  title: string;
  userName?: string;
  userEmail?: string;
}

export function Topbar({ title, userName = "Doctor", userEmail }: TopbarProps) {
  const t = useTranslations("topbar");
  const router = useRouter();
  const supabase = createClient();

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
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-sm bg-primary" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9 w-64 h-9 bg-muted/50 border-border text-sm rounded-lg focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            />
          </div>

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Notification bell */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200">
            <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent border border-transparent hover:border-border transition-all duration-200 focus:outline-none group">
                <Avatar className="h-8 w-8 ring-2 ring-border">
                  <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-foreground leading-tight">{userName}</div>
                  {userEmail && (
                    <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{userEmail}</div>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block group-hover:text-foreground transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-lg border-border shadow-lg p-1">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">{t("myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => router.push("/app/settings")}
                className="rounded-md text-sm text-foreground hover:bg-accent cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/app/billing")}
                className="rounded-md text-sm text-foreground hover:bg-accent cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="rounded-md text-sm text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
