import type { RemembranceEvent } from "./remembranceApi";
import { getAllOccurrences } from "./remembrance";

function formatICSDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545: fold at 75 octets
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    parts.push(remaining.slice(0, 75));
    remaining = " " + remaining.slice(75);
  }
  parts.push(remaining);
  return parts.join("\r\n");
}

export function generateFamilyICS(events: RemembranceEvent[]): string {
  const now = new Date();
  const dtstamp =
    now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bnei Menashe Calendar//Remembrance Center//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Bnei Menashe Family Remembrance",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const event of events) {
    const occurrences = getAllOccurrences(event, 20);
    const typeLabel =
      event.eventType === "yahrzeit"
        ? "Yahrzeit"
        : event.eventType === "birthday"
          ? "Birthday"
          : "Anniversary";

    for (const occ of occurrences) {
      const uid = `${event.id}-${occ.hebrewYear}@menashe-calendar`;
      const dateStr = formatICSDate(occ.gregorianDate);
      const summaryText = `${event.name} — ${typeLabel}`;
      const descParts = [
        event.relationship ? `Relationship: ${event.relationship}` : "",
        `Hebrew date: ${occ.hebrewDay} ${occ.hebrewMonthName} ${occ.hebrewYear}`,
        event.notes ? `Note: ${event.notes}` : "",
      ].filter(Boolean);

      const veventLines = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `SUMMARY:${escapeICS(summaryText)}`,
        descParts.length
          ? `DESCRIPTION:${escapeICS(descParts.join("\n"))}`
          : "",
        event.location ? `LOCATION:${escapeICS(event.location)}` : "",
        "END:VEVENT",
      ].filter(Boolean);

      lines.push(...veventLines);
    }
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}

export function downloadICS(
  icsContent: string,
  filename = "family-remembrance.ics",
): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
