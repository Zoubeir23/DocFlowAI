import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Award,
  CheckCircle,
  ArrowRight,
  Heart,
  CalendarCheck,
  BookOpen,
  BadgeCheck,
} from "lucide-react";
import doctorData from "@/data/doctor.json";

export default function AboutPage() {
  return (
    <>
      {/* Page Hero */}
      <section className="relative pt-36 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-crimson-950/20 rounded-full blur-3xl" />
        <div className="container-max relative z-10 text-center">
          <p className="section-subheading">About the Doctor</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-5">
            {doctorData.name}
          </h1>
          <p className="text-crimson-400 text-xl font-medium mb-4">{doctorData.title}</p>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">{doctorData.specialty} &mdash; {doctorData.hospital}</p>
        </div>
      </section>

      {/* Bio Section */}
      <section className="section-padding bg-slate-950">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Sidebar card */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-5">
                {/* Doctor card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-crimson-700 to-rose-500" />
                  {/* Doctor photo */}
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={doctorData.image}
                      alt={doctorData.name}
                      fill
                      className="object-cover object-top"
                      sizes="320px"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-white font-bold text-lg">{doctorData.name}</h3>
                      <p className="text-crimson-400 text-sm font-medium">{doctorData.title}</p>
                      <p className="text-slate-500 text-xs mt-1">{doctorData.hospital}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Experience", value: doctorData.experience },
                        { label: "Patients", value: doctorData.patientsServed },
                        { label: "Success Rate", value: doctorData.successRate },
                        { label: "Procedures", value: doctorData.procedures },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                          <p className="text-crimson-400 font-bold text-lg">{stat.value}</p>
                          <p className="text-slate-500 text-xs">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <Link href="/contact" className="btn-primary w-full justify-center text-sm">
                      <CalendarCheck className="w-4 h-4" />
                      Book Appointment
                    </Link>
                  </div>
                </div>

                {/* Awards quick list */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-crimson-400" />
                    Recognition
                  </h4>
                  <ul className="space-y-3">
                    {doctorData.awards.map((award) => (
                      <li key={award.title} className="flex items-start gap-3">
                        <BadgeCheck className="w-4 h-4 text-crimson-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-300 text-sm font-medium">{award.title}</p>
                          <p className="text-slate-600 text-xs">{award.year}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Biography */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Heart className="w-6 h-6 text-crimson-500 fill-crimson-500/20" strokeWidth={1.5} />
                  Biography
                </h2>
                <div className="space-y-4 text-slate-400 leading-relaxed">
                  <p>{doctorData.bio}</p>
                  <p>{doctorData.bioExtended}</p>
                </div>
              </div>

              {/* Education */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-crimson-500" strokeWidth={1.5} />
                  Education &amp; Training
                </h2>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-800" />
                  <div className="space-y-6">
                    {doctorData.education.map((edu, idx) => (
                      <div key={idx} className="relative flex items-start gap-6 pl-14">
                        <div className="absolute left-3 top-2 w-5 h-5 bg-crimson-600 rounded-full border-4 border-slate-950 z-10 flex items-center justify-center" />
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 hover:border-crimson-800 transition-all duration-300">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-white font-semibold">{edu.degree}</p>
                              <p className="text-slate-400 text-sm mt-1">{edu.institution}</p>
                            </div>
                            <span className="bg-crimson-950/60 text-crimson-400 text-xs font-bold px-3 py-1 rounded-full border border-crimson-800/40 shrink-0">
                              {edu.year}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <BadgeCheck className="w-6 h-6 text-crimson-500" strokeWidth={1.5} />
                  Board Certifications
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctorData.certifications.map((cert) => (
                    <div
                      key={cert}
                      className="flex items-start gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-crimson-800 transition-all duration-300"
                    >
                      <CheckCircle className="w-5 h-5 text-crimson-500 mt-0.5 shrink-0" />
                      <p className="text-slate-300 text-sm">{cert}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publications note */}
              <div className="bg-crimson-950/30 border border-crimson-800/40 rounded-2xl p-8">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-crimson-900/60 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-crimson-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">Research &amp; Publications</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Dr. Harrington has authored and co-authored over 40 peer-reviewed articles in journals including the{" "}
                      <em>Journal of the American College of Cardiology</em>,{" "}
                      <em>Circulation</em>, and <em>JACC: Cardiovascular Interventions</em>. His research focuses on outcomes in interventional cardiology, TAVR patient selection, and cardiovascular risk reduction strategies.
                    </p>
                    <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-crimson-400 hover:text-crimson-300 text-sm font-medium transition-colors">
                      Request Publications List
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
