/**
 * Daf Yomi engine — single source of truth for the mobile app.
 * Not part of shared-core (Daf Yomi is not modeled there); this file exists
 * so the Daf Yomi calculation is defined exactly once and reused by every
 * mobile screen that needs it (Daf Yomi screen, Sacred Study screen).
 */

export interface Tractate {
  name: string;
  pages: number;
}

export const TRACTATES: Tractate[] = [
  { name: "Berakhot", pages: 64 },
  { name: "Shabbat", pages: 157 },
  { name: "Eruvin", pages: 105 },
  { name: "Pesachim", pages: 121 },
  { name: "Yoma", pages: 88 },
  { name: "Sukkah", pages: 56 },
  { name: "Beitzah", pages: 40 },
  { name: "Rosh Hashana", pages: 35 },
  { name: "Ta'anit", pages: 31 },
  { name: "Megillah", pages: 32 },
  { name: "Moed Katan", pages: 29 },
  { name: "Chagigah", pages: 27 },
  { name: "Yevamot", pages: 122 },
  { name: "Ketubot", pages: 112 },
  { name: "Nedarim", pages: 91 },
  { name: "Nazir", pages: 66 },
  { name: "Sotah", pages: 49 },
  { name: "Gittin", pages: 90 },
  { name: "Kiddushin", pages: 82 },
  { name: "Bava Kamma", pages: 119 },
  { name: "Bava Metzia", pages: 119 },
  { name: "Bava Batra", pages: 176 },
  { name: "Sanhedrin", pages: 113 },
  { name: "Makkot", pages: 24 },
  { name: "Shevuot", pages: 49 },
  { name: "Avodah Zarah", pages: 76 },
  { name: "Horayot", pages: 14 },
  { name: "Zevachim", pages: 120 },
  { name: "Menachot", pages: 110 },
  { name: "Chullin", pages: 142 },
  { name: "Bekhorot", pages: 61 },
  { name: "Arakhin", pages: 34 },
  { name: "Temurah", pages: 34 },
  { name: "Keritot", pages: 28 },
  { name: "Meilah", pages: 22 },
  { name: "Niddah", pages: 73 },
];

export const DAF_TOTAL_PAGES = TRACTATES.reduce((a, t) => a + t.pages, 0);
export const DAF_CYCLE_START = new Date(2020, 0, 5);

export interface DafToday {
  tractate: string;
  daf: number;
  cycle: number;
  total: number;
}

export function getTodayDaf(offsetDays = 0): DafToday {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const daysSince = Math.floor((target.getTime() - DAF_CYCLE_START.getTime()) / 86400000);
  const dayInCycle = ((daysSince % DAF_TOTAL_PAGES) + DAF_TOTAL_PAGES) % DAF_TOTAL_PAGES;
  const cycle = Math.floor(daysSince / DAF_TOTAL_PAGES) + 14;
  let remaining = dayInCycle;
  for (const t of TRACTATES) {
    if (remaining < t.pages) return { tractate: t.name, daf: remaining + 2, cycle, total: DAF_TOTAL_PAGES };
    remaining -= t.pages;
  }
  return { tractate: TRACTATES[0].name, daf: 2, cycle, total: DAF_TOTAL_PAGES };
}

export function getSefariaDafUrl(tractate: string, daf: number): string {
  const slug = tractate.replace(/[' ]/g, "_");
  return `https://www.sefaria.org/${slug}.${daf}a`;
}

export function getDafProgress(tractate: string, daf: number): number {
  const t = TRACTATES.find((t) => t.name === tractate);
  if (!t) return 0;
  return Math.round(((daf - 2) / t.pages) * 100);
}
