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

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    return { text: "", action: null };
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  const rawText = result.response.text();

  return parseActionFromText(rawText);
}
