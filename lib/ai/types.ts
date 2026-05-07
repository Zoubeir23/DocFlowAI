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
  const actionMatch = rawText.match(/<action>([\s\S]*?)<\/action>/);
  let action: Record<string, unknown> | null = null;

  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[1].trim()) as Record<string, unknown>;
    } catch {
      action = null;
    }
  }

  const text = rawText.replace(/<action>[\s\S]*?<\/action>/g, "").trim();
  return { text, action };
}
