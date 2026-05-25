"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAsDoctor, markMessagesAsRead, type PatientMessage } from "@/actions/patient-chat";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DoctorChatPanelProps {
  patientId: string;
  patientName: string;
  initialMessages: PatientMessage[];
}

export function DoctorChatPanel({ patientId, patientName, initialMessages }: DoctorChatPanelProps) {
  const [messages, setMessages] = useState<PatientMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marquer les messages patients comme lus à l'ouverture
  useEffect(() => {
    markMessagesAsRead(patientId, "doctor");
  }, [patientId]);

  // Abonnement Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`patient_messages:${patientId}`)
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
          if (newMessage.sender_role === "patient") {
            markMessagesAsRead(patientId, "doctor");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patientId]);

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    setInput("");

    startTransition(async () => {
      const result = await sendMessageAsDoctor(patientId, content);
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
    <div className="flex flex-col h-[420px] border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Message — {patientName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Aucun message — démarrez la conversation
          </p>
        )}
        {messages.map((message) => {
          const isDoctor = message.sender_role === "doctor";
          return (
            <div key={message.id} className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] space-y-0.5`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isDoctor
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {message.content}
                </div>
                <p className={`text-[10px] text-muted-foreground ${isDoctor ? "text-right" : "text-left"}`}>
                  {format(new Date(message.created_at), "HH:mm", { locale: fr })}
                  {isDoctor && message.read_at && " · Lu"}
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
          placeholder="Écrivez un message… (Entrée pour envoyer)"
          rows={1}
          className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors max-h-28"
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
  );
}
