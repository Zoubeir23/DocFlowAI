"use client";

import { Calendar, Star, Shield, Clock, MapPin, Users, Award } from "lucide-react";

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,45,120,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function WebsitePreview({ website }: { website: any }) {
  const { style_config, hero_data, about_data } = website;
  const primary = style_config.primary || "#FF2D78";
  const teal = "#26C6DA";
  const cream = "#F5F0E8";
  const dark = "#1A1A2E";
  const pa = (a: number) => hexToRgba(primary, a);

  const clinicLetter = (hero_data.title || "M").charAt(0).toUpperCase();

  return (
    <div
      className="w-full h-full relative flex flex-col overflow-hidden rounded-tl-2xl rounded-tr-2xl"
      style={{ backgroundColor: cream, fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        .prev-bbn { font-family: 'Bebas Neue', Impact, sans-serif; }
        .prev-pfd { font-family: 'Playfair Display', Georgia, serif; font-style: italic; }
      `}</style>

      {/* Browser chrome */}
      <div
        className="h-10 flex items-center px-4 gap-3 shrink-0 z-20"
        style={{ backgroundColor: cream, borderBottom: `1px solid ${dark}10` }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div
          className="flex-1 max-w-[180px] mx-auto h-5 rounded flex items-center justify-center text-[9px] font-medium px-2 truncate"
          style={{ backgroundColor: `${dark}08`, color: `${dark}50` }}
        >
          votre-site.docflow.ai
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: cream }}>

        {/* NAV */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: `${cream}f0`, backdropFilter: "blur(8px)", borderBottom: `1px solid ${dark}08` }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black prev-bbn"
              style={{ backgroundColor: primary, color: "#fff" }}
            >
              {clinicLetter}
            </div>
            <span className="prev-bbn text-[13px] tracking-wide truncate max-w-[90px]" style={{ color: dark }}>
              {hero_data.title || "Cabinet"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {["Accueil", "Cabinet", "Contact"].map((l) => (
              <span key={l} className="text-[9px] font-medium hidden sm:inline" style={{ color: `${dark}50` }}>{l}</span>
            ))}
            <div
              className="px-2.5 py-1 text-[9px] font-bold rounded-full text-white"
              style={{ backgroundColor: primary }}
            >
              {hero_data.ctaPrimary || "Prendre RDV"}
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="relative px-4 py-8 overflow-hidden" style={{ backgroundColor: cream }}>
          {/* Decorative circle */}
          <div
            className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[55%] aspect-square rounded-full -z-10 pointer-events-none"
            style={{ border: `1px solid ${primary}15` }}
          />

          {/* Big bg number */}
          <div
            className="absolute left-0 bottom-0 prev-bbn leading-none select-none -z-10"
            style={{ fontSize: "7rem", color: `${dark}04` }}
          >01</div>

          <div className="flex items-center gap-4">
            {/* Left */}
            <div className="flex-1 space-y-2.5">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-semibold uppercase tracking-widest"
                style={{ color: primary, backgroundColor: pa(0.08), border: `1px solid ${pa(0.18)}` }}
              >
                <span className="w-1 h-1 rounded-full inline-block" style={{ backgroundColor: primary }} />
                Consultation disponible
              </div>

              {/* Headline Bebas + Playfair italic */}
              <h1 className="prev-bbn leading-[0.92]" style={{ fontSize: "clamp(18px, 3.5vw, 32px)", color: dark }}>
                {hero_data.title ? (
                  <>
                    {hero_data.title.split(" ").map((word: string, i: number) =>
                      i === 1 ? (
                        <span key={i} className="prev-pfd" style={{ color: primary }}>
                          {" "}{word}{" "}
                        </span>
                      ) : (
                        <span key={i}>{i === 0 ? word : ` ${word}`}</span>
                      )
                    )}
                  </>
                ) : (
                  <>Votre santé <span className="prev-pfd" style={{ color: primary }}>entre</span> de bonnes mains</>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-[9px] leading-relaxed max-w-[180px]" style={{ color: `${dark}55` }}>
                {(hero_data.subtitle || "").slice(0, 80)}{(hero_data.subtitle || "").length > 80 ? "…" : ""}
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-white text-[9px] font-bold rounded-full shadow"
                  style={{ backgroundColor: primary }}
                >
                  <Calendar className="w-2.5 h-2.5" />
                  {hero_data.ctaPrimary || "Prendre RDV"}
                </div>
                {hero_data.ctaSecondary && (
                  <div
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold rounded-full border"
                    style={{ borderColor: `${dark}20`, color: dark }}
                  >
                    {hero_data.ctaSecondary.slice(0, 14)}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 pt-2 border-t" style={{ borderColor: `${dark}10` }}>
                {[{ v: "15+", l: "Ans" }, { v: "10k+", l: "Patients" }, { v: "98%", l: "Satisfaction" }].map((s) => (
                  <div key={s.l}>
                    <div className="prev-bbn text-[13px] leading-none" style={{ color: dark }}>{s.v}</div>
                    <div className="text-[7px] font-medium mt-0.5" style={{ color: `${dark}40` }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: photo + floating cards */}
            <div className="relative shrink-0 w-28 sm:w-32">
              {/* Colored offset block */}
              <div className="absolute -top-1 -right-1 bottom-1 left-1 rounded-[14px] -z-10" style={{ backgroundColor: pa(0.12) }} />

              {about_data?.avatar || hero_data.bgImage ? (
                <img
                  src={about_data?.avatar || hero_data.bgImage}
                  alt=""
                  className="relative z-10 w-full aspect-[3/4] object-cover shadow-lg"
                  style={{ borderRadius: "14px" }}
                />
              ) : (
                <div
                  className="relative z-10 w-full aspect-[3/4] flex items-center justify-center shadow-md"
                  style={{ borderRadius: "14px", background: `linear-gradient(145deg, ${pa(0.14)}, ${pa(0.05)})` }}
                >
                  <div className="prev-bbn text-2xl" style={{ color: pa(0.4) }}>{clinicLetter}</div>
                </div>
              )}

              {/* Floating: patients */}
              <div
                className="absolute -bottom-4 -left-5 z-20 rounded-xl px-2.5 py-1.5 shadow-lg"
                style={{ backgroundColor: primary }}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-2.5 h-2.5 text-white" />
                  <div>
                    <p className="prev-bbn text-[11px] text-white leading-none">10k+</p>
                    <p className="text-[7px] text-white/70">Patients</p>
                  </div>
                </div>
              </div>

              {/* Floating: rating */}
              <div
                className="absolute -top-4 -right-4 z-20 rounded-xl px-2.5 py-1.5 shadow-lg"
                style={{ backgroundColor: teal }}
              >
                <div className="flex gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map((i) => <Star key={i} className="w-1.5 h-1.5 fill-white text-white" />)}
                </div>
                <p className="prev-bbn text-[11px] text-white leading-none">4.9</p>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <div className="px-4 py-2.5 flex items-center gap-4 overflow-hidden" style={{ backgroundColor: dark }}>
          {["Conventionné S.1", "Remboursé AM", "RDV en ligne 24h/24"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: primary }} />
              <span className="text-[8px] font-medium whitespace-nowrap" style={{ color: `${cream}55` }}>{t}</span>
            </div>
          ))}
        </div>

        {/* ABOUT */}
        {(about_data?.bio || about_data?.avatar) && (
          <section className="px-4 py-7 relative overflow-hidden" style={{ backgroundColor: `${dark}04` }}>
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 prev-bbn leading-none select-none -z-0 pointer-events-none"
              style={{ fontSize: "5rem", color: `${dark}04` }}
            >03</div>

            <div className="flex items-start gap-4 relative z-10">
              {about_data?.avatar ? (
                <div className="relative shrink-0">
                  <div className="absolute -top-2 -left-2 w-10 h-10 rounded-xl" style={{ backgroundColor: teal, opacity: 0.15 }} />
                  <img
                    src={about_data.avatar}
                    alt=""
                    className="relative z-10 w-20 aspect-[3/4] object-cover shadow-lg"
                    style={{ borderRadius: "12px" }}
                  />
                  <div
                    className="absolute -bottom-3 left-2 z-20 rounded-lg px-2 py-1 shadow-md"
                    style={{ backgroundColor: teal }}
                  >
                    <div className="flex items-center gap-1">
                      <Award className="w-2 h-2 text-white" />
                      <p className="prev-bbn text-[10px] text-white leading-none">15+</p>
                    </div>
                    <p className="text-[6px] text-white/75">Ans d'exp.</p>
                  </div>
                </div>
              ) : (
                <div
                  className="w-16 aspect-[3/4] flex-shrink-0 flex items-center justify-center shadow"
                  style={{ borderRadius: "12px", background: `linear-gradient(145deg, ${pa(0.1)}, ${pa(0.03)})` }}
                >
                  <div className="prev-bbn text-xl" style={{ color: pa(0.3) }}>{clinicLetter}</div>
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <div
                  className="text-[7px] font-semibold uppercase tracking-widest"
                  style={{ color: primary }}
                >Notre cabinet</div>
                <div className="prev-bbn leading-[0.92]" style={{ fontSize: "clamp(14px, 2.5vw, 22px)", color: dark }}>
                  À PROPOS <span className="prev-pfd" style={{ color: primary }}>du cabinet</span>
                </div>
                {about_data?.bio && (
                  <p className="text-[8px] leading-relaxed line-clamp-3" style={{ color: `${dark}55` }}>
                    {about_data.bio}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: `${dark}10` }}>
                  {[
                    { v: "15+", l: "Ans", bg: pa(0.08), c: primary },
                    { v: "10k+", l: "Patients", bg: `${teal}18`, c: teal },
                    { v: "98%", l: "Satisfaits", bg: `${dark}06`, c: dark },
                  ].map((s) => (
                    <div key={s.l} className="text-center rounded-lg py-1.5" style={{ backgroundColor: s.bg }}>
                      <div className="prev-bbn text-[11px] leading-none" style={{ color: s.c }}>{s.v}</div>
                      <div className="text-[7px] mt-0.5" style={{ color: `${dark}45` }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS */}
        {website.show_testimonials !== false && Array.isArray(website.testimonials) && website.testimonials.length > 0 && (
          <section className="px-4 py-6" style={{ backgroundColor: cream }}>
            <div className="mb-4 text-center">
              <div className="prev-bbn leading-none" style={{ fontSize: "clamp(14px, 2.5vw, 20px)", color: dark }}>
                CE QUE DISENT <span className="prev-pfd" style={{ color: primary }}>nos patients</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {website.testimonials.slice(0, 3).map((t: { text: string; name: string; context: string }, i: number) => {
                const bgColors = [dark, primary, teal];
                return (
                  <div key={i} className="rounded-xl p-3 flex flex-col" style={{ backgroundColor: bgColors[i % 3] }}>
                    <div className="flex gap-0.5 mb-1.5">
                      {[1,2,3,4,5].map((s) => <Star key={s} className="w-2 h-2 fill-white text-white opacity-90" />)}
                    </div>
                    <p className="text-[7.5px] leading-relaxed flex-1 text-white opacity-75">{t.text}</p>
                    <p className="text-[7px] font-bold text-white mt-1.5">{t.name}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-4 py-7 relative overflow-hidden" style={{ backgroundColor: primary }}>
          <div className="absolute right-0 bottom-0 prev-bbn leading-none select-none pointer-events-none opacity-[0.06] text-white" style={{ fontSize: "5rem" }}>RDV</div>
          <div className="relative z-10">
            <div className="prev-bbn leading-[0.92] text-white mb-2" style={{ fontSize: "clamp(16px, 3vw, 26px)" }}>
              PRÊT À PRENDRE <span className="prev-pfd opacity-80">rendez-vous ?</span>
            </div>
            <p className="text-[8px] text-white/60 mb-4 max-w-[200px] leading-relaxed">
              Assistant IA disponible 24h/24 pour le créneau idéal.
            </p>
            <div className="flex gap-3 items-start">
              <div className="px-4 py-2 bg-white rounded-full text-[9px] font-bold inline-flex items-center gap-1" style={{ color: primary }}>
                <Calendar className="w-2.5 h-2.5" />
                Prendre rendez-vous
              </div>
              <div className="flex-1 rounded-xl p-3 border border-white/20 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                {[
                  { icon: MapPin, label: "Adresse à la confirmation" },
                  { icon: Clock, label: "Lun – Ven · 8h – 19h" },
                  { icon: Shield, label: "Conventionné secteur 1" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="w-2.5 h-2.5 text-white/60 shrink-0" />
                    <span className="text-[7.5px] text-white/50">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="px-4 py-4 flex items-center justify-between" style={{ backgroundColor: dark }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center prev-bbn text-[9px]" style={{ backgroundColor: primary, color: "#fff" }}>
              {clinicLetter}
            </div>
            <span className="text-[8px] font-medium truncate max-w-[80px]" style={{ color: `${cream}40` }}>
              {hero_data.title || "Cabinet"}
            </span>
          </div>
          <span className="text-[7px]" style={{ color: `${cream}25` }}>
            Propulsé par <span className="font-semibold" style={{ color: `${cream}45` }}>DocFlow IA</span>
          </span>
        </div>

      </div>
    </div>
  );
}
