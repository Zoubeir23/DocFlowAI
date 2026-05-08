import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function HomePage() {
  const t = await getTranslations("landing");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-teal-500/30 selection:text-teal-100">

      {/* 1. NAV */}
      <nav className="sticky top-0 z-50 bg-background border-b border-foreground/15 h-16 flex items-center">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-4">
            <div className="teal-line w-8 hidden sm:block"></div>
            <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain dark:brightness-0 dark:invert" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-foreground/70 hover:text-foreground transition-colors">{t("nav.features")}</Link>
            <Link href="/pricing" className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-foreground/70 hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
            <Link href="#how-it-works" className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-foreground/70 hover:text-foreground transition-colors">{t("nav.howItWorks")}</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <button className="text-[15px] font-sans font-medium tracking-[0.12em] uppercase text-foreground/70 hover:text-foreground transition-colors">
                {t("nav.signIn")}
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn-void-primary !py-2.5 !px-5 !text-[14px]">
                {t("nav.startFreeTrial")}
              </button>
            </Link>
          </div>

        </div>
      </nav>

      {/* 2. HERO */}
      <section className="pt-24 pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row justify-between gap-16">
            
            {/* Gauche */}
            <div className="flex-1 max-w-2xl fade-in-up">
              <div className="flex items-center gap-4 mb-10">
                <div className="teal-line"></div>
                <span className="font-cormorant italic text-[15px] text-foreground/80 tracking-wide">AI-Powered Clinic OS</span>
              </div>
              
              <h1 className="font-cormorant font-normal text-6xl md:text-[80px] leading-[0.95] mb-6">
                {t("hero.titlePart1")} <br/>
                <em className="italic text-[#14b8a6]">{t("hero.titleHighlight")}</em>
              </h1>
              
              <h2 className="font-cormorant font-normal text-[28px] text-foreground/70 mb-8">
                {t("hero.titlePart2")}
              </h2>
              
              <p className="font-sans font-normal text-[15px] text-foreground/80 leading-relaxed max-w-[420px] mb-12">
                {t("hero.subtitle")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <button className="btn-void-primary w-full sm:w-auto">
                    {t("hero.ctaPrimary")}
                  </button>
                </Link>
              </div>
            </div>

            {/* Droite (Stats) */}
            <div className="lg:w-[320px] border-l border-foreground/15 pl-8 lg:pl-12 flex flex-col justify-center gap-8 fade-in-up" style={{ animationDelay: "0.2s" }}>
              
              <div className="pb-8 border-b border-foreground/15">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="void-stat-number">12</span>
                  <span className="text-[#14b8a6] text-xl font-normal">{t("hero.statApptsLabel")}</span>
                </div>
                <div className="font-mono text-[15px] uppercase tracking-[0.1em] text-foreground/70">{t("hero.statToday")}</div>
              </div>

              <div className="pb-8 border-b border-foreground/15">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="void-stat-number">847</span>
                  <span className="text-[#14b8a6] text-xl font-normal">{t("hero.statPtsLabel")}</span>
                </div>
                <div className="font-mono text-[15px] uppercase tracking-[0.1em] text-foreground/70">{t("hero.statPatients")}</div>
              </div>

              <div className="pb-8 border-b border-foreground/15">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="void-stat-number">94</span><span className="text-[#14b8a6] text-xl font-normal">%</span>
                </div>
                <div className="font-mono text-[15px] uppercase tracking-[0.1em] text-foreground/70">{t("hero.statCompletion")}</div>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="void-stat-number">156</span>
                  <span className="text-[#14b8a6] text-xl font-normal">{t("hero.statAiLabel")}</span>
                </div>
                <div className="font-mono text-[15px] uppercase tracking-[0.1em] text-foreground/70">{t("hero.statAiBookings")}</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. MOCKUP DASHBOARD */}
      <section className="px-6 lg:px-12 max-w-[1400px] mx-auto mb-24 fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="border border-foreground/15 bg-foreground/[0.05] backdrop-blur-[40px]">
          
          {/* Top bar */}
          <div className="bg-background/60 border-b border-foreground/15 px-4 py-3 flex items-center justify-center">
            <div className="font-cormorant italic text-[15px] text-foreground/70 tracking-wide">
              docflow.ai/dashboard
            </div>
          </div>

          {/* Intérieur */}
          <div className="p-8 lg:p-12 relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#14b8a6]/30 to-transparent"></div>
            
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="font-mono text-[15px] text-[#14b8a6] uppercase tracking-[0.15em] mb-3">{t("hero.dashboardTitle")}</p>
                <h3 className="font-cormorant font-normal text-[26px] text-foreground">{t("hero.greeting")}</h3>
              </div>
              <button className="border border-[#14b8a6]/20 bg-transparent text-[#14b8a6] font-mono text-[14px] uppercase tracking-[0.1em] px-5 py-2.5 hover:bg-[#14b8a6]/5 transition-colors">
                {t("hero.viewAppointments")} →
              </button>
            </div>

            <div className="void-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-8">
                <div className="font-mono text-[15px] text-[#14b8a6] uppercase tracking-[0.15em] mb-4">{t("hero.statToday")}</div>
                <div className="font-cormorant font-normal text-[40px] text-foreground leading-none mb-2">12</div>
                <div className="font-sans text-[14px] text-foreground/60 uppercase tracking-widest">{t("hero.dashboardTodayAppointments")}</div>
              </div>
              <div className="p-8">
                <div className="font-mono text-[15px] text-[#14b8a6] uppercase tracking-[0.15em] mb-4">{t("hero.statPatients")}</div>
                <div className="font-cormorant font-normal text-[40px] text-foreground leading-none mb-2">847</div>
                <div className="font-sans text-[14px] text-foreground/60 uppercase tracking-widest">{t("hero.dashboardActivePatients")}</div>
              </div>
              <div className="p-8">
                <div className="font-mono text-[15px] text-[#14b8a6] uppercase tracking-[0.15em] mb-4">{t("hero.statCompletion")}</div>
                <div className="font-cormorant font-normal text-[40px] text-foreground leading-none mb-2">94%</div>
                <div className="font-sans text-[14px] text-foreground/60 uppercase tracking-widest">{t("hero.dashboardAttendanceRate")}</div>
              </div>
              <div className="p-8">
                <div className="font-mono text-[15px] text-[#14b8a6] uppercase tracking-[0.15em] mb-4">{t("hero.statAi")}</div>
                <div className="font-cormorant font-normal text-[40px] text-foreground leading-none mb-2">156</div>
                <div className="font-sans text-[14px] text-foreground/60 uppercase tracking-widest">{t("hero.dashboardAIAssistant")}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. PROOF STRIP */}
      <div className="border-y border-foreground/15 py-6 px-6 lg:px-12 flex flex-wrap justify-center gap-10 lg:gap-16">
        {[
          t("proof.clinics"),
          t("proof.bookings"),
          t("proof.uptime"),
          t("proof.hipaa"),
        ].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-[#0d9488]"></div>
            <span className="font-sans text-[15px] uppercase tracking-[0.08em] text-foreground/70">{item}</span>
          </div>
        ))}
      </div>

      {/* 5. FEATURES */}
      <section id="features" className="py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          
          <div className="mb-20 text-center">
            <div className="teal-flourish mb-8"></div>
            <h2 className="font-cormorant font-normal text-[48px] lg:text-[56px] text-foreground mb-4">
              {t("features.title")}
            </h2>
            <p className="font-sans font-normal text-[15px] text-foreground/70">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="void-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[
              { num: "i.", title: t("features.aiAssistantTitle"), desc: t("features.aiAssistantDesc") },
              { num: "ii.", title: t("features.calendarTitle"), desc: t("features.calendarDesc") },
              { num: "iii.", title: t("features.crmTitle"), desc: t("features.crmDesc") },
              { num: "iv.", title: t("features.availabilityTitle"), desc: t("features.availabilityDesc") },
              { num: "v.", title: t("features.securityTitle"), desc: t("features.securityDesc") },
              { num: "vi.", title: t("features.analyticsTitle"), desc: t("features.analyticsDesc") },
            ].map((f) => (
              <div key={f.num} className="p-10 lg:p-14 group">
                <div className="font-cormorant italic text-[14px] text-[#14b8a6]/50 mb-8 transition-colors group-hover:text-[#14b8a6]">{f.num}</div>
                <h3 className="font-cormorant font-normal text-[26px] text-foreground mb-4">{f.title}</h3>
                <p className="font-sans font-normal text-[14px] leading-[1.8] text-foreground/70">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 border-y border-foreground/15">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-start">
            
            <div className="lg:sticky lg:top-32">
              <div className="font-mono text-[14px] text-[#14b8a6] uppercase tracking-[0.15em] mb-6">{t("howItWorks.sectionLabel")}</div>
              <h2 className="font-cormorant font-normal text-[42px] leading-tight text-foreground mb-6">
                {t("howItWorks.title")}
              </h2>
              <p className="font-sans font-normal text-[15px] text-foreground/70">
                {t("howItWorks.subtitle")}
              </p>
            </div>

            <div className="border-l border-foreground/15 pl-8 lg:pl-12 py-4">
              {[
                { step: "1", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
                { step: "2", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
                { step: "3", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
              ].map((s) => (
                <div key={s.step} className="relative pb-16 last:pb-0">
                  <div className="absolute -left-[32px] lg:-left-[48px] top-0 w-6 h-6 rounded-full bg-background border border-[#0d9488] flex items-center justify-center -translate-x-1/2">
                    <span className="font-mono text-[14px] text-[#14b8a6]">{s.step}</span>
                  </div>
                  <h3 className="font-cormorant font-normal text-[24px] text-foreground mb-3 leading-none">{s.title}</h3>
                  <p className="font-sans font-normal text-[14px] text-foreground/70 leading-relaxed max-w-[360px]">{s.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          
          <div className="void-grid grid-cols-1 md:grid-cols-3">
            {[
              { name: t("testimonials.t1.name"), role: t("testimonials.t1.role"), text: t("testimonials.t1.text") },
              { name: t("testimonials.t2.name"), role: t("testimonials.t2.role"), text: t("testimonials.t2.text") },
              { name: t("testimonials.t3.name"), role: t("testimonials.t3.role"), text: t("testimonials.t3.text") },
            ].map((t) => (
              <div key={t.name} className="void-card p-10">
                <div className="font-mono text-[14px] text-[#ffb700]/60 tracking-[0.2em] mb-6">★★★★★</div>
                <p className="font-cormorant italic text-[20px] text-foreground/80 leading-[1.7] mb-10">
                  « {t.text} »
                </p>
                <div className="border-t border-foreground/15 pt-6 flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center border border-[#14b8a6]/20 bg-transparent text-foreground font-sans text-[15px]">
                    {t.name.split(" ").map(n => n[0]).join("").replace("D", "")}
                  </div>
                  <div>
                    <div className="font-sans font-medium text-[14px] text-foreground mb-1">{t.name}</div>
                    <div className="font-sans font-normal text-[15px] text-foreground/70">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-32 border-t border-foreground/15 text-center">
        <div className="teal-flourish mb-12"></div>
        <h2 className="font-cormorant font-normal text-[56px] lg:text-[72px] text-foreground leading-tight mb-8">
          {t("cta.titlePart1")} <br/>
          <em className="italic text-[#14b8a6]">{t("cta.titleHighlight")}</em>
        </h2>
        <p className="font-sans font-medium text-[14px] uppercase tracking-[0.1em] text-foreground/70 mb-12">
          {t("cta.subtitle")}
        </p>
        <Link href="/signup">
          <button className="btn-void-primary">
            {t("cta.button")}
          </button>
        </Link>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-foreground/15 py-10 px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1400px] mx-auto">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/logo.png" alt="DocFlow IA" width={110} height={30} className="object-contain dark:brightness-0 dark:invert opacity-90" />
        </Link>
        <div className="flex items-center gap-8 font-sans font-normal text-[14px] text-foreground/60">
          <Link href="/pricing" className="hover:text-[#14b8a6] transition-colors">{t("footer.pricing")}</Link>
          <Link href="/login" className="hover:text-[#14b8a6] transition-colors">{t("footer.login")}</Link>
          <Link href="/signup" className="hover:text-[#14b8a6] transition-colors">{t("footer.signup")}</Link>
        </div>
        <div className="font-mono text-[14px] text-foreground/60">
          © 2026 DocFlow IA
        </div>
      </footer>

    </div>
  );
}
