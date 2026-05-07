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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("auth.signup");

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.fullName } },
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
    <div className="min-h-screen gradient-mesh flex">

      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] gradient-hero flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative flex items-center">
          <Link href="/">
            <Image src="/logo.png" alt="DocFlow IA" width={150} height={41} className="object-contain brightness-0 invert" />
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug">
              {t("brandTitle")}
            </h2>
            <p className="text-teal-100/80 mt-3 leading-relaxed text-sm">
              {t("brandSubtitle")}
            </p>
          </div>
          <div className="space-y-3">
            {[
              { text: t("feature1") },
              { text: t("feature2") },
              { text: t("feature3") },
              { text: t("feature4") },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-teal-300 flex-shrink-0" />
                <span className="text-sm text-teal-100/90 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-teal-200/50">{t("copyright")}</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Link href="/">
              <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain" />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t("createAccount")}</h1>
            <p className="text-slate-500 mt-1 text-sm">{t("trialSubtitle")}</p>
          </div>

          <div className="glass-card rounded-2xl p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">{t("fullNameLabel")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("fullNamePlaceholder")}
                  autoComplete="name"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                  {...register("fullName")}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">{t("emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  autoComplete="email"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">{t("passwordLabel")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    autoComplete="new-password"
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">{t("confirmPasswordLabel")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl gradient-brand text-white border-none font-semibold shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.01] transition-all mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                {loading ? t("submitLoading") : t("submitButton")}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                {t("alreadyHaveAccount")}{" "}
                <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                  {t("signIn")}
                </Link>
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed">
              {t("termsText")}{" "}
              <span className="text-teal-600 cursor-pointer hover:underline">{t("termsOfService")}</span>
              {" "}and{" "}
              <span className="text-teal-600 cursor-pointer hover:underline">{t("privacyPolicy")}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
