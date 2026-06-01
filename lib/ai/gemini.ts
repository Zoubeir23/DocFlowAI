import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIMessage, AIResponseResult } from "./types";
import { parseActionFromText } from "./types";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not configured");
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

export async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt: string
): Promise<AIResponseResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  const filteredHistory: { role: string; parts: { text: string }[] }[] = [];
  
  messages.slice(0, -1).forEach((m) => {
    const role = m.role === "assistant" ? "model" : "user";
    if (filteredHistory.length === 0 || filteredHistory[filteredHistory.length - 1].role !== role) {
      filteredHistory.push({ role, parts: [{ text: m.content }] });
    } else {
      // Append text to the previous message if roles are identical (avoids consecutive identical roles)
      filteredHistory[filteredHistory.length - 1].parts[0].text += "\n" + m.content;
    }
  });

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    return { text: "", action: null };
  }

  const chat = model.startChat({ history: filteredHistory });
  const result = await chat.sendMessage(lastMessage.content);
  const rawText = result.response.text();

  return parseActionFromText(rawText);
}

export async function summarizeCarnet(historyText: string): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });
  
  const systemPrompt = `
Vous êtes un assistant médical expert.
Votre tâche est de lire l'historique complet des diagnostics et traitements d'un patient provenant de son "Carnet Numérique" et de générer une synthèse médicale claire, professionnelle et concise.
Cette synthèse est destinée à un médecin qui reçoit ce patient pour la première fois.

Directives :
1. Structurez la synthèse avec des puces (points).
2. Mettez en évidence les antécédents médicaux majeurs, les allergies, et les traitements chroniques.
3. Résumez les récents diagnostics et prescriptions de manière chronologique ou thématique.
4. N'inventez AUCUNE information médicale. Si le carnet est vide ou manque d'infos, précisez-le.
5. Utilisez un vocabulaire médical approprié mais facilement lisible.
6. Formatez la réponse en Markdown (utilisez le gras pour les titres).
`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Voici l'historique :\n\n${historyText}\n\nVeuillez générer la synthèse.` }] }],
    systemInstruction: systemPrompt
  });

  return result.response.text();
}
