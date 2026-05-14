"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInvitationByToken, acceptInvitation } from "@/actions/team";
import { Users, Loader2, CheckCircle, AlertTriangle, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  receptionist: "Réceptionniste",
  assistant: "Assistant(e)",
};

type PageState = "loading" | "invite-found" | "auth-required" | "completing" | "success" | "error";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<{
    email: string;
    role: string;
    clinic_name: string;
    expires_at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const invite = await getInvitationByToken(token);
      if (!invite) {
        setError("Cette invitation est introuvable ou a déjà été utilisée.");
        setPageState("error");
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        setError("Cette invitation a expiré. Demandez à votre responsable de vous envoyer une nouvelle invitation.");
        setPageState("error");
        return;
      }

      setInvitation(invite);

      // Check if already authenticated
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Already logged in — try to accept directly
        setPageState("completing");
        const result = await acceptInvitation(token, user.user_metadata?.full_name ?? "");
        if (result.success) {
          setPageState("success");
          setTimeout(() => router.push("/app/dashboard"), 2000);
        } else {
          setError(result.error ?? "Erreur");
          setPageState("error");
        }
      } else {
        setPageState("auth-required");
      }
    })();
  }, [token, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setIsSigningUp(true);
    setError(null);

    const supabase = createClient();
    const appUrl = window.location.origin;

    const { error: signupError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${appUrl}/join/${token}`,
      },
    });

    setIsSigningUp(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    // After signup, accept invitation
    startTransition(async () => {
      setPageState("completing");
      const result = await acceptInvitation(token, fullName);
      if (result.success) {
        setPageState("success");
        setTimeout(() => router.push("/app/dashboard"), 2000);
      } else {
        setError(result.error ?? "Erreur");
        setPageState("error");
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setIsSigningUp(true);
    setError(null);

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

    setIsSigningUp(false);

    if (loginError) {
      setError("Mot de passe incorrect");
      return;
    }

    startTransition(async () => {
      setPageState("completing");
      const result = await acceptInvitation(token, "");
      if (result.success) {
        setPageState("success");
        setTimeout(() => router.push("/app/dashboard"), 2000);
      } else {
        setError(result.error ?? "Erreur");
        setPageState("error");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="DocFlow IA" width={130} height={33} className="mx-auto dark:brightness-0 dark:invert" />
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Loading */}
          {pageState === "loading" && (
            <div className="flex flex-col items-center gap-4 py-16 px-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Vérification de l'invitation...</p>
            </div>
          )}

          {/* Completing */}
          {pageState === "completing" && (
            <div className="flex flex-col items-center gap-4 py-16 px-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Activation de votre compte...</p>
            </div>
          )}

          {/* Success */}
          {pageState === "success" && (
            <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Bienvenue dans l'équipe !</h2>
                <p className="text-sm text-muted-foreground mt-1">Vous êtes redirigé vers le tableau de bord...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {pageState === "error" && (
            <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Invitation invalide</h2>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Link href="/login" className="text-sm text-primary hover:underline font-semibold">
                Retour à la connexion
              </Link>
            </div>
          )}

          {/* Auth required */}
          {pageState === "auth-required" && invitation && (
            <>
              {/* Header */}
              <div className="p-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Invitation de</p>
                    <p className="font-bold text-foreground">{invitation.clinic_name}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-background rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground">Vous êtes invité(e) en tant que</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {ROLE_LABELS[invitation.role] ?? invitation.role} · {invitation.email}
                  </p>
                </div>
              </div>

              {/* Tabs: signup or login */}
              <div className="p-6 space-y-5">
                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                  <button
                    onClick={() => setIsSigningUp(false)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isSigningUp ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                  >
                    <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
                    J'ai un compte
                  </button>
                  <button
                    onClick={() => setIsSigningUp(true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isSigningUp ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}
                  >
                    <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
                    Créer un compte
                  </button>
                </div>

                {isSigningUp ? (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Nom complet</Label>
                      <Input
                        placeholder="Dr. Marie Dupont"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Mot de passe</Label>
                      <Input
                        type="password"
                        placeholder="Minimum 8 caractères"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="rounded-xl"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />{error}
                      </p>
                    )}
                    <Button type="submit" disabled={isPending} className="w-full btn-primary">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Créer mon compte et rejoindre
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">Mot de passe</Label>
                      <Input
                        type="password"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />{error}
                      </p>
                    )}
                    <Button type="submit" disabled={isPending} className="w-full btn-primary">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Se connecter et rejoindre
                    </Button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
