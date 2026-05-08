"use client";

import { useEffect } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";

interface PublicClinicSiteProps {
  website: any;
  clinic: any;
  services: any[];
  doctor: any;
}

export function PublicClinicSite({ website, clinic, services, doctor }: PublicClinicSiteProps) {
  const { style_config, hero_data, about_data, show_chat_widget, show_services } = website;

  // Apply CSS variables
  const customStyles = {
    "--tw-color-primary": style_config.primary,
    "--tw-color-accent": style_config.accent,
    "--tw-radius": style_config.radius,
  } as React.CSSProperties;

  // Render widget if enabled
  useEffect(() => {
    if (show_chat_widget && clinic.slug) {
      // The iframe injection script (mimicking what users would embed)
      const iframe = document.createElement("iframe");
      iframe.src = `/widget/${clinic.slug}`;
      iframe.style.cssText = "position:fixed;bottom:0;right:0;width:420px;height:680px;border:none;z-index:9999;background:transparent;";
      iframe.allow = "clipboard-write";
      iframe.id = "docflow-widget-iframe";
      
      // Only append if it doesn't exist yet
      if (!document.getElementById("docflow-widget-iframe")) {
        document.body.appendChild(iframe);
      }

      return () => {
        const existing = document.getElementById("docflow-widget-iframe");
        if (existing) {
          existing.remove();
        }
      };
    }
  }, [show_chat_widget, clinic.slug]);

  return (
    <div 
      className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50"
      style={customStyles}
    >
      <div 
        className="min-h-screen relative" 
        style={{ fontFamily: style_config.fontBody }}
      >
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6 lg:px-12 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight" style={{ color: style_config.primary }}>
            {hero_data.title || clinic.name}
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {(about_data.bio || about_data.avatar) && (
              <a href="#about" className="hover:opacity-70 transition-opacity">À propos</a>
            )}
            {show_services && services.length > 0 && (
              <a href="#services" className="hover:opacity-70 transition-opacity">Services</a>
            )}
            <a 
              href="#contact" 
              className="px-6 py-3 text-white transition-opacity hover:opacity-90 shadow-lg"
              style={{ backgroundColor: style_config.primary, borderRadius: style_config.radius }}
            >
              {hero_data.ctaPrimary || "Prendre rendez-vous"}
            </a>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-56 lg:pb-40 px-6 lg:px-12 min-h-[80vh] flex items-center">
          {hero_data.bgImage && (
            <div className="absolute inset-0 z-0">
              <img 
                src={hero_data.bgImage} 
                alt="Hero Background" 
                className="w-full h-full object-cover opacity-10 dark:opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-zinc-950" />
            </div>
          )}
          <div className="max-w-5xl relative z-10">
            <h1 
              className="text-5xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight"
              style={{ fontFamily: style_config.fontHead }}
            >
              {hero_data.title}
            </h1>
            <p className="text-xl lg:text-3xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-3xl leading-relaxed">
              {hero_data.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a 
                href="#contact"
                className="px-8 py-4 text-white text-lg font-medium transition-transform hover:-translate-y-1 shadow-xl inline-flex items-center justify-center text-center w-full sm:w-auto"
                style={{ backgroundColor: style_config.primary, borderRadius: style_config.radius }}
              >
                {hero_data.ctaPrimary}
              </a>
              {hero_data.ctaSecondary && (
                <a 
                  href="#services"
                  className="px-8 py-4 text-lg font-medium border-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 inline-flex items-center justify-center text-center w-full sm:w-auto"
                  style={{ 
                    borderColor: style_config.primary, 
                    color: style_config.primary,
                    borderRadius: style_config.radius 
                  }}
                >
                  {hero_data.ctaSecondary}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* About Section */}
        {(about_data.bio || about_data.avatar) && (
          <section id="about" className="py-24 px-6 lg:px-12 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
              {about_data.avatar && (
                <div className="w-64 h-64 lg:w-96 lg:h-96 flex-shrink-0 relative">
                  <div className="absolute inset-0 -translate-x-4 translate-y-4 opacity-20" style={{ backgroundColor: style_config.primary, borderRadius: style_config.radius }} />
                  <img 
                    src={about_data.avatar} 
                    alt="Doctor" 
                    className="w-full h-full object-cover shadow-2xl relative z-10"
                    style={{ borderRadius: style_config.radius }}
                  />
                </div>
              )}
              <div>
                <h2 
                  className="text-4xl lg:text-5xl font-bold mb-8"
                  style={{ fontFamily: style_config.fontHead }}
                >
                  À propos du {doctor?.full_name || "Docteur"}
                </h2>
                <p className="text-xl text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                  {about_data.bio}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Services Section */}
        {show_services && services.length > 0 && (
          <section id="services" className="py-24 px-6 lg:px-12">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 
                  className="text-4xl lg:text-5xl font-bold mb-6"
                  style={{ fontFamily: style_config.fontHead }}
                >
                  Nos Services
                </h2>
                <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                  Découvrez les prestations et consultations proposées au sein de notre cabinet.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                  <div 
                    key={service.id}
                    className="p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-xl hover:-translate-y-1"
                    style={{ borderRadius: style_config.radius }}
                  >
                    <div 
                      className="w-12 h-12 flex items-center justify-center mb-6 text-white"
                      style={{ backgroundColor: style_config.primary, borderRadius: style_config.radius }}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{service.name}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6 line-clamp-3">
                      {service.description || "Consultation médicale spécialisée sur rendez-vous."}
                    </p>
                    <div className="flex items-center justify-between font-medium pt-6 border-t border-zinc-200 dark:border-zinc-800 text-sm">
                      <span className="text-zinc-500">{service.duration_minutes} min</span>
                      {service.price && (
                        <span style={{ color: style_config.primary }}>{service.price} €</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <footer id="contact" className="py-20 px-6 lg:px-12 bg-zinc-950 text-white text-center">
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-4xl font-bold mb-8"
              style={{ fontFamily: style_config.fontHead }}
            >
              Prêt à prendre rendez-vous ?
            </h2>
            <p className="text-xl text-zinc-400 mb-10">
              Notre assistant IA est disponible 24h/24 et 7j/7 pour trouver le créneau qui vous convient le mieux.
            </p>
            {show_chat_widget && (
              <button 
                onClick={() => {
                  // Trigger widget opening if there's an API, or just point out the widget
                  alert("Veuillez utiliser le widget de chat en bas à droite pour prendre rendez-vous.");
                }}
                className="px-8 py-4 text-white text-lg font-medium shadow-xl hover:opacity-90 transition-opacity"
                style={{ backgroundColor: style_config.primary, borderRadius: style_config.radius }}
              >
                Prendre rendez-vous avec l'IA
              </button>
            )}
            <div className="mt-20 pt-8 border-t border-zinc-800 text-zinc-500 flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} {clinic.name}. Tous droits réservés.</p>
              <p className="text-sm">
                Propulsé par <a href="https://docflow.ai" className="font-semibold text-white hover:underline">DocFlow IA</a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
