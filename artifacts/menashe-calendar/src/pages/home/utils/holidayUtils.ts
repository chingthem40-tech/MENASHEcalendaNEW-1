import { HebrewCalendar, flags } from "@hebcal/core";

export function getTodaySpecialStatus(today: Date): { label: string; emoji: string; type: string } | null {
  try {
    const fastEvents = HebrewCalendar.calendar({
      start: today, end: today, il: true, isHebrewYear: false,
      mask: flags.MINOR_FAST | flags.MAJOR_FAST,
    });
    if (fastEvents.length > 0) {
      return { type: "fast", label: fastEvents[0].render("en"), emoji: "📿" };
    }
    const rcEvents = HebrewCalendar.calendar({
      start: today, end: today, il: true, isHebrewYear: false,
      mask: flags.ROSH_CHODESH,
    });
    if (rcEvents.length > 0) {
      return { type: "roshChodesh", label: rcEvents[0].render("en"), emoji: "🌙" };
    }
    const specialShabbat = HebrewCalendar.calendar({
      start: today, end: today, il: true, isHebrewYear: false,
      mask: flags.SPECIAL_SHABBAT,
    });
    if (specialShabbat.length > 0) {
      return { type: "specialShabbat", label: specialShabbat[0].render("en"), emoji: "✨" };
    }
  } catch {}
  return null;
}

export function getTodayHolidays(): string[] {
  const today = new Date();
  const events = HebrewCalendar.calendar({
    start: today,
    end: today,
    il: true,
    isHebrewYear: false,
    mask: flags.CHAG | flags.MODERN_HOLIDAY,
  });
  return events.map(ev => ev.render("en"));
}
