export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponseResult {
  text: string;
  action: Record<string, unknown> | null;
}

export interface ClinicContext {
  clinicId: string;
  clinicName: string;
  timezone: string;
  tone: string;
  welcomeMessage: string;
  faq: Array<{ question: string; answer: string }>;
  services: Array<{ id: string; name: string; duration: number; price?: number }>;
  availableSlots?: Array<{
    date: string;
    slots: Array<{ start: string; end: string; label: string }>;
  }>;
  bookingBehavior: string;
  locale?: string;
}

export function parseActionFromText(rawText: string): AIResponseResult {
  let action: Record<string, unknown> | null = null;
  let text = rawText;

  // 1. Standard <action> tags
  const actionMatch = text.match(/<action>([\s\S]*?)<\/action>/);
  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[1].trim()) as Record<string, unknown>;
      text = text.replace(/<action>[\s\S]*?<\/action>/g, "").trim();
    } catch {
      // ignore parsing error
    }
  }

  // 2. Markdown JSON block fallback
  if (!action && text.includes('"intent"')) {
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?"intent"[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
        text = text.replace(/```(?:json)?\s*\{[\s\S]*?"intent"[\s\S]*?\}\s*```/g, "").trim();
      } catch {
        // ignore
      }
    }
  }

  // 3. Raw JSON object fallback
  if (!action && text.includes('"intent"')) {
    const rawMatch = text.match(/(\{[\s\S]*?"intent"\s*:\s*"create_booking"[\s\S]*?\})/);
    if (rawMatch) {
      try {
        action = JSON.parse(rawMatch[1].trim()) as Record<string, unknown>;
        text = text.replace(rawMatch[0], "").trim();
      } catch {
        // ignore
      }
    }
  }

  return { text, action };
}
