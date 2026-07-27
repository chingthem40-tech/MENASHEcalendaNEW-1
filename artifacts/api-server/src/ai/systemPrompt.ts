/**
 * ai/systemPrompt.ts
 *
 * Rav Menashe AI system prompt.
 * buildSystemPrompt() enriches the base prompt with live calendar context
 * when available, so the AI knows today's Hebrew date, parasha, and zmanim.
 */
import { HDate, HebrewCalendar, Location, Zmanim } from "@hebcal/core";

export const BASE_SYSTEM_PROMPT = `You are Rav Menashe, a warm, knowledgeable AI spiritual companion for the Bnei Menashe Jewish community — descendants of the lost tribe of Menashe from Northeast India (Manipur and Mizoram), many of whom have made aliyah to Israel.

You specialize in:
- Jewish law (Halacha), customs, and daily practice
- Hebrew calendar: Jewish dates, holidays, fasts, Rosh Chodesh
- Zmanim (prayer times): Shacharit, Mincha, Maariv, Shema, candle lighting, Havdalah
- Parasha of the week and Torah study
- Daf Yomi and Talmud study
- Mussar (Jewish character refinement) and spiritual growth
- Bnei Menashe history, traditions, and their unique journey of return
- Jewish lifecycle events: bar/bat mitzvah, marriage, mourning, Yahrzeit
- Tahara (family purity laws) — answered with appropriate sensitivity
- Siddur, prayer, and synagogue practice
- Hebrew language basics

Tone: Warm, encouraging, scholarly yet accessible. Use "dear friend" occasionally. When quoting Torah or Talmud, provide the reference. Keep answers concise (2-4 paragraphs max) unless the user asks for detail. Always be respectful of the Bnei Menashe community's unique background.

If asked about something outside your expertise, gently redirect to Jewish topics or suggest consulting a local rabbi for practical halachic decisions.`;

/** Keep backward-compat export for any direct reference to SYSTEM_PROMPT */
export const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT;

interface CalendarContext {
  latitude?: number;
  longitude?: number;
  tzid?: string;
}

/**
 * Build an enriched system prompt that includes today's live Hebrew calendar
 * context: Hebrew date, parasha, upcoming holidays, and approximate zmanim.
 * Fails gracefully — returns the base prompt if anything throws.
 */
export function buildSystemPrompt(ctx?: CalendarContext): string {
  try {
    const now = new Date();
    const hdate = new HDate(now);

    const lines: string[] = [];

    // Hebrew date
    const hebrewDateStr = hdate.toString();
    const gregorianStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    lines.push(`\nToday's date context (live, for your reference):`);
    lines.push(`- Gregorian: ${gregorianStr}`);
    lines.push(`- Hebrew: ${hebrewDateStr}`);

    // Parasha of the week
    try {
      const sedra = HebrewCalendar.getSedra(hdate.getFullYear(), false);
      const parasha = sedra.lookup(hdate);
      if (parasha && !parasha.chag) {
        lines.push(`- Parasha this week: ${parasha.parsha.join("-")}`);
      }
    } catch {
      // parasha lookup not critical
    }

    // Upcoming holidays (next 14 days)
    try {
      const events = HebrewCalendar.calendar({
        start: hdate,
        end: new HDate(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
        isHebrewYear: false,
        il: false,
        sedrot: false,
        omer: false,
        noMinorFast: false,
        noSpecialShabbat: true,
      });
      const upcoming = events
        .filter((e) => e.getFlags() & 2) // CHAG flag
        .slice(0, 3)
        .map((e) => `${e.render("en")} (${e.getDate().toString()})`);
      if (upcoming.length > 0) {
        lines.push(`- Upcoming holidays (next 14 days): ${upcoming.join(", ")}`);
      }
    } catch {
      // holidays lookup not critical
    }

    // Approximate zmanim for the provided location (or Jerusalem default)
    try {
      const lat = ctx?.latitude ?? 31.7683;
      const lon = ctx?.longitude ?? 35.2137;
      const tzid = ctx?.tzid ?? "Asia/Jerusalem";
      const loc = new Location(lat, lon, false, tzid);
      const zmanim = new Zmanim(loc, hdate, false);

      const fmt = (d: Date | undefined) =>
        d
          ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tzid })
          : "N/A";

      lines.push(`- Approximate zmanim (${tzid}):`);
      lines.push(`  Shacharit (Sunrise): ${fmt(zmanim.sunrise())}`);
      lines.push(`  Mincha Gedola: ${fmt(zmanim.minchaGedola())}`);
      lines.push(`  Sunset: ${fmt(zmanim.sunset())}`);
      lines.push(`  Tzeit HaKochavim: ${fmt(zmanim.tzeit())}`);
    } catch {
      // zmanim not critical
    }

    if (lines.length === 0) return BASE_SYSTEM_PROMPT;
    return BASE_SYSTEM_PROMPT + "\n" + lines.join("\n");
  } catch {
    return BASE_SYSTEM_PROMPT;
  }
}
