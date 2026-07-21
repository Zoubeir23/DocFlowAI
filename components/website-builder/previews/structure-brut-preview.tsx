"use client";

import { Calendar, Star, Clock, MapPin, Award } from "lucide-react";

export function StructureBrutPreview({ website }: { website: any }) {
  const { style_config, hero_data, about_data } = website;
  const accent = style_config.primary || "#0038FF";
  const ink = "#0A0A0A";
  const paper = "#F7F7F2";

  const clinicLetter = (hero_data.title || "M").charAt(0).toUpperCase();

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden rounded-tl-2xl rounded-tr-2xl" style={{ backgroundColor: paper, fontFamily: "'Work Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@700&family=Work+Sans:wght@400;600&display=swap');
        .sbp-an { font-family: 'Anton', Impact, sans-serif; text-transform: uppercase; }
        .sbp-spm { font-family: 'Space Mono', monospace; }
      `}</style>

      {/* Browser chrome */}
      <div className="h-10 flex items-center px-4 gap-3 shrink-0 z-20" style={{ backgroundColor: paper, borderBottom: `2px solid ${ink}` }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 max-w-[180px] mx-auto h-5 flex items-center justify-center text-[9px] font-medium px-2 truncate border" style={{ borderColor: `${ink}20`, color: `${ink}60` }}>
          votre-site.docflow.ai
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: paper }}>

        {/* NAV */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: paper, borderBottom: `2px solid ${ink}` }}>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 flex items-center justify-center text-[9px] sbp-an" style={{ backgroundColor: ink, color: paper }}>{clinicLetter}</div>
            <span className="sbp-an text-[12px] truncate max-w-[90px]">{hero_data.title || "Cabinet"}</span>
          </div>
          <div className="px-2.5 py-1 text-[8px] font-bold uppercase border-2" style={{ backgroundColor: accent, borderColor: ink, color: paper }}>
            RDV
          </div>
        </header>

        {/* HERO */}
        <section className="relative px-4 py-8 overflow-hidden" style={{ backgroundColor: paper }}>
          <div
            className="absolute left-[-8%] top-[10%] sbp-an select-none pointer-events-none leading-none"
            style={{ fontSize: "6rem", WebkitTextStroke: `1px ${ink}15`, color: "transparent" }}
          >
            RDV
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 mb-3 border-2 sbp-spm text-[7px] font-bold uppercase" style={{ borderColor: ink, backgroundColor: accent, color: paper }}>
              Disponible
            </div>

            <h1 className="sbp-an leading-[0.85] mb-3" style={{ fontSize: "clamp(18px,3.5vw,30px)", color: ink }}>
              {hero_data.title || "Votre santé sans compromis"}
            </h1>

            <p className="text-[8.5px] leading-relaxed mb-3 max-w-[200px] border-l-2 pl-2" style={{ borderColor: accent, color: `${ink}70` }}>
              {(hero_data.subtitle || "").slice(0, 80)}
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border-2" style={{ backgroundColor: ink, borderColor: ink, color: paper }}>
              <Calendar className="w-2.5 h-2.5" />
              {hero_data.ctaPrimary || "Prendre RDV"}
            </div>

            <div className="grid grid-cols-3 gap-0 mt-5 border-2" style={{ borderColor: ink }}>
              {[{ v: "15+", l: "Ans" }, { v: "10K+", l: "Patients" }, { v: "98%", l: "Satisf." }].map((s, i) => (
                <div key={s.l} className="text-center py-2" style={{ borderLeft: i > 0 ? `2px solid ${ink}` : "none" }}>
                  <div className="sbp-an text-[13px]" style={{ color: i === 1 ? accent : ink }}>{s.v}</div>
                  <div className="text-[6px] uppercase mt-0.5" style={{ color: `${ink}50` }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <div className="px-4 py-2.5 flex items-center gap-3 overflow-hidden border-y-2" style={{ backgroundColor: ink, borderColor: ink }}>
          {["Conventionné S.1", "RDV 24h/24", "4.9/5 avis"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5" style={{ backgroundColor: accent }} />
              <span className="sbp-spm text-[7px] font-bold uppercase whitespace-nowrap" style={{ color: paper }}>{t}</span>
            </div>
          ))}
        </div>

        {/* ABOUT */}
        {(about_data?.bio || about_data?.avatar) && (
          <section className="p-4" style={{ backgroundColor: ink }}>
            <div className="border-2" style={{ borderColor: paper }}>
              <div className="flex items-start gap-3 p-3">
                {about_data?.avatar ? (
                  <img src={about_data.avatar} alt="" className="w-14 aspect-[4/5] object-cover grayscale shrink-0" />
                ) : (
                  <div className="w-14 aspect-[4/5] shrink-0 flex items-center justify-center" style={{ backgroundColor: "#141414" }}>
                    <Award className="w-5 h-5" style={{ color: `${paper}30` }} />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <p className="sbp-an text-[13px] leading-tight" style={{ color: paper }}>
                    À propos <span style={{ color: accent }}>du cabinet</span>
                  </p>
                  {about_data?.bio && (
                    <p className="text-[7.5px] leading-relaxed line-clamp-3" style={{ color: `${paper}60` }}>{about_data.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS */}
        {website.show_testimonials !== false && Array.isArray(website.testimonials) && website.testimonials.length > 0 && (
          <section className="px-4 py-5" style={{ backgroundColor: paper }}>
            <p className="sbp-an text-[13px] mb-3">Avis <span style={{ color: accent }}>patients</span></p>
            <div className="grid grid-cols-2 gap-0 border-2" style={{ borderColor: ink }}>
              {website.testimonials.slice(0, 2).map((t: { text: string; name: string }, i: number) => (
                <div key={i} className="p-2.5" style={{ borderLeft: i > 0 ? `2px solid ${ink}` : "none" }}>
                  <div className="flex gap-0.5 mb-1">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-1.5 h-1.5" style={{ fill: accent, color: accent }} />)}</div>
                  <p className="text-[7px] leading-relaxed line-clamp-2" style={{ color: `${ink}70` }}>{t.text}</p>
                  <p className="text-[7px] font-bold mt-1" style={{ color: ink }}>{t.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-4 py-6" style={{ backgroundColor: accent }}>
          <p className="sbp-an leading-[0.85] mb-3" style={{ fontSize: "clamp(15px,2.5vw,22px)", color: paper }}>
            Prêt à prendre rendez-vous ?
          </p>
          <div className="flex gap-2.5 items-start">
            <div className="px-3 py-1.5 text-[8px] font-bold uppercase border-2 inline-flex items-center gap-1" style={{ backgroundColor: ink, borderColor: paper, color: paper }}>
              <Calendar className="w-2.5 h-2.5" />RDV
            </div>
            <div className="flex-1 p-2.5 border-2 space-y-1" style={{ borderColor: ink, backgroundColor: paper }}>
              {[{ icon: MapPin, l: "Adresse à confirmation" }, { icon: Clock, l: "Lun–Ven 8h–19h" }].map(({ icon: Icon, l }) => (
                <div key={l} className="flex items-center gap-1.5">
                  <Icon className="w-2.5 h-2.5" style={{ color: accent }} />
                  <span className="text-[7px]" style={{ color: `${ink}60` }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="px-4 py-4 flex items-center justify-between" style={{ backgroundColor: ink }}>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 flex items-center justify-center text-[9px] sbp-an" style={{ backgroundColor: accent, color: paper }}>{clinicLetter}</div>
            <span className="text-[8px] truncate max-w-[80px]" style={{ color: `${paper}45` }}>{hero_data.title || "Cabinet"}</span>
          </div>
          <span className="sbp-spm text-[7px] uppercase" style={{ color: `${paper}30` }}>DocFlow IA</span>
        </div>

      </div>
    </div>
  );
}
