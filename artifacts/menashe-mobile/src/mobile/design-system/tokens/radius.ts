/**
 * MMDL — Border Radius Tokens
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Soft, elegant, premium — targets the "luxury reading app" feel.
 * All rounded corners in the app MUST come from this scale.
 *
 * Usage:
 *   import { RD } from "@/src/mobile/design-system";
 *   <View style={{ borderRadius: RD.lg }} />
 */

export const RD = {
  /** 4dp — subtle rounding, tags, tiny chips */
  xs:     4,
  /** 8dp — small elements, input fields */
  sm:     8,
  /** 12dp — standard cards, buttons */
  md:     12,
  /** 16dp — large cards, sheets */
  lg:     16,
  /** 20dp — hero cards, feature panels */
  xl:     20,
  /** 24dp — prominent modal corners */
  "2xl":  24,
  /** 32dp — very large decorative radius */
  "3xl":  32,
  /** 9999dp — full-pill shape (badges, chips, toggles) */
  pill:   9999,
  /** Use width/2 at runtime — circle avatar helper */
  circle: 9999,
} as const;

export type RadiusKey = keyof typeof RD;

// ─── Semantic radius aliases ───────────────────────────────────────────────────

export const COMPONENT_RADIUS = {
  button:        RD.md,       // 12dp
  buttonSmall:   RD.sm,       // 8dp
  buttonPill:    RD.pill,
  card:          RD.lg,       // 16dp
  cardLarge:     RD.xl,       // 20dp
  input:         RD.md,       // 12dp
  chip:          RD.pill,
  badge:         RD.pill,
  avatar:        RD.circle,
  modal:         RD["2xl"],   // 24dp — top corners only on bottom sheet
  bottomSheet:   RD["2xl"],
  dialog:        RD.xl,       // 20dp
  searchBar:     RD.xl,       // 20dp
  calendarCell:  RD.sm,       // 8dp
  tabIcon:       RD.sm,       // 8dp
  floatingBtn:   RD.circle,
  section:       RD.lg,       // 16dp
  toast:         RD.md,       // 12dp
  tooltip:       RD.sm,       // 8dp
} as const;
