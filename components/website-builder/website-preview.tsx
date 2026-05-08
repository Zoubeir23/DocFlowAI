"use client";

import { cn } from "@/lib/utils";

export function WebsitePreview({ website }: { website: any }) {
  const { style_config, hero_data, about_data } = website;

  // Apply CSS variables to a wrapper div based on the style config
  const customStyles = {
    "--tw-color-primary": style_config.primary,
    "--tw-color-accent": style_config.accent,
    "--tw-radius": style_config.radius,
  } as React.CSSProperties;

  return (
    <div className="w-full h-full bg-muted/20 relative rounded-tl-2xl overflow-hidden border-t border-l border-border flex flex-col">
      {/* Browser mockup header */}
      <div className="h-12 bg-background border-b border-border flex items-center px-4 gap-4 z-10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 max-w-xl mx-auto h-7 bg-muted rounded-md flex items-center justify-center px-3 text-xs text-muted-foreground truncate">
          mysite.docflow.ai
        </div>
      </div>

      {/* Preview Content (Iframe or direct render) */}
      {/* We do a direct render for real-time preview feeling */}
      <div 
        className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950"
        style={customStyles}
      >
        <div 
          className="min-h-screen relative" 
          style={{ fontFamily: style_config.fontBody }}
        >
          {/* Mock Header */}
          <header className="absolute top-0 left-0 right-0 z-10 px-8 py-6 flex items-center justify-between">
            <div className="text-xl font-bold" style={{ color: style_config.primary }}>
              {hero_data.title}
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <a href="#" className="hover:opacity-70 transition-opacity">About</a>
              <a href="#" className="hover:opacity-70 transition-opacity">Services</a>
              <a 
                href="#" 
                className="px-5 py-2.5 text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: style_config.primary, borderRadius: style_config.radius }}
              >
                {hero_data.ctaPrimary}
              </a>
            </nav>
          </header>

          {/* Hero Section */}
          <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-8 min-h-[600px] flex items-center">
            {hero_data.bgImage && (
              <div className="absolute inset-0 z-0">
                <img 
                  src={hero_data.bgImage} 
                  alt="Hero Background" 
                  className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-zinc-950" />
              </div>
            )}
            <div className="max-w-4xl relative z-10">
              <h1 
                className="text-5xl lg:text-7xl font-bold tracking-tight mb-6"
                style={{ fontFamily: style_config.fontHead }}
              >
                {hero_data.title}
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl">
                {hero_data.subtitle}
              </p>
              <div className="flex items-center gap-4">
                <button 
                  className="px-8 py-4 text-white text-lg font-medium transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: style_config.primary, borderRadius: style_config.radius }}
                >
                  {hero_data.ctaPrimary}
                </button>
                {hero_data.ctaSecondary && (
                  <button 
                    className="px-8 py-4 text-lg font-medium border-2 transition-colors hover:bg-muted"
                    style={{ 
                      borderColor: style_config.primary, 
                      color: style_config.primary,
                      borderRadius: style_config.radius 
                    }}
                  >
                    {hero_data.ctaSecondary}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* About Section preview */}
          {(about_data.bio || about_data.avatar) && (
            <section className="py-20 px-8 bg-muted/30">
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
                {about_data.avatar && (
                  <div className="w-48 h-48 lg:w-64 lg:h-64 flex-shrink-0">
                    <img 
                      src={about_data.avatar} 
                      alt="Doctor" 
                      className="w-full h-full object-cover shadow-xl"
                      style={{ borderRadius: style_config.radius }}
                    />
                  </div>
                )}
                <div>
                  <h2 
                    className="text-3xl font-bold mb-6"
                    style={{ fontFamily: style_config.fontHead }}
                  >
                    About The Doctor
                  </h2>
                  <p className="text-lg text-muted-foreground whitespace-pre-line leading-relaxed">
                    {about_data.bio}
                  </p>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
