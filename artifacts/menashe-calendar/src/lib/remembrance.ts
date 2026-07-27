import { HDate, months } from "@hebcal/core";
import type { RemembranceEvent } from "./remembranceApi";

export const HEBREW_MONTHS: Array<{ value: number; name: string }> = [
  { value: 7, name: "Tishrei" },
  { value: 8, name: "Cheshvan" },
  { value: 9, name: "Kislev" },
  { value: 10, name: "Tevet" },
  { value: 11, name: "Shvat" },
  { value: 12, name: "Adar I" },
  { value: 13, name: "Adar II" },
  { value: 1, name: "Nisan" },
  { value: 2, name: "Iyar" },
  { value: 3, name: "Sivan" },
  { value: 4, name: "Tammuz" },
  { value: 5, name: "Av" },
  { value: 6, name: "Elul" },
];

export interface OccurrenceRow {
  hebrewYear: number;
  hebrewDay: number;
  hebrewMonthName: string;
  gregorianDate: Date;
}

export interface RemembranceOccurrence {
  date: Date | null;
  daysAway: number | null;
  isToday: boolean;
  isTomorrow: boolean;
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function annualHebrewDate(event: RemembranceEvent, year: number): Date | null {
  if (!event.hebrewDay || !event.hebrewMonth) return null;

  const month = event.hebrewMonth;
  const day = event.hebrewDay;
  const originalYear = event.hebrewYear ?? year - 1;
  let targetMonth = month;
  let targetDay = day;

  if (event.eventType === "yahrzeit") {
    if (month === months.ADAR_II) {
      targetMonth = HDate.monthsInYear(year);
    } else if (
      month === months.ADAR_I &&
      day === 30 &&
      !HDate.isLeapYear(year)
    ) {
      targetMonth = months.SHVAT;
    } else if (
      month === months.CHESHVAN &&
      day === 30 &&
      !HDate.longCheshvan(originalYear + 1)
    ) {
      targetMonth = months.KISLEV;
      targetDay = 29;
    } else if (
      month === months.KISLEV &&
      day === 30 &&
      HDate.shortKislev(originalYear + 1)
    ) {
      targetMonth = months.TEVET;
      targetDay = 29;
    }
  } else {
    const originalLeap = HDate.isLeapYear(originalYear);
    if (
      (month === months.ADAR_I && !originalLeap) ||
      (month === months.ADAR_II && originalLeap)
    ) {
      targetMonth = HDate.monthsInYear(year);
    } else if (
      month === months.CHESHVAN &&
      day === 30 &&
      !HDate.longCheshvan(year)
    ) {
      targetMonth = months.KISLEV;
      targetDay = 1;
    } else if (
      month === months.KISLEV &&
      day === 30 &&
      HDate.shortKislev(year)
    ) {
      targetMonth = months.TEVET;
      targetDay = 1;
    } else if (
      month === months.ADAR_I &&
      day === 30 &&
      originalLeap &&
      !HDate.isLeapYear(year)
    ) {
      targetMonth = months.NISAN;
      targetDay = 1;
    }
  }

  try {
    const result = new HDate(targetDay, targetMonth, year).greg();
    result.setHours(0, 0, 0, 0);
    return result;
  } catch {
    return null;
  }
}

export function getNextRemembranceOccurrence(
  event: RemembranceEvent,
  from = new Date(),
): RemembranceOccurrence {
  const today = startOfDay(from);
  let date: Date | null = null;

  if (!event.repeatAnnually && event.gregorianDate) {
    const [year, month, day] = event.gregorianDate.split("-").map(Number);
    if ([year, month, day].every(Number.isFinite)) {
      date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      if (date < today) date = null;
    }
  } else if (event.usesHebrewDate && event.hebrewDay && event.hebrewMonth) {
    const currentYear = new HDate(today).getFullYear();
    for (let offset = 0; offset < 3; offset += 1) {
      const candidate = annualHebrewDate(event, currentYear + offset);
      if (candidate && candidate >= today) {
        date = candidate;
        break;
      }
    }
  } else if (event.gregorianDate) {
    const [year, month, day] = event.gregorianDate.split("-").map(Number);
    if ([year, month, day].every(Number.isFinite)) {
      const currentYear = today.getFullYear();
      for (let offset = 0; offset < 3; offset += 1) {
        const candidate = new Date(currentYear + offset, month - 1, day);
        candidate.setHours(0, 0, 0, 0);
        if (candidate >= today) {
          date = candidate;
          break;
        }
      }
    }
  }

  if (!date)
    return { date: null, daysAway: null, isToday: false, isTomorrow: false };
  const daysAway = Math.round((date.getTime() - today.getTime()) / 86400000);
  return {
    date,
    daysAway,
    isToday: daysAway === 0,
    isTomorrow: daysAway === 1,
  };
}

export function getAllOccurrences(
  event: RemembranceEvent,
  yearsAhead = 20,
): OccurrenceRow[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: OccurrenceRow[] = [];

  if (event.usesHebrewDate && event.hebrewDay && event.hebrewMonth) {
    const currentHYear = new HDate(today).getFullYear();
    for (let offset = 0; offset <= yearsAhead; offset++) {
      const hYear = currentHYear + offset;
      const gregDate = annualHebrewDate(event, hYear);
      if (gregDate && gregDate >= today) {
        const hd = new HDate(gregDate);
        results.push({
          hebrewYear: hd.getFullYear(),
          hebrewDay: hd.getDate(),
          hebrewMonthName: hd.getMonthName(),
          gregorianDate: gregDate,
        });
      }
    }
  } else if (event.gregorianDate) {
    const [, month, day] = event.gregorianDate.split("-").map(Number);
    const currentGYear = today.getFullYear();
    const limit = event.repeatAnnually ? yearsAhead : 0;
    for (let offset = 0; offset <= limit; offset++) {
      const d = new Date(currentGYear + offset, month - 1, day);
      d.setHours(0, 0, 0, 0);
      if (d >= today) {
        const hd = new HDate(d);
        results.push({
          hebrewYear: hd.getFullYear(),
          hebrewDay: hd.getDate(),
          hebrewMonthName: hd.getMonthName(),
          gregorianDate: d,
        });
      }
    }
  }

  return results;
}

export function formatRemembranceDate(
  event: RemembranceEvent,
  locale = "en-US",
) {
  const occurrence = getNextRemembranceOccurrence(event);
  if (!occurrence.date) return "";
  return occurrence.date.toLocaleDateString(locale, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
