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

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // iCal spec: lines > 75 chars must be folded (CRLF + space)
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = " " + remaining.slice(75);
  }
  chunks.push(remaining);
  return chunks.join("\r\n");
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
    const cn = event.organizerName ? `;CN=${escapeICalText(event.organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${event.organizerEmail}`);
  }
  if (event.attendeeEmail) {
    const cn = event.attendeeName ? `;CN=${escapeICalText(event.attendeeName)}` : "";
    lines.push(`ATTENDEE${cn};RSVP=FALSE:mailto:${event.attendeeEmail}`);
  }

  lines.push("END:VEVENT");

  return lines.map(foldLine).join("\r\n");
}

export function buildICalCalendar(calName: string, events: ICalEvent[]): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DocFlow IA//DocFlow Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(calName)}`,
    "X-WR-TIMEZONE:Europe/Paris",
  ].join("\r\n");

  const body = events.map(buildICalEvent).join("\r\n");

  return `${header}\r\n${body}\r\nEND:VCALENDAR`;
}
