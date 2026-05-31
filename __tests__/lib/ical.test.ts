import { describe, it, expect } from "vitest";
import { buildICalEvent, buildICalCalendar, type ICalEvent } from "@/lib/ical";

const BASE_EVENT: ICalEvent = {
  uid: "test-uid-001@docflow.ai",
  summary: "Consultation",
  startAt: new Date("2026-06-10T10:00:00Z"),
  endAt: new Date("2026-06-10T10:30:00Z"),
};

describe("buildICalEvent", () => {
  it("wraps content with BEGIN:VEVENT / END:VEVENT", () => {
    const output = buildICalEvent(BASE_EVENT);
    expect(output).toContain("BEGIN:VEVENT");
    expect(output).toContain("END:VEVENT");
  });

  it("encodes dates in iCal UTC format", () => {
    const output = buildICalEvent(BASE_EVENT);
    expect(output).toContain("DTSTART:20260610T100000Z");
    expect(output).toContain("DTEND:20260610T103000Z");
  });

  it("escapes backslash, semicolon, and comma in TEXT values", () => {
    const event: ICalEvent = { ...BASE_EVENT, summary: "Test; Visite, Dr\\Smith" };
    const output = buildICalEvent(event);
    expect(output).toContain("SUMMARY:Test\\; Visite\\, Dr\\\\Smith");
  });

  it("normalizes Windows line endings before escaping", () => {
    const event: ICalEvent = { ...BASE_EVENT, description: "Ligne 1\r\nLigne 2\rLigne 3" };
    const output = buildICalEvent(event);
    expect(output).toContain("DESCRIPTION:Ligne 1\\nLigne 2\\nLigne 3");
  });

  it("includes optional DESCRIPTION and LOCATION when provided", () => {
    const event: ICalEvent = { ...BASE_EVENT, description: "Note", location: "Cabinet A" };
    const output = buildICalEvent(event);
    expect(output).toContain("DESCRIPTION:Note");
    expect(output).toContain("LOCATION:Cabinet A");
  });

  it("omits DESCRIPTION and LOCATION when absent", () => {
    const output = buildICalEvent(BASE_EVENT);
    expect(output).not.toContain("DESCRIPTION:");
    expect(output).not.toContain("LOCATION:");
  });

  it("uses quoted-string for CN parameter (not TEXT escaping)", () => {
    const event: ICalEvent = {
      ...BASE_EVENT,
      organizerName: 'Dr. Müller, "Chef"',
      organizerEmail: "dr@example.com",
    };
    const output = buildICalEvent(event);
    expect(output).toContain('CN="Dr. Müller, \\"Chef\\""');
    expect(output).toContain(":mailto:dr@example.com");
  });

  it("includes ATTENDEE with quoted-string CN when provided", () => {
    const event: ICalEvent = {
      ...BASE_EVENT,
      attendeeName: "Jean; Dupont",
      attendeeEmail: "jean@example.com",
    };
    const output = buildICalEvent(event);
    expect(output).toContain('CN="Jean; Dupont"');
    expect(output).toContain("RSVP=FALSE:mailto:jean@example.com");
  });

  it("folds lines exceeding 75 bytes using CRLF + space", () => {
    const longSummary = "A".repeat(80);
    const event: ICalEvent = { ...BASE_EVENT, summary: longSummary };
    const output = buildICalEvent(event);
    const lines = output.split("\r\n");
    for (const line of lines) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });

  it("folds correctly with UTF-8 multi-byte characters without splitting sequences", () => {
    // Each 'é' is 2 bytes in UTF-8 — forces byte-aware folding
    const longSummary = "é".repeat(50);
    const event: ICalEvent = { ...BASE_EVENT, summary: longSummary };
    const output = buildICalEvent(event);
    // Verify the unfolded value reconstructs correctly
    const unfolded = output.replace(/\r\n /g, "");
    expect(unfolded).toContain(`SUMMARY:${longSummary}`);
    // Verify no line exceeds 75 bytes
    const lines = output.split("\r\n");
    for (const line of lines) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });
});

describe("buildICalCalendar", () => {
  it("wraps with BEGIN:VCALENDAR / END:VCALENDAR", () => {
    const output = buildICalCalendar("Test Agenda", [BASE_EVENT]);
    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("END:VCALENDAR");
  });

  it("includes required iCal headers", () => {
    const output = buildICalCalendar("Test Agenda", [BASE_EVENT]);
    expect(output).toContain("VERSION:2.0");
    expect(output).toContain("CALSCALE:GREGORIAN");
    expect(output).toContain("METHOD:PUBLISH");
    expect(output).toContain("X-WR-TIMEZONE:Europe/Paris");
  });

  it("sets X-WR-CALNAME with the provided calendar name", () => {
    const output = buildICalCalendar("Clinique Santé+", [BASE_EVENT]);
    expect(output).toContain("X-WR-CALNAME:Clinique Santé+");
  });

  it("folds long header lines", () => {
    const longName = "Clinique ".repeat(10).trim();
    const output = buildICalCalendar(longName, []);
    const lines = output.split("\r\n");
    for (const line of lines) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });

  it("includes embedded VEVENT blocks", () => {
    const output = buildICalCalendar("Test", [BASE_EVENT]);
    expect(output).toContain("BEGIN:VEVENT");
    expect(output).toContain("END:VEVENT");
  });

  it("handles empty event list", () => {
    const output = buildICalCalendar("Vide", []);
    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("END:VCALENDAR");
    expect(output).not.toContain("BEGIN:VEVENT");
  });

  it("uses CRLF line endings throughout", () => {
    const output = buildICalCalendar("Test", [BASE_EVENT]);
    // Should not contain bare \n (only \r\n)
    const withoutCRLF = output.replace(/\r\n/g, "");
    expect(withoutCRLF).not.toContain("\n");
  });
});
