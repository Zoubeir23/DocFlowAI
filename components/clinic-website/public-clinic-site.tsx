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
  Quote,
  Phone,
  Stethoscope,
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
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(37,99,235,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65;
}

const TESTIMONIALS = [
  {
    text: "Accueil chaleureux, médecin très à l'écoute. J'ai enfin trouvé un praticien qui prend le temps d'expliquer chaque étape du traitement.",
    name: "Marie L.",
    context: "Patiente depuis 3 ans",
    rating: 5,
  },
  {
    text: "La prise de rendez-vous en ligne est un vrai gain de temps. Le cabinet est moderne et l'attente très raisonnable. Je recommande vivement.",
    name: "Thomas B.",
    context: "Patient régulier",
    rating: 5,
  },
  {
    text: "Suivi sérieux et professionnel. Le médecin est disponible et réactif. Rassurée après chaque consultation, je ne changerais pour rien au monde.",
    name: "Fatou D.",
    context: "Recommandée par un ami",
    rating: 5,
  },
];

export function PublicClinicSite({
  website,
  clinic,
  services,
  doctor,
}: PublicClinicSiteProps) {
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

  const isPill = style_config.radius === "9999px" || style_config.radius === "50rem";
  const cardRadius = isPill ? "20px" : style_config.radius;
  const primary = style_config.primary || "#2563eb";
  const pa = (a: number) => hexToRgba(primary, a);
  const ctaTextColor = isLightColor(primary) ? "#1C1C27" : "#ffffff";

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

  return (
    <div
      className="min-h-screen bg-[#F8F7F4] text-[#1C1C27] antialiased scroll-smooth"
      style={{ overflowX: "hidden" }}
    >
      {/* ── Google Fonts + global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,700&family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Syne:wght@400;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&display=swap');

        :root {
          --cp: ${primary};
          --cr: ${style_config.radius};
        }

        .ch  { font-family: '${headFont}', 'Fraunces', Georgia, serif; }
        .cb  { font-family: '${bodyFont}', 'DM Sans', system-ui, sans-serif; }

        /* Section anchors with nav offset */
        #hero, #services, #about, #testimonials, #contact {
          scroll-margin-top: 80px;
        }

        /* Animations */
        @keyframes _float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-9px) rotate(1.5deg); }
        }
        @keyframes _float2 {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes _in {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes _pingg {
          75%,100% { transform:scale(2.2); opacity:0; }
        }
        @keyframes _marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .af  { animation: _float  5.5s ease-in-out infinite; }
        .af2 { animation: _float2 5.5s ease-in-out infinite 2s; }
        .ai1 { animation: _in 0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .ai2 { animation: _in 0.65s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .ai3 { animation: _in 0.65s cubic-bezier(0.22,1,0.36,1) 0.24s both; }
        .ai4 { animation: _in 0.65s cubic-bezier(0.22,1,0.36,1) 0.36s both; }
        .ap  { animation: _pingg 1.4s cubic-bezier(0,0,0.2,1) infinite; }

        .marquee-track { animation: _marquee 28s linear infinite; }

        /* Mobile drawer */
        .drawer {
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .drawer.open { transform: translateX(0); }

        /* Service card accent */
        .svc-card::before {
          content:'';
          position:absolute;
          top:0; left:0; right:0;
          height:3px;
          background: var(--cp);
          border-radius: 3px 3px 0 0;
          opacity:0;
          transition: opacity 0.25s ease;
        }
        .svc-card:hover::before { opacity:1; }

        /* Grain overlay */
        .grain::after {
          content:'';
          position:fixed;
          inset:0;
          pointer-events:none;
          z-index:998;
          opacity:0.025;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }

        /* Hover nav underline */
        .nav-link span { transition: width 0.2s ease; }
        .nav-link:hover span { width: 100% !important; }
      `}</style>

      <div className="cb grain">

        {/* ═══════════════════
            NAV
        ═══════════════════ */}
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            isScrolled
              ? "bg-white/96 backdrop-blur-lg shadow-[0_1px_0_rgba(0,0,0,0.07),0_2px_16px_rgba(0,0,0,0.05)] py-3"
              : "bg-transparent py-5"
          )}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

            <a href="#hero" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: primary, color: ctaTextColor }}
              >
                {clinicInitial}
              </div>
              <span className="hidden sm:block ch font-semibold text-[#1C1C27] text-[15px] tracking-tight">
                {clinic.name}
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="nav-link relative text-sm font-medium text-[#1C1C27]/50 hover:text-[#1C1C27] transition-colors py-1"
                >
                  {link.label}
                  <span
                    className="absolute bottom-0 left-0 h-[1.5px] w-0 rounded-full"
                    style={{ backgroundColor: primary }}
                  />
                </a>
              ))}
            </nav>

            <a
              href="#contact"
              onClick={openWidget}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: primary, color: ctaTextColor, borderRadius: style_config.radius }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {hero_data.ctaPrimary || "Prendre RDV"}
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <div className={cn("fixed inset-0 z-40 md:hidden", mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none")}>
          <div
            className={cn("absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300", mobileMenuOpen ? "opacity-100" : "opacity-0")}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={cn("absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col drawer", mobileMenuOpen && "open")}>
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
              <span className="ch font-bold text-[#1C1C27] text-base">{clinic.name}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col p-3 gap-1 mt-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl font-medium text-[15px] text-[#1C1C27] hover:bg-gray-50 transition-colors group"
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 text-[#1C1C27]/25 group-hover:text-[#1C1C27]/50 transition-colors" />
                </a>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <a
                href="#contact"
                onClick={(e) => { setMobileMenuOpen(false); openWidget(e); }}
                className="flex items-center justify-center gap-2 w-full py-3.5 font-semibold text-[15px] shadow-md active:scale-[0.98] transition-all"
                style={{ backgroundColor: primary, color: ctaTextColor, borderRadius: style_config.radius }}
              >
                <Calendar className="w-4 h-4" />
                {hero_data.ctaPrimary || "Prendre rendez-vous"}
              </a>
            </div>
          </div>
        </div>


        {/* ═══════════════════
            HERO
        ═══════════════════ */}
        <section
          id="hero"
          className="relative min-h-[100svh] flex items-center overflow-hidden pt-24 pb-16 px-4 sm:px-6 lg:px-8"
        >
          {/* Background image overlay */}
          {hero_data.bgImage && (
            <div className="absolute inset-0 -z-20">
              <img src={hero_data.bgImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#F8F7F4]/98 via-[#F8F7F4]/94 to-[#F8F7F4]/80" />
            </div>
          )}

          {/* Colour blobs */}
          <div
            className="absolute -top-20 -right-20 w-[55vw] max-w-[700px] h-[55vw] max-h-[700px] rounded-full -z-10 opacity-[0.12]"
            style={{ backgroundColor: primary, filter: "blur(130px)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-[30vw] max-w-[350px] h-[30vw] max-h-[350px] rounded-full -z-10 opacity-[0.06] bg-amber-300"
            style={{ filter: "blur(80px)" }}
          />

          {/* Dot grid */}
          <div
            className="absolute inset-0 -z-10 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, #1C1C27 1.5px, transparent 1.5px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Decorative large circle ring */}
          <div
            className="absolute right-[-8vw] top-1/2 -translate-y-1/2 w-[60vw] max-w-[680px] h-[60vw] max-h-[680px] rounded-full border -z-10 opacity-[0.06]"
            style={{ borderColor: primary, borderWidth: "2px" }}
          />

          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-10 lg:gap-12 items-center">

              {/* ── Left content ── */}
              <div className="space-y-7 text-center lg:text-left">

                {/* Badge */}
                <div className="flex justify-center lg:justify-start ai1">
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] border"
                    style={{ color: primary, backgroundColor: pa(0.07), borderColor: pa(0.18) }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="ap absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: primary }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary }} />
                    </span>
                    Cabinet médical · Consultation disponible
                  </span>
                </div>

                {/* Heading */}
                <div className="ai2">
                  <h1
                    className="ch font-bold leading-[1.07] tracking-tight text-[#1C1C27]"
                    style={{ fontSize: "clamp(2.4rem, 6.5vw, 4.5rem)" }}
                  >
                    {hero_data.title}
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-[#1C1C27]/55 text-base sm:text-[1.05rem] leading-relaxed max-w-lg mx-auto lg:mx-0 ai3">
                  {hero_data.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start ai4">
                  <a
                    href="#contact"
                    onClick={openWidget}
                    className="inline-flex items-center justify-center gap-2 px-7 py-[14px] font-semibold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
                    style={{ backgroundColor: primary, color: ctaTextColor, borderRadius: style_config.radius }}
                  >
                    <Calendar className="w-4 h-4" />
                    {hero_data.ctaPrimary || "Prendre rendez-vous"}
                  </a>
                  {hero_data.ctaSecondary && (
                    <a
                      href={show_services && services.length > 0 ? "#services" : "#about"}
                      className="inline-flex items-center justify-center gap-2 px-7 py-[14px] font-semibold text-sm border-2 transition-all duration-200 hover:bg-[#1C1C27]/5 active:scale-[0.97]"
                      style={{ borderColor: pa(0.3), color: primary, borderRadius: style_config.radius }}
                    >
                      {hero_data.ctaSecondary}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Stats strip */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-x-10 gap-y-4 pt-5 border-t border-[#1C1C27]/08">
                  {[
                    { value: "15+", label: "Ans d'expérience" },
                    { value: "10k+", label: "Patients satisfaits" },
                    { value: "98%", label: "Taux de satisfaction" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div
                        className="ch text-[2rem] sm:text-[2.25rem] font-bold leading-none text-[#1C1C27]"
                      >
                        {s.value}
                      </div>
                      <div className="text-xs text-[#1C1C27]/40 font-medium mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: image composition ── */}
              <div className="relative flex items-center justify-center order-first lg:order-last">
                <div className="relative w-full max-w-[320px] sm:max-w-[380px] lg:max-w-full mx-auto">

                  {/* Offset colour block behind image */}
                  <div
                    className="absolute top-4 right-4 bottom-[-12px] left-[-12px] rounded-[28px] opacity-25"
                    style={{ backgroundColor: primary }}
                  />
                  <div
                    className="absolute top-[-12px] right-[-12px] bottom-4 left-4 rounded-[28px] opacity-10 border-2"
                    style={{ borderColor: primary }}
                  />

                  {/* Main image */}
                  {about_data?.avatar ? (
                    <img
                      src={about_data.avatar}
                      alt={clinic.name}
                      className="relative z-10 w-full aspect-[4/5] object-cover shadow-2xl"
                      style={{ borderRadius: "24px" }}
                    />
                  ) : hero_data.bgImage ? (
                    <img
                      src={hero_data.bgImage}
                      alt={clinic.name}
                      className="relative z-10 w-full aspect-[4/5] object-cover shadow-2xl"
                      style={{ borderRadius: "24px" }}
                    />
                  ) : (
                    <div
                      className="relative z-10 w-full aspect-[4/5] flex flex-col items-center justify-center shadow-xl"
                      style={{
                        borderRadius: "24px",
                        background: `linear-gradient(135deg, ${pa(0.14)}, ${pa(0.05)})`,
                        border: `1px solid ${pa(0.16)}`,
                      }}
                    >
                      <Stethoscope className="w-16 h-16 mb-4 opacity-20" style={{ color: primary }} />
                      <p className="text-[#1C1C27]/35 text-sm font-medium">{clinic.name}</p>
                    </div>
                  )}

                  {/* Floating: certified */}
                  <div className="absolute -bottom-6 sm:-bottom-8 -left-4 sm:-left-8 z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100/80 af">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1C1C27]">Médecin certifié</p>
                        <p className="text-[10px] text-[#1C1C27]/40 mt-0.5">Ordre National des Médecins</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating: rating */}
                  <div className="absolute -top-6 sm:-top-8 -right-4 sm:-right-6 z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100/80 af2">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-[#1C1C27]">4.9 / 5</p>
                    <p className="text-[10px] text-[#1C1C27]/40 mt-0.5">250+ avis patients</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════
            TRUST MARQUEE
        ═══════════════════ */}
        <div className="bg-white border-y border-gray-100 py-4 overflow-hidden">
          <div className="flex" aria-hidden="true">
            <div className="marquee-track flex items-center shrink-0 gap-0">
              {[...Array(2)].map((_, repeatIndex) => (
                <div key={repeatIndex} className="flex items-center">
                  {[
                    { icon: Shield, label: "Conventionné secteur 1" },
                    { icon: CheckCircle2, label: "Remboursé Assurance Maladie" },
                    { icon: Award, label: "Certifié Ordre des Médecins" },
                    { icon: Calendar, label: "RDV en ligne 24h/24" },
                    { icon: Star, label: "4.9/5 sur 250+ avis" },
                    { icon: Phone, label: "Réponse sous 24h" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm font-medium text-[#1C1C27]/50 whitespace-nowrap px-8">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: primary }} />
                      {label}
                      <span className="ml-8 text-[#1C1C27]/15">·</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ═══════════════════
            SERVICES
        ═══════════════════ */}
        {show_services && services.length > 0 && (
          <section id="services" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#F8F7F4]">
            <div className="max-w-6xl mx-auto">

              {/* Header: editorial left-aligned */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3"
                    style={{ color: primary }}
                  >
                    Nos spécialités
                  </p>
                  <h2
                    className="ch font-bold text-[#1C1C27] leading-tight"
                    style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)" }}
                  >
                    Domaines d'expertise
                  </h2>
                </div>
                <p className="text-[#1C1C27]/50 text-base max-w-sm lg:text-right leading-relaxed">
                  Des soins personnalisés et de haute qualité pour répondre à tous vos besoins médicaux.
                </p>
              </div>

              {/* Numbered grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200/60">
                {services.map((service, index) => {
                  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                  const match = service.name.match(emojiRegex);
                  const icon = match ? match[1] : "🩺";
                  const displayName = match ? match[2] : service.name;
                  const num = String(index + 1).padStart(2, "0");

                  return (
                    <div
                      key={service.id}
                      className="svc-card relative bg-white p-7 lg:p-8 group overflow-hidden transition-all duration-300 hover:z-10 hover:shadow-[0_12px_48px_rgba(0,0,0,0.1)]"
                    >
                      {/* Large decorative number */}
                      <div
                        className="absolute top-4 right-4 ch text-7xl font-black leading-none select-none transition-opacity duration-300"
                        style={{ color: pa(0.06) }}
                      >
                        {num}
                      </div>

                      {/* Emoji icon */}
                      <div
                        className="w-12 h-12 flex items-center justify-center text-xl mb-6 rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: pa(0.08), borderRadius: "12px" }}
                      >
                        {icon}
                      </div>

                      <h3 className="ch text-[1.15rem] font-bold text-[#1C1C27] mb-2 relative z-10">
                        {displayName}
                      </h3>
                      <p className="text-sm text-[#1C1C27]/50 leading-relaxed relative z-10">
                        {service.description ||
                          "Consultation médicale spécialisée avec diagnostic précis et suivi personnalisé adapté à vos besoins."}
                      </p>

                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100 text-xs font-semibold relative z-10">
                        <span className="flex items-center gap-1.5 text-[#1C1C27]/40">
                          <Clock className="w-3.5 h-3.5" />
                          {service.duration_minutes} min
                        </span>
                        {service.price && (
                          <span
                            className="px-3 py-1.5 rounded-full font-bold"
                            style={{ color: primary, backgroundColor: pa(0.08) }}
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


        {/* ═══════════════════
            ABOUT
        ═══════════════════ */}
        {(about_data?.bio || about_data?.avatar) && (
          <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
            {/* Decorative accent stripe */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 hidden lg:block"
              style={{ backgroundColor: primary }}
            />

            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

                {/* Image */}
                <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                  {about_data?.avatar ? (
                    <div className="relative">
                      {/* Background square */}
                      <div
                        className="absolute inset-0 translate-x-5 translate-y-5 rounded-3xl"
                        style={{ backgroundColor: pa(0.1) }}
                      />
                      <img
                        src={about_data.avatar}
                        alt="Médecin"
                        className="relative z-10 w-full aspect-[3/4] object-cover shadow-2xl"
                        style={{ borderRadius: "24px" }}
                      />

                      {/* Experience badge */}
                      <div
                        className="absolute -bottom-6 left-6 z-20 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: pa(0.1) }}
                          >
                            <Award className="w-6 h-6" style={{ color: primary }} />
                          </div>
                          <div>
                            <p className="ch text-2xl font-bold text-[#1C1C27] leading-none">15+</p>
                            <p className="text-xs text-[#1C1C27]/45 mt-0.5">Ans d'expérience</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-[3/4] flex flex-col items-center justify-center shadow-lg"
                      style={{
                        borderRadius: "24px",
                        background: `linear-gradient(145deg, ${pa(0.1)}, ${pa(0.03)})`,
                        border: `1px solid ${pa(0.12)}`,
                      }}
                    >
                      <Stethoscope className="w-20 h-20 opacity-20" style={{ color: primary }} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-7 text-center lg:text-left">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: primary }}
                  >
                    Notre cabinet
                  </p>

                  <h2
                    className="ch font-bold text-[#1C1C27] leading-tight"
                    style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)" }}
                  >
                    À propos du{" "}
                    <span style={{ color: primary }}>cabinet</span>
                  </h2>

                  {/* Pull quote */}
                  <blockquote
                    className="relative pl-5 border-l-4 text-left"
                    style={{ borderColor: primary }}
                  >
                    <Quote
                      className="absolute -top-2 -left-1 w-5 h-5 opacity-20"
                      style={{ color: primary }}
                    />
                    <p className="ch italic text-[#1C1C27]/70 text-base lg:text-lg leading-relaxed">
                      {about_data?.bio
                        ? (about_data.bio.split(".")[0] + ".").trim()
                        : "Une médecine de qualité, au service de chaque patient."}
                    </p>
                  </blockquote>

                  {about_data?.bio && (
                    <p className="text-[#1C1C27]/55 leading-relaxed text-base whitespace-pre-line">
                      {about_data.bio.split(".").slice(1).join(".").trim()}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                    {[
                      { value: "15+", label: "Ans d'expérience" },
                      { value: "10k+", label: "Patients traités" },
                      { value: "98%", label: "Satisfaction" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="ch text-2xl sm:text-3xl font-bold" style={{ color: primary }}>
                          {s.value}
                        </div>
                        <div className="text-[11px] text-[#1C1C27]/40 font-medium mt-1 leading-tight">
                          {s.label}
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
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: primary }} />
                        <span className="text-sm text-[#1C1C27]/60">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}


        {/* ═══════════════════
            TESTIMONIALS
        ═══════════════════ */}
        <section id="testimonials" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: pa(0.04) }}>
          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: primary }}>
                Témoignages
              </p>
              <h2
                className="ch font-bold text-[#1C1C27] leading-tight"
                style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)" }}
              >
                Ce que disent nos patients
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  className="bg-white p-7 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col"
                  style={{ borderRadius: cardRadius }}
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Large quote mark */}
                  <div
                    className="ch text-6xl font-black leading-none mb-2 select-none"
                    style={{ color: pa(0.12) }}
                  >
                    "
                  </div>

                  <p className="text-[#1C1C27]/65 text-sm leading-relaxed flex-1">{t.text}</p>

                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: pa(0.1), color: primary }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C27]">{t.name}</p>
                      <p className="text-[11px] text-[#1C1C27]/40">{t.context}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════
            CTA / CONTACT
        ═══════════════════ */}
        <section
          id="contact"
          className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{ backgroundColor: primary }}
        >
          {/* White blobs */}
          <div className="absolute -top-20 right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07] bg-white blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full opacity-[0.07] bg-white blur-[80px] pointer-events-none" />

          {/* Dot grid white */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
              backgroundSize: "30px 30px",
            }}
          />

          {/* Giant decorative text */}
          <div
            className="absolute right-0 bottom-0 ch font-black leading-none select-none pointer-events-none opacity-[0.04] text-white"
            style={{ fontSize: "clamp(8rem,18vw,20rem)", lineHeight: 0.9 }}
            aria-hidden="true"
          >
            RDV
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-start">

              {/* Left */}
              <div className="space-y-7 text-center lg:text-left">
                <h2
                  className="ch font-bold text-white leading-[1.05]"
                  style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}
                >
                  Prêt à prendre<br />rendez-vous ?
                </h2>
                <p className="text-white/60 text-base lg:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                  Notre assistant IA est disponible 24h/24 et 7j/7 pour vous trouver le créneau idéal. Rapide, simple, sans attente.
                </p>
                <div className="flex justify-center lg:justify-start">
                  <button
                    onClick={openWidget}
                    className="inline-flex items-center gap-2 px-7 py-[14px] bg-white font-semibold text-sm hover:bg-white/92 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 active:scale-[0.97]"
                    style={{ color: primary, borderRadius: style_config.radius }}
                  >
                    <Calendar className="w-4 h-4" />
                    {show_chat_widget ? "Ouvrir l'assistant IA" : "Prendre rendez-vous"}
                  </button>
                </div>

                {/* Mini trust */}
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
              <div
                className="rounded-3xl p-6 lg:p-8 border border-white/20 space-y-6"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
              >
                <h3 className="ch text-white font-bold text-xl">Informations pratiques</h3>

                {[
                  {
                    icon: MapPin,
                    title: "Adresse",
                    desc: contactAddress || "Communiquée à la confirmation de votre rendez-vous.",
                  },
                  {
                    icon: Clock,
                    title: "Horaires",
                    desc: contactSchedule,
                  },
                  {
                    icon: Phone,
                    title: "Contact",
                    desc: contactPhone || "Joignez-nous via l'assistant IA ou le formulaire en ligne.",
                  },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={title}>
                    {i > 0 && <div className="h-px bg-white/10" />}
                    <div className="flex items-start gap-4 pt-[i === 0 ? 0 : 6px]">
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
              </div>

            </div>
          </div>
        </section>


        {/* ═══════════════════
            FOOTER
        ═══════════════════ */}
        <footer className="bg-[#0C0C15] text-white pt-14 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">

            {/* Top grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/08">

              {/* Brand */}
              <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                    style={{ backgroundColor: primary, color: ctaTextColor }}
                  >
                    {clinicInitial}
                  </div>
                  <span className="ch font-semibold text-white/80">{clinic.name}</span>
                </div>
                <p className="text-sm text-white/35 leading-relaxed max-w-[200px]">
                  Cabinet médical dédié à votre santé et votre bien-être.
                </p>
              </div>

              {/* Navigation */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-4">Navigation</p>
                <div className="space-y-3">
                  {navLinks.map((l) => (
                    <a key={l.href} href={l.href} className="block text-sm text-white/45 hover:text-white/75 transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Services */}
              {show_services && services.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-4">Spécialités</p>
                  <div className="space-y-3">
                    {services.slice(0, 5).map((s) => {
                      const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                      const match = s.name.match(emojiRegex);
                      const name = match ? match[2] : s.name;
                      return (
                        <a key={s.id} href="#services" className="block text-sm text-white/45 hover:text-white/75 transition-colors truncate">
                          {name}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact info */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-4">Contact</p>
                <div className="space-y-3 text-sm text-white/45">
                  {contactSchedule && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: pa(0.6) }} />
                      <span className="leading-relaxed">{contactSchedule.split("\n")[0]}</span>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: pa(0.6) }} />
                      <a href={`tel:${contactPhone}`} className="hover:text-white/70 transition-colors">{contactPhone}</a>
                    </div>
                  )}
                  {contactAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: pa(0.6) }} />
                      <span className="leading-relaxed">{contactAddress}</span>
                    </div>
                  )}
                  {contactInsurance && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: pa(0.6) }} />
                      <span>{contactInsurance}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: pa(0.6) }} />
                    <a href="#contact" onClick={openWidget} className="hover:text-white/70 transition-colors">Prendre rendez-vous</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[12px] text-white/25">
              <span>© {new Date().getFullYear()} {clinic.name}. Tous droits réservés.</span>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white/45 transition-colors">Mentions légales</a>
                <a href="#" className="hover:text-white/45 transition-colors">Confidentialité</a>
              </div>
              <span>
                Propulsé par{" "}
                <a href="https://docflow.ai" className="text-white/45 hover:text-white/70 font-semibold transition-colors">
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
