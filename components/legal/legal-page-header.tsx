"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LegalPageHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  return (
    <header className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
      <Link href="/">
        <Image
          src="/logo.png"
          alt="DocFlow IA"
          width={120}
          height={32}
          className="object-contain dark:brightness-0 dark:invert"
        />
      </Link>
      {isLoggedIn ? (
        <Link href="/app/dashboard" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
          Tableau de bord
        </Link>
      ) : (
        <Link href="/login" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
          Se connecter
        </Link>
      )}
    </header>
  );
}
