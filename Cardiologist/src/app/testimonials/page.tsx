import Link from "next/link";
import { Star, Quote, CalendarCheck } from "lucide-react";
import testimonialsData from "@/data/testimonials.json";
import doctorData from "@/data/doctor.json";

export default function TestimonialsPage() {
  return (
    <>
      {/* Page Hero */}
      <section className="relative pt-36 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-crimson-950/20 rounded-full blur-3xl" />
        <div className="container-max relative z-10 text-center">
          <p className="section-subheading">Patient Stories</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-5">
            Real Patients, <span className="text-gradient">Real Results</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Hear directly from patients whose lives were changed by exceptional cardiac care.
          </p>
        </div>
      </section>

      {/* Stats row */}
      <section className="bg-slate-900 border-y border-slate-800">
        <div className="container-max">
          <div className="grid grid-cols-3 divide-x divide-slate-800">
            {[
              { value: doctorData.patientsServed, label: "Patients Served" },
              { value: doctorData.successRate, label: "Success Rate" },
              { value: "4.9 / 5.0", label: "Average Rating" },
            ].map(({ value, label }) => (
              <div key={label} className="stat-box py-10">
                <span className="text-3xl font-bold text-crimson-400">{value}</span>
                <span className="text-slate-500 text-sm mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="section-padding bg-slate-950">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonialsData.testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-7 hover:border-crimson-800 transition-all duration-300 flex flex-col"
              >
                <Quote className="w-8 h-8 text-crimson-800 mb-4" strokeWidth={1} />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="pt-5 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{t.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Age {t.age} &bull; {t.condition}</p>
                    </div>
                    <span className="text-slate-600 text-xs bg-slate-800 px-3 py-1 rounded-full">{t.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="container-max text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to experience the same level of care?
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of patients who have trusted Dr. Harrington with their cardiovascular health.
          </p>
          <Link href="/contact" className="btn-primary text-base px-8 py-4">
            <CalendarCheck className="w-5 h-5" />
            Schedule Your Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
