"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAsPatient, markMessagesAsRead, type PatientMessage } from "@/actions/patient-chat";
import { Send, Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PatientChatPanelProps {
  patientId: string;
  clinicName: string;
  initialMessages: PatientMessage[];
}

export function PatientChatPanel({ patientId, clinicName, initialMessages }: PatientChatPanelProps) {
  const [messages, setMessages] = useState<PatientMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [unreadCount, setUnreadCount] = useState(
    initialMessages.filter((m) => m.sender_role === "doctor" && !m.read_at).length
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      markMessagesAsRead(patientId, "patient");
      setUnreadCount(0);
    }
  }, [open, messages, patientId]);

  // Abonnement Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`patient_messages_portal:${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "patient_messages",
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const newMessage = payload.new as PatientMessage;
          setMessages((previous) => [...previous, newMessage]);
          if (newMessage.sender_role === "doctor" && !open) {
            setUnreadCount((count) => count + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patientId, open]);

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    setInput("");

    startTransition(async () => {
      const result = await sendMessageAsPatient(content);
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'envoi");
        setInput(content);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3 hover:bg-accent transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground flex-1 text-left">
          Messages — {clinicName}
        </span>
        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="flex flex-col h-[360px] border border-border rounded-2xl overflow-hidden bg-card">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Aucun message — posez votre question à votre médecin
              </p>
            )}
            {messages.map((message) => {
              const isPatient = message.sender_role === "patient";
              return (
                <div key={message.id} className={`flex ${isPatient ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[78%] space-y-0.5">
                    {!isPatient && (
                      <p className="text-[10px] text-muted-foreground px-1">{clinicName}</p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isPatient
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {message.content}
                    </div>
                    <p className={`text-[10px] text-muted-foreground ${isPatient ? "text-right" : "text-left"}`}>
                      {format(new Date(message.created_at), "HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-border flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message… (Entrée pour envoyer)"
              rows={1}
              className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors max-h-24 caret-primary"
            />
            <button
              onClick={handleSend}
              disabled={isPending || !input.trim()}
              className="h-9 w-9 flex items-center justify-center bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
