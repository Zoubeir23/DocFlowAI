export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  createdAt?: Date;
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function escapeICalText(text: string): string {
  return normalizeLineEndings(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function escapeICalParamValue(value: string): string {
  // RFC 5545 §3.2 — CN is a quoted-string: escape \ and " only
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function foldLine(line: string): string {
  // RFC 5545 §3.1 — fold at 75 octets (not chars), don't break multi-byte sequences
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);

  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    const limit = offset === 0 ? 75 : 74; // continuation lines have leading space (1 byte)
    let end = offset + limit;

    if (end >= bytes.length) {
      chunks.push(new TextDecoder().decode(bytes.slice(offset)));
      break;
    }

    // Walk back to avoid splitting a multi-byte UTF-8 sequence (continuation bytes are 0x80–0xBF)
    while (end > offset && (bytes[end]! & 0xc0) === 0x80) {
      end--;
    }

    chunks.push(new TextDecoder().decode(bytes.slice(offset, end)));
    offset = end;
  }

  return chunks.join("\r\n ");
}

export function buildICalEvent(event: ICalEvent): string {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatICalDate(event.createdAt ?? new Date())}`,
    `DTSTART:${formatICalDate(event.startAt)}`,
    `DTEND:${formatICalDate(event.endAt)}`,
    `SUMMARY:${escapeICalText(event.summary)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }
  if (event.organizerEmail) {
    const cn = event.organizerName ? `;CN=${escapeICalParamValue(event.organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${event.organizerEmail}`);
  }
  if (event.attendeeEmail) {
    const cn = event.attendeeName ? `;CN=${escapeICalParamValue(event.attendeeName)}` : "";
    lines.push(`ATTENDEE${cn};RSVP=FALSE:mailto:${event.attendeeEmail}`);
  }

  lines.push("END:VEVENT");

  return lines.map(foldLine).join("\r\n");
}

export function buildICalCalendar(calName: string, events: ICalEvent[]): string {
  const headerLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DocFlow IA//DocFlow Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(calName)}`,
    "X-WR-TIMEZONE:Europe/Paris",
  ].map(foldLine).join("\r\n");

  const body = events.map(buildICalEvent).join("\r\n");

  return `${headerLines}\r\n${body}\r\nEND:VCALENDAR`;
}
