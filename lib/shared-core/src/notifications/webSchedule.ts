import { HebrewCalendar, HDate, flags } from "@hebcal/core";
import { getUpcomingParashiyot } from "../parasha/parasha";
import { calculateZmanim } from "../zmanim/zmanim";
import type { Location } from "../locations/locations";

export type WebNotificationPreferences = {
  dailyDate: boolean;
  shabbat: boolean;
  havdalah: boolean;
  holiday: boolean;
  fastDay: boolean;
  specialEvent: boolean;
  omer: boolean;
  prayers: boolean;
  parasha: boolean;
  shema: boolean;
  shabbatDigest: boolean;
  yahrzeit: boolean;
};

export type WebNotificationScheduleConfig = {
  prefs: WebNotificationPreferences;
  location: Location;
  leadTime: 5 | 10 | 15 | 30;
};

export type WebNotificationScheduleItem = {
  fireAt: number;
  title: string;
  body: string;
  tag: string;
  timezone: string;
};

export const WEB_SCHEDULE_HORIZON_DAYS = 70;

function calendarDateInTimeZone(instant: Date, timeZone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return new Date(parts.year, parts.month - 1, parts.day, 12);
}

function zonedDateTime(
  date: Date,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const desired = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
  );
  let instant = desired;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const adjustment = desired - represented;
    instant += adjustment;
    if (adjustment === 0) break;
  }
  return new Date(instant);
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function nextWeekday(targetDay: number, from: Date): Date {
  const date = new Date(from);
  let difference = (targetDay - date.getDay() + 7) % 7;
  if (difference === 0) difference = 7;
  date.setDate(date.getDate() + difference);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatTime(date: Date, timeZone: string): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

function ordinal(value: number): string {
  const suffix = value % 100 >= 11 && value % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th";
  return `${value}${suffix}`;
}

export function buildWebNotificationSchedule(
  config: WebNotificationScheduleConfig,
  now = new Date(),
  horizonDays = WEB_SCHEDULE_HORIZON_DAYS,
): WebNotificationScheduleItem[] {
  const { prefs, location, leadTime } = config;
  const items: WebNotificationScheduleItem[] = [];
  const nowMs = now.getTime();
  const today = calendarDateInTimeZone(now, location.tz);
  const endMs = nowMs + horizonDays * 24 * 60 * 60 * 1000;

  const add = (fireAt: Date, title: string, body: string, tag: string) => {
    const fireAtMs = fireAt.getTime();
    if (fireAtMs > nowMs && fireAtMs <= endMs) {
      items.push({
        fireAt: fireAtMs,
        title,
        body,
        tag,
        timezone: location.tz,
      });
    }
  };

  for (let dayOffset = 0; dayOffset <= horizonDays; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const key = dateKey(date);

    if (prefs.dailyDate) {
      const hebrew = new HDate(date);
      const label = `${ordinal(hebrew.getDate())} of ${HDate.getMonthName(hebrew.getMonth(), hebrew.getFullYear())}`;
      const relative = dayOffset === 0
        ? "Today"
        : dayOffset === 1
          ? "Tomorrow"
          : date.toLocaleDateString("en-US", { weekday: "long" });
      add(
        zonedDateTime(date, 8, 0, location.tz),
        `${relative} — ${label}`,
        dayOffset === 0
          ? "Take a moment for reflection."
          : `The Hebrew date is ${label}.`,
        `daily-hebrew-date-${key}`,
      );
    }

    if (prefs.shema || prefs.prayers) {
      const zmanim = calculateZmanim(date, location.lat, location.lng);
      const label = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (prefs.shema && zmanim.latestShema) {
        add(
          new Date(zmanim.latestShema.getTime() - leadTime * 60_000),
          `📖 Latest Shema in ${leadTime} min`,
          `Deadline to recite Shema is at ${formatTime(zmanim.latestShema, location.tz)} (${label}). Don't miss it!`,
          `shema-push-${key}`,
        );
      }
      if (prefs.prayers && zmanim.sunrise) {
        add(
          new Date(zmanim.sunrise.getTime() - leadTime * 60_000),
          `🌅 Shacharit in ${leadTime} min`,
          `Morning prayer at ${formatTime(zmanim.sunrise, location.tz)} in ${location.name}. ${label}.`,
          `shacharit-push-${key}`,
        );
      }
      if (prefs.prayers && zmanim.minchaKetana) {
        add(
          new Date(zmanim.minchaKetana.getTime() - leadTime * 60_000),
          `🌤 Mincha in ${leadTime} min`,
          `Ideal Mincha at ${formatTime(zmanim.minchaKetana, location.tz)} in ${location.name}. ${label}.`,
          `mincha-push-${key}`,
        );
      }
      if (prefs.prayers && zmanim.tzais) {
        add(
          new Date(zmanim.tzais.getTime() - leadTime * 60_000),
          `🌙 Maariv in ${leadTime} min`,
          `Nightfall and Maariv at ${formatTime(zmanim.tzais, location.tz)} in ${location.name}. ${label}.`,
          `maariv-push-${key}`,
        );
      }
    }

    if (prefs.omer) {
      const events = HebrewCalendar.calendar({
        start: date,
        end: date,
        il: true,
        isHebrewYear: false,
        mask: flags.OMER_COUNT,
      });
      const event = events[0] as { getOmer?: () => number } | undefined;
      const omerDay = event?.getOmer?.();
      if (omerDay) {
        const zmanim = calculateZmanim(date, location.lat, location.lng);
        const nightfall = zmanim.tzais ?? zmanim.havdalah;
        if (nightfall) {
          add(
            nightfall,
            `🌾 Count the Omer — Day ${omerDay}`,
            `Tonight is day ${omerDay} of 49. Time to count!`,
            `omer-push-${key}`,
          );
        }
      }
    }
  }

  if (prefs.shabbat || prefs.havdalah || prefs.shabbatDigest || prefs.parasha) {
    let friday = nextWeekday(5, today);
    while (friday.getTime() <= endMs) {
      const saturday = new Date(friday);
      saturday.setDate(friday.getDate() + 1);
      const key = dateKey(friday);
      const fridayZmanim = calculateZmanim(
        friday,
        location.lat,
        location.lng,
        location.candleLightingMinutes,
      );
      const saturdayZmanim = calculateZmanim(saturday, location.lat, location.lng);
      const parasha = getUpcomingParashiyot(friday, 1)[0];

      if (prefs.shabbat && fridayZmanim.candleLighting) {
        add(
          new Date(fridayZmanim.candleLighting.getTime() - 18 * 60_000),
          "🕯️ Shabbat Candle Lighting",
          `Light candles in 18 minutes at ${formatTime(fridayZmanim.candleLighting, location.tz)}. Shabbat Shalom!`,
          `candle-push-${key}`,
        );
      }
      if (prefs.havdalah && saturdayZmanim.havdalah) {
        add(
          saturdayZmanim.havdalah,
          "✨ Havdalah Time",
          `Shabbat has ended at ${formatTime(saturdayZmanim.havdalah, location.tz)}. Shavua Tov — have a wonderful week!`,
          `havdalah-push-${key}`,
        );
      }
      if (prefs.shabbatDigest) {
        add(
          zonedDateTime(friday, 8, 0, location.tz),
          `📜 Parashat ${parasha?.name ?? "Shabbat"}`,
          `🕯 Candles: ${fridayZmanim.candleLighting ? formatTime(fridayZmanim.candleLighting, location.tz) : "--:--"} · ✨ Havdalah: ${saturdayZmanim.havdalah ? formatTime(saturdayZmanim.havdalah, location.tz) : "--:--"} · Shabbat Shalom!`,
          `digest-push-${key}`,
        );
      }
      if (prefs.parasha && parasha) {
        const hebrew = parasha.hebrewName ? ` (${parasha.hebrewName})` : "";
        add(
          zonedDateTime(friday, 8, 0, location.tz),
          `📖 Parashat ${parasha.name}${hebrew}`,
          `This Shabbat's Torah portion is Parashat ${parasha.name}. Shabbat Shalom to the Bnei Menashe community!`,
          `parasha-push-${key}`,
        );
      }

      friday = new Date(friday);
      friday.setDate(friday.getDate() + 7);
    }
  }

  if (prefs.holiday || prefs.fastDay || prefs.specialEvent) {
    const end = new Date(today);
    end.setDate(end.getDate() + horizonDays);
    const events = HebrewCalendar.calendar({
      start: today,
      end,
      il: true,
      isHebrewYear: false,
      mask:
        flags.CHAG |
        flags.MODERN_HOLIDAY |
        flags.MINOR_FAST |
        flags.MAJOR_FAST |
        flags.ROSH_CHODESH |
        flags.SPECIAL_SHABBAT,
    });
    const seen = new Set<string>();
    for (const event of events) {
      const date = event.getDate().greg();
      date.setHours(0, 0, 0, 0);
      const name = event.render("en");
      const occurrenceKey = `${name}:${dateKey(date)}`;
      if (seen.has(occurrenceKey)) continue;
      seen.add(occurrenceKey);
      const eventFlags = event.getFlags();
      const isFast = Boolean(eventFlags & (flags.MINOR_FAST | flags.MAJOR_FAST));
      const isSpecial = Boolean(eventFlags & (flags.ROSH_CHODESH | flags.SPECIAL_SHABBAT));
      if (
        (isFast && !prefs.fastDay) ||
        (isSpecial && !prefs.specialEvent) ||
        (!isFast && !isSpecial && !prefs.holiday)
      ) continue;
      const dayBefore = new Date(date);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const category = isFast ? "fast" : isSpecial ? "special" : "holiday";
      const dateLabel = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      add(
        zonedDateTime(dayBefore, 8, 0, location.tz),
        `${isFast ? "⚠️" : "✡"} ${name} Tomorrow`,
        isFast
          ? `Tomorrow is ${name}. Plan your fast and reflection.`
          : `${name} begins tomorrow, ${dateLabel}. Chag Sameach to the Bnei Menashe community!`,
        `${category}-push-${name.replace(/\s+/g, "-").toLowerCase()}-${dateKey(date)}`,
      );
    }
  }

  return items.sort((left, right) => left.fireAt - right.fireAt);
}