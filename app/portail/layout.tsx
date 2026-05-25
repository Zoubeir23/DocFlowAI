import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function PortailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/portail/dashboard">
            <Image
              src="/logo.png"
              alt="DocFlow IA"
              width={110}
              height={30}
              className="object-contain dark:brightness-0 dark:invert"
            />
          </Link>
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Espace patient
          </span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
