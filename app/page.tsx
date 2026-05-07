import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Calendar, Bot, Shield, Clock, Users, Star,
  CheckCircle, Zap, BarChart3, Activity, Sparkles, Brain,
  HeartPulse, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm shadow-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="DocFlow IA" width={140} height={38} className="object-contain" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Features</Link>
              <Link href="/pricing" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Pricing</Link>
              <Link href="#how-it-works" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">How It Works</Link>
              <Link href="#testimonials" className="text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors">Reviews</Link>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gradient-brand text-white border-none rounded-xl font-semibold shadow-md shadow-teal-200/50 hover:shadow-teal-300/60 hover:scale-[1.02] transition-all">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 lg:pt-28 lg:pb-36">
        {/* Background mesh */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-400/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">

            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              Powered by Claude AI · 24/7 Booking Assistant
              <span className="flex items-center gap-1 text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full ml-1">New</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6 tracking-tight">
              Let AI Handle Your{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#0d9488,#0891b2)" }}>
                  Appointment Bookings
                </span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-teal-100/60 -z-0 rounded" />
              </span>
              {" "}Automatically
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Intelligent booking assistant for clinics. Patients chat naturally to book, reschedule, or cancel. You focus on care — AI handles the admin.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gradient-brand text-white border-none px-8 h-12 text-base rounded-2xl font-bold shadow-xl shadow-teal-200/60 hover:shadow-teal-300/70 hover:scale-[1.02] transition-all">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/widget/citycare-clinic">
                <Button size="lg" variant="outline" className="px-8 h-12 text-base rounded-2xl border-slate-200 font-semibold text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-all">
                  See Live Demo
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400 font-medium">No credit card required · Cancel anytime</p>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 gradient-brand rounded-3xl opacity-10 blur-xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-300/30 border border-slate-100 overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-slate-400 border border-slate-200 max-w-xs mx-auto text-center">
                  medbook.ai/app/dashboard
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="pulse-dot" />
                  <span className="text-xs text-teal-600 font-semibold">Live</span>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-6 gradient-mesh">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mb-1">Live Dashboard</p>
                    <h3 className="text-lg font-bold text-slate-800">Good morning, Dr. Smith</h3>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 gradient-brand rounded-xl text-white text-xs font-semibold shadow-md">
                    <Activity className="w-3.5 h-3.5" /> View Appointments
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Today", value: "12", gradient: "linear-gradient(135deg,#0d9488,#0891b2)" },
                    { label: "Patients", value: "847", bg: "bg-violet-50", text: "text-violet-600" },
                    { label: "Completion", value: "94%", bg: "bg-emerald-50", text: "text-emerald-600" },
                    { label: "AI Bookings", value: "156", bg: "bg-cyan-50", text: "text-cyan-600" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${stat.bg || ""}`}
                        style={stat.gradient ? { background: stat.gradient } : undefined}
                      >
                        <Activity className={`w-4 h-4 ${stat.gradient ? "text-white" : stat.text}`} />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 stat-number">{stat.value}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="border-y border-slate-100 bg-slate-50/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-slate-500 font-medium">
            {["500+ clinics onboarded", "50,000+ bookings processed", "99.9% uptime", "HIPAA-ready architecture"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-2 mb-4 tracking-tight">
              Everything to Run a Modern Clinic
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Powerful tools built specifically for healthcare providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "AI Booking Assistant",
                description: "Claude AI converses naturally with patients to collect info, show slots, and confirm bookings automatically.",
                gradient: "linear-gradient(135deg,#0d9488,#0891b2)",
              },
              {
                icon: Calendar,
                title: "Smart Calendar",
                description: "Visual day/week/month calendar. Drag-and-drop appointments, mark status, and manage your schedule effortlessly.",
                gradient: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              },
              {
                icon: Users,
                title: "Patient CRM",
                description: "Complete patient profiles with visit history, upcoming bookings, and clinical notes all in one place.",
                gradient: "linear-gradient(135deg,#0891b2,#06b6d4)",
              },
              {
                icon: Clock,
                title: "Availability Management",
                description: "Set clinic hours, lunch breaks, holidays, and blocked dates. AI respects every constraint automatically.",
                gradient: "linear-gradient(135deg,#d97706,#ea580c)",
              },
              {
                icon: Shield,
                title: "Multi-Tenant Security",
                description: "Each clinic is completely isolated. Row-level security ensures no data leakage between practices.",
                gradient: "linear-gradient(135deg,#dc2626,#e11d48)",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Track booking trends, occupancy rates, no-shows, and patient acquisition at a glance.",
                gradient: "linear-gradient(135deg,#16a34a,#059669)",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 hover-lift group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-200"
                  style={{ background: feature.gradient }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-teal-700 transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 gradient-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Process</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-2 mb-4 tracking-tight">How It Works</h2>
            <p className="text-lg text-slate-500">Up and running in under 10 minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-teal-200 to-cyan-200" />

            {[
              {
                step: "01",
                title: "Set Up Your Clinic",
                description: "Create your account, configure services, set availability hours, and customise your AI assistant's personality.",
                icon: HeartPulse,
              },
              {
                step: "02",
                title: "Add Widget to Your Site",
                description: "Embed the booking widget on your website with one line of code. Works on any website or CMS.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "AI Books Patients",
                description: "Patients chat with your AI to book appointments 24/7. You get notified and manage everything from your dashboard.",
                icon: Bot,
              },
            ].map((item, i) => (
              <div key={item.step} className="text-center relative">
                <div className="w-16 h-16 gradient-brand text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-teal-200/50 relative">
                  <item.icon className="w-7 h-7 text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-2 tracking-tight">
              Loved by Healthcare Providers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Dr. Sarah Mitchell",
                role: "Family Practice Physician",
                rating: 5,
                review: "DocFlow IA reduced our phone calls by 70%. Patients love booking at any hour, and our staff focuses on actual patient care now.",
                initials: "SM",
              },
              {
                name: "Dr. James Park",
                role: "Pediatrician",
                rating: 5,
                review: "The AI assistant is remarkably natural. Parents can book for their children conversationally. No-shows decreased significantly.",
                initials: "JP",
              },
              {
                name: "Dr. Maria Santos",
                role: "Dermatologist",
                rating: 5,
                review: "Setup was incredibly easy. Within an hour we had the widget on our site and patients were booking through AI. Incredible ROI.",
                initials: "MS",
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="glass-card rounded-2xl p-6 hover-lift">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-5 text-sm">"{testimonial.review}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-teal-100 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 border border-white/20">
            <Zap className="w-3.5 h-3.5" />
            14-day free trial · No credit card
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-lg text-teal-100/80 mb-8 max-w-xl mx-auto">
            Join hundreds of clinics using AI to modernise their booking experience
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 px-8 h-12 text-base rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <Image src="/logo.png" alt="DocFlow IA" width={120} height={33} className="object-contain brightness-0 invert" />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/pricing" className="hover:text-teal-400 transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-teal-400 transition-colors">Login</Link>
              <Link href="/signup" className="hover:text-teal-400 transition-colors">Sign Up</Link>
            </div>
            <p className="text-sm text-slate-500">© 2025 DocFlow IA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
