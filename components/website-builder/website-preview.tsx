"use client";

import { Calendar, Star, Shield, Clock, MapPin } from "lucide-react";

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(37, 99, 235, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function WebsitePreview({ website }: { website: any }) {
  const { style_config, hero_data, about_data } = website;
  const primary = style_config.primary || "#2563eb";
  const pa = (a: number) => hexToRgba(primary, a);
  const isPill = style_config.radius === "9999px" || style_config.radius === "50rem";
  const cardRadius = isPill ? "16px" : style_config.radius;

  const clinicLetter = (hero_data.title || "M").charAt(0).toUpperCase();

  return (
    <div className="w-full h-full bg-muted/20 relative rounded-tl-2xl rounded-tr-2xl overflow-hidden border border-border flex flex-col shadow-2xl">

      {/* Browser chrome */}
      <div className="h-11 bg-background border-b border-border flex items-center px-4 gap-3 z-20 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 max-w-xs mx-auto h-6 bg-muted/50 rounded-md flex items-center justify-center text-[10px] font-medium text-muted-foreground border border-border truncate px-2">
          votre-site.docflow.ai
        </div>
      </div>

      {/* Preview content */}
      <div
        className="flex-1 overflow-y-auto text-[#1C1C27] antialiased"
        style={{
          backgroundColor: "#F8F7F4",
          fontFamily: `'${style_config.fontBody || "DM Sans"}', system-ui, sans-serif`,
        }}
      >
        {/* Nav */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 bg-white/95 border-b border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
              style={{ backgroundColor: primary }}
            >
              {clinicLetter}
            </div>
            <span
              className="text-sm font-semibold text-[#1C1C27] truncate max-w-[120px]"
              style={{ fontFamily: `'${style_config.fontHead || "Fraunces"}', Georgia, serif` }}
            >
              {hero_data.title || "Cabinet"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {["Accueil", "Cabinet", "Contact"].map((l) => (
              <span key={l} className="text-[10px] font-medium text-[#1C1C27]/45 hidden sm:inline">
                {l}
              </span>
            ))}
            <div
              className="px-3 py-1.5 text-white text-[10px] font-semibold shadow"
              style={{ backgroundColor: primary, borderRadius: style_config.radius }}
            >
              {hero_data.ctaPrimary || "Prendre RDV"}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative px-5 py-10 overflow-hidden min-h-[260px] flex items-center">
          {/* Blob bg */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full -z-10 blur-[60px] opacity-15"
            style={{ backgroundColor: primary }}
          />
          <div
            className="absolute inset-0 -z-10 opacity-[0.025]"
            style={{
              backgroundImage: `radial-gradient(circle, #1C1C27 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          {hero_data.bgImage && (
            <div className="absolute inset-0 -z-20">
              <img
                src={hero_data.bgImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#F8F7F4]/92" />
            </div>
          )}

          <div className="flex items-center gap-6 w-full">
            {/* Left text */}
            <div className="flex-1 space-y-3">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-semibold uppercase tracking-widest"
                style={{ color: primary, backgroundColor: pa(0.1), border: `1px solid ${pa(0.2)}` }}
              >
                <span
                  className="w-1 h-1 rounded-full inline-block"
                  style={{ backgroundColor: primary }}
                />
                Cabinet Médical
              </div>

              <h1
                className="font-bold leading-tight text-[#1C1C27]"
                style={{
                  fontFamily: `'${style_config.fontHead || "Fraunces"}', Georgia, serif`,
                  fontSize: "clamp(16px, 3vw, 26px)",
                }}
              >
                {hero_data.title}
              </h1>

              <p className="text-[10px] text-[#1C1C27]/50 leading-relaxed max-w-[200px]">
                {(hero_data.subtitle || "").slice(0, 100)}
                {(hero_data.subtitle || "").length > 100 ? "…" : ""}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-white text-[9px] font-semibold shadow"
                  style={{ backgroundColor: primary, borderRadius: style_config.radius }}
                >
                  <Calendar className="w-2.5 h-2.5" />
                  {hero_data.ctaPrimary || "Prendre RDV"}
                </div>
                {hero_data.ctaSecondary && (
                  <div
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[9px] font-semibold border"
                    style={{
                      borderColor: pa(0.3),
                      color: primary,
                      borderRadius: style_config.radius,
                    }}
                  >
                    {hero_data.ctaSecondary}
                  </div>
                )}
              </div>

              {/* Mini stats */}
              <div className="flex gap-4 pt-2 border-t border-gray-200">
                {[
                  { v: "15+", l: "Ans" },
                  { v: "10k+", l: "Patients" },
                  { v: "98%", l: "Satisfaction" },
                ].map((s) => (
                  <div key={s.l}>
                    <div
                      className="text-sm font-bold text-[#1C1C27]"
                      style={{ fontFamily: `'${style_config.fontHead || "Fraunces"}', Georgia, serif` }}
                    >
                      {s.v}
                    </div>
                    <div className="text-[8px] text-[#1C1C27]/40">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right image */}
            <div className="relative shrink-0 w-28 sm:w-36">
              {about_data?.avatar || hero_data.bgImage ? (
                <img
                  src={about_data?.avatar || hero_data.bgImage}
                  alt=""
                  className="w-full aspect-[4/5] object-cover shadow-lg"
                  style={{ borderRadius: "18px" }}
                />
              ) : (
                <div
                  className="w-full aspect-[4/5] flex items-center justify-center shadow"
                  style={{
                    borderRadius: "18px",
                    background: `linear-gradient(135deg, ${pa(0.15)}, ${pa(0.05)})`,
                    border: `1px solid ${pa(0.15)}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-black"
                    style={{ backgroundColor: primary }}
                  >
                    {clinicLetter}
                  </div>
                </div>
              )}

              {/* Floating badges */}
              <div className="absolute -bottom-3 -left-3 bg-white rounded-xl p-2 shadow border border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-bold">Certifié</span>
                </div>
              </div>

              <div className="absolute -top-3 -right-2 bg-white rounded-xl p-2 shadow border border-gray-100">
                <div className="flex gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-2 h-2 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-[8px] font-bold">4.9/5</div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <div className="bg-white border-y border-gray-100 px-5 py-3">
          <div className="flex items-center gap-4 overflow-hidden">
            {["Conventionné S.1", "Remboursé AM", "RDV en ligne"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 shrink-0">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: primary }}
                />
                <span className="text-[9px] text-[#1C1C27]/50 font-medium whitespace-nowrap">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About preview */}
        {(about_data?.bio || about_data?.avatar) && (
          <section className="px-5 py-8 bg-white border-t border-gray-100">
            <div className="flex items-start gap-5">
              {about_data?.avatar ? (
                <img
                  src={about_data.avatar}
                  alt=""
                  className="w-20 aspect-[3/4] object-cover shadow flex-shrink-0"
                  style={{ borderRadius: "14px" }}
                />
              ) : (
                <div
                  className="w-20 aspect-[3/4] flex-shrink-0 flex items-center justify-center"
                  style={{ borderRadius: "14px", backgroundColor: pa(0.08) }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black"
                    style={{ backgroundColor: primary }}
                  >
                    {clinicLetter}
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div
                  className="text-[8px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full inline-block"
                  style={{ color: primary, backgroundColor: pa(0.08) }}
                >
                  Notre cabinet
                </div>
                <div
                  className="text-sm font-bold text-[#1C1C27] leading-tight"
                  style={{ fontFamily: `'${style_config.fontHead || "Fraunces"}', Georgia, serif` }}
                >
                  À propos du cabinet
                </div>
                <p className="text-[9px] text-[#1C1C27]/50 leading-relaxed line-clamp-3">
                  {about_data?.bio || ""}
                </p>
                <div className="flex gap-4 pt-2 border-t border-gray-100">
                  {[{ v: "15+", l: "Ans" }, { v: "10k+", l: "Patients" }, { v: "98%", l: "Satisfaction" }].map(
                    (s) => (
                      <div key={s.l} className="text-center">
                        <div className="text-xs font-bold" style={{ color: primary }}>
                          {s.v}
                        </div>
                        <div className="text-[8px] text-[#1C1C27]/40">{s.l}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA section */}
        <section
          className="px-5 py-8 relative overflow-hidden"
          style={{ backgroundColor: primary }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-[30px] bg-white" />
          <div className="text-white space-y-3 relative z-10">
            <div
              className="text-base font-bold leading-tight"
              style={{ fontFamily: `'${style_config.fontHead || "Fraunces"}', Georgia, serif` }}
            >
              Prêt à prendre rendez-vous ?
            </div>
            <p className="text-[9px] text-white/60 leading-relaxed">
              Notre assistant IA disponible 24h/24 pour trouver le créneau idéal.
            </p>
            <div className="flex items-start gap-3">
              <div
                className="flex-1 rounded-xl p-3 border border-white/15"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <div className="space-y-2.5">
                  {[
                    { icon: MapPin, label: "Adresse communiquée à la confirmation" },
                    { icon: Clock, label: "Lundi — Vendredi, 8h — 19h" },
                    { icon: Shield, label: "Conventionné secteur 1" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="w-2.5 h-2.5 text-white/60 shrink-0" />
                      <span className="text-[8px] text-white/50 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="bg-[#0F0F1A] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-black"
              style={{ backgroundColor: primary }}
            >
              {clinicLetter}
            </div>
            <span className="text-[9px] text-white/40 font-medium truncate max-w-[100px]">
              {hero_data.title || "Cabinet"}
            </span>
          </div>
          <span className="text-[8px] text-white/25">
            Propulsé par{" "}
            <span className="text-white/40 font-semibold">DocFlow IA</span>
          </span>
        </div>
      </div>
    </div>
  );
}
