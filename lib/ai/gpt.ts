import OpenAI from "openai";
import type { AIMessage, AIResponseResult } from "./types";
import { parseActionFromText } from "./types";

const GPT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt: string
): Promise<AIResponseResult> {
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: GPT_MODEL,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const rawText = completion.choices[0]?.message?.content ?? "";
  return parseActionFromText(rawText);
}
