"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, X, Bot, User, Loader2, Calendar,
  CheckCircle, Minimize2, Send, ChevronLeft, ChevronRight,
  Clock, Phone, Mail, UserCircle2, Stethoscope, ArrowLeft,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";
import { generatePatientTempId } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";
// patientTempId kept for chat mode conversation tracking

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

export function WidgetChat({
  clinicSlug, clinicName, widgetColor, welcomeMessage, services,
}: WidgetChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [step, setStep] = useState<Step>("home");

  // Booking state
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

  // Chat state
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
    setIsMinimized(false);
  }, []);

  // Fetch slots when date is selected
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

  // Calendar helpers
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const today = startOfDay(new Date());

  const isDayAvailable = (day: Date) => !isBefore(day, today);

  const colorStyle = { backgroundColor: widgetColor };
  const colorText = { color: widgetColor };
  const colorBorder = { borderColor: widgetColor };

  return (
    <>
      {/* Launcher button */}
      {!isOpen && (
        <button
          onClick={openWidget}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full px-5 py-3.5 text-white font-medium shadow-2xl hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={colorStyle}
        >
          <MessageCircle className="w-6 h-6" />
          <span>{t("bookAppointment")}</span>
        </button>
      )}

      {/* Widget panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 ${isMinimized ? "h-14" : "h-[620px]"}`}
          style={{ width: "390px", maxWidth: "calc(100vw - 48px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0" style={colorStyle}>
            <div className="flex items-center gap-3">
              {step !== "home" && step !== "chat" && (
                <button onClick={() => {
                  if (step === "service") setStep("home");
                  else if (step === "calendar") setStep("service");
                  else if (step === "slots") setStep("calendar");
                  else if (step === "details") setStep("slots");
                  else if (step === "confirm") setStep("details");
                }} className="p-1 hover:bg-white/20 rounded-lg transition-colors mr-1">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{clinicName}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <p className="text-xs text-white/80">{t("aiOnline")}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsOpen(false); reset(); }} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 overflow-y-auto">

              {/* ── HOME ── */}
              {step === "home" && (
                <div className="p-5 space-y-4">
                  <div className="text-center pt-2 pb-1">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white" style={colorStyle}>
                      <Bot className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{clinicName}</h3>
                    <p className="text-gray-500 text-sm mt-1">{welcomeMessage}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => setStep("service")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-md transition-all text-left group"
                      style={colorBorder}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={colorStyle}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t("bookAction")}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t("chooseService")}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setStep("chat");
                        if (messages.length === 0) {
                          setMessages([{ id: uuidv4(), role: "assistant", content: welcomeMessage, timestamp: new Date() }]);
                        }
                        setTimeout(() => chatInputRef.current?.focus(), 100);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t("chatAction")}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t("askQuestions")}</p>
                      </div>
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-400 pt-2">{t("poweredBy")}</p>
                </div>
              )}

              {/* ── SERVICE PICKER ── */}
              {step === "service" && (
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{t("selectService")}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{t("chooseHelp")}</p>
                  </div>
                  <div className="space-y-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => { setSelectedService(service); setStep("calendar"); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left hover:shadow-sm ${selectedService?.id === service.id ? "border-current bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                        style={selectedService?.id === service.id ? colorBorder : {}}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{service.duration_minutes} {t("min")}
                            </span>
                            {service.price && (
                              <span className="text-xs font-medium" style={colorText}>${service.price}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CALENDAR ── */}
              {step === "calendar" && (
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{t("chooseDate")}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedService?.name}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    {/* Month nav */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <button
                        onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                        disabled={isBefore(endOfMonth(subMonths(calendarMonth, 1)), today)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="font-semibold text-gray-900 text-sm capitalize">
                        {format(calendarMonth, "MMMM yyyy", { locale: dfLocale })}
                      </span>
                      <button
                        onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 border-b border-gray-100">
                      {(widgetLocale === "fr" ? ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]).map((d) => (
                        <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
                      ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 p-2 gap-1">
                      {Array.from({ length: startPadding }).map((_, i) => (
                        <div key={`pad-${i}`} />
                      ))}
                      {calendarDays.map((day) => {
                        const available = isDayAvailable(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, today);
                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => { if (available) { setSelectedDate(day); setStep("slots"); } }}
                            disabled={!available}
                            className={`h-9 w-full rounded-lg text-sm font-medium transition-all
                              ${isSelected ? "text-white shadow-sm" : ""}
                              ${!isSelected && available ? "hover:bg-gray-100 text-gray-800" : ""}
                              ${!available ? "text-gray-200 cursor-not-allowed" : ""}
                              ${isToday && !isSelected ? "font-bold ring-1 ring-inset" : ""}
                            `}
                            style={isSelected ? colorStyle : isToday && !isSelected ? colorBorder : {}}
                          >
                            {format(day, "d", { locale: dfLocale })}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SLOTS ── */}
              {step === "slots" && (
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{t("pickTime")}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 capitalize">
                      {selectedDate && format(selectedDate, "EEEE, d MMMM", { locale: dfLocale })} · {selectedService?.name}
                    </p>
                  </div>

                  {slotsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      <p className="text-sm text-gray-400">{t("loadingTimes")}</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="font-medium text-gray-700 text-sm">{t("noSlots")}</p>
                      <p className="text-xs text-gray-400 mt-1">{t("tryDifferent")}</p>
                      <button onClick={() => setStep("calendar")} className="mt-4 text-sm font-medium underline" style={colorText}>
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
                            onClick={() => { setSelectedSlot(slot); setStep("details"); }}
                            className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5
                              ${isSelected ? "text-white border-transparent" : "border-gray-100 text-gray-700 hover:border-current hover:shadow-sm"}`}
                            style={isSelected ? colorStyle : {}}
                          >
                            <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-white/80" : "text-gray-400"}`} />
                            {slot.label.split(" - ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── PATIENT DETAILS ── */}
              {step === "details" && (
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{t("yourDetails")}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{t("detailsSubtitle")}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{t("fullName")}</label>
                      <div className="relative">
                        <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="John Smith"
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ "--tw-ring-color": widgetColor } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{t("phone")}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {t("email")} <span className="text-gray-400 font-normal normal-case">{t("optional")}</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{bookingError}</p>
                  )}

                  <button
                    onClick={() => {
                      if (!patientName.trim() || !patientPhone.trim()) {
                        setBookingError(t("nameReq"));
                        return;
                      }
                      setBookingError("");
                      setStep("confirm");
                    }}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                    style={colorStyle}
                  >
                    {t("review")}
                  </button>
                </div>
              )}

              {/* ── CONFIRM ── */}
              {step === "confirm" && (
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{t("confirmTitle")}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{t("confirmSubtitle")}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={colorStyle}>
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("service")}</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedService?.name}</p>
                        <p className="text-xs text-gray-500">{selectedService?.duration_minutes} min{selectedService?.price ? ` · $${selectedService.price}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={colorStyle}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("dateTime")}</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {selectedDate && format(selectedDate, "EEEE, d MMMM yyyy", { locale: dfLocale })}
                        </p>
                        <p className="text-xs text-gray-500">{selectedSlot?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={colorStyle}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("patient")}</p>
                        <p className="text-sm font-semibold text-gray-900">{patientName}</p>
                        <p className="text-xs text-gray-500">{patientPhone}{patientEmail ? ` · ${patientEmail}` : ""}</p>
                      </div>
                    </div>
                  </div>

                  {bookingError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{bookingError}</p>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={confirmBooking}
                      disabled={bookingLoading}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                      style={colorStyle}
                    >
                      {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {bookingLoading ? t("confirmingBtn") : t("confirmBtn")}
                    </button>
                    <button
                      onClick={() => setStep("details")}
                      disabled={bookingLoading}
                      className="w-full py-2.5 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
                    >
                      {t("editBtn")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SUCCESS ── */}
              {step === "success" && (
                <div className="p-5 flex flex-col items-center justify-center text-center h-full space-y-4 pt-10">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg" style={colorStyle}>
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{t("successTitle")}</h3>
                    <p className="text-gray-500 text-sm mt-1">{t("successSubtitle")}</p>
                  </div>

                  <div className="w-full rounded-xl bg-gray-50 border border-gray-100 p-4 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("service")}</span>
                      <span className="font-medium text-gray-900">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("dateTime")}</span>
                      <span className="font-medium text-gray-900 capitalize">{selectedDate && format(selectedDate, "d MMM yyyy", { locale: dfLocale })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("pickTime")}</span>
                      <span className="font-medium text-gray-900">{selectedSlot?.label.split(" - ")[0]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("patient")}</span>
                      <span className="font-medium text-gray-900">{patientName}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">{t("successNotes")}</p>

                  <button
                    onClick={reset}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
                    style={colorStyle}
                  >
                    {t("bookAnother")}
                  </button>
                </div>
              )}

              {/* ── CHAT ── */}
              {step === "chat" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-gray-200" : "text-white"}`}
                          style={msg.role === "assistant" ? colorStyle : {}}
                        >
                          {msg.role === "user" ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                          {msg.role === "user" ? (
                            <div className="rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm leading-relaxed bg-gray-100 text-gray-900">
                              {msg.content}
                            </div>
                          ) : (
                            <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed text-white" style={colorStyle}>
                              <MarkdownMessage content={msg.content} />
                              {msg.bookingSuccess && (
                                <div className="mt-2 flex items-center gap-1 text-green-200 text-xs border-t border-white/20 pt-2">
                                  <CheckCircle className="w-3.5 h-3.5" /> Appointment confirmed!
                                </div>
                              )}
                            </div>
                          )}
                          <span className="text-xs text-gray-400 px-1">{format(msg.timestamp, widgetLocale === "fr" ? "HH:mm" : "h:mm a")}</span>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-end gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={colorStyle}>
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={colorStyle}>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <input
                        ref={chatInputRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                        placeholder={t("typeMessage")}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-white"
                        disabled={chatLoading}
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || chatLoading}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-40"
                        style={colorStyle}
                      >
                        {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">{t("poweredBy")}</p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-white/90">{children}</em>,
        ul: ({ children }) => <ul className="mt-1 mb-2 space-y-1 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mt-1 mb-2 space-y-1 last:mb-0 list-none">{children}</ol>,
        li: ({ children, ...props }) => {
          const ordered = (props as any).ordered;
          return (
            <li className="flex items-start gap-2 text-sm">
              {ordered ? null : <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />}
              <span>{children}</span>
            </li>
          );
        },
        h1: ({ children }) => <p className="font-bold text-base mb-1">{children}</p>,
        h2: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
        h3: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
        hr: () => <div className="my-2 border-t border-white/20" />,
        code: ({ children }) => (
          <code className="bg-white/20 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-white/40 pl-3 my-1 italic text-white/80">{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
