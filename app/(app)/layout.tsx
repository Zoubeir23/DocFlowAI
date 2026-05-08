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
    .select("full_name, email, role, clinic:clinics(name, slug)")
    .eq("id", user.id)
    .single() as {
    data: {
      full_name: string;
      email: string;
      role: string;
      clinic: { name: string; slug: string } | null;
    } | null;
  };

  if (!userData) redirect("/onboarding");
  const clinic = userData.clinic;
  if (!clinic) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 dark:bg-background">
      <NavigationProgress />
      <Sidebar clinicName={clinic.name} />
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
