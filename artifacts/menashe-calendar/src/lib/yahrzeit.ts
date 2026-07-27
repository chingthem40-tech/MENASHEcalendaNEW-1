import { HDate } from "@hebcal/core";
import { hebrewDayNumeral } from "./hebrewCalendar";

export const YAHRZEIT_STORAGE_KEY = "menashe-yahrzeit-entries";

export interface YartzeitEntry {
  id: string;
  name: string;
  hebrewDay: number;
  hebrewMonth: number;
  displayDate: string;
  wasAfterSunset: boolean;
}

export function getYahrzeitEntries(): YartzeitEntry[] {
  try {
    const raw = localStorage.getItem(YAHRZEIT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as YartzeitEntry[];
  } catch {}
  return [];
}

export function saveYahrzeitEntries(entries: YartzeitEntry[]) {
  try {
    localStorage.setItem(YAHRZEIT_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function getNextYahrzeit(hebrewDay: number, hebrewMonth: number): {
  date: Date;
  daysAway: number;
  monthName: string;
  isToday: boolean;
} | null {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentHYear = new HDate(today).getFullYear();
    for (let offset = 0; offset <= 2; offset++) {
      const yhDate = new HDate(hebrewDay, hebrewMonth, currentHYear + offset);
      const greg = yhDate.greg();
      greg.setHours(0, 0, 0, 0);
      if (greg >= today) {
        const daysAway = Math.round((greg.getTime() - today.getTime()) / 86400000);
        return {
          date: greg,
          daysAway,
          monthName: HDate.getMonthName(hebrewMonth, currentHYear + offset),
          isToday: daysAway === 0,
        };
      }
    }
  } catch {}
  return null;
}

export function hebrewDayLabel(day: number, month: number, year?: number): string {
  const hYear = year ?? new HDate(new Date()).getFullYear();
  return `${hebrewDayNumeral(day)} ${HDate.getMonthName(month, hYear)}`;
}

/**
 * Returns a map of { gregorianDay: YartzeitEntry[] } for entries whose
 * Hebrew anniversary falls within the given Gregorian year+month.
 */
export function getYahrzeitDatesForMonth(
  gregYear: number,
  gregMonth: number,
  entries: YartzeitEntry[],
): Record<number, YartzeitEntry[]> {
  const map: Record<number, YartzeitEntry[]> = {};
  const firstDay = new Date(gregYear, gregMonth, 1);
  const lastDay  = new Date(gregYear, gregMonth + 1, 0);
  const hYearStart = new HDate(firstDay).getFullYear();

  for (const entry of entries) {
    for (let offset = 0; offset <= 1; offset++) {
      try {
        const yhDate = new HDate(entry.hebrewDay, entry.hebrewMonth, hYearStart + offset);
        const greg = yhDate.greg();
        greg.setHours(0, 0, 0, 0);
        if (greg >= firstDay && greg <= lastDay) {
          const d = greg.getDate();
          if (!map[d]) map[d] = [];
          map[d].push(entry);
          break;
        }
      } catch {}
    }
  }
  return map;
}
