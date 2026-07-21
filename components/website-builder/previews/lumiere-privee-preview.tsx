"use client";

import { Calendar, Star, Shield, Clock, MapPin, Award } from "lucide-react";

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(198,161,91,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function LumierePriveePreview({ website }: { website: any }) {
  const { style_config, hero_data, about_data } = website;
  const gold = style_config.primary || "#C6A15B";
  const ink = "#0B0A08";
  const ivory = "#F4EFE4";
  const ga = (a: number) => hexToRgba(gold, a);

  const clinicLetter = (hero_data.title || "M").charAt(0).toUpperCase();

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden rounded-tl-2xl rounded-tr-2xl" style={{ backgroundColor: ink, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,400&family=Manrope:wght@400;500;600&display=swap');
        .lpp-fr { font-family: 'Fraunces', Georgia, serif; font-style: italic; }
      `}</style>

      {/* Browser chrome */}
      <div className="h-10 flex items-center px-4 gap-3 shrink-0 z-20" style={{ backgroundColor: ink, borderBottom: `1px solid ${ga(0.15)}` }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 max-w-[180px] mx-auto h-5 rounded flex items-center justify-center text-[9px] font-medium px-2 truncate" style={{ backgroundColor: `${ivory}0a`, color: `${ivory}50` }}>
          votre-site.docflow.ai
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: ink }}>

        {/* NAV */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3" style={{ backgroundColor: `${ink}f0`, backdropFilter: "blur(8px)", borderBottom: `1px solid ${ga(0.12)}` }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 border flex items-center justify-center text-[9px] lpp-fr" style={{ borderColor: ga(0.5), color: gold }}>{clinicLetter}</div>
            <span className="text-[11px] tracking-wide truncate max-w-[90px]" style={{ color: ivory }}>{hero_data.title || "Cabinet"}</span>
          </div>
          <div className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-widest border" style={{ borderColor: gold, color: gold }}>
            {(hero_data.ctaPrimary || "RDV").slice(0, 10)}
          </div>
        </header>

        {/* HERO */}
        <section className="relative px-4 py-9" style={{ backgroundColor: ink }}>
          <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(ellipse 60% 50% at 80% 20%, ${ga(0.1)}, transparent 70%)` }} />
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-px" style={{ backgroundColor: gold }} />
            <span className="text-[7px] font-semibold uppercase tracking-[0.24em]" style={{ color: gold }}>{hero_data.title || "Cabinet"}</span>
          </div>
          <h1 className="lpp-fr leading-[1.05] mb-2.5" style={{ fontSize: "clamp(16px,3vw,26px)", color: ivory }}>
            {hero_data.title || "Une médecine d'exception"}
          </h1>
          <p className="text-[8.5px] leading-relaxed mb-4 max-w-[220px]" style={{ color: `${ivory}60` }}>
            {(hero_data.subtitle || "").slice(0, 90)}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-widest" style={{ backgroundColor: gold, color: ink }}>
            <Calendar className="w-2.5 h-2.5" />
            {hero_data.ctaPrimary || "Prendre rendez-vous"}
          </div>

          <div className="flex items-center gap-6 pt-4 mt-5 border-t" style={{ borderColor: ga(0.15) }}>
            {[{ v: "20+", l: "Années" }, { v: "Privé", l: "Sur RDV" }, { v: "5.0", l: "Satisfaction" }].map((s) => (
              <div key={s.l}>
                <div className="lpp-fr text-[12px]" style={{ color: gold }}>{s.v}</div>
                <div className="text-[6px] uppercase tracking-widest mt-0.5" style={{ color: `${ivory}40` }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST STRIP */}
        <div className="px-4 py-3 flex items-center gap-4 overflow-hidden border-y" style={{ backgroundColor: "#100E0B", borderColor: ga(0.12) }}>
          {["Confidentialité", "Praticien certifié", "Excellence reconnue"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 shrink-0">
              <Shield className="w-2 h-2" style={{ color: gold }} />
              <span className="text-[7px] uppercase tracking-widest whitespace-nowrap" style={{ color: `${ivory}50` }}>{t}</span>
            </div>
          ))}
        </div>

        {/* ABOUT */}
        {(about_data?.bio || about_data?.avatar) && (
          <section className="px-4 py-7 relative" style={{ backgroundColor: "#100E0B" }}>
            <div className="flex items-start gap-4">
              {about_data?.avatar ? (
                <div className="relative shrink-0">
                  <div className="absolute -top-1.5 -right-1.5 w-16 h-20 border" style={{ borderColor: ga(0.4) }} />
                  <img src={about_data.avatar} alt="" className="relative z-10 w-16 aspect-[4/5] object-cover" style={{ filter: "grayscale(0.15)" }} />
                </div>
              ) : (
                <div className="w-14 aspect-[4/5] shrink-0 flex items-center justify-center" style={{ backgroundColor: "#141210" }}>
                  <Award className="w-5 h-5" style={{ color: ga(0.4) }} />
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <p className="text-[7px] font-semibold uppercase tracking-[0.24em]" style={{ color: gold }}>Le praticien</p>
                <p className="lpp-fr text-[15px] leading-tight" style={{ color: ivory }}>Une pratique fondée sur l'exigence</p>
                {about_data?.bio && (
                  <p className="text-[7.5px] leading-relaxed line-clamp-3" style={{ color: `${ivory}55` }}>{about_data.bio}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS */}
        {website.show_testimonials !== false && Array.isArray(website.testimonials) && website.testimonials.length > 0 && (
          <section className="px-4 py-6" style={{ backgroundColor: ink }}>
            <p className="text-[7px] font-semibold uppercase tracking-[0.24em] mb-3 text-center" style={{ color: gold }}>Témoignages</p>
            <div className="grid grid-cols-2 gap-2">
              {website.testimonials.slice(0, 2).map((t: { text: string; name: string }, i: number) => (
                <div key={i} className="p-3 border" style={{ borderColor: ga(0.15) }}>
                  <div className="flex gap-0.5 mb-1.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-1.5 h-1.5" style={{ fill: gold, color: gold }} />)}</div>
                  <p className="lpp-fr text-[8px] leading-relaxed line-clamp-2" style={{ color: `${ivory}80` }}>"{t.text}"</p>
                  <p className="text-[7px] font-semibold mt-1.5" style={{ color: ivory }}>{t.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-4 py-7" style={{ backgroundColor: "#100E0B" }}>
          <p className="lpp-fr leading-[1.05] mb-2" style={{ fontSize: "clamp(14px,2.5vw,20px)", color: ivory }}>
            Prenez rendez-vous en toute discrétion
          </p>
          <div className="flex gap-3 items-start mt-4">
            <div className="px-3 py-2 text-[8px] font-semibold uppercase tracking-widest inline-flex items-center gap-1" style={{ backgroundColor: gold, color: ink }}>
              <Calendar className="w-2.5 h-2.5" />RDV
            </div>
            <div className="flex-1 p-3 border space-y-1.5" style={{ borderColor: ga(0.2) }}>
              {[{ icon: MapPin, l: "Adresse à la confirmation" }, { icon: Clock, l: "Lun – Ven · 9h – 19h" }].map(({ icon: Icon, l }) => (
                <div key={l} className="flex items-center gap-1.5">
                  <Icon className="w-2.5 h-2.5" style={{ color: gold }} />
                  <span className="text-[7px]" style={{ color: `${ivory}50` }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="px-4 py-4 flex items-center justify-between border-t" style={{ backgroundColor: ink, borderColor: ga(0.1) }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 border flex items-center justify-center text-[9px] lpp-fr" style={{ borderColor: ga(0.5), color: gold }}>{clinicLetter}</div>
            <span className="text-[8px] truncate max-w-[80px]" style={{ color: `${ivory}45` }}>{hero_data.title || "Cabinet"}</span>
          </div>
          <span className="text-[7px]" style={{ color: `${ivory}30` }}>DocFlow IA</span>
        </div>

      </div>
    </div>
  );
}
