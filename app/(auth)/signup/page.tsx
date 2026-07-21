"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const t = useTranslations("auth.signup");

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setLoading(true);
    if (!acceptedTerms) {
      toast.error("Vous devez accepter les CGU et la politique de confidentialité.");
      setLoading(false);
      return;
    }
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            // Horodatage persisté dans user_metadata et revérifié côté serveur
            // par createOnboarding — évite qu'un appel direct à signUp() sans
            // passer par la case à cocher crée un compte considéré comme
            // ayant accepté les CGU / le traitement de données de santé.
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });
      if (error) { toast.error(error.message); return; }
      if (authData.user) {
        toast.success("Account created! Let's set up your clinic.");
        router.push("/onboarding");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground selection:bg-teal-500/30 selection:text-teal-100">

      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-background border-r border-foreground/15 flex-col justify-between p-12 relative overflow-hidden">
        {/* Logo */}
        <div className="relative flex items-center">
          <Link href="/">
            <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain dark:brightness-0 dark:invert" />
          </Link>
        </div>

        {/* Center content */}
        <div className="relative space-y-12">
          <div>
            <h2 className="font-cormorant font-normal text-[40px] text-foreground leading-tight mb-4">
              {t("brandTitle")}
            </h2>
            <p className="font-sans font-normal text-[14px] text-foreground/80 leading-relaxed max-w-[320px]">
              {t("brandSubtitle")}
            </p>
          </div>
          <div className="space-y-6">
            {[
              { text: t("feature1") },
              { text: t("feature2") },
              { text: t("feature3") },
              { text: t("feature4") },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-none flex items-center justify-center flex-shrink-0">
                  <CheckCircle strokeWidth={1.5} className="w-5 h-5 text-[#14b8a6]" />
                </div>
                <span className="font-sans font-normal text-[15px] text-foreground/60 group-hover:text-foreground transition-colors">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-[1px] bg-gradient-to-r from-[#14b8a6] to-transparent"></div>
          <p className="font-mono text-[15px] uppercase tracking-widest text-foreground/60">© 2026 DocFlow IA</p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-12">
            <Link href="/">
              <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain dark:brightness-0 dark:invert" />
            </Link>
          </div>

          <div className="mb-10 text-center">
            <h1 className="font-cormorant font-normal text-[32px] text-foreground tracking-tight mb-2">{t("createAccount")}</h1>
            <p className="font-sans font-normal text-foreground/80 text-[14px]">{t("trialSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block font-mono text-[14px] uppercase tracking-[0.1em] text-foreground/80">{t("fullNameLabel")}</label>
              <input
                id="fullName"
                type="text"
                placeholder={t("fullNamePlaceholder")}
                autoComplete="name"
                className="w-full h-12 bg-foreground/[0.05] border border-foreground/20 rounded-none px-4 font-sans text-[14px] text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-[#14b8a6] focus:bg-[#14b8a6]/5 transition-colors"
                {...register("fullName")}
              />
              {errors.fullName && <p className="text-[15px] font-sans text-red-400 mt-1">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block font-mono text-[14px] uppercase tracking-[0.1em] text-foreground/80">{t("emailLabel")}</label>
              <input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                className="w-full h-12 bg-foreground/[0.05] border border-foreground/20 rounded-none px-4 font-sans text-[14px] text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-[#14b8a6] focus:bg-[#14b8a6]/5 transition-colors"
                {...register("email")}
              />
              {errors.email && <p className="text-[15px] font-sans text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block font-mono text-[14px] uppercase tracking-[0.1em] text-foreground/80">{t("passwordLabel")}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="new-password"
                  className="w-full h-12 bg-foreground/[0.05] border border-foreground/20 rounded-none px-4 font-sans text-[14px] text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-[#14b8a6] focus:bg-[#14b8a6]/5 transition-colors"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-[#14b8a6] transition-colors"
                >
                  {showPassword ? <EyeOff strokeWidth={1.5} className="w-4 h-4" /> : <Eye strokeWidth={1.5} className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[15px] font-sans text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block font-mono text-[14px] uppercase tracking-[0.1em] text-foreground/80">{t("confirmPasswordLabel")}</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                autoComplete="new-password"
                className="w-full h-12 bg-foreground/[0.05] border border-foreground/20 rounded-none px-4 font-sans text-[14px] text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-[#14b8a6] focus:bg-[#14b8a6]/5 transition-colors"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-[15px] font-sans text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Legal checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#14b8a6] cursor-pointer flex-shrink-0"
              />
              <label htmlFor="terms" className="text-[13px] text-foreground/60 leading-relaxed cursor-pointer">
                J&apos;ai lu et j&apos;accepte les{" "}
                <Link href="/terms" target="_blank" className="text-[#14b8a6] hover:underline">
                  Conditions Générales d&apos;Utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/privacy" target="_blank" className="text-[#14b8a6] hover:underline">
                  Politique de Confidentialité
                </Link>
                , y compris le traitement de données de santé.
              </label>
            </div>

            <button
              type="submit"
              className="btn-void-primary w-full h-12 flex items-center justify-center gap-2 mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={loading || !acceptedTerms}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? t("submitLoading") : t("submitButton")}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-foreground/15" />
            <span className="font-mono text-[12px] uppercase tracking-widest text-foreground/40">{t('orContinueWith')}</span>
            <div className="flex-1 h-[1px] bg-foreground/15" />
          </div>

          <div className="mt-4">
            <GoogleOAuthButton label={t('continueWithGoogle')} redirectTo="/onboarding" />
          </div>

          <div className="mt-8 pt-8 border-t border-foreground/15 text-center">
            <p className="font-sans font-normal text-foreground/70 text-[15px]">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-[#14b8a6] hover:text-foreground transition-colors ml-1">
                {t("signIn")}
              </Link>
            </p>
          </div>

          <p className="mt-6 font-sans font-normal text-[13px] text-foreground/40 text-center leading-relaxed">
            <Link href="/terms" target="_blank" className="hover:text-foreground/70 transition-colors underline underline-offset-2">CGU</Link>
            {" · "}
            <Link href="/privacy" target="_blank" className="hover:text-foreground/70 transition-colors underline underline-offset-2">Politique de confidentialité</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
