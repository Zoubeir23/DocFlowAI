"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "C'est quoi un webhook ?",
    answer: "Un webhook, c'est comme un \"signal d'alerte\" que DocFlow envoie à un autre logiciel dès qu'il se passe quelque chose (nouveau rendez-vous, annulation, etc.). L'autre logiciel reçoit ce signal et peut agir en conséquence — par exemple, envoyer un SMS à votre secrétaire.",
  },
  {
    question: "C'est quoi une clé API ?",
    answer: "Une clé API, c'est un mot de passe spécial qui permet à un autre logiciel de se connecter à DocFlow en votre nom. Comme une carte d'accès : seul le logiciel qui possède la clé peut lire ou écrire dans vos données.",
  },
  {
    question: "C'est quoi MCP / Claude Desktop ?",
    answer: "MCP (Model Context Protocol) est une technologie qui connecte DocFlow à Claude Desktop, l'assistant IA d'Anthropic. Une fois configuré, vous pouvez parler à Claude en langage naturel et il accède directement à vos données DocFlow pour vous répondre.",
  },
  {
    question: "Je ne suis pas informaticien. Par où commencer ?",
    answer: "Commencez par l'intégration MCP avec Claude Desktop — c'est la plus simple, aucun code requis. Ensuite, si vous voulez automatiser des tâches (agenda, notifications), utilisez Zapier ou Make avec les webhooks. Ces deux plateformes proposent des tutoriels visuels sans code.",
  },
  {
    question: "Est-ce que mes données patients sont sécurisées ?",
    answer: "Oui. Chaque webhook est signé avec une clé secrète unique, et chaque clé API peut être révoquée à tout moment. Toutes les communications passent par HTTPS. Vous contrôlez exactement quelles données sont partagées et avec qui.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">Questions fréquentes</h3>
      </div>
      <div className="space-y-2">
        {FAQ_ITEMS.map((item, index) => (
          <div key={index} className="border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <p className="text-xs font-semibold text-foreground">{item.question}</p>
              {openIndex === index
                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
