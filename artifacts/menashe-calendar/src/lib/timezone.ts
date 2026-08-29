export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function zonedDateTime(
  date: Date,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  if (!isValidIanaTimeZone(timeZone)) {
    throw new Error(`Invalid IANA timezone: ${timeZone}`);
  }

  const desired = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0,
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

export function calendarDateInTimeZone(
  instant: Date,
  timeZone: string,
): Date {
  if (!isValidIanaTimeZone(timeZone)) {
    throw new Error(`Invalid IANA timezone: ${timeZone}`);
  }
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
  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
}