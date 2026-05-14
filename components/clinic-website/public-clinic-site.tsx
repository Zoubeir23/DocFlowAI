"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Menu,
  X,
  Calendar,
  Clock,
  MapPin,
  Star,
  Shield,
  Award,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface PublicClinicSiteProps {
  website: any;
  clinic: any;
  services: any[];
  doctor: any;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(37, 99, 235, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PublicClinicSite({
  website,
  clinic,
  services,
  doctor,
}: PublicClinicSiteProps) {
  const { style_config, hero_data, about_data, show_chat_widget, show_services } = website;

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (show_chat_widget && clinic.slug) {
      const iframe = document.createElement("iframe");
      iframe.src = `/widget/${clinic.slug}`;
      iframe.style.cssText =
        "position:fixed;bottom:0;right:0;width:420px;height:680px;border:none;z-index:9999;background:transparent;";
      iframe.allow = "clipboard-write";
      iframe.id = "docflow-widget-iframe";
      if (!document.getElementById("docflow-widget-iframe")) {
        document.body.appendChild(iframe);
      }
      return () => {
        document.getElementById("docflow-widget-iframe")?.remove();
      };
    }
  }, [show_chat_widget, clinic.slug]);

  const isPill = style_config.radius === "9999px" || style_config.radius === "50rem";
  const cardRadius = isPill ? "20px" : style_config.radius;
  const primary = style_config.primary || "#2563eb";
  const pa = (a: number) => hexToRgba(primary, a);

  const navLinks = [
    { label: "Accueil", href: "#hero" },
    ...(show_services && services.length > 0
      ? [{ label: "Spécialités", href: "#services" }]
      : []),
    ...((about_data?.bio || about_data?.avatar)
      ? [{ label: "Cabinet", href: "#about" }]
      : []),
    { label: "Contact", href: "#contact" },
  ];

  const clinicInitial = (clinic.name || "M").charAt(0).toUpperCase();
  const headFont = style_config.fontHead || "Fraunces";
  const bodyFont = style_config.fontBody || "DM Sans";

  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Playfair+Display:wght@400;500;600;700&family=Syne:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap`;

  return (
    <div
      className="min-h-screen bg-[#F8F7F4] text-[#1C1C27] antialiased scroll-smooth"
      style={{ overflowX: "hidden" }}
    >
      {/* ── Fonts & global styles ── */}
      <style>{`
        @import url('${googleFontsUrl}');

        :root {
          --clinic-primary: ${primary};
          --clinic-radius: ${style_config.radius};
        }

        .clinic-body { font-family: '${bodyFont}', 'DM Sans', system-ui, sans-serif; }
        .clinic-heading { font-family: '${headFont}', 'Fraunces', Georgia, serif; }

        @keyframes clinic-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes clinic-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes clinic-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }

        .animate-clinic-float { animation: clinic-float 5s ease-in-out infinite; }
        .animate-clinic-float-delayed { animation: clinic-float 5s ease-in-out infinite 1.8s; }
        .animate-clinic-in { animation: clinic-in 0.7s ease both; }
        .animate-clinic-in-2 { animation: clinic-in 0.7s ease 0.15s both; }
        .animate-clinic-in-3 { animation: clinic-in 0.7s ease 0.3s both; }
        .animate-clinic-ping { animation: clinic-ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite; }

        .mobile-drawer {
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-drawer.open { transform: translateX(0); }

        .service-card::before {
          content: '';
          position: absolute;
          top: 0; left: 1.5rem; right: 1.5rem;
          height: 2px;
          background: var(--clinic-primary);
          border-radius: 0 0 4px 4px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .service-card:hover::before { opacity: 1; }
      `}</style>

      <div className="clinic-body">

        {/* ═══════════════════════════════
            NAVIGATION
        ═══════════════════════════════ */}
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
            isScrolled
              ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06),0_4px_24px_rgba(0,0,0,0.06)] py-3"
              : "bg-transparent py-6"
          )}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

            {/* Logo */}
            <a href="#hero" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-105 transition-transform"
                style={{ backgroundColor: primary }}
              >
                {clinicInitial}
              </div>
              <span
                className="hidden sm:block font-semibold text-[#1C1C27] text-base tracking-tight clinic-heading"
              >
                {clinic.name}
              </span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#1C1C27]/55 hover:text-[#1C1C27] transition-colors relative group py-1"
                >
                  {link.label}
                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-250 rounded-full"
                    style={{ backgroundColor: primary }}
                  />
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <a
              href="#contact"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: primary, borderRadius: style_config.radius }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {hero_data.ctaPrimary || "Prendre RDV"}
            </a>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#1C1C27]" />
              ) : (
                <Menu className="w-5 h-5 text-[#1C1C27]" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <div
          className={cn(
            "fixed inset-0 z-40 md:hidden",
            mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {/* backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* drawer */}
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col mobile-drawer",
              mobileMenuOpen && "open"
            )}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <span className="clinic-heading font-bold text-[#1C1C27]">
                {clinic.name}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-4 rounded-xl text-[#1C1C27] font-medium text-base hover:bg-gray-50 transition-colors group"
                >
                  {link.label}
                  <ChevronRight
                    className="w-4 h-4 text-[#1C1C27]/30 group-hover:text-[#1C1C27]/60 transition-colors"
                  />
                </a>
              ))}
            </nav>

            <div className="p-5 border-t border-gray-100">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-4 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                style={{ backgroundColor: primary, borderRadius: style_config.radius }}
              >
                <Calendar className="w-4 h-4" />
                {hero_data.ctaPrimary || "Prendre rendez-vous"}
              </a>
            </div>
          </div>
        </div>


        {/* ═══════════════════════════════
            HERO
        ═══════════════════════════════ */}
        <section
          id="hero"
          className="relative min-h-[100svh] flex items-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
        >
          {/* Backgrounds */}
          {hero_data.bgImage && (
            <div className="absolute inset-0 -z-20">
              <img
                src={hero_data.bgImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#F8F7F4]/97 via-[#F8F7F4]/90 to-[#F8F7F4]/75" />
            </div>
          )}

          {/* Decorative blobs */}
          <div
            className="absolute top-0 right-0 w-[50vw] max-w-[600px] h-[50vw] max-h-[600px] rounded-full -z-10 blur-[120px] opacity-15"
            style={{ backgroundColor: primary }}
          />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full -z-10 blur-[80px] opacity-[0.06] bg-amber-400" />

          {/* Dot grid */}
          <div
            className="absolute inset-0 -z-10 opacity-[0.025]"
            style={{
              backgroundImage: `radial-gradient(circle, #1C1C27 1.5px, transparent 1.5px)`,
              backgroundSize: "36px 36px",
            }}
          />

          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* ── Left: Text ── */}
              <div className="space-y-7 text-center lg:text-left animate-clinic-in">

                {/* Badge */}
                <div className="flex justify-center lg:justify-start">
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest border"
                    style={{
                      color: primary,
                      backgroundColor: pa(0.08),
                      borderColor: pa(0.2),
                    }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className="animate-clinic-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                        style={{ backgroundColor: primary }}
                      />
                      <span
                        className="relative inline-flex h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: primary }}
                      />
                    </span>
                    Cabinet médical — Disponible
                  </span>
                </div>

                {/* Heading */}
                <h1
                  className="clinic-heading text-[clamp(2.2rem,6vw,4rem)] font-bold leading-[1.08] tracking-tight text-[#1C1C27]"
                >
                  {hero_data.title}
                </h1>

                {/* Subtitle */}
                <p className="text-[#1C1C27]/55 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 animate-clinic-in-2">
                  {hero_data.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-clinic-in-3">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: primary, borderRadius: style_config.radius }}
                  >
                    <Calendar className="w-4 h-4" />
                    {hero_data.ctaPrimary || "Prendre rendez-vous"}
                  </a>
                  {hero_data.ctaSecondary && (
                    <a
                      href={show_services && services.length > 0 ? "#services" : "#about"}
                      className="inline-flex items-center justify-center gap-2 px-7 py-4 font-semibold text-sm rounded-xl border-2 transition-all hover:bg-[#1C1C27]/5 active:scale-[0.98]"
                      style={{
                        borderColor: pa(0.35),
                        color: primary,
                        borderRadius: style_config.radius,
                      }}
                    >
                      {hero_data.ctaSecondary}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Trust row */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4 border-t border-[#1C1C27]/10">
                  {[
                    { value: "15+", label: "Ans d'expérience" },
                    { value: "10k+", label: "Patients satisfaits" },
                    { value: "98%", label: "Satisfaction" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div
                        className="clinic-heading text-2xl sm:text-3xl font-bold text-[#1C1C27]"
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs text-[#1C1C27]/45 font-medium mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Image ── */}
              <div className="relative flex items-center justify-center order-first lg:order-last">
                <div className="relative w-full max-w-[340px] sm:max-w-[400px] mx-auto">

                  {/* Bg accent shape */}
                  <div
                    className="absolute inset-6 opacity-15 blur-sm"
                    style={{ backgroundColor: primary, borderRadius: "32px" }}
                  />

                  {/* Main image */}
                  {about_data?.avatar ? (
                    <img
                      src={about_data.avatar}
                      alt={clinic.name}
                      className="relative z-10 w-full aspect-[4/5] object-cover shadow-2xl"
                      style={{ borderRadius: "28px" }}
                    />
                  ) : hero_data.bgImage ? (
                    <img
                      src={hero_data.bgImage}
                      alt={clinic.name}
                      className="relative z-10 w-full aspect-[4/5] object-cover shadow-2xl"
                      style={{ borderRadius: "28px" }}
                    />
                  ) : (
                    <div
                      className="relative z-10 w-full aspect-[4/5] flex flex-col items-center justify-center shadow-xl"
                      style={{
                        borderRadius: "28px",
                        background: `linear-gradient(135deg, ${pa(0.12)}, ${pa(0.04)})`,
                        border: `1px solid ${pa(0.15)}`,
                      }}
                    >
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-xl mb-4"
                        style={{ backgroundColor: primary }}
                      >
                        {clinicInitial}
                      </div>
                      <p className="text-[#1C1C27]/40 text-sm font-medium">
                        {clinic.name}
                      </p>
                    </div>
                  )}

                  {/* Floating card: Certified */}
                  <div className="absolute -bottom-5 -left-5 sm:-left-8 z-20 bg-white rounded-2xl p-3.5 shadow-xl border border-gray-100 animate-clinic-float">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1C1C27] leading-tight">
                          Certifié
                        </p>
                        <p className="text-[10px] text-[#1C1C27]/45 leading-tight">
                          Médecin agréé
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Floating card: Rating */}
                  <div className="absolute -top-5 -right-5 sm:-right-6 z-20 bg-white rounded-2xl p-3.5 shadow-xl border border-gray-100 animate-clinic-float-delayed">
                    <div className="flex items-center gap-1.5 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-[#1C1C27]">4.9 / 5</p>
                    <p className="text-[10px] text-[#1C1C27]/45">Avis patients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════
            TRUST BAR
        ═══════════════════════════════ */}
        <div className="bg-white border-y border-gray-100 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {[
                { icon: Shield, label: "Médecin conventionné secteur 1" },
                { icon: CheckCircle2, label: "Remboursement Assurance Maladie" },
                { icon: Award, label: "Certifié par l'Ordre des Médecins" },
                { icon: Calendar, label: "Prise de RDV en ligne 24h/24" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-[#1C1C27]/55 font-medium">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: primary }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ═══════════════════════════════
            SERVICES
        ═══════════════════════════════ */}
        {show_services && services.length > 0 && (
          <section id="services" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8F7F4]">
            <div className="max-w-6xl mx-auto">

              {/* Header */}
              <div className="text-center mb-12 lg:mb-16">
                <span
                  className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-4 py-2 rounded-full"
                  style={{ color: primary, backgroundColor: pa(0.08) }}
                >
                  Nos spécialités
                </span>
                <h2
                  className="clinic-heading text-[clamp(2rem,4vw,3.5rem)] font-bold text-[#1C1C27] leading-tight"
                >
                  Domaines d'expertise
                </h2>
                <p className="mt-4 text-[#1C1C27]/55 text-base max-w-lg mx-auto leading-relaxed">
                  Des soins personnalisés et de haute qualité pour répondre à tous vos besoins médicaux.
                </p>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {services.map((service) => {
                  const emojiRegex =
                    /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                  const match = service.name.match(emojiRegex);
                  const icon = match ? match[1] : "🩺";
                  const displayName = match ? match[2] : service.name;

                  return (
                    <div
                      key={service.id}
                      className="service-card relative bg-white border border-gray-100 p-6 lg:p-8 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-gray-200"
                      style={{ borderRadius: cardRadius }}
                    >
                      {/* Icon */}
                      <div
                        className="w-14 h-14 flex items-center justify-center text-2xl mb-6 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: pa(0.08),
                          borderRadius: "14px",
                        }}
                      >
                        {icon}
                      </div>

                      <h3 className="clinic-heading text-lg font-bold text-[#1C1C27] mb-2">
                        {displayName}
                      </h3>
                      <p className="text-sm text-[#1C1C27]/50 leading-relaxed">
                        {service.description ||
                          "Consultation médicale spécialisée avec diagnostic précis et suivi personnalisé."}
                      </p>

                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-[#1C1C27]/40">
                          <Clock className="w-3.5 h-3.5" />
                          {service.duration_minutes} min
                        </span>
                        {service.price && (
                          <span
                            className="px-3 py-1.5 rounded-full font-bold"
                            style={{
                              color: primary,
                              backgroundColor: pa(0.08),
                            }}
                          >
                            {service.price} €
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}


        {/* ═══════════════════════════════
            ABOUT
        ═══════════════════════════════ */}
        {(about_data?.bio || about_data?.avatar) && (
          <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Image */}
                <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                  {about_data?.avatar ? (
                    <div className="relative">
                      <div
                        className="absolute -top-5 -left-5 w-20 h-20 rounded-2xl opacity-20"
                        style={{ backgroundColor: primary }}
                      />
                      <div
                        className="absolute -bottom-5 -right-5 w-14 h-14 rounded-xl opacity-10"
                        style={{ backgroundColor: primary }}
                      />
                      <img
                        src={about_data.avatar}
                        alt="Médecin"
                        className="relative z-10 w-full aspect-[3/4] object-cover shadow-2xl"
                        style={{ borderRadius: "28px" }}
                      />

                      {/* Floating info */}
                      <div className="absolute -bottom-6 left-6 z-20 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: pa(0.1) }}
                          >
                            <Award className="w-5 h-5" style={{ color: primary }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1C1C27] leading-tight">
                              Expert Certifié
                            </p>
                            <p className="text-xs text-[#1C1C27]/45 leading-tight">
                              Médecin qualifié
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-[3/4] flex items-center justify-center shadow-lg"
                      style={{
                        borderRadius: "28px",
                        background: `linear-gradient(135deg, ${pa(0.1)}, ${pa(0.04)})`,
                        border: `1px solid ${pa(0.12)}`,
                      }}
                    >
                      <Award
                        className="w-20 h-20"
                        style={{ color: pa(0.3) }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-6 text-center lg:text-left">
                  <span
                    className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full"
                    style={{ color: primary, backgroundColor: pa(0.08) }}
                  >
                    Notre cabinet
                  </span>

                  <h2 className="clinic-heading text-[clamp(2rem,4vw,3.5rem)] font-bold text-[#1C1C27] leading-tight">
                    À propos du{" "}
                    <span style={{ color: primary }}>cabinet</span>
                  </h2>

                  <p className="text-[#1C1C27]/55 leading-relaxed whitespace-pre-line text-base lg:text-[1.05rem]">
                    {about_data.bio}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                    {[
                      { value: "15+", label: "Ans d'expérience" },
                      { value: "10k+", label: "Patients traités" },
                      { value: "98%", label: "Satisfaction" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div
                          className="clinic-heading text-2xl sm:text-3xl font-bold mb-1"
                          style={{ color: primary }}
                        >
                          {stat.value}
                        </div>
                        <div className="text-xs text-[#1C1C27]/45 font-medium leading-tight">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Certifications */}
                  <div className="space-y-3 pt-2">
                    {[
                      "Membre de l'Ordre National des Médecins",
                      "Formé aux dernières techniques médicales",
                      "Suivi et accompagnement personnalisé",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 justify-center lg:justify-start">
                        <CheckCircle2
                          className="w-4 h-4 shrink-0"
                          style={{ color: primary }}
                        />
                        <span className="text-sm text-[#1C1C27]/60">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* ═══════════════════════════════
            CTA / CONTACT
        ═══════════════════════════════ */}
        <section
          id="contact"
          className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{ backgroundColor: primary }}
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-[80px] bg-white pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-[60px] bg-white pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left: Text */}
              <div className="text-white space-y-6 text-center lg:text-left">
                <h2 className="clinic-heading text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.1]">
                  Prêt à prendre<br />rendez-vous ?
                </h2>
                <p className="text-white/65 text-base lg:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                  Notre assistant IA est disponible 24h/24 et 7j/7 pour trouver
                  le créneau qui vous convient parfaitement.
                </p>
                {show_chat_widget && (
                  <div className="flex justify-center lg:justify-start">
                    <button
                      className="inline-flex items-center gap-2 px-7 py-4 bg-white font-semibold text-sm rounded-xl hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-xl transition-all active:scale-[0.98]"
                      style={{ color: primary, borderRadius: style_config.radius }}
                    >
                      <Calendar className="w-4 h-4" />
                      Ouvrir l'assistant IA
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Info card */}
              <div
                className="rounded-3xl p-6 lg:p-8 border border-white/20 space-y-5"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                <h3 className="text-white font-bold text-xl clinic-heading">
                  Informations pratiques
                </h3>

                {[
                  {
                    icon: MapPin,
                    title: "Cabinet Médical",
                    desc: "L'adresse exacte vous sera communiquée lors de la confirmation de votre rendez-vous.",
                  },
                  {
                    icon: Clock,
                    title: "Horaires",
                    desc: "Consultations sur rendez-vous.\nLundi au vendredi, 8h – 19h.",
                  },
                  {
                    icon: Shield,
                    title: "Assurance & Mutuelle",
                    desc: "Conventionné secteur 1. Remboursement Assurance Maladie.",
                  },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={title}>
                    {i > 0 && <div className="h-px bg-white/15 my-5" />}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm mb-1">{title}</p>
                        <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                          {desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════
            FOOTER
        ═══════════════════════════════ */}
        <footer className="bg-[#0F0F1A] text-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: primary }}
                >
                  {clinicInitial}
                </div>
                <span className="font-medium text-white/70 text-sm">
                  {clinic.name}
                </span>
              </div>

              {/* Legal links */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/35">
                <a href="#" className="hover:text-white/60 transition-colors">
                  Mentions légales
                </a>
                <a href="#" className="hover:text-white/60 transition-colors">
                  Politique de confidentialité
                </a>
                <span>© {new Date().getFullYear()} {clinic.name}</span>
              </div>

              {/* Powered by */}
              <p className="text-xs text-white/25">
                Propulsé par{" "}
                <a
                  href="https://docflow.ai"
                  className="text-white/50 hover:text-white font-semibold transition-colors"
                >
                  DocFlow IA
                </a>
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
