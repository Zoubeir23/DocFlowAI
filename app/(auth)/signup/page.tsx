"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Sparkles, Shield, Brain, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
          <Image src="/logo.png" alt="DocFlow IA" width={150} height={41} className="object-contain brightness-0 invert" />
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug">
              Get started in<br />under 2 minutes.
            </h2>
            <p className="text-teal-100/80 mt-3 leading-relaxed text-sm">
              Set up your clinic, configure your AI assistant, and start accepting patient bookings today.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { text: "No credit card required" },
              { text: "Free plan includes 50 appointments/mo" },
              { text: "AI widget ready in 2 minutes" },
              { text: "Cancel anytime" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-teal-300 flex-shrink-0" />
                <span className="text-sm text-teal-100/90 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-teal-200/50">© 2024 DocFlow IA · All rights reserved</p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create your account</h1>
            <p className="text-slate-500 mt-1 text-sm">Start your 14-day free trial today — no card needed</p>
          </div>

          <div className="glass-card rounded-2xl p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. John Smith"
                  autoComplete="name"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                  {...register("fullName")}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinic.com"
                  autoComplete="email"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white focus:ring-teal-500 focus:border-teal-400 transition-colors"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
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
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
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
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <span className="text-teal-600 cursor-pointer hover:underline">Terms of Service</span>
              {" "}and{" "}
              <span className="text-teal-600 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
