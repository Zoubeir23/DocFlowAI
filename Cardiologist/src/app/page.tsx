import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Phone,
  Star,
  Shield,
  Activity,
  CalendarCheck,
} from "lucide-react";
import doctorData from "@/data/doctor.json";
import servicesData from "@/data/services.json";
import testimonialsData from "@/data/testimonials.json";
import EcgLine from "@/components/EcgLine";

export default function HomePage() {
  const featuredServices = servicesData.services.slice(0, 4);
  const featuredTestimonials = testimonialsData.testimonials.slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-950">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid opacity-30" />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-crimson-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-crimson-900/10 rounded-full blur-3xl" />

        {/* ECG decorative line */}
        <div className="absolute bottom-0 left-0 right-0 opacity-20">
          <EcgLine />
        </div>

        <div className="container-max relative z-10 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-crimson-950/60 border border-crimson-800/50 rounded-full px-4 py-2 mb-8">
                <div className="w-2 h-2 bg-crimson-500 rounded-full animate-pulse" />
                <span className="text-crimson-300 text-xs font-semibold uppercase tracking-widest">
                  Board-Certified Interventional Cardiologist
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6">
                Advanced <br />
                <span className="text-gradient">Heart Care</span> <br />
                You Can Trust
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">
                {doctorData.tagline}. Combining {doctorData.experience} of clinical excellence with the most advanced interventional techniques available.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/contact" className="btn-primary text-base px-8 py-4">
                  <CalendarCheck className="w-5 h-5" />
                  Schedule Consultation
                </Link>
                <Link href="/services" className="btn-outline text-base px-8 py-4">
                  View Services
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Quick badges */}
              <div className="flex flex-wrap gap-3">
                {["FACC Certified", "FSCAI Member", "Harvard Trained", "20+ Years Experience"].map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-full px-4 py-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-crimson-400 shrink-0" />
                    <span className="text-slate-300 text-xs font-medium">{badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Doctor card */}
            <div className="flex justify-center lg:justify-end animate-slide-up">
              <div className="relative">
                {/* Main card */}
                <div className="relative w-80 xl:w-96 bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl glow-crimson">
                  {/* Card header strip */}
                  <div className="h-2 bg-gradient-to-r from-crimson-700 via-crimson-500 to-rose-500" />

                  {/* Doctor photo */}
                  <div className="relative h-72 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                    <Image
                      src={doctorData.image}
                      alt={doctorData.name}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 320px, 384px"
                      priority
                    />
                    {/* Subtle gradient overlay at bottom for name readability */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/90 to-transparent z-10" />
                    <div className="absolute bottom-0 inset-x-0 z-20 p-4 text-center">
                      <p className="text-white font-bold text-base leading-tight">{doctorData.name}</p>
                      <p className="text-crimson-400 text-xs font-medium">{doctorData.title}</p>
                    </div>
                  </div>

                  {/* Card stats */}
                  <div className="grid grid-cols-3 divide-x divide-slate-800 border-t border-slate-800">
                    {[
                      { label: "Experience", value: doctorData.experience },
                      { label: "Patients", value: doctorData.patientsServed },
                      { label: "Success", value: doctorData.successRate },
                    ].map((stat) => (
                      <div key={stat.label} className="stat-box py-4">
                        <span className="text-crimson-400 font-bold text-lg">{stat.value}</span>
                        <span className="text-slate-500 text-xs mt-0.5">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badge — top right */}
                <div className="absolute -top-4 -right-4 bg-crimson-600 text-white rounded-2xl px-4 py-3 shadow-xl shadow-crimson-900/50">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-bold leading-none">Top Doctor</p>
                      <p className="text-xs opacity-75 leading-none mt-0.5">2022–2024</p>
                    </div>
                  </div>
                </div>

                {/* Floating badge — bottom left */}
                <div className="absolute -bottom-4 -left-4 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-crimson-950 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-crimson-500 fill-crimson-500" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold leading-none">{doctorData.procedures}</p>
                      <p className="text-slate-500 text-xs leading-none mt-0.5">Procedures Done</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-900 border-y border-slate-800">
        <div className="container-max">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-800">
            {[
              { icon: TrendingUp, label: "Years Experience", value: doctorData.experience, color: "text-crimson-400" },
              { icon: Users, label: "Patients Served", value: doctorData.patientsServed, color: "text-rose-400" },
              { icon: Activity, label: "Success Rate", value: doctorData.successRate, color: "text-crimson-400" },
              { icon: Heart, label: "Procedures", value: doctorData.procedures, color: "text-rose-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-box py-8">
                <Icon className={`w-6 h-6 ${color} mb-2`} strokeWidth={1.5} />
                <span className={`text-3xl font-bold ${color}`}>{value}</span>
                <span className="text-slate-500 text-sm mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About preview */}
      <section className="section-padding bg-slate-950">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left decorative area */}
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-crimson-800 transition-all duration-300">
                    <Shield className="w-8 h-8 text-crimson-500 mb-3" strokeWidth={1.5} />
                    <h4 className="text-white font-semibold mb-1">Board Certified</h4>
                    <p className="text-slate-500 text-sm">Dual certification in Cardiovascular Disease & Interventional Cardiology</p>
                  </div>
                  <div className="bg-crimson-950/40 border border-crimson-900/50 rounded-2xl p-6">
                    <div className="text-4xl font-bold text-crimson-400 mb-1">40+</div>
                    <p className="text-slate-400 text-sm">Peer-reviewed publications in leading cardiovascular journals</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-crimson-900/20 border border-crimson-800/40 rounded-2xl p-6">
                    <div className="text-4xl font-bold text-crimson-300 mb-1">3x</div>
                    <p className="text-slate-400 text-sm">Castle Connolly Best Doctor distinction</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-crimson-800 transition-all duration-300">
                    <Award className="w-8 h-8 text-crimson-500 mb-3" strokeWidth={1.5} />
                    <h4 className="text-white font-semibold mb-1">FACC & FSCAI</h4>
                    <p className="text-slate-500 text-sm">Fellow of American College of Cardiology</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right text */}
            <div className="order-1 lg:order-2">
              <p className="section-subheading">About Dr. Harrington</p>
              <h2 className="section-heading mb-6">
                Two Decades of <br />
                <span className="text-gradient">Cardiovascular Excellence</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-5">{doctorData.bio}</p>
              <p className="text-slate-500 leading-relaxed mb-8 text-sm">{doctorData.bioExtended}</p>

              <div className="space-y-3 mb-8">
                {doctorData.education.slice(0, 2).map((edu) => (
                  <div key={edu.institution} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-crimson-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-200 text-sm font-medium">{edu.degree}</span>
                      <span className="text-slate-500 text-sm"> &mdash; {edu.institution}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/about" className="btn-primary">
                Full Biography
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="section-padding bg-slate-900/50">
        <div className="container-max">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="section-subheading">Cardiac Services</p>
            <h2 className="section-heading mb-4">
              Comprehensive Heart Care <span className="text-gradient">Expertise</span>
            </h2>
            <p className="text-slate-400">
              From precise diagnostics to life-saving interventional procedures, every service is designed around your cardiac health and long-term wellbeing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {featuredServices.map((service) => {
              const categoryClass: Record<string, string> = {
                Diagnostic: "badge-diagnostic",
                Interventional: "badge-interventional",
                Monitoring: "badge-monitoring",
                Management: "badge-management",
                Prevention: "badge-prevention",
              };
              return (
                <div key={service.id} className="card-hover group">
                  <div className="w-12 h-12 bg-crimson-950/60 rounded-xl flex items-center justify-center mb-5 group-hover:bg-crimson-900/60 transition-colors duration-300 border border-crimson-900/40">
                    <Heart className="w-6 h-6 text-crimson-400" strokeWidth={1.5} />
                  </div>
                  <span className={`${categoryClass[service.category] ?? "badge"} mb-4`}>{service.category}</span>
                  <h3 className="text-white font-semibold text-lg mb-3 mt-2">{service.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{service.shortDescription}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/services" className="btn-outline">
              View All Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="section-padding bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="container-max relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-subheading">Why Dr. Harrington</p>
              <h2 className="section-heading mb-6">
                Patient-First Care, <br />
                <span className="text-gradient">World-Class Results</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Every patient receives the same undivided attention, evidence-based medicine, and access to the latest cardiac technology — regardless of the complexity of their condition.
              </p>
              <Link href="/contact" className="btn-primary">
                <CalendarCheck className="w-5 h-5" />
                Schedule a Consultation
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Heart,
                  title: "Minimally Invasive",
                  desc: "Advanced catheter-based techniques minimize recovery time and surgical risk.",
                },
                {
                  icon: Award,
                  title: "Award-Winning Care",
                  desc: "Consistently recognized among the nation's top cardiologists by Castle Connolly and US News.",
                },
                {
                  icon: Users,
                  title: "Personalized Treatment",
                  desc: "No generic protocols — every plan is tailored to your anatomy, lifestyle, and goals.",
                },
                {
                  icon: Shield,
                  title: "Evidence-Based Medicine",
                  desc: "Treatment decisions grounded in the latest peer-reviewed cardiovascular research.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-crimson-800 transition-all duration-300">
                  <div className="w-10 h-10 bg-crimson-950/50 rounded-lg flex items-center justify-center mb-4 border border-crimson-900/40">
                    <Icon className="w-5 h-5 text-crimson-400" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-white font-semibold mb-2">{title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials preview */}
      <section className="section-padding bg-slate-900/50">
        <div className="container-max">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="section-subheading">Patient Stories</p>
            <h2 className="section-heading mb-4">
              Lives Changed. <span className="text-gradient">Hearts Healed.</span>
            </h2>
            <p className="text-slate-400">
              Real words from real patients who trusted Dr. Harrington with their most important organ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {featuredTestimonials.map((t) => (
              <div key={t.id} className="card flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.condition}</p>
                  </div>
                  <span className="text-slate-600 text-xs">{t.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/testimonials" className="btn-outline">
              Read All Stories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-crimson-950/40 via-slate-950 to-slate-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-crimson-900/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-crimson-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-crimson-900/50">
              <Heart className="w-8 h-8 text-white fill-white" strokeWidth={1.5} />
            </div>
            <h2 className="section-heading mb-5">
              Your Heart Deserves the <span className="text-gradient">Best Care</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Whether you need a preventive evaluation, a second opinion, or advanced intervention — Dr. Harrington and his team are ready to help. Schedule your consultation today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary text-base px-8 py-4">
                <CalendarCheck className="w-5 h-5" />
                Book an Appointment
              </Link>
              <a
                href={`tel:${doctorData.phone}`}
                className="btn-outline text-base px-8 py-4"
              >
                <Phone className="w-5 h-5" />
                Call {doctorData.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
