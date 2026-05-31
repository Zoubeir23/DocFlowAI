"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { linkPatientToAuth } from "@/actions/patient-portal";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

export default function SetupPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Définir le mot de passe
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Lier le compte au dossier patient
    const result = await linkPatientToAuth();
    if (!result.success) {
      toast.error(result.error ?? "Liaison du dossier patient impossible");
      setLoading(false);
      return;
    }

    toast.success("Mot de passe créé — bienvenue !");
    router.replace("/portail/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Créez votre mot de passe</h1>
          <p className="text-sm text-muted-foreground">
            Choisissez un mot de passe pour accéder à votre espace patient
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-border bg-background text-foreground text-sm caret-primary placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              required
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-foreground text-sm caret-primary placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Création en cours…" : "Créer mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
