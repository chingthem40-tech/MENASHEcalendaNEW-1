import { HDate, HebrewCalendar, flags } from "@hebcal/core";

export const JERUSALEM = { lat: 31.7683, lng: 35.2137 };

export function getHebrewDate(date: Date = new Date()): HDate {
  return new HDate(date);
}

export function formatHebrewDate(hdate: HDate): string {
  return hdate.render("en");
}

export function formatHebrewDateHebrew(hdate: HDate): string {
  return hdate.renderGematriya();
}

export function getHebrewYear(date: Date = new Date()): number {
  return new HDate(date).getFullYear();
}

export function getHebrewMonthName(hdate: HDate): string {
  return HDate.getMonthName(hdate.getMonth(), hdate.getFullYear());
}

export function formatGregorianDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatGregorianShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getDayOfWeek(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
}

export interface CalendarDay {
  date: Date;
  gregorianDay: number;
  hebrewDay: number;
  hebrewMonth: string;
  hebrewYear: number;
  isToday: boolean;
  isShabbat: boolean;
  events: string[];
  roshChodesh: boolean;
}

export function getMonthCalendar(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const events = HebrewCalendar.calendar({
    start: firstDay,
    end: lastDay,
    il: true,
    isHebrewYear: false,
    mask: flags.ROSH_CHODESH | flags.CHAG | flags.SPECIAL_SHABBAT | flags.MODERN_HOLIDAY,
  });

  const eventMap: Record<string, string[]> = {};
  for (const ev of events) {
    const d = ev.getDate().greg();
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push(ev.render("en"));
  }

  const days: CalendarDay[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const current = new Date(d);
    const hdate = new HDate(current);
    const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
    const dayEvents = eventMap[key] || [];
    const isRoshChodesh = dayEvents.some(e => e.toLowerCase().includes("rosh chodesh"));

    days.push({
      date: new Date(current),
      gregorianDay: current.getDate(),
      hebrewDay: hdate.getDate(),
      hebrewMonth: getHebrewMonthName(hdate),
      hebrewYear: hdate.getFullYear(),
      isToday:
        current.getDate() === today.getDate() &&
        current.getMonth() === today.getMonth() &&
        current.getFullYear() === today.getFullYear(),
      isShabbat: current.getDay() === 6,
      events: dayEvents,
      roshChodesh: isRoshChodesh,
    });
  }
  return days;
}

export function getCurrentParasha(): string {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 86400000);
  const events = HebrewCalendar.calendar({
    start: today,
    end: nextWeek,
    il: true,
    isHebrewYear: false,
    mask: flags.PARSHA_HASHAVUA,
  });
  if (events.length > 0) return events[0].render("en");
  return "";
}

export function getUpcomingHolidays(days = 30): Array<{ name: string; date: Date }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today.getTime() + days * 86400000);
  const events = HebrewCalendar.calendar({
    start: today,
    end,
    il: true,
    isHebrewYear: false,
    mask: flags.CHAG | flags.MODERN_HOLIDAY,
  });
  const seen = new Set<string>();
  const results: Array<{ name: string; date: Date }> = [];
  for (const ev of events) {
    const name = ev.render("en");
    if (!seen.has(name)) {
      seen.add(name);
      results.push({ name, date: ev.getDate().greg() });
    }
  }
  return results;
}

const HEBREW_NUMERALS: Record<number, string> = {
  1: "א", 2: "ב", 3: "ג", 4: "ד", 5: "ה", 6: "ו", 7: "ז", 8: "ח", 9: "ט",
  10: "י", 11: "יא", 12: "יב", 13: "יג", 14: "יד", 15: "טו", 16: "טז",
  17: "יז", 18: "יח", 19: "יט", 20: "כ", 21: "כא", 22: "כב", 23: "כג",
  24: "כד", 25: "כה", 26: "כו", 27: "כז", 28: "כח", 29: "כט", 30: "ל",
};

export function hebrewDayNumeral(day: number): string {
  return HEBREW_NUMERALS[day] ?? String(day);
}

export function getHebrewMonthsBetween(firstDay: Date, lastDay: Date): string {
  const hStart = new HDate(firstDay);
  const hEnd = new HDate(lastDay);
  const startName = HDate.getMonthName(hStart.getMonth(), hStart.getFullYear());
  const endName = HDate.getMonthName(hEnd.getMonth(), hEnd.getFullYear());
  const hYear = hStart.getFullYear();
  if (startName === endName) {
    return `${startName} ${hYear}`;
  }
  return `${startName} – ${endName} ${hYear}`;
}
