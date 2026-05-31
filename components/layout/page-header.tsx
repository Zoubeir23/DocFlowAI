import { Bell, ChevronDown, Settings2, CreditCard, LogOut } from "lucide-react";
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
    .maybeSingle() as { data: { full_name: string; email: string } | null };

  const initials = (userData?.full_name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all">
            <Bell style={{ width: 18, height: 18 }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-accent border border-transparent hover:border-border transition-all focus:outline-none">
                <Avatar className="h-8 w-8 ring-2 ring-border">
                  <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-foreground leading-tight">{userData?.full_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{userData?.email}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border shadow-lg p-1">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="rounded-lg text-sm hover:bg-accent cursor-pointer">
                <Link href="/app/settings">
                  <Settings2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg text-sm hover:bg-accent cursor-pointer">
                <Link href="/app/billing">
                  <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="rounded-lg text-sm text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="w-full text-left flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
