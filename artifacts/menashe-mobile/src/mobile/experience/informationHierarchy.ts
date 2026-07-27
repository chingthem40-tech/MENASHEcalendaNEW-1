/**
 * informationHierarchy.ts
 * Menashe Experience Language — Phase 2: Information Hierarchy
 *
 * Defines the three-level visual priority system for ALL screens in
 * Menashe Calendar Mobile. No screen may invent its own priority order.
 *
 * Level 1 — Seen immediately, without searching.
 * Level 2 — Rewards a moment of deliberate attention.
 * Level 3 — Discoverable when the user seeks it.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HierarchyLevel = 1 | 2 | 3;

export interface HierarchyItem {
  /** Human-readable label for this content element */
  label: string;
  /** Which screen(s) this item appears on */
  screens: Screen[];
  /** The visual priority level */
  level: HierarchyLevel;
  /** The component / card family that renders this item */
  cardFamily: CardFamily;
  /** Why this level was assigned */
  rationale: string;
}

export type Screen =
  | "home"
  | "calendar"
  | "zmanim"
  | "torah"
  | "community"
  | "settings"
  | "all";

export type CardFamily =
  | "HeroCard"
  | "CountdownCard"
  | "FeatureCard"
  | "InformationCard"
  | "LearningCard"
  | "StatisticCard"
  | "ActionCard"
  | "PreviewCard"
  | "GalleryCard"
  | "AlertCard"
  | "NativeList"
  | "Inline";

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const HIERARCHY_LEVELS = {
  1: {
    label: "Level 1 — Primary",
    description:
      "The user's eye lands here first. Rendered in the Hero area or above the fold. " +
      "Maximum one Level 1 element per screen. Typography: DisplayXL or Heading1. " +
      "Always full-width. Never hidden behind scroll.",
    typographyScale: ["DisplayXL", "Heading1", "Heading2"] as const,
    colorRole: "primary" as const,
    animationPriority: "enters first (delay 0–80ms)",
  },
  2: {
    label: "Level 2 — Secondary",
    description:
      "Rewards deliberate attention. Above the fold on most devices, or immediately below. " +
      "Typography: Heading3, Body, BodySemiBold. May use 2-column grid.",
    typographyScale: ["Heading3", "Body", "BodySemiBold"] as const,
    colorRole: "secondary" as const,
    animationPriority: "enters second (delay 100–240ms)",
  },
  3: {
    label: "Level 3 — Tertiary",
    description:
      "Discoverable — the user scrolls or taps to find it. " +
      "Typography: BodySmall, Caption, Overline. Never uses gold accent as primary color.",
    typographyScale: ["BodySmall", "Caption", "Overline"] as const,
    colorRole: "muted" as const,
    animationPriority: "enters last (delay 260–440ms)",
  },
} as const;

// ---------------------------------------------------------------------------
// HOME screen hierarchy
// ---------------------------------------------------------------------------

export const HOME_HIERARCHY: HierarchyItem[] = [
  {
    label: "Today's Hebrew Date",
    screens: ["home"],
    level: 1,
    cardFamily: "HeroCard",
    rationale:
      "The entire application's purpose is the Jewish calendar. The date is the first " +
      "thing a user needs. It anchors every other piece of information on the screen.",
  },
  {
    label: "Gregorian Date + Greeting",
    screens: ["home"],
    level: 1,
    cardFamily: "HeroCard",
    rationale:
      "Provides temporal grounding alongside the Hebrew date. Part of the hero block.",
  },
  {
    label: "Hebrew Numeral Date (e.g. ט״ז בתמוז)",
    screens: ["home"],
    level: 1,
    cardFamily: "HeroCard",
    rationale:
      "Cultural authenticity. Hebrew-literate users navigate by this form. Hero placement.",
  },
  {
    label: "Prayer Times (Zmanim Bar)",
    screens: ["home"],
    level: 1,
    cardFamily: "HeroCard",
    rationale:
      "Time-critical. Users check zmanim daily for prayer obligations. " +
      "The glass zmanim bar is anchored to the bottom of the hero — always visible.",
  },
  {
    label: "Shabbat / Yom Tov Countdown",
    screens: ["home"],
    level: 1,
    cardFamily: "CountdownCard",
    rationale:
      "Time-sensitive ritual obligation. When Shabbat is within 72 hours, " +
      "the countdown becomes the second most urgent element on screen.",
  },
  {
    label: "Quick Actions (Zmanim, Calendar, Torah, Settings)",
    screens: ["home"],
    level: 2,
    cardFamily: "ActionCard",
    rationale:
      "Navigation shortcuts are Level 2 — important but not time-critical. " +
      "Grid of 52×52 icons with labels below.",
  },
  {
    label: "Parashah of the Week",
    screens: ["home"],
    level: 2,
    cardFamily: "InformationCard",
    rationale:
      "Weekly study anchor. Relevant to all users, every day of the week.",
  },
  {
    label: "Today's Focus / Daf Yomi",
    screens: ["home"],
    level: 2,
    cardFamily: "LearningCard",
    rationale:
      "Daily learning obligations. High relevance, moderate urgency.",
  },
  {
    label: "Upcoming Holiday",
    screens: ["home"],
    level: 2,
    cardFamily: "InformationCard",
    rationale:
      "Anticipation of upcoming Yom Tov. Relevant 7–14 days before the holiday.",
  },
  {
    label: "Memorial Sanctuary Entry",
    screens: ["home"],
    level: 3,
    cardFamily: "FeatureCard",
    rationale:
      "Community feature — important but not a daily necessity. " +
      "Compact 2-column Feature Card pair alongside AI. Enters last.",
  },
  {
    label: "Rav Menashe AI Entry",
    screens: ["home"],
    level: 3,
    cardFamily: "FeatureCard",
    rationale:
      "Discovery feature. Powerful but not urgently needed on every visit. " +
      "Paired with Memorial Sanctuary in the same 2-column row.",
  },
  {
    label: "Go Premium",
    screens: ["home"],
    level: 3,
    cardFamily: "AlertCard",
    rationale:
      "Commercial — only shown to non-premium users. Always last on screen.",
  },
];

// ---------------------------------------------------------------------------
// CALENDAR screen hierarchy
// ---------------------------------------------------------------------------

export const CALENDAR_HIERARCHY: HierarchyItem[] = [
  {
    label: "Month Grid / Selected Date",
    screens: ["calendar"],
    level: 1,
    cardFamily: "HeroCard",
    rationale: "The calendar grid is the screen's purpose. It is the hero.",
  },
  {
    label: "Events for Selected Day",
    screens: ["calendar"],
    level: 2,
    cardFamily: "InformationCard",
    rationale: "The logical next step after selecting a date.",
  },
  {
    label: "Holiday + Parasha badges",
    screens: ["calendar"],
    level: 2,
    cardFamily: "Inline",
    rationale: "Contextual metadata visible within the grid cells.",
  },
  {
    label: "Month Navigation",
    screens: ["calendar"],
    level: 3,
    cardFamily: "Inline",
    rationale: "Navigation controls — present but not primary content.",
  },
];

// ---------------------------------------------------------------------------
// ZMANIM screen hierarchy
// ---------------------------------------------------------------------------

export const ZMANIM_HIERARCHY: HierarchyItem[] = [
  {
    label: "Current / Next Zman",
    screens: ["zmanim"],
    level: 1,
    cardFamily: "HeroCard",
    rationale: "Time-critical. The user opened this screen for a specific time.",
  },
  {
    label: "Full Daily Zmanim List",
    screens: ["zmanim"],
    level: 2,
    cardFamily: "NativeList",
    rationale: "Complete reference — consulted deliberately.",
  },
  {
    label: "Location Source",
    screens: ["zmanim"],
    level: 3,
    cardFamily: "Inline",
    rationale: "Confirmatory — user trusts the times once they see the city.",
  },
];

// ---------------------------------------------------------------------------
// TORAH screen hierarchy
// ---------------------------------------------------------------------------

export const TORAH_HIERARCHY: HierarchyItem[] = [
  {
    label: "Parashah Name + Summary",
    screens: ["torah"],
    level: 1,
    cardFamily: "HeroCard",
    rationale: "Primary content of the Torah tab.",
  },
  {
    label: "Daily Insight / Quote",
    screens: ["torah"],
    level: 2,
    cardFamily: "LearningCard",
    rationale: "Deepens engagement after the hero.",
  },
  {
    label: "Rav Menashe AI Chat",
    screens: ["torah"],
    level: 2,
    cardFamily: "FeatureCard",
    rationale: "Interactive study tool — high value, direct tap.",
  },
  {
    label: "Daf Yomi",
    screens: ["torah"],
    level: 3,
    cardFamily: "InformationCard",
    rationale: "Supplemental learning track — relevant to a subset of users.",
  },
];

// ---------------------------------------------------------------------------
// COMMUNITY screen hierarchy
// ---------------------------------------------------------------------------

export const COMMUNITY_HIERARCHY: HierarchyItem[] = [
  {
    label: "Memorial Sanctuary 3D",
    screens: ["community"],
    level: 1,
    cardFamily: "HeroCard",
    rationale: "The centrepiece of the community experience.",
  },
  {
    label: "Yahrzeit Remembrances",
    screens: ["community"],
    level: 2,
    cardFamily: "StatisticCard",
    rationale: "Sacred community data. High emotional significance.",
  },
  {
    label: "Community Announcements",
    screens: ["community"],
    level: 2,
    cardFamily: "InformationCard",
    rationale: "Shared context — important for the group.",
  },
  {
    label: "Member Count / Stats",
    screens: ["community"],
    level: 3,
    cardFamily: "StatisticCard",
    rationale: "Social proof — interesting but not actionable.",
  },
];

// ---------------------------------------------------------------------------
// Flat lookup by screen
// ---------------------------------------------------------------------------

export const ALL_HIERARCHY: HierarchyItem[] = [
  ...HOME_HIERARCHY,
  ...CALENDAR_HIERARCHY,
  ...ZMANIM_HIERARCHY,
  ...TORAH_HIERARCHY,
  ...COMMUNITY_HIERARCHY,
];

/**
 * Returns all items for a given screen, sorted by level ascending.
 */
export function getHierarchyForScreen(screen: Screen): HierarchyItem[] {
  return ALL_HIERARCHY
    .filter((item) => item.screens.includes(screen) || item.screens.includes("all"))
    .sort((a, b) => a.level - b.level);
}

/**
 * Returns all Level 1 items across all screens.
 * Useful for cross-screen consistency audits.
 */
export function getPrimaryItems(): HierarchyItem[] {
  return ALL_HIERARCHY.filter((item) => item.level === 1);
}
