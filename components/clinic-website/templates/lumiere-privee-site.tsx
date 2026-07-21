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
  Phone,
  Stethoscope,
} from "lucide-react";

interface LumierePriveeSiteProps {
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
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(198,161,91,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function LumierePriveeSite({ website, clinic, services, doctor }: LumierePriveeSiteProps) {
  const { style_config, hero_data, about_data, contact_data, show_chat_widget, show_services, show_testimonials, testimonials } = website;
  const patientTestimonials: Array<{ text: string; name: string; context: string }> = Array.isArray(testimonials) ? testimonials : [];

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
  const contactSchedule = contact_data?.schedule || "Lundi – Vendredi · 9h – 19h";
  const contactInsurance = contact_data?.insurance_info || "Sur rendez-vous uniquement";

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

  const gold = style_config.primary || "#C6A15B";
  const ink = "#0B0A08";
  const ivory = "#F4EFE4";
  const ga = (a: number) => hexToRgba(gold, a);
  const clinicInitial = (clinic.name || "M").charAt(0).toUpperCase();

  const navLinks = [
    { label: "Accueil", href: "#hero" },
    ...(show_services && services.length > 0 ? [{ label: "Prestations", href: "#services" }] : []),
    ...((about_data?.bio || about_data?.avatar) ? [{ label: "Le praticien", href: "#about" }] : []),
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen antialiased scroll-smooth" style={{ backgroundColor: ink, color: ivory, overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Manrope:wght@300;400;500;600;700&display=swap');

        .fr  { font-family: 'Fraunces', Georgia, serif; }
        .mnr { font-family: 'Manrope', system-ui, sans-serif; }

        #hero, #services, #about, #testimonials, #contact { scroll-margin-top: 96px; }

        @keyframes _rise { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
        .r1 { animation: _rise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .r2 { animation: _rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s both; }
        .r3 { animation: _rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .r4 { animation: _rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s both; }

        .lp-link { position: relative; }
        .lp-link::after {
          content: ""; position: absolute; left: 0; right: 100%; bottom: -3px; height: 1px;
          background: var(--gold); transition: right 0.35s cubic-bezier(0.65,0,0.35,1);
        }
        .lp-link:hover::after { right: 0; }

        .lp-row { transition: background-color 0.3s ease, padding-left 0.3s ease; }
        .lp-row:hover { background-color: rgba(198,161,91,0.05); padding-left: 12px; }

        .lp-card { transition: border-color 0.3s ease, transform 0.3s ease; }
        .lp-card:hover { border-color: var(--gold); transform: translateY(-2px); }

        .drawer { transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
        .drawer.open { transform: translateX(0); }
      `}</style>

      <div className="mnr" style={{ ["--gold" as string]: gold }}>

        {/* ═══════ NAV ═══════ */}
        <header
          className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-500", isScrolled ? "py-4" : "py-7")}
          style={{
            backgroundColor: isScrolled ? `${ink}f2` : "transparent",
            backdropFilter: isScrolled ? "blur(14px)" : "none",
            borderBottom: isScrolled ? `1px solid ${ga(0.15)}` : "1px solid transparent",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-6">
            <a href="#hero" className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 border flex items-center justify-center fr text-[15px]" style={{ borderColor: ga(0.5), color: gold }}>
                {clinicInitial}
              </div>
              <span className="hidden sm:block fr text-[17px] tracking-wide" style={{ color: ivory }}>
                {clinic.name}
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="lp-link text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: `${ivory}90` }}>
                  {link.label}
                </a>
              ))}
            </nav>

            <a
              href="#contact"
              onClick={openWidget}
              className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] border transition-all duration-300 hover:bg-[var(--gold)]"
              style={{ borderColor: gold, color: gold }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = gold)}
            >
              {hero_data.ctaPrimary || "Prendre rendez-vous"}
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center border"
              style={{ borderColor: ga(0.3) }}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" style={{ color: ivory }} /> : <Menu className="w-4 h-4" style={{ color: ivory }} />}
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <div className={cn("fixed inset-0 z-40 md:hidden", mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none")}>
          <div
            className={cn("absolute inset-0 transition-opacity duration-300", mobileMenuOpen ? "opacity-100" : "opacity-0")}
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={cn("absolute right-0 top-0 bottom-0 w-[280px] flex flex-col drawer", mobileMenuOpen && "open")} style={{ backgroundColor: ink, borderLeft: `1px solid ${ga(0.15)}` }}>
            <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor: ga(0.12) }}>
              <span className="fr text-[19px]" style={{ color: ivory }}>{clinic.name}</span>
              <button onClick={() => setMobileMenuOpen(false)}><X className="w-4 h-4" style={{ color: ivory }} /></button>
            </div>
            <nav className="flex-1 flex flex-col p-6 gap-6 mt-2">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-[13px] font-medium uppercase tracking-[0.16em]" style={{ color: `${ivory}80` }}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="p-6 border-t" style={{ borderColor: ga(0.12) }}>
              <a
                href="#contact"
                onClick={(e) => { setMobileMenuOpen(false); openWidget(e); }}
                className="flex items-center justify-center w-full py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] border"
                style={{ borderColor: gold, color: gold }}
              >
                {hero_data.ctaPrimary || "Prendre rendez-vous"}
              </a>
            </div>
          </div>
        </div>

        {/* ═══════ HERO ═══════ */}
        <section id="hero" className="relative min-h-[100svh] flex items-center pt-32 pb-20 px-6 lg:px-10" style={{ backgroundColor: ink }}>
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 80% 20%, ${ga(0.08)}, transparent 70%)`,
            }}
          />
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">

              <div className="space-y-9">
                <div className="flex items-center gap-4 r1">
                  <span className="w-10 h-px" style={{ backgroundColor: gold }} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: gold }}>
                    {clinic.name}
                  </span>
                </div>

                <h1 className="fr italic font-normal leading-[1.04] r2" style={{ fontSize: "clamp(2.75rem,6vw,5.25rem)", color: ivory }}>
                  {hero_data.title || "Une médecine d'exception, en toute confidentialité"}
                </h1>

                <p className="text-[15px] leading-relaxed max-w-md r3" style={{ color: `${ivory}70` }}>
                  {hero_data.subtitle || "Un accompagnement médical d'excellence, sur rendez-vous, dans un cadre pensé pour votre sérénité."}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 r4">
                  <a
                    href="#contact"
                    onClick={openWidget}
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] transition-all duration-300"
                    style={{ backgroundColor: gold, color: ink }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {hero_data.ctaPrimary || "Prendre rendez-vous"}
                  </a>
                  {hero_data.ctaSecondary && (
                    <a
                      href={show_services && services.length > 0 ? "#services" : "#about"}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] border"
                      style={{ borderColor: `${ivory}25`, color: ivory }}
                    >
                      {hero_data.ctaSecondary}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-10 pt-8 border-t r4" style={{ borderColor: ga(0.15) }}>
                  {[
                    { value: "20+", label: "Années d'exercice" },
                    { value: "Privé", label: "Sur rendez-vous" },
                    { value: "5.0", label: "Satisfaction patients" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="fr italic text-2xl" style={{ color: gold }}>{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-[0.14em] mt-1.5" style={{ color: `${ivory}45` }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative r3">
                <div className="absolute -top-5 -left-5 w-full h-full border" style={{ borderColor: ga(0.4) }} />
                {about_data?.avatar || hero_data.bgImage ? (
                  <img
                    src={about_data?.avatar || hero_data.bgImage}
                    alt={clinic.name}
                    className="relative z-10 w-full aspect-[4/5] object-cover"
                    style={{ filter: "grayscale(0.15) contrast(1.05)" }}
                  />
                ) : (
                  <div className="relative z-10 w-full aspect-[4/5] flex flex-col items-center justify-center" style={{ backgroundColor: "#141210" }}>
                    <Stethoscope className="w-14 h-14 mb-4" style={{ color: ga(0.35) }} />
                    <p className="fr italic text-lg" style={{ color: ga(0.5) }}>{clinic.name}</p>
                  </div>
                )}
                <div className="absolute -bottom-6 left-8 right-8 z-20 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: ink, border: `1px solid ${ga(0.3)}` }}>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3 h-3" style={{ fill: gold, color: gold }} />)}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: `${ivory}55` }}>Excellence reconnue</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════ TRUST STRIP ═══════ */}
        <div className="py-6 px-6 lg:px-10 border-y" style={{ backgroundColor: "#100E0B", borderColor: ga(0.12) }}>
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { icon: Shield, label: "Confidentialité absolue" },
              { icon: Award, label: "Praticien certifié" },
              { icon: Calendar, label: "Rendez-vous personnalisé" },
              { icon: Star, label: "Excellence reconnue" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className="w-3.5 h-3.5" style={{ color: gold }} />
                <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: `${ivory}55` }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ SERVICES ═══════ */}
        {show_services && services.length > 0 && (
          <section id="services" className="py-24 lg:py-32 px-6 lg:px-10" style={{ backgroundColor: ink }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] mb-4" style={{ color: gold }}>Prestations</p>
                <h2 className="fr italic font-normal leading-[1.05]" style={{ fontSize: "clamp(2.25rem,4.5vw,3.75rem)", color: ivory }}>
                  Nos domaines d'expertise
                </h2>
              </div>

              <div>
                {services.map((service, index) => {
                  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                  const match = service.name.match(emojiRegex);
                  const displayName = match ? match[2] : service.name;
                  const num = String(index + 1).padStart(2, "0");

                  return (
                    <div
                      key={service.id}
                      className="lp-row flex items-center justify-between gap-6 py-7 border-b"
                      style={{ borderColor: ga(0.12) }}
                    >
                      <div className="flex items-center gap-6 min-w-0">
                        <span className="fr italic text-lg shrink-0" style={{ color: ga(0.5) }}>{num}</span>
                        <div className="min-w-0">
                          <h3 className="fr text-xl truncate" style={{ color: ivory }}>{displayName}</h3>
                          {service.description && (
                            <p className="text-[13px] mt-1 truncate" style={{ color: `${ivory}50` }}>{service.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <span className="text-[12px] uppercase tracking-[0.1em] hidden sm:flex items-center gap-1.5" style={{ color: `${ivory}45` }}>
                          <Clock className="w-3 h-3" />{service.duration_minutes} min
                        </span>
                        {service.price && (
                          <span className="fr italic text-lg" style={{ color: gold }}>{service.price} €</span>
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
          <section id="about" className="py-24 lg:py-32 px-6 lg:px-10" style={{ backgroundColor: "#100E0B" }}>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-16 lg:gap-24 items-center">

                <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                  {about_data?.avatar ? (
                    <>
                      <div className="absolute -top-5 -right-5 w-full h-full border" style={{ borderColor: ga(0.4) }} />
                      <img src={about_data.avatar} alt="Praticien" className="relative z-10 w-full aspect-[4/5] object-cover" style={{ filter: "grayscale(0.15) contrast(1.05)" }} />
                    </>
                  ) : (
                    <div className="w-full aspect-[4/5] flex items-center justify-center" style={{ backgroundColor: "#141210" }}>
                      <Stethoscope className="w-16 h-16" style={{ color: ga(0.3) }} />
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: gold }}>Le praticien</p>
                  <h2 className="fr italic font-normal leading-[1.05]" style={{ fontSize: "clamp(2.25rem,4.5vw,3.5rem)", color: ivory }}>
                    Une pratique fondée sur l'exigence
                  </h2>

                  <div className="pl-6 border-l" style={{ borderColor: gold }}>
                    <p className="fr italic text-lg leading-relaxed" style={{ color: `${ivory}80` }}>
                      {about_data?.bio ? (about_data.bio.split(".")[0] + ".").trim() : "Une médecine d'exception, au service de chaque patient."}
                    </p>
                  </div>

                  {about_data?.bio && (
                    <p className="text-[14px] leading-relaxed" style={{ color: `${ivory}55` }}>
                      {about_data.bio.split(".").slice(1).join(".").trim()}
                    </p>
                  )}

                  <div className="space-y-4 pt-4">
                    {[
                      "Membre de l'Ordre National des Médecins",
                      "Formation continue aux techniques les plus avancées",
                      "Suivi personnalisé et discrétion absolue",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-4">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: gold }} />
                        <span className="text-[13px]" style={{ color: `${ivory}65` }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* ═══════ TESTIMONIALS ═══════ */}
        {show_testimonials !== false && patientTestimonials.length > 0 && (
          <section id="testimonials" className="py-24 lg:py-32 px-6 lg:px-10" style={{ backgroundColor: ink }}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] mb-4" style={{ color: gold }}>Témoignages</p>
                <h2 className="fr italic font-normal leading-[1.05]" style={{ fontSize: "clamp(2.25rem,4.5vw,3.5rem)", color: ivory }}>
                  Ce que disent nos patients
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {patientTestimonials.slice(0, 4).map((testimonial, i) => (
                  <div key={i} className="lp-card p-8 border" style={{ borderColor: ga(0.15) }}>
                    <div className="flex items-center gap-1 mb-5">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5" style={{ fill: gold, color: gold }} />)}
                    </div>
                    <p className="fr italic text-lg leading-relaxed mb-6" style={{ color: `${ivory}85` }}>
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center justify-between pt-5 border-t" style={{ borderColor: ga(0.12) }}>
                      <span className="text-[13px] font-semibold" style={{ color: ivory }}>{testimonial.name}</span>
                      <span className="text-[11px] uppercase tracking-[0.1em]" style={{ color: `${ivory}40` }}>{testimonial.context}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════ CONTACT / CTA ═══════ */}
        <section id="contact" className="relative py-24 lg:py-32 px-6 lg:px-10" style={{ backgroundColor: "#100E0B" }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-start">

              <div className="space-y-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: gold }}>Contact</p>
                <h2 className="fr italic font-normal leading-[1.05]" style={{ fontSize: "clamp(2.5rem,5.5vw,4.5rem)", color: ivory }}>
                  Prenez rendez-vous en toute discrétion
                </h2>
                <p className="text-[15px] leading-relaxed max-w-md" style={{ color: `${ivory}60` }}>
                  Notre assistant dédié organise votre venue selon vos disponibilités, dans la confidentialité la plus stricte.
                </p>
                <a
                  href="#contact"
                  onClick={openWidget}
                  className="inline-flex items-center gap-2.5 px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.16em]"
                  style={{ backgroundColor: gold, color: ink }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {show_chat_widget ? "Ouvrir l'assistant" : "Prendre rendez-vous"}
                </a>
              </div>

              <div className="space-y-7 p-8 border" style={{ borderColor: ga(0.2) }}>
                {[
                  { icon: MapPin, title: "Adresse", desc: contactAddress || "Communiquée à la confirmation du rendez-vous." },
                  { icon: Clock, title: "Horaires", desc: contactSchedule },
                  { icon: Phone, title: "Contact", desc: contactPhone || "Via notre assistant dédié." },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={title}>
                    {i > 0 && <div className="h-px mb-7" style={{ backgroundColor: ga(0.12) }} />}
                    <div className="flex items-start gap-4">
                      <Icon className="w-4 h-4 mt-1 shrink-0" style={{ color: gold }} />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: ivory }}>{title}</p>
                        <p className="text-[13px] leading-relaxed mt-1.5 whitespace-pre-line" style={{ color: `${ivory}55` }}>{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {contactInsurance && (
                  <div className="pt-2 border-t" style={{ borderColor: ga(0.12) }}>
                    <p className="text-[12px]" style={{ color: `${ivory}45` }}>{contactInsurance}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="pt-16 pb-8 px-6 lg:px-10" style={{ backgroundColor: ink, borderTop: `1px solid ${ga(0.12)}` }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border flex items-center justify-center fr text-[13px]" style={{ borderColor: ga(0.5), color: gold }}>
                  {clinicInitial}
                </div>
                <span className="fr italic text-[16px]" style={{ color: ivory }}>{clinic.name}</span>
              </div>
              <nav className="flex items-center gap-8">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} className="text-[11px] uppercase tracking-[0.14em]" style={{ color: `${ivory}45` }}>{l.label}</a>
                ))}
              </nav>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t text-[11px]" style={{ borderColor: ga(0.1), color: `${ivory}35` }}>
              <span>© {new Date().getFullYear()} {clinic.name}. Tous droits réservés.</span>
              <span>Propulsé par <span style={{ color: `${ivory}55` }}>DocFlow IA</span></span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
