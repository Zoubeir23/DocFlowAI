"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, CalendarCheck, FileText, Clock, CreditCard, Phone } from "lucide-react";
import faqsData from "@/data/faqs.json";
import doctorData from "@/data/doctor.json";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors duration-200">
      <button
        className="w-full flex items-center justify-between p-6 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-white font-medium pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-crimson-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 pb-6 px-6" : "max-h-0"
        }`}
      >
        <p className="text-slate-400 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function PatientInfoPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="container-max relative z-10 text-center">
          <p className="section-subheading">For Patients</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-5">
            Patient <span className="text-gradient">Information</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to know before, during, and after your visit with Dr. Harrington.
          </p>
        </div>
      </section>

      {/* Info cards */}
      <section className="section-padding bg-slate-950">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            {[
              {
                icon: CalendarCheck,
                title: "New Patients",
                desc: "First-time visits include a comprehensive 60–90 minute evaluation. Please arrive 20 minutes early to complete paperwork.",
              },
              {
                icon: FileText,
                title: "Required Documents",
                desc: "Bring a valid photo ID, insurance card, a list of current medications, and any prior cardiac test results or imaging.",
              },
              {
                icon: CreditCard,
                title: "Insurance & Billing",
                desc: "We accept Medicare, Blue Cross Blue Shield, Aetna, Cigna, United Healthcare, and most major plans. Please call to verify.",
              },
              {
                icon: Clock,
                title: "Office Hours",
                desc: "Monday to Friday 8 AM–5 PM, Saturday 9 AM–1 PM. After-hours urgent concerns, call our emergency line.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover">
                <div className="w-12 h-12 bg-crimson-950/60 border border-crimson-900/40 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-crimson-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Preparation tips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <div>
              <p className="section-subheading">Before Your Visit</p>
              <h2 className="section-heading mb-6">How to Prepare</h2>
              <div className="space-y-4">
                {[
                  "Write down all symptoms, how long you have had them, and what makes them better or worse.",
                  "Compile a complete list of all medications, vitamins, and supplements with dosages.",
                  "Gather any previous cardiac test results: ECGs, echocardiograms, stress tests, or catheterization reports.",
                  "Note your family history of heart disease, including parents and siblings.",
                  "If you have diabetes, check your blood sugar before leaving home.",
                  "Do not eat or drink for 4 hours before stress testing or procedural appointments.",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-crimson-600 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-slate-400 text-sm leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="section-subheading">Office Hours</p>
              <h2 className="section-heading mb-6">When We Are Open</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-crimson-700 to-rose-500" />
                <div className="p-6 space-y-0">
                  {Object.entries(doctorData.hours).map(([day, hours], idx) => (
                    <div
                      key={day}
                      className={`flex items-center justify-between py-3.5 ${
                        idx < Object.keys(doctorData.hours).length - 1 ? "border-b border-slate-800" : ""
                      }`}
                    >
                      <span className="text-slate-400 capitalize font-medium text-sm">{day}</span>
                      <span
                        className={`text-sm font-semibold ${
                          hours === "Closed" ? "text-slate-600" : "text-white"
                        }`}
                      >
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 bg-crimson-950/30 border border-crimson-800/40 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-crimson-400 shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">After-Hours Emergency Line</p>
                    <a href={`tel:${doctorData.emergencyLine}`} className="text-crimson-400 font-bold hover:text-crimson-300 transition-colors">
                      {doctorData.emergencyLine}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="section-subheading">Common Questions</p>
              <h2 className="section-heading">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {faqsData.faqs.map((faq) => (
                <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
