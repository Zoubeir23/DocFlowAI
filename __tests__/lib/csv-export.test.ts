import { describe, it, expect } from "vitest";

// Extracted from app/api/export routes — tested in isolation
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatDateFr(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTimeFr(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

describe("escapeCsvField", () => {
  it("returns empty string for null", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("returns plain string unchanged", () => {
    expect(escapeCsvField("hello")).toBe("hello");
  });

  it("wraps in quotes when field contains comma", () => {
    expect(escapeCsvField("hello, world")).toBe('"hello, world"');
  });

  it("wraps in quotes and escapes internal quotes", () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps in quotes when field contains newline", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("handles empty string", () => {
    expect(escapeCsvField("")).toBe("");
  });

  it("converts numbers to string", () => {
    expect(escapeCsvField(42 as unknown as string)).toBe("42");
  });
});

describe("formatDateFr", () => {
  it("formats date in DD/MM/YYYY", () => {
    const result = formatDateFr("2026-05-15T14:30:00");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toContain("2026");
  });
});

describe("formatTimeFr", () => {
  it("formats time in HH:MM", () => {
    const result = formatTimeFr("2026-05-15T14:30:00Z");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
