import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export async function PageHeader({ title, description }: PageHeaderProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = supabase as any;
  const { data: userData } = await db
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single() as { data: { full_name: string; email: string } | null };

  const initials = (userData?.full_name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all">
            <Bell style={{ width: 18, height: 18 }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full border-2 border-white" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all focus:outline-none">
                <Avatar className="h-8 w-8 ring-2 ring-teal-100">
                  <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-700 leading-tight">{userData?.full_name}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{userData?.email}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-100 shadow-lg p-1">
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal px-2 py-1.5">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem asChild className="rounded-lg text-sm hover:bg-teal-50 hover:text-teal-700 cursor-pointer">
                <Link href="/app/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg text-sm hover:bg-teal-50 hover:text-teal-700 cursor-pointer">
                <Link href="/app/billing">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem asChild className="rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="w-full text-left">Sign Out</button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
