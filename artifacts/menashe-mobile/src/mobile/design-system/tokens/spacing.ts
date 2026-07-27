/**
 * MMDL — Spacing System
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Single spacing scale used for all margin, padding, and gap values.
 * Never use magic numbers in components — always reference SP.xxx.
 *
 * Unit: dp (density-independent pixels, React Native default)
 *
 * Usage:
 *   import { SP } from "@/src/mobile/design-system";
 *   <View style={{ padding: SP[4], gap: SP[2] }} />
 */

export const SP = {
  0:   0,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  3.5: 14,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  9:   36,
  10:  40,
  11:  44,
  12:  48,
  14:  56,
  16:  64,
  20:  80,
  24:  96,
  32:  128,
} as const;

export type SpacingKey = keyof typeof SP;

// ─── Semantic spacing aliases ─────────────────────────────────────────────────
// Named spacing for common layout use cases — prevents inconsistency.

export const LAYOUT_SPACE = {
  /** Horizontal padding inside a screen */
  screenPaddingX:    SP[4],       // 16dp
  /** Vertical padding at top of a screen (below status bar / header) */
  screenPaddingTop:  SP[3],       // 12dp

  /** Spacing between major screen sections */
  sectionGap:        SP[8],       // 32dp
  /** Vertical padding inside a section */
  sectionPaddingY:   SP[5],       // 20dp

  /** Spacing between cards in a grid or list */
  cardGap:           SP[3],       // 12dp
  /** Internal card padding */
  cardPaddingX:      SP[4],       // 16dp
  cardPaddingY:      SP[3],       // 12dp

  /** Vertical gap between list items */
  listItemGap:       SP[2],       // 8dp
  /** Internal list item padding */
  listItemPaddingX:  SP[4],       // 16dp
  listItemPaddingY:  SP[2.5],     // 10dp

  /** Spacing between inline elements (icon + label, etc.) */
  inlineGap:         SP[2],       // 8dp

  /** Standard button horizontal padding */
  buttonPaddingX:    SP[5],       // 20dp
  /** Standard button vertical padding */
  buttonPaddingY:    SP[3],       // 12dp

  /** Input field internal padding */
  inputPaddingX:     SP[4],       // 16dp
  inputPaddingY:     SP[3],       // 12dp

  /** Minimum touch-target size per WCAG (see accessibility/index.ts) */
  minTouchTarget:    SP[11],      // 44dp (iOS HIG) / 48dp (Android) — see a11y file
} as const;
