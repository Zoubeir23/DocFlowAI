"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Activity,
  Waves,
  Shield,
  TrendingUp,
  RadioTower,
  ShieldCheck,
  HeartPulse,
  Clock,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import servicesData from "@/data/services.json";

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Heart,
  Activity,
  Waves,
  Shield,
  TrendingUp,
  RadioTower,
  HeartPulse,
  ShieldCheck,
};

const categoryBadgeClass: Record<string, string> = {
  Diagnostic: "badge-diagnostic",
  Interventional: "badge-interventional",
  Monitoring: "badge-monitoring",
  Management: "badge-management",
  Prevention: "badge-prevention",
};

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? servicesData.services
      : servicesData.services.filter((s) => s.category === activeCategory);

  return (
    <>
      {/* Page Hero */}
      <section className="relative pt-36 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-crimson-950/20 rounded-full blur-3xl" />
        <div className="container-max relative z-10 text-center">
          <p className="section-subheading">What We Offer</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-5">
            Cardiac <span className="text-gradient">Services</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            From diagnostic imaging to complex interventional procedures, our comprehensive cardiovascular services cover every aspect of heart health.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="section-padding bg-slate-950">
        <div className="container-max">
          {/* Category filter */}
          <div className="flex flex-wrap gap-3 justify-center mb-14">
            {servicesData.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-crimson-600 border-crimson-600 text-white shadow-lg shadow-crimson-900/30"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((service) => {
              const Icon = iconMap[service.icon] ?? Heart;
              return (
                <div
                  key={service.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-7 hover:border-crimson-800 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-5 mb-5">
                    <div className="w-14 h-14 bg-crimson-950/60 border border-crimson-900/40 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-crimson-900/60 transition-colors duration-300">
                      <Icon className="w-7 h-7 text-crimson-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`${categoryBadgeClass[service.category] ?? "badge"} mb-2`}>
                        {service.category}
                      </span>
                      <h3 className="text-white font-bold text-xl mt-1">{service.title}</h3>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{service.description}</p>
                  <div className="flex items-center gap-6 pt-5 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <div>
                        <p className="text-slate-500 text-xs">Duration</p>
                        <p className="text-slate-300 text-sm font-medium">{service.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
                      <div>
                        <p className="text-slate-500 text-xs">Recovery</p>
                        <p className="text-slate-300 text-sm font-medium">{service.recovery}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="container-max text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Not sure which service you need?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Schedule a consultation and Dr. Harrington will evaluate your condition and recommend the most appropriate diagnostic or treatment pathway.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="btn-primary">
              <CalendarCheck className="w-5 h-5" />
              Book a Consultation
            </Link>
            <Link href="/patient-info" className="btn-outline">
              Patient Information
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
