import { getHebrewDate, getDayOfWeek, getHebrewMonthName, hebrewDayNumeral } from "../../../lib/hebrewCalendar";
import { calculateZmanim } from "../../../lib/zmanim";
import { getCurrentParasha, getUpcomingHolidays } from "../../../lib/parasha";
import { getOmerDay } from "../../../modals/OmerModal";
import { getTodayHolidays } from "../utils";
import type { Location } from "../../../lib/locations";

export function useHomeCalendar(location: Location) {
  const today = new Date();
  const hdate = getHebrewDate(today);
  const zmanim = calculateZmanim(today, location.lat, location.lng, location.candleLightingMinutes);
  const parasha = getCurrentParasha(today);
  const holidays = getUpcomingHolidays(today, 3);

  const hebrewDay = hebrewDayNumeral(hdate.getDate());
  const hebrewMonth = getHebrewMonthName(hdate);
  const hebrewYear = hdate.getFullYear();

  const isFriday = today.getDay() === 5;
  const isShabbat = today.getDay() === 6;
  const showCandleLighting = isFriday || isShabbat;

  const todayHolidays = getTodayHolidays();
  const omerDay = getOmerDay(today);

  const nextShabbat = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + (6 - today.getDay()),
  );
  const dayName = getDayOfWeek(today);
  const monthStr = today.toLocaleDateString("en-US", { month: "long" });
  const yearStr = today.getFullYear();

  return {
    today,
    hdate,
    zmanim,
    parasha,
    holidays,
    hebrewDay,
    hebrewMonth,
    hebrewYear,
    isFriday,
    isShabbat,
    showCandleLighting,
    todayHolidays,
    omerDay,
    nextShabbat,
    dayName,
    monthStr,
    yearStr,
  };
}
