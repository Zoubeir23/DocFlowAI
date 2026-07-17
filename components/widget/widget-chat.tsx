"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, X, Bot, User, Loader2, Calendar,
  CheckCircle, Send, ChevronLeft, ChevronRight,
  Clock, Phone, Mail, UserCircle2, Stethoscope, ArrowLeft,
  Sparkles, ChevronDown
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";
import { generatePatientTempId } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number | null;
}

interface Slot {
  start: string;
  end: string;
  label: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  bookingSuccess?: boolean;
}

interface WidgetChatProps {
  clinicSlug: string;
  clinicName: string;
  widgetColor: string;
  welcomeMessage: string;
  services: Service[];
}

type Step = "home" | "service" | "calendar" | "slots" | "details" | "confirm" | "success" | "chat";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(37,99,235,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function WidgetChat({
  clinicSlug, clinicName, widgetColor, welcomeMessage, services,
}: WidgetChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("home");

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [patientTempId] = useState(() => generatePatientTempId());
  const [widgetLocale] = useState<"fr" | "en">(() => {
    if (typeof document === "undefined") return "fr";
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    const raw = match?.[1];
    return raw === "fr" || raw === "en" ? raw : "fr";
  });
  const dfLocale = widgetLocale === "fr" ? fr : enUS;
  const t = useTranslations("widgetChat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openWidget = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Écouter les messages postMessage depuis la page parente (boutons CTA des templates)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "open") {
        setIsOpen(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    fetch(`/api/widget/slots?clinicSlug=${clinicSlug}&serviceId=${selectedService.id}&date=${dateStr}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService, clinicSlug]);

  const reset = () => {
    setStep("home");
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setBookingError("");
    setSlots([]);
  };

  const confirmBooking = async () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      setBookingError(t("nameReq"));
      return;
    }
    setBookingError("");
    setBookingLoading(true);
    try {
      const res = await fetch("/api/widget/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicSlug,
          serviceId: selectedService?.id,
          startAt: selectedSlot?.start,
          endAt: selectedSlot?.end,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          patientEmail: patientEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("success");
      } else {
        setBookingError(data.error || t("bookFailed"));
      }
    } catch {
      setBookingError(t("error"));
    } finally {
      setBookingLoading(false);
    }
  };

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    const userMsg: ChatMessage = { id: uuidv4(), role: "user", content: trimmed, timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId, patientTempId, clinicSlug, locale: widgetLocale }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Server error");
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((p) => [...p, {
        id: uuidv4(), role: "assistant", content: data.message,
        timestamp: new Date(), bookingSuccess: data.bookingResult?.success,
      }]);
    } catch {
      setMessages((p) => [...p, { id: uuidv4(), role: "assistant", content: t("error"), timestamp: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  };

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const today = startOfDay(new Date());
  const isDayAvailable = (day: Date) => !isBefore(day, today);

  const pa = (a: number) => hexToRgba(widgetColor, a);
  const clinicInitial = (clinicName || "M").charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes wg-float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes wg-ping-slow {
          75%,100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes wg-in {
          from { opacity:0; transform:scale(0.92) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes wg-slide-up {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes wg-shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        @keyframes wg-orb-1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(10px,-8px) scale(1.1); }
        }
        @keyframes wg-orb-2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-8px,6px) scale(0.95); }
        }
        .wg-float { animation: wg-float 4s ease-in-out infinite; }
        .wg-ping  { animation: wg-ping-slow 2s cubic-bezier(0,0,0.2,1) infinite; }
        .wg-in    { animation: wg-in 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .wg-slide { animation: wg-slide-up 0.3s ease both; }
        .wg-slide-1 { animation: wg-slide-up 0.3s 0.05s ease both; opacity:0; }
        .wg-slide-2 { animation: wg-slide-up 0.3s 0.1s ease both; opacity:0; }
        .wg-slide-3 { animation: wg-slide-up 0.3s 0.15s ease both; opacity:0; }
        .wg-orb-1 { animation: wg-orb-1 6s ease-in-out infinite; }
        .wg-orb-2 { animation: wg-orb-2 8s ease-in-out infinite; }

        @keyframes wg-typing {
          0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
        .wg-typing { animation: wg-typing 1.2s cubic-bezier(0.22,1,0.36,1) infinite; }

        @media (prefers-reduced-motion: reduce) {
          .wg-float, .wg-ping, .wg-orb-1, .wg-orb-2, .wg-typing { animation: none; }
          .wg-in, .wg-slide, .wg-slide-1, .wg-slide-2, .wg-slide-3 {
            animation-duration: 0.01ms; opacity: 1;
          }
        }

        .wg-input:focus-within {
          border-color: ${widgetColor}55;
          box-shadow: 0 0 0 3px ${pa(0.1)};
        }
        .wg-btn-primary {
          position: relative;
          overflow: hidden;
        }
        .wg-btn-primary::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .wg-btn-primary:hover::after {
          animation: wg-shimmer 0.7s ease forwards;
        }
        .wg-btn-primary:hover {
          box-shadow: 0 14px 36px -4px ${pa(0.6)};
          transform: translateY(-1px);
        }
        .wg-btn-primary:active { transform: scale(0.98); }

        .wg-service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.08);
        }
        .wg-slot-btn:hover:not([data-selected="true"]) {
          border-color: ${widgetColor}55;
          color: ${widgetColor};
        }
        .wg-action-secondary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>

      {/* ── LAUNCHER ── */}
      {!isOpen && (
        <button
          onClick={openWidget}
          className="fixed bottom-5 right-5 z-[9999] wg-float group"
          aria-label="Ouvrir l'assistant"
        >
          <div className="relative">
            <div
              className="wg-ping absolute inset-0 rounded-full opacity-30"
              style={{ backgroundColor: widgetColor }}
            />
            <div
              className="relative flex items-center gap-3 rounded-full px-5 py-3.5 text-white transition-all duration-300 group-hover:gap-3.5 group-hover:px-6"
              style={{
                background: `linear-gradient(140deg, ${widgetColor} 0%, ${hexToRgba(widgetColor, 0.85)} 100%)`,
                boxShadow: `0 8px 28px -4px ${pa(0.55)}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
            >
              <MessageCircle className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="font-semibold text-[13px] tracking-wide whitespace-nowrap">
                {t("bookAppointment")}
              </span>
            </div>
          </div>
        </button>
      )}

      {/* ── WIDGET PANEL ── */}
      {isOpen && (
        <div
          className="fixed bottom-4 right-4 z-[9999] flex flex-col bg-[#F8F7F5] overflow-hidden wg-in"
          style={{
            width: "390px",
            maxWidth: "calc(100vw - 24px)",
            height: "640px",
            maxHeight: "calc(100vh - 32px)",
            borderRadius: "24px",
            boxShadow: "0 32px 80px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >

          {/* ── HEADER ── */}
          <div
            className="relative overflow-hidden flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, #0D1117 0%, #1a1f2e 60%, ${hexToRgba(widgetColor, 0.25)} 100%)`,
            }}
          >
            {/* Colour accent top strip */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${widgetColor}, ${pa(0.3)})` }}
            />

            {/* Subtle dot pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10 flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                {step !== "home" && step !== "chat" && (
                  <button
                    onClick={() => {
                      if (step === "service") setStep("home");
                      else if (step === "calendar") setStep("service");
                      else if (step === "slots") setStep("calendar");
                      else if (step === "details") setStep("slots");
                      else if (step === "confirm") setStep("details");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </button>
                )}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-lg border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${widgetColor}, ${pa(0.7)})` }}
                >
                  {step === "home" ? (
                    <span className="font-cormorant font-bold text-lg">{clinicInitial}</span>
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-cormorant font-bold text-white text-[17px] leading-tight tracking-tight">
                    {clinicName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.12em]">
                      {t("aiOnline")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setIsOpen(false)}
                  title="Réduire"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); reset(); }}
                  title="Fermer"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white/60 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── BOOKING PROGRESS ── */}
          {["service","calendar","slots","details","confirm"].includes(step) && (
            <div className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#F8F7F5] border-b border-black/[0.04]">
              {(["service","calendar","slots","details","confirm"] as Step[]).map((s, i) => {
                const steps: Step[] = ["service","calendar","slots","details","confirm"];
                const currentIdx = steps.indexOf(step);
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: isCurrent ? "20px" : "6px",
                        backgroundColor: isCurrent ? widgetColor : isDone ? `${widgetColor}55` : "rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── BODY ── */}
          <div className="flex-1 overflow-y-auto">

            {/* HOME */}
            {step === "home" && (
              <div className="p-4 flex flex-col gap-3.5">
                {/* Welcome card — aurora gradient */}
                <div
                  className="rounded-3xl p-5 relative overflow-hidden wg-slide"
                  style={{
                    background: `linear-gradient(145deg, #0D1117 0%, #161b28 55%, ${hexToRgba(widgetColor, 0.35)} 100%)`,
                    minHeight: "168px",
                  }}
                >
                  {/* Animated orbs */}
                  <div
                    className="wg-orb-1 absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-30 blur-3xl pointer-events-none"
                    style={{ backgroundColor: widgetColor }}
                  />
                  <div
                    className="wg-orb-2 absolute bottom-0 left-4 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
                    style={{ backgroundColor: hexToRgba(widgetColor, 0.6) }}
                  />
                  {/* Dot grid */}
                  <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{
                      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon with glow ring */}
                    <div className="relative inline-flex mb-3.5">
                      <div
                        className="absolute inset-0 rounded-2xl blur-md opacity-60"
                        style={{ backgroundColor: widgetColor }}
                      />
                      <div
                        className="relative w-13 h-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
                        style={{ background: `linear-gradient(135deg, ${widgetColor} 0%, ${hexToRgba(widgetColor, 0.7)} 100%)` }}
                      >
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-cormorant font-bold text-white text-xl leading-tight">
                        {clinicName}
                      </h3>
                      {/* Online badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        En ligne
                      </span>
                    </div>
                    <p className="text-white/55 text-[13px] leading-relaxed max-w-[240px]">
                      {welcomeMessage}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  {/* Primary action */}
                  <button
                    onClick={() => setStep("service")}
                    className="w-full text-white rounded-2xl p-4 text-left transition-all duration-200 wg-btn-primary wg-slide-1 flex items-center gap-3.5"
                    style={{
                      background: `linear-gradient(135deg, ${widgetColor} 0%, ${hexToRgba(widgetColor, 0.82)} 100%)`,
                      boxShadow: `0 8px 28px -4px ${pa(0.5)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}
                  >
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/10">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[14px] leading-tight">{t("bookAction")}</p>
                      <p className="text-white/65 text-[12px] mt-0.5">{t("chooseService")}</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                    </div>
                  </button>

                  {/* Secondary action */}
                  <button
                    onClick={() => {
                      setStep("chat");
                      if (messages.length === 0) {
                        setMessages([{ id: uuidv4(), role: "assistant", content: welcomeMessage, timestamp: new Date() }]);
                      }
                      setTimeout(() => chatInputRef.current?.focus(), 100);
                    }}
                    className="wg-action-secondary w-full bg-white rounded-2xl p-4 text-left transition-all duration-200 wg-slide-2 flex items-center gap-3.5 group"
                    style={{
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ backgroundColor: pa(0.08) }}
                    >
                      <MessageCircle className="w-5 h-5" style={{ color: widgetColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#1C1C27] text-[14px] leading-tight">{t("chatAction")}</p>
                      <p className="text-[#1C1C27]/45 text-[12px] mt-0.5">{t("askQuestions")}</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#F0EEF2] flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-[#1C1C27]/40" />
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 pb-1 wg-slide-3">
                  <Sparkles className="w-3 h-3 text-[#1C1C27]/20" />
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-[#1C1C27]/25 uppercase">{t("poweredBy")}</p>
                </div>
              </div>
            )}

            {/* SERVICE PICKER */}
            {step === "service" && (
              <div className="p-5 space-y-4">
                <div className="wg-slide">
                  <h3 className="font-cormorant font-bold text-2xl text-[#1C1C27]">{t("selectService")}</h3>
                  <p className="text-sm text-[#1C1C27]/45 mt-0.5">{t("chooseHelp")}</p>
                </div>
                <div className="space-y-2.5">
                  {services.map((service, i) => {
                    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u;
                    const match = service.name.match(emojiRegex);
                    const emoji = match ? match[1] : null;
                    const displayName = match ? match[2] : service.name;

                    return (
                      <button
                        key={service.id}
                        onClick={() => { setSelectedService(service); setStep("calendar"); }}
                        className="wg-service-card w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left transition-all"
                        style={{
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                          border: `1px solid ${selectedService?.id === service.id ? pa(0.35) : "rgba(0,0,0,0.05)"}`,
                          animationDelay: `${i * 0.04}s`,
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: pa(0.08) }}
                        >
                          {emoji ?? <Stethoscope className="w-5 h-5" style={{ color: widgetColor }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1C1C27] text-[14px] truncate">{displayName}</p>
                          <div className="flex items-center gap-2.5 mt-0.5">
                            <span className="text-[12px] text-[#1C1C27]/40 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{service.duration_minutes} min
                            </span>
                            {service.price != null && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-[#1C1C27]/20" />
                                <span className="text-[12px] font-bold" style={{ color: widgetColor }}>{service.price} €</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#1C1C27]/20 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CALENDAR */}
            {step === "calendar" && (
              <div className="p-5 space-y-4">
                <div className="wg-slide">
                  <h3 className="font-cormorant font-bold text-2xl text-[#1C1C27]">{t("chooseDate")}</h3>
                  <div
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[12px] font-semibold"
                    style={{ backgroundColor: pa(0.1), color: widgetColor }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {selectedService?.name}
                  </div>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden p-3" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center justify-between px-1 py-2">
                    <button
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      disabled={isBefore(endOfMonth(subMonths(calendarMonth, 1)), today)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#1C1C27]/60" />
                    </button>
                    <span className="font-bold text-[#1C1C27] text-[14px] capitalize tracking-wide">
                      {format(calendarMonth, "MMMM yyyy", { locale: dfLocale })}
                    </span>
                    <button
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-[#1C1C27]/60" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 mb-1">
                    {(widgetLocale === "fr" ? ["Di","Lu","Ma","Me","Je","Ve","Sa"] : ["Su","Mo","Tu","We","Th","Fr","Sa"]).map((d) => (
                      <div key={d} className="py-1.5 text-center text-[10px] font-bold tracking-widest text-[#1C1C27]/30 uppercase">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: startPadding }).map((_, i) => <div key={`p-${i}`} />)}
                    {calendarDays.map((day) => {
                      const available = isDayAvailable(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, today);
                      return (
                        <div key={day.toISOString()} className="aspect-square p-0.5">
                          <button
                            onClick={() => { if (available) { setSelectedDate(day); setStep("slots"); } }}
                            disabled={!available}
                            className={`w-full h-full rounded-xl text-[13px] font-semibold transition-all relative
                              ${isSelected ? "text-white shadow-lg" : ""}
                              ${!isSelected && available ? "hover:bg-gray-50 text-[#1C1C27]" : ""}
                              ${!available ? "text-[#1C1C27]/20 cursor-not-allowed" : ""}
                            `}
                            style={isSelected ? { backgroundColor: widgetColor } : isToday ? { color: widgetColor } : {}}
                          >
                            {format(day, "d")}
                            {isToday && !isSelected && (
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: widgetColor }} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SLOTS */}
            {step === "slots" && (
              <div className="p-5 space-y-4">
                <div className="wg-slide">
                  <h3 className="font-cormorant font-bold text-2xl text-[#1C1C27]">{t("pickTime")}</h3>
                  <p className="text-[13px] text-[#1C1C27]/45 mt-0.5 capitalize">
                    {selectedDate && format(selectedDate, "EEEE, d MMMM", { locale: dfLocale })}
                  </p>
                </div>

                {slotsLoading ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: widgetColor }} />
                    <p className="text-[13px] text-[#1C1C27]/40">{t("loadingTimes")}</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
                    <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: pa(0.3) }} />
                    <p className="font-bold text-[#1C1C27] text-[14px]">{t("noSlots")}</p>
                    <p className="text-[13px] text-[#1C1C27]/40 mt-1">{t("tryDifferent")}</p>
                    <button
                      onClick={() => setStep("calendar")}
                      className="mt-5 text-[13px] font-bold px-5 py-2 rounded-full bg-[#F0EEF2] text-[#1C1C27] hover:bg-gray-200 transition-colors"
                    >
                      {t("goBack")}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          data-selected={isSelected}
                          onClick={() => { setSelectedSlot(slot); setStep("details"); }}
                          className={`wg-slot-btn py-3 px-3 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 border`}
                          style={isSelected ? {
                            backgroundColor: widgetColor,
                            borderColor: widgetColor,
                            color: "white",
                            boxShadow: `0 6px 20px -4px ${pa(0.5)}`,
                          } : {
                            backgroundColor: "white",
                            borderColor: "rgba(0,0,0,0.07)",
                            color: "#1C1C27",
                          }}
                        >
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-white/80" : "text-[#1C1C27]/30"}`} />
                          {slot.label.split(" - ")[0]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* DETAILS */}
            {step === "details" && (
              <div className="p-5 space-y-4">
                <div className="wg-slide">
                  <h3 className="font-cormorant font-bold text-2xl text-[#1C1C27]">{t("yourDetails")}</h3>
                  <p className="text-[13px] text-[#1C1C27]/45 mt-0.5">{t("detailsSubtitle")}</p>
                </div>

                <div className="bg-white rounded-2xl p-4 space-y-3" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  {[
                    { label: t("fullName"), icon: UserCircle2, value: patientName, set: setPatientName, type: "text", placeholder: "Marie Dupont" },
                    { label: t("phone"), icon: Phone, value: patientPhone, set: setPatientPhone, type: "tel", placeholder: "+33 6 12 34 56 78" },
                    { label: `${t("email")} (${t("optional")})`, icon: Mail, value: patientEmail, set: setPatientEmail, type: "email", placeholder: "marie@exemple.fr" },
                  ].map(({ label, icon: Icon, value, set, type, placeholder }) => (
                    <div key={type} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#1C1C27]/40 uppercase tracking-[0.12em]">{label}</label>
                      <div
                        className="wg-input relative flex items-center rounded-xl border bg-[#FAFAF8] transition-all"
                        style={{ borderColor: "rgba(0,0,0,0.08)" }}
                      >
                        <Icon className="absolute left-3.5 w-4 h-4 text-[#1C1C27]/30" />
                        <input
                          type={type}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-transparent focus:outline-none font-medium text-[#1C1C27] placeholder-[#1C1C27]/25 rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {bookingError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {bookingError}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!patientName.trim() || !patientPhone.trim()) { setBookingError(t("nameReq")); return; }
                    setBookingError("");
                    setStep("confirm");
                  }}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-[14px] transition-all wg-btn-primary"
                  style={{ backgroundColor: widgetColor, boxShadow: `0 6px 24px -4px ${pa(0.45)}` }}
                >
                  {t("review")}
                </button>
              </div>
            )}

            {/* CONFIRM */}
            {step === "confirm" && (
              <div className="p-5 space-y-4">
                <div className="wg-slide">
                  <h3 className="font-cormorant font-bold text-2xl text-[#1C1C27]">{t("confirmTitle")}</h3>
                  <p className="text-[13px] text-[#1C1C27]/45 mt-0.5">{t("confirmSubtitle")}</p>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  {[
                    { icon: Stethoscope, label: t("service"), main: selectedService?.name, sub: `${selectedService?.duration_minutes} min${selectedService?.price ? ` · ${selectedService.price} €` : ""}` },
                    { icon: Calendar, label: t("dateTime"), main: selectedDate && format(selectedDate, "EEEE d MMMM yyyy", { locale: dfLocale }), sub: selectedSlot?.label },
                    { icon: User, label: t("patient"), main: patientName, sub: patientPhone + (patientEmail ? ` · ${patientEmail}` : "") },
                  ].map(({ icon: Icon, label, main, sub }, i, arr) => (
                    <div key={label} className={`flex gap-4 p-4 ${i < arr.length - 1 ? "border-b border-[#F0EEF2]" : ""}`}>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: pa(0.08), color: widgetColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#1C1C27]/30 uppercase tracking-widest">{label}</p>
                        <p className="text-[14px] font-bold text-[#1C1C27] mt-0.5 capitalize">{main}</p>
                        <p className="text-[12px] text-[#1C1C27]/45 font-medium mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {bookingError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {bookingError}
                  </div>
                )}

                <div className="space-y-2.5">
                  <button
                    onClick={confirmBooking}
                    disabled={bookingLoading}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-[14px] transition-all wg-btn-primary flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ backgroundColor: widgetColor, boxShadow: `0 6px 24px -4px ${pa(0.45)}` }}
                  >
                    {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {bookingLoading ? t("confirmingBtn") : t("confirmBtn")}
                  </button>
                  <button
                    onClick={() => setStep("details")}
                    disabled={bookingLoading}
                    className="w-full py-3 rounded-xl text-[#1C1C27]/60 font-semibold text-[13px] hover:bg-[#F0EEF2] transition-colors bg-[#F8F7F5]"
                  >
                    {t("editBtn")}
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <div className="p-5 flex flex-col items-center text-center h-full">
                <div className="pt-6 pb-4">
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-4"
                    style={{ background: `linear-gradient(135deg, ${widgetColor}, ${pa(0.8)})` }}
                  >
                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ backgroundColor: widgetColor }} />
                    <CheckCircle className="w-8 h-8 relative z-10" />
                  </div>
                  <h3 className="font-cormorant font-bold text-3xl text-[#1C1C27]">{t("successTitle")}</h3>
                  <p className="text-[#1C1C27]/45 text-[13px] mt-2">{t("successSubtitle")}</p>
                </div>

                <div className="w-full bg-white rounded-2xl p-4 space-y-3" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  {[
                    { label: t("service"), value: selectedService?.name },
                    { label: t("dateTime"), value: selectedDate && format(selectedDate, "d MMM yyyy", { locale: dfLocale }) },
                    { label: t("pickTime"), value: selectedSlot?.label.split(" - ")[0] },
                    { label: t("patient"), value: patientName },
                  ].map(({ label, value }, i, arr) => (
                    <div key={label} className={`flex justify-between items-center text-[13px] ${i < arr.length - 1 ? "pb-3 border-b border-[#F0EEF2]" : ""}`}>
                      <span className="text-[#1C1C27]/40 font-medium">{label}</span>
                      <span className="font-bold text-[#1C1C27] capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#1C1C27]/30 mt-4 mb-5 font-medium">{t("successNotes")}</p>

                <button
                  onClick={reset}
                  className="w-full py-3.5 rounded-xl font-bold text-[14px] bg-white border border-[rgba(0,0,0,0.07)] text-[#1C1C27] hover:bg-[#F0EEF2] transition-colors"
                >
                  {t("bookAnother")}
                </button>
              </div>
            )}

            {/* CHAT */}
            {step === "chat" && (
              <div className="flex flex-col h-full bg-[#F8F7F5]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.role === "assistant" && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm flex-shrink-0 mb-4"
                          style={{ background: `linear-gradient(135deg, ${widgetColor}, ${pa(0.8)})` }}
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className={`max-w-[82%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        {msg.role === "user" ? (
                          <div
                            className="rounded-2xl rounded-br-sm px-4 py-2.5 text-[14px] leading-relaxed text-white font-medium shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${widgetColor}, ${hexToRgba(widgetColor, 0.85)})`,
                              boxShadow: `0 4px 14px -2px ${pa(0.35)}`,
                            }}
                          >
                            {msg.content}
                          </div>
                        ) : (
                          <div
                            className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-[14px] leading-relaxed text-[#1C1C27] bg-white shadow-sm border border-black/[0.05]"
                          >
                            <MarkdownMessage content={msg.content} />
                            {msg.bookingSuccess && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-emerald-600 text-[11px] border-t border-black/[0.06] pt-2.5 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" /> Rendez-vous confirmé
                              </div>
                            )}
                          </div>
                        )}
                        <span className="text-[10px] text-[#1C1C27]/30 font-medium px-1">
                          {format(msg.timestamp, widgetLocale === "fr" ? "HH:mm" : "h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-end gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${widgetColor}, ${pa(0.8)})` }}>
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="rounded-2xl rounded-bl-md px-4 py-3 shadow-sm" style={{ backgroundColor: widgetColor }}>
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-white/70 rounded-full wg-typing" style={{ animationDelay: `${i * 0.18}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-black/[0.05] bg-[#F8F7F5] flex-shrink-0">
                  <div
                    className="wg-input flex items-end gap-2 bg-white rounded-2xl p-1.5 border transition-all shadow-sm"
                    style={{ borderColor: "rgba(0,0,0,0.07)" }}
                  >
                    <textarea
                      ref={chatInputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                      placeholder={t("typeMessage")}
                      rows={1}
                      className="flex-1 max-h-24 px-3 py-2 text-[14px] bg-transparent focus:outline-none resize-none font-medium text-[#1C1C27] placeholder-[#1C1C27]/30"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-30 flex-shrink-0 mb-0.5 mr-0.5 hover:scale-105 active:scale-95"
                      style={{ backgroundColor: chatInput.trim() ? widgetColor : "rgba(0,0,0,0.15)" }}
                    >
                      {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                    </button>
                  </div>
                  <div className="flex justify-center items-center gap-1 mt-1.5">
                    <Sparkles className="w-2.5 h-2.5 text-[#1C1C27]/15" />
                    <p className="text-[9px] font-semibold tracking-widest text-[#1C1C27]/15 uppercase">{t("poweredBy")}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-[#1C1C27]">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-[#1C1C27]">{children}</strong>,
        em: ({ children }) => <em className="italic text-[#1C1C27]/80">{children}</em>,
        ul: ({ children }) => <ul className="mt-1.5 mb-2.5 space-y-1.5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mt-1.5 mb-2.5 space-y-1.5 list-decimal list-inside last:mb-0">{children}</ol>,
        li: ({ children }) => (
          <li className="flex items-start gap-2 text-[14px] text-[#1C1C27]">
            <span className="mt-2 w-1 h-1 rounded-full bg-[#1C1C27]/40 flex-shrink-0" />
            <span className="leading-relaxed">{children}</span>
          </li>
        ),
        h1: ({ children }) => <p className="font-bold text-[16px] mb-2 text-[#1C1C27]">{children}</p>,
        h2: ({ children }) => <p className="font-bold text-[15px] mb-1.5 text-[#1C1C27]">{children}</p>,
        h3: ({ children }) => <p className="font-bold text-[14px] mb-1 text-[#1C1C27]">{children}</p>,
        hr: () => <div className="my-3 border-t border-black/10" />,
        code: ({ children }) => (
          <code className="bg-black/[0.06] rounded px-1.5 py-0.5 text-[12px] font-mono text-[#1C1C27]">{children}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-black/20 pl-3 my-2 italic text-[#1C1C27]/70 bg-black/[0.03] py-1 pr-2 rounded-r-lg">{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
