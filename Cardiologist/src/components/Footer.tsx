import Link from "next/link";
import { Heart, Phone, Mail, MapPin, Clock, Linkedin, Twitter, BookOpen } from "lucide-react";
import doctorData from "@/data/doctor.json";
import navData from "@/data/nav.json";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      {/* Emergency Banner */}
      <div className="bg-crimson-900/40 border-b border-crimson-800/50">
        <div className="container-max py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
            <span className="text-crimson-300 font-semibold">Cardiac Emergency?</span>
            <span className="text-slate-400 hidden sm:inline">–</span>
            <a
              href={`tel:${doctorData.emergencyLine}`}
              className="text-white font-bold hover:text-crimson-300 transition-colors"
            >
              Call {doctorData.emergencyLine} immediately or dial 911
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-max py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 bg-crimson-600 rounded-lg flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white fill-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Dr. Harrington</p>
                <p className="text-crimson-400 text-xs font-medium">{doctorData.specialty}</p>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Board-certified interventional cardiologist dedicated to delivering compassionate, evidence-based heart care in Boston, MA.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href={doctorData.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={doctorData.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={doctorData.social.researchgate}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                aria-label="ResearchGate"
              >
                <BookOpen className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {navData.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-crimson-400 text-sm transition-colors duration-200 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-crimson-600 rounded-full inline-block"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Office Hours */}
          <div>
            <h4 className="text-white font-semibold mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-crimson-400" />
              Office Hours
            </h4>
            <ul className="space-y-2.5">
              {Object.entries(doctorData.hours).map(([day, hours]) => (
                <li key={day} className="flex justify-between text-sm gap-4">
                  <span className="text-slate-500 capitalize">{day.slice(0, 3)}</span>
                  <span className={`font-medium ${hours === "Closed" ? "text-slate-600" : "text-slate-300"}`}>
                    {hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5">Contact</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${doctorData.phone}`}
                  className="flex items-start gap-3 text-sm group"
                >
                  <Phone className="w-4 h-4 text-crimson-500 mt-0.5 shrink-0" />
                  <span className="text-slate-400 group-hover:text-white transition-colors">{doctorData.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${doctorData.email}`}
                  className="flex items-start gap-3 text-sm group"
                >
                  <Mail className="w-4 h-4 text-crimson-500 mt-0.5 shrink-0" />
                  <span className="text-slate-400 group-hover:text-white transition-colors break-all">{doctorData.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-crimson-500 mt-0.5 shrink-0" />
                <span className="text-slate-400">{doctorData.address}</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link href="/contact" className="btn-primary text-sm py-2.5">
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container-max py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-xs text-center sm:text-left">
            &copy; {currentYear} {doctorData.name}, {doctorData.title}. All rights reserved.
          </p>
          <p className="text-slate-700 text-xs">
            {doctorData.hospital} &mdash; {doctorData.address.split(",").slice(-2).join(",").trim()}
          </p>
        </div>
      </div>
    </footer>
  );
}
