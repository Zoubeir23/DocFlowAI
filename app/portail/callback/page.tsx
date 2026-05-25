"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { linkPatientToAuth } from "@/actions/patient-portal";
import { Loader2, AlertTriangle } from "lucide-react";

export default function PortailCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const result = await linkPatientToAuth();

      if (result.success) {
        router.replace("/portail/dashboard");
      } else {
        setError(result.error ?? "Liaison du compte impossible");
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Connexion impossible</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a
            href="/portail/login"
            className="inline-block text-sm text-primary hover:underline"
          >
            Réessayer
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connexion en cours…</p>
      </div>
    </div>
  );
}
