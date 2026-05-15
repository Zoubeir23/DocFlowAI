"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
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
  Phone,
  Stethoscope,
  ArrowUpRight,
  Heart,
  Users,
} from "lucide-react";

interface PublicClinicSiteProps {
  website: any;
  clinic: any;
  services: any[];
  doctor: any;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,45,120,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
}

const TESTIMONIALS = [
  {
    text: "Accueil chaleureux, médecin très à l'écoute. J'ai enfin trouvé un praticien qui prend le temps d'expliquer chaque étape.",
    name: "Marie L.",
    context: "Patiente depuis 3 ans",
  },
  {
    text: "La prise de rendez-vous en ligne est un vrai gain de temps. Cabinet moderne, attente très raisonnable.",
    name: "Thomas B.",
    context: "Patient régulier",
  },
  {
    text: "Suivi sérieux et professionnel. Rassurée après chaque consultation, je ne changerais pour rien au monde.",
    name: "Fatou D.",
    context: "Recommandée par un ami",
  },
];

export function PublicClinicSite({ website, clinic, services, doctor }: PublicClinicSiteProps) {
  const { style_config, hero_data, about_data, contact_data, show_chat_widget, show_services } = website;

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

  const contactAddress = contact_data?.address || "";
  const contactPhone = contact_data?.phone || "";
  const contactSchedule = contact_data?.schedule || "Lundi – Vendredi · 8h – 19h";
  const contactInsurance = contact_data?.insurance_info || "Conventionné secteur 1";

  const openWidget = (e: React.MouseEvent) => {
    e.preventDefault();
    if (show_chat_widget) {
      const iframe = document.getElementById("docflow-widget-iframe") as HTMLIFrameElement | null;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: "open" }, "*");
        return;
      }
    }
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const primary = style_config.primary || "#FF2D78";
  const teal = "#26C6DA";
  const cream = "#F5F0E8";
  const dark = "#1A1A2E";
  const pa = (a: number) => hexToRgba(primary, a);
  const ctaTextColor = isLightColor(primary) ? "#1A1A2E" : "#ffffff";
  const clinicInitial = (clinic.name || "M").charAt(0).toUpperCase();

  const navLinks = [
    { label: "Accueil", href: "#hero" },
    ...(show_services && services.length > 0 ? [{ label: "Spécialités", href: "#services" }] : []),
    ...((about_data?.bio || about_data?.avatar) ? [{ label: "Cabinet", href: "#about" }] : []),
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen antialiased scroll-smooth" style={{ backgroundColor: cream, color: dark, overflowX: "hidden" }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        :root {
          --cp: ${primary};
          --teal: ${teal};
          --cream: ${cream};
          --dark: ${dark};
        }

        .bbn  { font-family: 'Bebas Neue', 'Impact', sans-serif; letter-spacing: 0.03em; }
        .pfdi { font-family: 'Playfair Display', Georgia, serif; }
        .dms  { font-family: 'DM Sans', system-ui, sans-serif; }

        #hero, #services, #about, #testimonials, #contact {
          scroll-margin-top: 80px;
        }

        @keyframes _float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes _float2 {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes _in {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes _marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes _ping {
          75%,100% { transform:scale(2.2); opacity:0; }
        }

        .af   { animation: _float  6s ease-in-out infinite; }
        .af2  { animation: _float2 5s ease-in-out infinite 1.5s; }
        .ai1  { animation: _in 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .ai2  { animation: _in 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
        .ai3  { animation: _in 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
        .ai4  { animation: _in 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
        .marquee-track { animation: _marquee 30s linear infinite; }
        .live-dot { animation: _ping 1.6s cubic-bezier(0,0,0.2,1) infinite; }

        .drawer { transform: translateX(100%); transition: transform 0.32s cubic-bezier(0.4,0,0.2,1); }
        .drawer.open { transform: translateX(0); }

        .svc-pill {
          transition: all 0.22s ease;
          white-space: nowrap;
        }
        .svc-pill:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
      `}</style>

      <div className="dms">

        {/* ═══════ NAV ═══════ */}
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            isScrolled
              ? "py-3 shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
              : "py-5"
          )}
          style={{ backgroundColor: isScrolled ? `${cream}f5` : "transparent", backdropFilter: isScrolled ? "blur(16px)" : "none" }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

            <a href="#hero" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform duration-200 bbn"
                style={{ backgroundColor: primary, color: ctaTextColor }}
              >
                {clinicInitial}
              </div>
              <span className="hidden sm:block bbn text-[18px] tracking-wide" style={{ color: dark }}>
                {clinic.name}
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:opacity-100"
                  style={{ color: `${dark}80` }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = `${dark}80`)}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <a
              href="#contact"
              onClick={openWidget}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200 active:scale-[0.97]"
              style={{ backgroundColor: primary, color: ctaTextColor }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {hero_data.ctaPrimary || "Prendre RDV"}
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border shadow-sm"
              style={{ backgroundColor: cream, borderColor: `${dark}20` }}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <div className={cn("fixed inset-0 z-40 md:hidden", mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none")}>
          <div
            className={cn("absolute inset-0 backdrop-blur-sm transition-opacity duration-300", mobileMenuOpen ? "opacity-100" : "opacity-0")}
            style={{ backgroundColor: "rgba(26,26,46,0.4)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={cn("absolute right-0 top-0 bottom-0 w-[280px] flex flex-col drawer", mobileMenuOpen && "open")} style={{ backgroundColor: cream }}>
            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: `${dark}10` }}>
              <span className="bbn text-[20px]">{clinic.name}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: `${dark}08` }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col p-3 gap-1 mt-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl font-medium text-[15px] transition-colors"
                  style={{ color: dark }}
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 opacity-25" />
                </a>
              ))}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: `${dark}10` }}>
              <a
                href="#contact"
                onClick={(e) => { setMobileMenuOpen(false); openWidget(e); }}
                className="flex items-center justify-center gap-2 w-full py-3.5 font-bold text-[15px] rounded-full shadow-md transition-all active:scale-[0.98]"
                style={{ backgroundColor: primary, color: ctaTextColor }}
              >
                <Calendar className="w-4 h-4" />
                {hero_data.ctaPrimary || "Prendre rendez-vous"}
              </a>
            </div>
          </div>
        </div>


        {/* ═══════ HERO ═══════ */}
        <section
          id="hero"
          className="relative min-h-[100svh] flex items-center overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: cream }}
        >
          {/* Large decorative circle */}
          <div
            className="absolute right-[-15vw] top-1/2 -translate-y-1/2 w-[80vw] max-w-[800px] h-[80vw] max-h-[800px] rounded-full -z-10 pointer-events-none"
            style={{ border: `2px solid ${primary}18` }}
          />
          <div
            className="absolute right-[-5vw] top-1/2 -translate-y-1/2 w-[55vw] max-w-[580px] h-[55vw] max-h-[580px] rounded-full -z-10 pointer-events-none"
            style={{ border: `1px solid ${primary}10` }}
          />

          {/* Big decorative number BG */}
          <div
            className="absolute left-[-2vw] bottom-[-4vw] bbn select-none pointer-events-none -z-10 leading-none"
            style={{ fontSize: "clamp(12rem,30vw,28rem)", color: `${dark}04` }}
            aria-hidden="true"
          >
            01
          </div>

          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_500px] gap-10 lg:gap-16 items-center">

              {/* ── Left ── */}
              <div className="space-y-7 text-center lg:text-left">

                {/* Live badge */}
                <div className="flex justify-center lg:justify-start ai1">
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] border"
                    style={{ color: primary, backgroundColor: pa(0.07), borderColor: pa(0.18) }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="live-dot absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: primary }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary }} />
                    </span>
                    Consultation disponible
                  </span>
                </div>

                {/* Headline — Bebas Neue + Playfair italic mix */}
                <div className="ai2">
                  <h1
                    className="bbn leading-[0.95] tracking-wide"
                    style={{ fontSize: "clamp(3.5rem,9vw,7.5rem)", color: dark }}
                  >
                    {hero_data.title ? (
                      <>
                        {hero_data.title.split(" ").map((word: string, i: number) =>
                          i === 1 ? (
                            <span key={i} className="pfdi italic font-normal" style={{ color: primary }}>
                              {" "}{word}{" "}
                            </span>
                          ) : (
                            <span key={i}>{i === 0 ? word : ` ${word}`}</span>
                          )
                        )}
                      </>
                    ) : (
                      <>
                        Votre santé{" "}
                        <span className="pfdi italic font-normal" style={{ color: primary }}>entre</span>{" "}
                        de bonnes mains
                      </>
                    )}
                  </h1>
                </div>

                {/* Subtitle */}
                <p
                  className="text-base sm:text-[1.05rem] leading-relaxed max-w-lg mx-auto lg:mx-0 ai3"
                  style={{ color: `${dark}60` }}
                >
                  {hero_data.subtitle || "Un accompagnement médical personnalisé, disponible 24h/24 pour votre bien-être."}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start ai4">
                  <a
                    href="#contact"
                    onClick={openWidget}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
                    style={{ backgroundColor: primary, color: ctaTextColor }}
                  >
                    <Calendar className="w-4 h-4" />
                    {hero_data.ctaPrimary || "Prendre rendez-vous"}
                  </a>
                  {hero_data.ctaSecondary && (
                    <a
                      href={show_services && services.length > 0 ? "#services" : "#about"}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm rounded-full border-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                      style={{ borderColor: `${dark}20`, color: dark }}
                    >
                      {hero_data.ctaSecondary}
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-x-10 gap-y-5 pt-6 border-t" style={{ borderColor: `${dark}10` }}>
                  {[
                    { value: "15+", label: "Ans d'expérience" },
                    { value: "10k+", label: "Patients satisfaits" },
                    { value: "98%", label: "Taux de satisfaction" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="bbn leading-none" style={{ fontSize: "clamp(2rem,4vw,2.75rem)", color: dark }}>
                        {stat.value}
                      </div>
                      <div className="text-xs font-medium mt-1" style={{ color: `${dark}45` }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: photo + floating cards ── */}
              <div className="relative flex items-center justify-center order-first lg:order-last">
                <div className="relative w-full max-w-[320px] sm:max-w-[360px] lg:max-w-full mx-auto">

                  {/* Colored offset block */}
                  <div
                    className="absolute -top-3 -right-3 bottom-3 left-3 rounded-[32px] -z-10"
                    style={{ backgroundColor: pa(0.12) }}
                  />

                  {/* Portrait */}
                  {about_data?.avatar ? (
                    <img
                      src={about_data.avatar}
                      alt={clinic.name}
                      className="relative z-10 w-full aspect-[3/4] object-cover shadow-2xl"
                      style={{ borderRadius: "28px" }}
                    />
                  ) : hero_data.bgImage ? (
                    <img
                      src={hero_data.bgImage}
                      alt={clinic.name}
                      className="relative z-10 w-full aspect-[3/4] object-cover shadow-2xl"
                      style={{ borderRadius: "28px" }}
                    />
                  ) : (
                    <div
                      className="relative z-10 w-full aspect-[3/4] flex flex-col items-center justify-center shadow-xl"
                      style={{ borderRadius: "28px", background: `linear-gradient(145deg, ${pa(0.12)}, ${pa(0.04)})` }}
                    >
                      <Stethoscope className="w-20 h-20 mb-4 opacity-20" style={{ color: primary }} />
                      <p className="font-semibold opacity-30">{clinic.name}</p>
                    </div>
                  )}

                  {/* Floating card: patients */}
                  <div
                    className="absolute -bottom-8 -left-6 sm:-left-10 z-20 rounded-2xl px-5 py-4 shadow-2xl af"
                    style={{ backgroundColor: primary }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="bbn text-2xl text-white leading-none">10k+</p>
                        <p className="text-[11px] text-white/70 font-medium mt-0.5">Patients suivis</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating card: rating */}
                  <div
                    className="absolute -top-8 -right-4 sm:-right-8 z-20 rounded-2xl px-5 py-4 shadow-2xl af2"
                    style={{ backgroundColor: teal }}
                  >
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 fill-white text-white" />
                      ))}
                    </div>
                    <p className="bbn text-2xl text-white leading-none">4.9</p>
                    <p className="text-[11px] text-white/80 font-medium mt-0.5">250+ avis</p>
                  </div>

                  {/* Floating card: certified */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-8 z-20 rounded-2xl px-4 py-3 shadow-xl af"
                    style={{ backgroundColor: cream, border: `1px solid ${dark}10`, animationDelay: "3s" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-5 h-5" style={{ color: primary }} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: dark }}>Certifié</p>
                        <p className="text-[10px]" style={{ color: `${dark}50` }}>Ordre des Médecins</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ═══════ TRUST MARQUEE ═══════ */}
        <div className="border-y overflow-hidden py-4" style={{ backgroundColor: dark, borderColor: `${cream}10` }}>
          <div className="flex" aria-hidden="true">
            <div className="marquee-track flex items-center shrink-0 gap-0">
              {[...Array(2)].map((_, ri) => (
                <div key={ri} className="flex items-center">
                  {[
                    { icon: Shield, label: "Conventionné secteur 1" },
                    { icon: CheckCircle2, label: "Remboursé Assurance Maladie" },
                    { icon: Award, label: "Certifié Ordre des Médecins" },
                    { icon: Calendar, label: "RDV en ligne 24h/24" },
                    { icon: Star, label: "4.9/5 · 250+ avis vérifiés" },
                    { icon: Heart, label: "Soins personnalisés" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm font-medium whitespace-nowrap px-8" style={{ color: `${cream}60` }}>
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: primary }} />
                      {label}
                      <span className="ml-8" style={{ color: `${cream}20` }}>·</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ═══════ SERVICES ═══════ */}
        {show_services && services.length > 0 && (
          <section id="services" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: cream }}>
            <div className="max-w-6xl mx-auto">

              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 relative">
                {/* Giant bg number */}
                <div
                  className="absolute -top-8 right-0 bbn leading-none select-none pointer-events-none"
                  style={{ fontSize: "clamp(6rem,15vw,12rem)", color: `${dark}04` }}
                  aria-hidden="true"
                >
                  02
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                    Nos spécialités
                  </p>
                  <h2 className="bbn leading-[0.95]" style={{ fontSize: "clamp(2.8rem,6vw,5rem)", color: dark }}>
                    DOMAINES{" "}
                    <span className="pfdi italic font-normal" style={{ color: primary }}>d'expertise</span>
                  </h2>
                </div>
                <p className="text-base max-w-xs lg:text-right leading-relaxed" style={{ color: `${dark}55` }}>
                  Des soins spécialisés et personnalisés pour chacun de vos besoins médicaux.
                </p>
              </div>

              {/* Service cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {services.map((service, index) => {
                  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                  const match = service.name.match(emojiRegex);
                  const icon = match ? match[1] : "🩺";
                  const displayName = match ? match[2] : service.name;
                  const num = String(index + 1).padStart(2, "0");
                  const isEven = index % 2 === 0;

                  return (
                    <div
                      key={service.id}
                      className="relative rounded-3xl p-7 overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      style={{ backgroundColor: isEven ? `${dark}05` : pa(0.06), border: `1px solid ${dark}08` }}
                    >
                      {/* Large decorative number */}
                      <div
                        className="absolute top-4 right-5 bbn leading-none select-none transition-opacity duration-300 group-hover:opacity-80"
                        style={{ fontSize: "5rem", color: isEven ? `${dark}07` : pa(0.12) }}
                      >
                        {num}
                      </div>

                      {/* Icon */}
                      <div className="text-3xl mb-5">{icon}</div>

                      <h3 className="bbn text-[1.4rem] mb-2 relative z-10" style={{ color: dark }}>
                        {displayName}
                      </h3>
                      <p className="text-sm leading-relaxed relative z-10" style={{ color: `${dark}55` }}>
                        {service.description || "Consultation médicale spécialisée avec diagnostic précis et suivi personnalisé."}
                      </p>

                      <div className="flex items-center gap-3 mt-6 relative z-10">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: `${dark}08`, color: `${dark}60` }}
                        >
                          <Clock className="w-3 h-3" />
                          {service.duration_minutes} min
                        </span>
                        {service.price && (
                          <span
                            className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ backgroundColor: pa(0.1), color: primary }}
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


        {/* ═══════ ABOUT ═══════ */}
        {(about_data?.bio || about_data?.avatar) && (
          <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: `${dark}04` }}>

            {/* Giant bg number */}
            <div
              className="absolute right-[-2vw] top-1/2 -translate-y-1/2 bbn leading-none select-none pointer-events-none"
              style={{ fontSize: "clamp(10rem,25vw,22rem)", color: `${dark}03` }}
              aria-hidden="true"
            >
              03
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

                {/* Image */}
                <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                  {about_data?.avatar ? (
                    <div className="relative">
                      {/* Teal offset block */}
                      <div
                        className="absolute -top-4 -left-4 w-2/3 h-2/3 rounded-3xl"
                        style={{ backgroundColor: teal, opacity: 0.15 }}
                      />
                      {/* Pink offset block */}
                      <div
                        className="absolute -bottom-4 -right-4 w-1/2 h-1/2 rounded-3xl"
                        style={{ backgroundColor: primary, opacity: 0.12 }}
                      />
                      <img
                        src={about_data.avatar}
                        alt="Cabinet médical"
                        className="relative z-10 w-full aspect-[3/4] object-cover shadow-2xl"
                        style={{ borderRadius: "28px" }}
                      />
                      {/* Experience badge */}
                      <div
                        className="absolute -bottom-6 left-8 z-20 rounded-2xl px-5 py-4 shadow-xl"
                        style={{ backgroundColor: teal }}
                      >
                        <div className="flex items-center gap-3">
                          <Award className="w-6 h-6 text-white" />
                          <div>
                            <p className="bbn text-2xl text-white leading-none">15+</p>
                            <p className="text-[11px] text-white/80 font-medium">Ans d'expérience</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-[3/4] flex flex-col items-center justify-center shadow-lg"
                      style={{ borderRadius: "28px", background: `linear-gradient(145deg, ${pa(0.1)}, ${pa(0.03)})` }}
                    >
                      <Stethoscope className="w-20 h-20 opacity-20" style={{ color: primary }} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-7 text-center lg:text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: primary }}>
                    Notre cabinet
                  </p>

                  <h2 className="bbn leading-[0.95]" style={{ fontSize: "clamp(2.8rem,5.5vw,4.5rem)", color: dark }}>
                    À PROPOS{" "}
                    <span className="pfdi italic font-normal" style={{ color: primary }}>du cabinet</span>
                  </h2>

                  {/* Pull quote */}
                  <div className="relative pl-5 border-l-4 text-left" style={{ borderColor: primary }}>
                    <p className="pfdi italic text-lg leading-relaxed" style={{ color: `${dark}70` }}>
                      {about_data?.bio
                        ? (about_data.bio.split(".")[0] + ".").trim()
                        : "Une médecine de qualité, au service de chaque patient."}
                    </p>
                  </div>

                  {about_data?.bio && (
                    <p className="text-base leading-relaxed" style={{ color: `${dark}55` }}>
                      {about_data.bio.split(".").slice(1).join(".").trim()}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 py-6 border-t border-b" style={{ borderColor: `${dark}10` }}>
                    {[
                      { value: "15+", label: "Ans d'expérience", bg: pa(0.08), color: primary },
                      { value: "10k+", label: "Patients traités", bg: `${teal}15`, color: teal },
                      { value: "98%", label: "Satisfaction", bg: `${dark}06`, color: dark },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="text-center rounded-2xl py-4 px-2"
                        style={{ backgroundColor: stat.bg }}
                      >
                        <div className="bbn text-2xl sm:text-3xl leading-none" style={{ color: stat.color }}>
                          {stat.value}
                        </div>
                        <div className="text-[10px] font-medium mt-1.5 leading-tight" style={{ color: `${dark}50` }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3">
                    {[
                      "Membre de l'Ordre National des Médecins",
                      "Formé aux dernières avancées médicales",
                      "Écoute et accompagnement personnalisé",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: pa(0.1) }}>
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: primary }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: `${dark}65` }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}


        {/* ═══════ TESTIMONIALS ═══════ */}
        <section id="testimonials" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: cream }}>
          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: primary }}>
                Témoignages
              </p>
              <h2 className="bbn leading-[0.95]" style={{ fontSize: "clamp(2.8rem,5.5vw,4.5rem)", color: dark }}>
                CE QUE DISENT{" "}
                <span className="pfdi italic font-normal" style={{ color: primary }}>nos patients</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  className="rounded-3xl p-7 lg:p-8 flex flex-col group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
                  style={{ backgroundColor: i === 1 ? primary : i === 2 ? teal : dark }}
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-white text-white opacity-90" />
                    ))}
                  </div>

                  {/* Large quote */}
                  <div className="bbn text-7xl leading-none mb-2 select-none text-white opacity-20">"</div>

                  <p className="text-sm leading-relaxed flex-1 text-white opacity-80">{t.text}</p>

                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/15">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0 text-white bbn">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-[11px] text-white/55">{t.context}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════ CONTACT / CTA ═══════ */}
        <section
          id="contact"
          className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{ backgroundColor: primary }}
        >
          {/* White blobs */}
          <div className="absolute -top-20 right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.06] bg-white blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full opacity-[0.06] bg-white blur-[80px] pointer-events-none" />

          {/* Giant bg text */}
          <div
            className="absolute right-[-2vw] bottom-[-4vw] bbn leading-none select-none pointer-events-none opacity-[0.06] text-white"
            style={{ fontSize: "clamp(8rem,20vw,20rem)" }}
            aria-hidden="true"
          >
            RDV
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">

              {/* Left */}
              <div className="space-y-7 text-center lg:text-left">
                <h2 className="bbn text-white leading-[0.95]" style={{ fontSize: "clamp(3rem,7vw,6rem)" }}>
                  PRÊT À PRENDRE{" "}
                  <span className="pfdi italic font-normal opacity-75">rendez-vous ?</span>
                </h2>
                <p className="text-base lg:text-lg leading-relaxed max-w-md mx-auto lg:mx-0 text-white/60">
                  Notre assistant IA est disponible 24h/24 pour vous trouver le créneau idéal. Rapide, simple, sans attente.
                </p>
                <div className="flex justify-center lg:justify-start">
                  <button
                    onClick={openWidget}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white font-bold text-sm rounded-full hover:bg-white/92 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 active:scale-[0.97]"
                    style={{ color: primary }}
                  >
                    <Calendar className="w-4 h-4" />
                    {show_chat_widget ? "Ouvrir l'assistant IA" : "Prendre rendez-vous"}
                  </button>
                </div>
                <div className="flex flex-wrap justify-center lg:justify-start gap-5 pt-2">
                  {[
                    { icon: Shield, label: "Conventionné S.1" },
                    { icon: CheckCircle2, label: "Remboursé AM" },
                    { icon: Clock, label: "Réponse sous 24h" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-sm text-white/60 font-medium">
                      <Icon className="w-4 h-4 text-white/40" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: info card */}
              <div className="rounded-3xl p-6 lg:p-8 space-y-6 border border-white/20" style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
                <h3 className="bbn text-white text-2xl">INFORMATIONS PRATIQUES</h3>

                {[
                  { icon: MapPin, title: "Adresse", desc: contactAddress || "Communiquée à la confirmation de votre rendez-vous." },
                  { icon: Clock, title: "Horaires", desc: contactSchedule },
                  { icon: Phone, title: "Contact", desc: contactPhone || "Joignez-nous via l'assistant IA." },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={title}>
                    {i > 0 && <div className="h-px bg-white/10" />}
                    <div className="flex items-start gap-4 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-white/80" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{title}</p>
                        <p className="text-white/55 text-sm leading-relaxed mt-0.5 whitespace-pre-line">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {contactInsurance && (
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <Shield className="w-4 h-4 text-white/60 shrink-0" />
                    <span className="text-sm text-white/60 font-medium">{contactInsurance}</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>


        {/* ═══════ FOOTER ═══════ */}
        <footer style={{ backgroundColor: dark, color: cream }} className="pt-14 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b" style={{ borderColor: `${cream}08` }}>

              {/* Brand */}
              <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm bbn"
                    style={{ backgroundColor: primary, color: ctaTextColor }}
                  >
                    {clinicInitial}
                  </div>
                  <span className="bbn text-[18px] opacity-80">{clinic.name}</span>
                </div>
                <p className="text-sm leading-relaxed max-w-[200px]" style={{ color: `${cream}35` }}>
                  Cabinet médical dédié à votre santé et votre bien-être.
                </p>
              </div>

              {/* Nav */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: `${cream}30` }}>Navigation</p>
                <div className="space-y-3">
                  {navLinks.map((l) => (
                    <a key={l.href} href={l.href} className="block text-sm transition-colors" style={{ color: `${cream}45` }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = cream)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = `${cream}45`)}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Services */}
              {show_services && services.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: `${cream}30` }}>Spécialités</p>
                  <div className="space-y-3">
                    {services.slice(0, 5).map((s) => {
                      const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                      const match = s.name.match(emojiRegex);
                      const name = match ? match[2] : s.name;
                      return (
                        <a key={s.id} href="#services" className="block text-sm truncate transition-colors" style={{ color: `${cream}45` }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = cream)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = `${cream}45`)}
                        >
                          {name}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: `${cream}30` }}>Contact</p>
                <div className="space-y-3 text-sm" style={{ color: `${cream}45` }}>
                  {contactSchedule && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: pa(0.7) }} />
                      <span>{contactSchedule.split("\n")[0]}</span>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: pa(0.7) }} />
                      <a href={`tel:${contactPhone}`} style={{ color: `${cream}45` }}>{contactPhone}</a>
                    </div>
                  )}
                  {contactAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: pa(0.7) }} />
                      <span>{contactAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: pa(0.7) }} />
                    <a href="#contact" onClick={openWidget} style={{ color: `${cream}45` }}>Prendre rendez-vous</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[12px]" style={{ color: `${cream}25` }}>
              <span>© {new Date().getFullYear()} {clinic.name}. Tous droits réservés.</span>
              <div className="flex items-center gap-6">
                <a href="#">Mentions légales</a>
                <a href="#">Confidentialité</a>
              </div>
              <span>
                Propulsé par{" "}
                <a href="https://docflow.ai" className="font-semibold" style={{ color: `${cream}50` }}>
                  DocFlow IA
                </a>
              </span>
            </div>

          </div>
        </footer>

      </div>
    </div>
  );
}
