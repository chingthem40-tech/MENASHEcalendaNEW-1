import { Router } from "express";
import { HebrewCalendar, Location as HebLocation } from "@hebcal/core";

const router = Router();

// Simple in-memory cache — keyed by all response-shaping params, TTL 1 hour
// Bounded to MAX_CACHE_ENTRIES to prevent memory exhaustion on high-cardinality query strings.
const ICS_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 200;
const icsCache = new Map<string, { body: string; expiresAt: number }>();

function icsCacheSet(key: string, body: string): void {
  const now = Date.now();
  // Evict expired entries before checking cap (keeps map tidy)
  for (const [k, v] of icsCache) {
    if (v.expiresAt <= now) icsCache.delete(k);
  }
  // Evict oldest entry if still at cap
  if (icsCache.size >= MAX_CACHE_ENTRIES) {
    icsCache.delete(icsCache.keys().next().value as string);
  }
  icsCache.set(key, { body, expiresAt: now + ICS_TTL_MS });
}

function toICSDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function toICSAllDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

router.get("/calendar/ics", async (req, res) => {
  try {
    const {
      lat, lng, tz,
      locationName = "My Location",
      country = "XX",
      months = "6",
    } = req.query as Record<string, string>;

    if (!lat || !lng || !tz) {
      return res.status(400).json({ error: "lat, lng, tz are required" });
    }

    const numMonths = Math.min(12, Math.max(1, parseInt(months) || 6));

    // Cache key includes all response-shaping inputs (locationName affects X-WR-CALNAME and HebLocation)
    // numMonths (normalized) is used, not raw `months`, to avoid key skew from equivalent values like "6"/"06"
    const cacheKey = `${lat}|${lng}|${tz}|${country.slice(0, 2).toUpperCase()}|${numMonths}|${locationName}`;
    const cached = icsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="menashe-calendar.ics"`);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("X-Cache", "HIT");
      return res.send(cached.body);
    }
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + numMonths);

    const hebLoc = new HebLocation(
      parseFloat(lat),
      parseFloat(lng),
      country === "IL" || country === "Israel",
      tz,
      locationName,
      country.slice(0, 2).toUpperCase(),
    );

    const events = HebrewCalendar.calendar({
      start,
      end,
      location: hebLoc,
      candlelighting: true,
      havdalahMins: 50,
      sedrot: true,
      omer: false,
      noModern: false,
      il: country === "IL" || country === "Israel",
    });

    const dtstamp = toICSDateUTC(new Date());
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//Menashe Calendar//Sacred Calendar//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      foldLine(`X-WR-CALNAME:Menashe Sacred Calendar — ${locationName}`),
      `X-WR-CALDESC:Jewish holidays\\, Shabbat times\\, and weekly Parasha for Bnei Menashe`,
      `X-WR-TIMEZONE:${tz}`,
      "X-PUBLISHED-TTL:PT1H",
    ];

    for (const ev of events) {
      const gregDate = ev.getDate().greg();
      const title = ev.render("en");
      const evTime: Date | undefined = (ev as any).eventTime;

      const uid = `menashe-${toICSAllDay(gregDate)}-${Buffer.from(title).toString("base64url").slice(0, 20)}@menashecalendar.app`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(foldLine(`SUMMARY:${escapeICS(title)}`));
      lines.push(`DTSTAMP:${dtstamp}`);

      if (evTime instanceof Date) {
        const endTime = new Date(evTime.getTime() + 60 * 60 * 1000);
        lines.push(`DTSTART:${toICSDateUTC(evTime)}`);
        lines.push(`DTEND:${toICSDateUTC(endTime)}`);
        lines.push("CATEGORIES:Shabbat,Jewish Calendar");
      } else {
        const nextDay = new Date(gregDate);
        nextDay.setDate(nextDay.getDate() + 1);
        lines.push(`DTSTART;VALUE=DATE:${toICSAllDay(gregDate)}`);
        lines.push(`DTEND;VALUE=DATE:${toICSAllDay(nextDay)}`);
        lines.push("CATEGORIES:Jewish Calendar");
      }

      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n");

    // Store in cache (bounded, evicts expired + oldest-first at cap)
    icsCacheSet(cacheKey, icsContent);

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="menashe-calendar.ics"`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Cache", "MISS");
    return res.send(icsContent);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Failed to generate calendar feed" });
  }
});

export default router;
