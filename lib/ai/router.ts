import type { AIMessage, AIResponseResult } from "./types";

type ActiveAIProvider = "claude" | "gemini" | "gpt" | "ollama";

function resolveActiveProvider(): ActiveAIProvider {
  const configured = process.env.ACTIVE_AI_PROVIDER?.toLowerCase();
  if (
    configured === "claude" ||
    configured === "gemini" ||
    configured === "gpt" ||
    configured === "ollama"
  ) {
    return configured;
  }
  return "claude";
}

export async function generateAIResponse(
  messages: AIMessage[],
  systemPrompt: string
): Promise<AIResponseResult> {
  const provider = resolveActiveProvider();

  switch (provider) {
    case "gemini": {
      const { generateAIResponse: generateViaGemini } = await import("./gemini");
      return generateViaGemini(messages, systemPrompt);
    }
    case "gpt": {
      const { generateAIResponse: generateViaGPT } = await import("./gpt");
      return generateViaGPT(messages, systemPrompt);
    }
    case "ollama": {
      const { generateAIResponse: generateViaOllama } = await import("./ollama");
      return generateViaOllama(messages, systemPrompt);
    }
    default: {
      const { generateAIResponse: generateViaClaude } = await import("./claude");
      return generateViaClaude(messages, systemPrompt);
    }
  }
}
