import Anthropic from "@anthropic-ai/sdk";
import type { AIMessage, AIResponseResult } from "./types";
import { parseActionFromText } from "./types";

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt: string
): Promise<AIResponseResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const rawText = response.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");

  return parseActionFromText(rawText);
}
