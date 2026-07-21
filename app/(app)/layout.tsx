import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NavigationProgress } from "@/components/layout/navigation-progress";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const db = supabase as any;
  const { data: userData } = await db
    .from("users")
    .select("full_name, email, role, clinic:clinics(name, slug, is_active)")
    .eq("id", user.id)
    .maybeSingle() as {
    data: {
      full_name: string;
      email: string;
      role: string;
      clinic: { name: string; slug: string; is_active: boolean } | null;
    } | null;
  };

  if (!userData) redirect("/onboarding");

  const clinic = userData.clinic;

  // super_admin sans clinique → redirige vers le panel admin, pas l'onboarding
  if (!clinic && userData.role === "super_admin") redirect("/admin");

  if (!clinic) redirect("/onboarding");

  // C7 fix: une clinique désactivée par le super-admin ne doit plus être
  // accessible au staff — jusqu'ici seul users.is_active était vérifié.
  if (!clinic.is_active) redirect("/blocked");

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 dark:bg-background">
      <NavigationProgress />
      <Sidebar clinicName={clinic?.name ?? "DocFlow IA"} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          title="DocFlow IA"
          userName={userData.full_name || "Doctor"}
          userEmail={userData.email}
        />
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
