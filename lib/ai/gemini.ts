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
