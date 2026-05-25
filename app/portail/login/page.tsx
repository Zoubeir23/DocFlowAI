"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

export default function PortailLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/portail/callback`,
        shouldCreateUser: false,
      },
    });

    setLoading(false);

    if (error) {
      toast.error("Aucun compte patient trouvé pour cet email");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Vérifiez vos emails</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Un lien de connexion a été envoyé à{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            <br />
            Cliquez sur le lien pour accéder à votre espace.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Utiliser un autre email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Votre espace patient</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email pour recevoir un lien de connexion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-foreground text-sm caret-primary placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {loading ? "Envoi en cours…" : "Recevoir le lien de connexion"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Votre email doit être enregistré dans votre dossier patient.
          <br />
          Contactez votre médecin si vous n'avez pas accès.
        </p>
      </div>
    </div>
  );
}
