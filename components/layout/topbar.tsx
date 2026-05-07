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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full gradient-brand" />
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9 w-64 h-9 bg-slate-50 border-slate-200 text-sm rounded-xl focus:ring-teal-500 focus:border-teal-400 placeholder:text-slate-400"
            />
          </div>

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Notification bell */}
          <button className="relative p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all duration-200">
            <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full border-2 border-white" />
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-200 focus:outline-none group">
                <Avatar className="h-8 w-8 ring-2 ring-teal-100">
                  <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-700 leading-tight">{userName}</div>
                  {userEmail && (
                    <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{userEmail}</div>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block group-hover:text-teal-500 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-100 shadow-lg shadow-slate-200/50 p-1">
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal px-2 py-1.5">{t("myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                onClick={() => router.push("/app/settings")}
                className="rounded-lg text-sm text-slate-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2 text-slate-400" />
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/app/billing")}
                className="rounded-lg text-sm text-slate-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-2 text-slate-400" />
                {t("billing")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
