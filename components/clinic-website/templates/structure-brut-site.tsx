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
  ArrowRight,
} from "lucide-react";

interface StructureBrutSiteProps {
  website: any;
  clinic: any;
  services: any[];
  doctor: any;
}

export function StructureBrutSite({ website, clinic, services, doctor }: StructureBrutSiteProps) {
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

  const accent = style_config.primary || "#0038FF";
  const ink = "#0A0A0A";
  const paper = "#F7F7F2";
  const clinicInitial = (clinic.name || "M").charAt(0).toUpperCase();

  const navLinks = [
    { label: "Accueil", href: "#hero" },
    ...(show_services && services.length > 0 ? [{ label: "Services", href: "#services" }] : []),
    ...((about_data?.bio || about_data?.avatar) ? [{ label: "Cabinet", href: "#about" }] : []),
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen antialiased scroll-smooth" style={{ backgroundColor: paper, color: ink, overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;500;600;700;800&display=swap');

        .an  { font-family: 'Anton', Impact, sans-serif; text-transform: uppercase; }
        .spm { font-family: 'Space Mono', monospace; }
        .wks { font-family: 'Work Sans', system-ui, sans-serif; }

        #hero, #services, #about, #testimonials, #contact { scroll-margin-top: 76px; }

        .hard-shadow { box-shadow: 8px 8px 0 var(--ink); }
        .hard-shadow-sm { box-shadow: 5px 5px 0 var(--ink); }
        .hard-btn {
          box-shadow: 6px 6px 0 var(--ink);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .hard-btn:hover { transform: translate(3px, 3px); box-shadow: 3px 3px 0 var(--ink); }
        .hard-btn:active { transform: translate(6px, 6px); box-shadow: 0 0 0 var(--ink); }

        .brut-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .brut-card:hover { transform: translate(-3px, -3px); box-shadow: 8px 8px 0 var(--ink); }

        @keyframes _marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: _marquee 22s linear infinite; }

        .drawer { transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
        .drawer.open { transform: translateX(0); }
      `}</style>

      <div className="wks" style={{ ["--ink" as string]: ink }}>

        {/* ═══════ NAV ═══════ */}
        <header
          className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-200", isScrolled ? "py-3" : "py-4")}
          style={{ backgroundColor: paper, borderBottom: `3px solid ${ink}` }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <a href="#hero" className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 flex items-center justify-center font-black text-base an" style={{ backgroundColor: ink, color: paper }}>
                {clinicInitial}
              </div>
              <span className="hidden sm:block an text-[17px]" style={{ color: ink }}>{clinic.name}</span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="spm text-[12px] font-bold uppercase tracking-tight hover:underline decoration-2 underline-offset-4" style={{ color: ink }}>
                  {link.label}
                </a>
              ))}
            </nav>

            <a
              href="#contact"
              onClick={openWidget}
              className="hard-btn hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase border-[3px]"
              style={{ backgroundColor: accent, borderColor: ink, color: paper }}
            >
              {hero_data.ctaPrimary || "Prendre RDV"}
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center border-[3px]"
              style={{ borderColor: ink }}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <div className={cn("fixed inset-0 z-40 md:hidden", mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none")}>
          <div className={cn("absolute inset-0 transition-opacity duration-300", mobileMenuOpen ? "opacity-100" : "opacity-0")} style={{ backgroundColor: "rgba(10,10,10,0.5)" }} onClick={() => setMobileMenuOpen(false)} />
          <div className={cn("absolute right-0 top-0 bottom-0 w-[280px] flex flex-col drawer", mobileMenuOpen && "open")} style={{ backgroundColor: paper, borderLeft: `3px solid ${ink}` }}>
            <div className="flex items-center justify-between px-5 py-5 border-b-[3px]" style={{ borderColor: ink }}>
              <span className="an text-[20px]">{clinic.name}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center border-[2px]" style={{ borderColor: ink }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col p-4 gap-1 mt-1">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="spm flex items-center justify-between px-3 py-3.5 font-bold text-[14px] uppercase border-b" style={{ borderColor: `${ink}15` }}>
                  {link.label}
                  <ArrowRight className="w-4 h-4" />
                </a>
              ))}
            </nav>
            <div className="p-4 border-t-[3px]" style={{ borderColor: ink }}>
              <a
                href="#contact"
                onClick={(e) => { setMobileMenuOpen(false); openWidget(e); }}
                className="hard-btn flex items-center justify-center gap-2 w-full py-3.5 font-bold text-[14px] uppercase border-[3px]"
                style={{ backgroundColor: accent, borderColor: ink, color: paper }}
              >
                {hero_data.ctaPrimary || "Prendre rendez-vous"}
              </a>
            </div>
          </div>
        </div>

        {/* ═══════ HERO ═══════ */}
        <section id="hero" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: paper }}>
          <div
            className="absolute left-[-4vw] top-[18%] an select-none pointer-events-none -z-0 leading-none"
            style={{ fontSize: "clamp(8rem,22vw,20rem)", WebkitTextStroke: `1.5px ${ink}12`, color: "transparent" }}
            aria-hidden="true"
          >
            RDV
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 border-[3px] spm text-[11px] font-bold uppercase" style={{ borderColor: ink, backgroundColor: accent, color: paper }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: paper }} />
              Consultation disponible
            </div>

            <h1 className="an leading-[0.88] mb-8" style={{ fontSize: "clamp(3.25rem,10vw,8.5rem)", color: ink }}>
              {hero_data.title || "Votre santé sans compromis"}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
              <p className="text-base sm:text-lg leading-relaxed max-w-xl border-l-[3px] pl-5" style={{ borderColor: accent, color: `${ink}80` }}>
                {hero_data.subtitle || "Un accompagnement médical direct, sans détour, disponible 24h/24 pour votre bien-être."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  onClick={openWidget}
                  className="hard-btn inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm uppercase border-[3px] whitespace-nowrap"
                  style={{ backgroundColor: ink, borderColor: ink, color: paper }}
                >
                  <Calendar className="w-4 h-4" />
                  {hero_data.ctaPrimary || "Prendre rendez-vous"}
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-0 mt-16 border-[3px]" style={{ borderColor: ink }}>
              {[
                { value: "15+", label: "Ans d'expérience" },
                { value: "10K+", label: "Patients suivis" },
                { value: "98%", label: "Satisfaction" },
              ].map((stat, i) => (
                <div key={stat.label} className="p-6 text-center" style={{ borderLeft: i > 0 ? `3px solid ${ink}` : "none" }}>
                  <div className="an leading-none" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: i === 1 ? accent : ink }}>{stat.value}</div>
                  <div className="spm text-[10px] font-bold uppercase mt-2" style={{ color: `${ink}60` }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ TRUST MARQUEE ═══════ */}
        <div className="overflow-hidden py-3.5" style={{ backgroundColor: ink, borderTop: `3px solid ${ink}`, borderBottom: `3px solid ${ink}` }}>
          <div className="flex" aria-hidden="true">
            <div className="marquee-track flex items-center shrink-0 gap-0">
              {[...Array(2)].map((_, ri) => (
                <div key={ri} className="flex items-center">
                  {["Conventionné S.1", "Remboursé Assurance Maladie", "Certifié Ordre des Médecins", "RDV en ligne 24h/24", "4.9/5 · 250+ avis"].map((label) => (
                    <div key={label} className="spm flex items-center gap-3 text-[12px] font-bold uppercase whitespace-nowrap px-8" style={{ color: paper }}>
                      <span className="w-1.5 h-1.5" style={{ backgroundColor: accent }} />
                      {label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ SERVICES ═══════ */}
        {show_services && services.length > 0 && (
          <section id="services" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: paper }}>
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between gap-6 mb-14">
                <h2 className="an leading-[0.9]" style={{ fontSize: "clamp(2.5rem,6vw,5rem)", color: ink }}>
                  Nos <span style={{ color: accent }}>services</span>
                </h2>
                <span className="spm text-[11px] font-bold uppercase hidden sm:block" style={{ color: `${ink}50` }}>{String(services.length).padStart(2, "0")} spécialités</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-[3px]" style={{ borderColor: ink }}>
                {services.map((service, index) => {
                  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                  const match = service.name.match(emojiRegex);
                  const icon = match ? match[1] : "+";
                  const displayName = match ? match[2] : service.name;
                  const num = String(index + 1).padStart(2, "0");
                  const cols = 3;
                  const isRightEdge = (index + 1) % cols === 0;
                  const isBottomRow = index >= services.length - (services.length % cols || cols);

                  return (
                    <div
                      key={service.id}
                      className="brut-card relative p-6 group"
                      style={{
                        borderRight: isRightEdge ? "none" : `3px solid ${ink}`,
                        borderBottom: isBottomRow ? "none" : `3px solid ${ink}`,
                        backgroundColor: index % 5 === 2 ? accent : paper,
                      }}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <span className="an text-3xl" style={{ color: index % 5 === 2 ? paper : `${ink}25` }}>{num}</span>
                        <span className="text-2xl">{icon}</span>
                      </div>
                      <h3 className="an text-xl mb-2 leading-tight" style={{ color: index % 5 === 2 ? paper : ink }}>{displayName}</h3>
                      <p className="text-[13px] leading-relaxed mb-4" style={{ color: index % 5 === 2 ? `${paper}90` : `${ink}55` }}>
                        {service.description || "Consultation médicale spécialisée avec diagnostic précis."}
                      </p>
                      <div className="flex items-center gap-2 spm text-[11px] font-bold uppercase" style={{ color: index % 5 === 2 ? paper : ink }}>
                        <Clock className="w-3 h-3" />
                        {service.duration_minutes} min
                        {service.price && <span className="ml-auto">{service.price}€</span>}
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
          <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: ink }}>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-[3px]" style={{ borderColor: paper }}>

                <div className="relative aspect-[4/5] lg:aspect-auto" style={{ borderBottom: `3px solid ${paper}`, borderRight: "none" }}>
                  {about_data?.avatar ? (
                    <img src={about_data.avatar} alt="Cabinet médical" className="w-full h-full object-cover grayscale" style={{ minHeight: "320px" }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#141414", minHeight: "320px" }}>
                      <Stethoscope className="w-16 h-16" style={{ color: `${paper}30` }} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 px-3 py-2 border-[3px] spm text-[11px] font-bold uppercase" style={{ backgroundColor: accent, borderColor: paper, color: paper }}>
                    <Award className="w-3.5 h-3.5 inline mr-1.5" />15+ ans
                  </div>
                </div>

                <div className="p-8 lg:p-12 space-y-6" style={{ borderLeft: `3px solid ${paper}` }}>
                  <h2 className="an leading-[0.9]" style={{ fontSize: "clamp(2.25rem,4.5vw,3.5rem)", color: paper }}>
                    À propos <span style={{ color: accent }}>du cabinet</span>
                  </h2>

                  <p className="spm text-[13px] leading-relaxed border-l-[3px] pl-4" style={{ borderColor: accent, color: `${paper}90` }}>
                    {about_data?.bio ? (about_data.bio.split(".")[0] + ".").trim() : "Une médecine directe, sans détour."}
                  </p>

                  {about_data?.bio && (
                    <p className="text-[14px] leading-relaxed" style={{ color: `${paper}60` }}>
                      {about_data.bio.split(".").slice(1).join(".").trim()}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-0 border-[3px] mt-6" style={{ borderColor: paper }}>
                    {[
                      { value: "15+", label: "Ans" },
                      { value: "10K+", label: "Patients" },
                      { value: "98%", label: "Satisfaits" },
                    ].map((stat, i) => (
                      <div key={stat.label} className="text-center py-4" style={{ borderLeft: i > 0 ? `3px solid ${paper}` : "none" }}>
                        <div className="an text-xl" style={{ color: i === 1 ? accent : paper }}>{stat.value}</div>
                        <div className="text-[9px] uppercase mt-1" style={{ color: `${paper}45` }}>{stat.label}</div>
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
          <section id="testimonials" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: paper }}>
            <div className="max-w-6xl mx-auto">
              <h2 className="an leading-[0.9] mb-14" style={{ fontSize: "clamp(2.5rem,6vw,5rem)", color: ink }}>
                Avis <span style={{ color: accent }}>patients</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-[3px]" style={{ borderColor: ink }}>
                {patientTestimonials.slice(0, 3).map((testimonial, i) => (
                  <div key={i} className="p-7 relative" style={{ borderLeft: i > 0 ? `3px solid ${ink}` : "none" }}>
                    <div className="an text-6xl leading-none mb-3" style={{ color: `${ink}12` }}>"</div>
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5" style={{ fill: accent, color: accent }} />)}
                    </div>
                    <p className="text-[13px] leading-relaxed mb-6" style={{ color: `${ink}70` }}>{testimonial.text}</p>
                    <div className="flex items-center gap-3 pt-4 border-t-[2px]" style={{ borderColor: `${ink}15` }}>
                      <div className="w-8 h-8 flex items-center justify-center an text-[12px]" style={{ backgroundColor: ink, color: paper }}>
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{ color: ink }}>{testimonial.name}</p>
                        <p className="spm text-[10px] uppercase" style={{ color: `${ink}45` }}>{testimonial.context}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════ CONTACT / CTA ═══════ */}
        <section id="contact" className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: accent }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">

              <div className="space-y-7">
                <h2 className="an leading-[0.88]" style={{ fontSize: "clamp(2.75rem,7vw,6rem)", color: paper }}>
                  Prêt à prendre rendez-vous ?
                </h2>
                <p className="text-base lg:text-lg leading-relaxed max-w-md" style={{ color: `${paper}c0` }}>
                  Notre assistant IA est disponible 24h/24 pour vous trouver le créneau idéal.
                </p>
                <button
                  onClick={openWidget}
                  className="hard-btn inline-flex items-center gap-2 px-8 py-4 font-bold text-sm uppercase border-[3px]"
                  style={{ backgroundColor: ink, borderColor: paper, color: paper }}
                >
                  <Calendar className="w-4 h-4" />
                  {show_chat_widget ? "Ouvrir l'assistant IA" : "Prendre rendez-vous"}
                </button>
              </div>

              <div className="border-[3px] p-6 lg:p-8 space-y-5" style={{ borderColor: ink, backgroundColor: paper }}>
                <h3 className="an text-xl" style={{ color: ink }}>Infos pratiques</h3>
                {[
                  { icon: MapPin, title: "Adresse", desc: contactAddress || "Communiquée à la confirmation." },
                  { icon: Clock, title: "Horaires", desc: contactSchedule },
                  { icon: Phone, title: "Contact", desc: contactPhone || "Via l'assistant IA." },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <div key={title}>
                    {i > 0 && <div className="h-[2px] mb-5" style={{ backgroundColor: `${ink}15` }} />}
                    <div className="flex items-start gap-3">
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
                      <div>
                        <p className="spm text-[11px] font-bold uppercase" style={{ color: ink }}>{title}</p>
                        <p className="text-[13px] leading-relaxed mt-1 whitespace-pre-line" style={{ color: `${ink}60` }}>{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {contactInsurance && (
                  <div className="flex items-center gap-2 pt-2 border-t-[2px]" style={{ borderColor: `${ink}15` }}>
                    <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                    <span className="text-[12px] font-medium" style={{ color: `${ink}60` }}>{contactInsurance}</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer style={{ backgroundColor: ink, color: paper }} className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10 border-b-[2px]" style={{ borderColor: `${paper}15` }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 flex items-center justify-center an text-[14px]" style={{ backgroundColor: accent, color: paper }}>{clinicInitial}</div>
                <span className="an text-[18px]">{clinic.name}</span>
              </div>
              <nav className="flex items-center gap-6">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} className="spm text-[11px] font-bold uppercase" style={{ color: `${paper}55` }}>{l.label}</a>
                ))}
              </nav>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 spm text-[11px] uppercase" style={{ color: `${paper}35` }}>
              <span>© {new Date().getFullYear()} {clinic.name}</span>
              <span>Propulsé par <span style={{ color: `${paper}55` }}>DocFlow IA</span></span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
