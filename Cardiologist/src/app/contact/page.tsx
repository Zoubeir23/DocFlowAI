"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import doctorData from "@/data/doctor.json";

type FormState = "idle" | "sending" | "success" | "error";

const SERVICE_OPTIONS = [
  "Coronary Angiography",
  "Angioplasty & Stenting",
  "Echocardiography",
  "TAVR Procedure",
  "Cardiac Stress Testing",
  "Holter Monitoring",
  "Heart Failure Management",
  "Preventive Cardiology",
  "General Consultation",
  "Second Opinion",
];

export default function ContactPage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
    newPatient: "yes",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");
    setTimeout(() => {
      setFormState("success");
    }, 1200);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="container-max relative z-10 text-center">
          <p className="section-subheading">Get In Touch</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-5">
            Book an <span className="text-gradient">Appointment</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Schedule a consultation with Dr. Harrington. New and returning patients are welcome.
          </p>
        </div>
      </section>

      {/* Contact section */}
      <section className="section-padding bg-slate-950">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact info sidebar */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
                <div className="space-y-5">
                  <a
                    href={`tel:${doctorData.phone}`}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-11 h-11 bg-crimson-950/60 border border-crimson-900/40 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-crimson-900/60 transition-colors">
                      <Phone className="w-5 h-5 text-crimson-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Office Phone</p>
                      <p className="text-white font-medium group-hover:text-crimson-300 transition-colors">{doctorData.phone}</p>
                    </div>
                  </a>
                  <a
                    href={`mailto:${doctorData.email}`}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-11 h-11 bg-crimson-950/60 border border-crimson-900/40 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-crimson-900/60 transition-colors">
                      <Mail className="w-5 h-5 text-crimson-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Email</p>
                      <p className="text-white font-medium text-sm group-hover:text-crimson-300 transition-colors break-all">{doctorData.email}</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-crimson-950/60 border border-crimson-900/40 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-crimson-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Address</p>
                      <p className="text-white font-medium text-sm">{doctorData.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-crimson-400" />
                  <h3 className="text-white font-semibold text-sm">Office Hours</h3>
                </div>
                <div className="px-6 py-4 space-y-0">
                  {Object.entries(doctorData.hours).map(([day, hours], idx) => (
                    <div
                      key={day}
                      className={`flex justify-between py-2.5 text-sm ${
                        idx < Object.keys(doctorData.hours).length - 1 ? "border-b border-slate-800/50" : ""
                      }`}
                    >
                      <span className="text-slate-400 capitalize">{day.slice(0, 3)}</span>
                      <span className={hours === "Closed" ? "text-slate-600" : "text-slate-200 font-medium"}>
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency */}
              <div className="bg-crimson-950/30 border border-crimson-800/40 rounded-xl p-5">
                <p className="text-crimson-300 font-semibold text-sm mb-1">Cardiac Emergency?</p>
                <p className="text-slate-400 text-xs mb-3">Do not wait — call immediately or dial 911.</p>
                <a
                  href={`tel:${doctorData.emergencyLine}`}
                  className="text-white font-bold text-lg hover:text-crimson-300 transition-colors"
                >
                  {doctorData.emergencyLine}
                </a>
              </div>
            </div>

            {/* Booking form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-crimson-700 via-crimson-500 to-rose-500" />
                <div className="p-8">
                  {formState === "success" ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-emerald-950/60 border border-emerald-800/40 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-white text-2xl font-bold mb-3">Request Received</h3>
                      <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                        Thank you for reaching out. Our team will contact you within one business day to confirm your appointment. For urgent matters, please call {doctorData.phone}.
                      </p>
                      <button
                        onClick={() => { setFormState("idle"); setForm({ firstName: "", lastName: "", email: "", phone: "", service: "", preferredDate: "", preferredTime: "", message: "", newPatient: "yes" }); }}
                        className="mt-8 btn-outline text-sm"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">Appointment Request</h2>
                        <p className="text-slate-500 text-sm">All fields marked * are required.</p>
                      </div>

                      {/* Name row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">First Name *</label>
                          <input
                            type="text"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Jane"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Last Name *</label>
                          <input
                            type="text"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Smith"
                            required
                          />
                        </div>
                      </div>

                      {/* Contact row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="jane@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="label">Phone Number *</label>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="(617) 555-0000"
                            required
                          />
                        </div>
                      </div>

                      {/* Service */}
                      <div>
                        <label className="label">Service / Reason for Visit *</label>
                        <select
                          name="service"
                          value={form.service}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select a service...</option>
                          {SERVICE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date/time row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Preferred Date</label>
                          <input
                            type="date"
                            name="preferredDate"
                            value={form.preferredDate}
                            onChange={handleChange}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="label">Preferred Time</label>
                          <select
                            name="preferredTime"
                            value={form.preferredTime}
                            onChange={handleChange}
                            className="input-field"
                          >
                            <option value="">Any time</option>
                            <option value="morning">Morning (8 AM – 12 PM)</option>
                            <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
                          </select>
                        </div>
                      </div>

                      {/* New patient */}
                      <div>
                        <label className="label">Are you a new patient?</label>
                        <div className="flex gap-6">
                          {["yes", "no"].map((val) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="newPatient"
                                value={val}
                                checked={form.newPatient === val}
                                onChange={handleChange}
                                className="accent-crimson-500 w-4 h-4"
                              />
                              <span className="text-slate-300 text-sm capitalize">{val === "yes" ? "Yes, new patient" : "No, returning patient"}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="label">Additional Information</label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          className="input-field resize-none"
                          rows={4}
                          placeholder="Describe your symptoms or any additional context that would help Dr. Harrington prepare for your visit..."
                        />
                      </div>

                      {formState === "error" && (
                        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-950/40 border border-rose-800/40 rounded-lg px-4 py-3">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Something went wrong. Please try again or call our office directly.
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={formState === "sending"}
                        className="btn-primary w-full justify-center py-4 text-base"
                      >
                        {formState === "sending" ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending Request...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Submit Appointment Request
                          </>
                        )}
                      </button>

                      <p className="text-slate-600 text-xs text-center">
                        By submitting, you consent to being contacted regarding your appointment. For emergencies, call 911 or {doctorData.emergencyLine}.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
