import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { requireSuperAdmin } from "@/actions/admin-shared";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // M6 fix: défense en profondeur — la protection de /admin/* ne doit pas
  // reposer uniquement sur le matcher du middleware.
  const auth = await requireSuperAdmin();
  if (!auth) redirect("/login");

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ThemeProvider>
  );
}
