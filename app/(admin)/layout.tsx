import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ThemeProvider>
  );
}
