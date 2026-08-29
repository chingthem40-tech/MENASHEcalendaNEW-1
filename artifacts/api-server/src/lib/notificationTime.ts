export const COMMUNITY_TIME_ZONE = "Asia/Kolkata";

export type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: string;
  hour: number;
  minute: number;
  dateKey: string;
};

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getZonedDateParts(
  instant: Date,
  timeZone: string,
): ZonedDateParts {
  if (!isValidIanaTimeZone(timeZone)) {
    throw new Error(`Invalid IANA timezone: ${timeZone}`);
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return {
    year,
    month,
    day,
    weekday: parts.weekday,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

export function zonedCalendarDate(instant: Date, timeZone: string): Date {
  const parts = getZonedDateParts(instant, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

export function shouldReconcileSameDay(
  instant: Date,
  timeZone: string,
  targetHour: number,
  weekday?: string,
): boolean {
  const parts = getZonedDateParts(instant, timeZone);
  return parts.hour >= targetHour && (!weekday || parts.weekday === weekday);
}