"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Heart, Phone } from "lucide-react";
import navData from "@/data/nav.json";
import doctorData from "@/data/doctor.json";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-slate-950/50"
          : "bg-transparent"
      }`}
    >
      <div className="container-max">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 bg-crimson-600 rounded-lg flex items-center justify-center shadow-lg group-hover:bg-crimson-700 transition-colors duration-200">
              <Heart className="w-5 h-5 text-white fill-white" strokeWidth={1.5} />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">{doctorData.name.split(" ").slice(0, 3).join(" ")}</p>
              <p className="text-crimson-400 text-xs font-medium">{doctorData.specialty}</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navData.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link pb-1 ${pathname === link.href ? "nav-link-active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${doctorData.phone}`}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors duration-200"
            >
              <Phone className="w-4 h-4 text-crimson-500" />
              <span>{doctorData.phone}</span>
            </a>
            <Link href="/contact" className="btn-primary py-2.5 text-sm">
              Book Appointment
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors duration-200"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-slate-950/98 backdrop-blur-md border-t border-slate-800 px-4 py-6 space-y-1">
          {navData.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === link.href
                  ? "bg-crimson-950 text-crimson-400"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800 mt-4 space-y-3">
            <a
              href={`tel:${doctorData.phone}`}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 text-sm"
            >
              <Phone className="w-4 h-4 text-crimson-500" />
              {doctorData.phone}
            </a>
            <Link href="/contact" className="btn-primary w-full justify-center text-sm">
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
