import SunCalc from "suncalc";

export const ALOT_HASHACHAR_MINUTES = 72;
export const TZAIS_MINUTES = 42;

export interface ZmanimTimes {
  alotHaShachar: Date | null;
  sunrise: Date | null;
  latestShema: Date | null;
  latestShacharit: Date | null;
  chatzot: Date | null;
  minchaGedolah: Date | null;
  minchaKetana: Date | null;
  plagHamincha: Date | null;
  sunset: Date | null;
  tzais: Date | null;
  candleLighting: Date | null;
  havdalah: Date | null;
  shaahZmanitGra: number;
  isShabbat: boolean;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function calculateZmanim(
  date: Date = new Date(),
  lat = 31.7683,
  lng = 35.2137,
  candleLightingMinutes = 18,
): ZmanimTimes {
  const times = SunCalc.getTimes(date, lat, lng);
  const sunrise = times.sunrise;
  const sunset = times.sunset;

  const blank: ZmanimTimes = {
    alotHaShachar: null,
    sunrise: null,
    latestShema: null,
    latestShacharit: null,
    chatzot: null,
    minchaGedolah: null,
    minchaKetana: null,
    plagHamincha: null,
    sunset: null,
    tzais: null,
    candleLighting: null,
    havdalah: null,
    shaahZmanitGra: 60,
    isShabbat: date.getDay() === 5 || date.getDay() === 6,
  };

  if (!sunrise || !sunset || isNaN(sunrise.getTime()) || isNaN(sunset.getTime())) {
    return blank;
  }

  const dayMs = sunset.getTime() - sunrise.getTime();
  const shaahZmanitMs = dayMs / 12;

  return {
    alotHaShachar: addMinutes(sunrise, -ALOT_HASHACHAR_MINUTES),
    sunrise,
    latestShema: new Date(sunrise.getTime() + 3 * shaahZmanitMs),
    latestShacharit: new Date(sunrise.getTime() + 4 * shaahZmanitMs),
    chatzot: new Date(sunrise.getTime() + 6 * shaahZmanitMs),
    minchaGedolah: new Date(sunrise.getTime() + 6.5 * shaahZmanitMs),
    minchaKetana: new Date(sunrise.getTime() + 9.5 * shaahZmanitMs),
    plagHamincha: new Date(sunrise.getTime() + 10.75 * shaahZmanitMs),
    sunset,
    tzais: addMinutes(sunset, TZAIS_MINUTES),
    candleLighting: addMinutes(sunset, -candleLightingMinutes),
    havdalah: addMinutes(sunset, TZAIS_MINUTES),
    shaahZmanitGra: shaahZmanitMs / 60000,
    isShabbat: date.getDay() === 5 || date.getDay() === 6,
  };
}

export function formatTime(date: Date | null, tz = "Asia/Jerusalem"): string {
  if (!date || isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}
