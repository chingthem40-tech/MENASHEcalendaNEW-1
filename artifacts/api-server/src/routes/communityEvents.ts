/**
 * Community Events — /api/community/events
 *
 * Returns upcoming Bnei Menashe community events: Jewish holidays, Shabbat,
 * and recurring community gatherings. No database — curated, rule-based.
 * Easy to promote to a DB-backed table in the future.
 */

import { Router } from "express";
import { HebrewCalendar, HDate, flags } from "@hebcal/core";

const router = Router();

export type CommunityEventType = "shabbat" | "holiday" | "community" | "learning";

export interface CommunityEvent {
  id: string;
  type: CommunityEventType;
  emoji: string;
  title: string;
  titleTK: string;
  description: string;
  descriptionTK: string;
  date: string;          // ISO date "YYYY-MM-DD"
  time?: string;         // "HH:MM" local
  location?: string;
  virtual?: boolean;
  recurring?: "weekly" | "monthly";
}

/** Next N Saturdays from today (Shabbat). */
function nextShabbatot(n: number, from: Date): Date[] {
  const results: Date[] = [];
  const d = new Date(from);
  // Find next Saturday (day 6)
  const dayOfWeek = d.getDay();
  const daysUntilSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek);
  d.setDate(d.getDate() + daysUntilSat);
  for (let i = 0; i < n; i++) {
    results.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return results;
}

/** ISO date string "YYYY-MM-DD" from a JS Date. */
function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dy}`;
}

/** Major holidays in the next 90 days. */
function upcomingHolidays(from: Date, days = 90): CommunityEvent[] {
  const to = new Date(from);
  to.setDate(to.getDate() + days);

  const events = HebrewCalendar.calendar({
    start: new HDate(from),
    end: new HDate(to),
    isHebrewYear: false,
    il: false,
    sedrot: false,
    omer: false,
    yomKippurKatan: false,
    mask: flags.YOM_TOV_ENDS | flags.CHAG | flags.ROSH_CHODESH | flags.SPECIAL_SHABBAT,
  });

  const EMOJI: Record<string, string> = {
    "Rosh Hashana": "🍎",
    "Yom Kippur": "📖",
    "Sukkot": "🌿",
    "Shmini Atzeret": "🌿",
    "Simchat Torah": "📜",
    "Chanukah": "🕎",
    "Tu BiShvat": "🌱",
    "Purim": "🎭",
    "Pesach": "🫓",
    "Shavuot": "📜",
    "Tisha B'Av": "✡",
    "Rosh Chodesh": "🌙",
  };

  const TK: Record<string, { title: string; desc: string }> = {
    "Rosh Hashana":    { title: "Kumsaa Thar",       desc: "Kumpi thar ni, Lungsim buaina leh thupui ngaihdan." },
    "Yom Kippur":      { title: "Thahat Ni",          desc: "Ni tha pawl in lungsim buai leh Pathen in kizopna." },
    "Sukkot":          { title: "Sukkot",              desc: "Sukkot lawmman, tuite leh puante ngaih." },
    "Chanukah":        { title: "Chanukah",            desc: "Mei kat vei 8 lawmman." },
    "Purim":           { title: "Purim",               desc: "Esther leh Mordechai vawisuni in puakin." },
    "Pesach":          { title: "Pesach",              desc: "Egypt ram pan suaktak lawmman." },
    "Shavuot":         { title: "Shavuot",             desc: "Torah piak ni lawmman." },
    "Tisha B'Av":      { title: "Tisha B'Av",          desc: "Bet Hamikdash suak ni." },
    "Rosh Chodesh":    { title: "Thla Thar",           desc: "Thla thar kumkhua thar." },
  };

  return events.map((ev) => {
    const rawDate = ev.getDate().greg();
    const d = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
    const name = ev.getDesc();
    const baseName = Object.keys(EMOJI).find((k) => name.startsWith(k)) ?? name;
    const tk = TK[baseName];

    return {
      id: `holiday-${isoDate(d)}-${name.replace(/\s+/g, "-").toLowerCase()}`,
      type: "holiday" as CommunityEventType,
      emoji: EMOJI[baseName] ?? "✡",
      title: name,
      titleTK: tk?.title ?? name,
      description: `Observe ${name} with the Bnei Menashe community.`,
      descriptionTK: tk?.desc ?? `${name} in lawm rawh.`,
      date: isoDate(d),
    };
  });
}

/** Fixed recurring community events (always-on). */
function recurringEvents(from: Date, weeks = 4): CommunityEvent[] {
  const events: CommunityEvent[] = [];
  const RECURRING: Array<{
    dayOfWeek: number; // 0=Sun … 6=Sat
    time: string;
    title: string;
    titleTK: string;
    description: string;
    descriptionTK: string;
    location: string;
    virtual: boolean;
    type: CommunityEventType;
    emoji: string;
    recurring: "weekly" | "monthly";
  }> = [
    {
      dayOfWeek: 0, // Sunday
      time: "08:00",
      title: "Daf Yomi Study Circle",
      titleTK: "Daf Yomi Kihilna",
      description: "Daily Talmud study — open to all levels. Join via WhatsApp group.",
      descriptionTK: "Talmud kihilna — thu dawt zawng zawng tan. WhatsApp group-ah join rawh.",
      location: "Virtual · WhatsApp",
      virtual: true,
      type: "learning",
      emoji: "📖",
      recurring: "weekly",
    },
    {
      dayOfWeek: 3, // Wednesday
      time: "19:00",
      title: "Weekly Halacha Class",
      titleTK: "Halacha Kihilna",
      description: "Practical Halacha for Bnei Menashe families, with Rabbi Shlomo Gangte.",
      descriptionTK: "Bnei Menashe chhungkua tan halacha, Rabbi Shlomo Gangte in.",
      location: "Zoom · Community Hall",
      virtual: true,
      type: "learning",
      emoji: "🕍",
      recurring: "weekly",
    },
    {
      dayOfWeek: 6, // Saturday (Shabbat morning)
      time: "09:00",
      title: "Shabbat Morning Services",
      titleTK: "Shabbat Zing Thupui",
      description: "Community Shabbat services. Visitors welcome. Kiddush follows.",
      descriptionTK: "Mipil Shabbat thupui. Kiddush a um.",
      location: "Beit Knesset Bnei Menashe, Churachandpur",
      virtual: false,
      type: "community",
      emoji: "🕯",
      recurring: "weekly",
    },
  ];

  for (const rec of RECURRING) {
    const d = new Date(from);
    const diff = (rec.dayOfWeek - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    for (let w = 0; w < weeks; w++) {
      const date = new Date(d);
      date.setDate(date.getDate() + w * 7);
      events.push({
        id: `rec-${rec.dayOfWeek}-${isoDate(date)}`,
        type: rec.type,
        emoji: rec.emoji,
        title: rec.title,
        titleTK: rec.titleTK,
        description: rec.description,
        descriptionTK: rec.descriptionTK,
        date: isoDate(date),
        time: rec.time,
        location: rec.location,
        virtual: rec.virtual,
        recurring: rec.recurring,
      });
    }
  }

  return events;
}

// ── Route ──────────────────────────────────────────────────────────────────────

router.get("/community/events", (_req, res) => {
  try {
    const now = new Date();

    const holidays = upcomingHolidays(now, 90);
    const recurring = recurringEvents(now, 3);

    const all: CommunityEvent[] = [...holidays, ...recurring].sort(
      (a, b) => a.date.localeCompare(b.date),
    );

    // Dedupe by date+title (Shabbat recurring may overlap holiday special Shabbatot)
    const seen = new Set<string>();
    const deduped = all.filter((ev) => {
      const key = `${ev.date}-${ev.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Return next 20 events
    res.json(deduped.slice(0, 20));
  } catch (err) {
    console.error("[community/events]", err);
    res.status(500).json({ error: "Failed to generate events" });
  }
});

export default router;
