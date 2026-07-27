/* ═══════════════════════════════════════════════════════════════════════════
   MENASHE CALENDAR — Web Design Tokens
   Canonical source of truth for the web frontend color & spacing system.
   The mobile app uses artifacts/menashe-mobile/constants/colors.ts.

   GOLD PALETTE:
   • GOLD         = #d4a843  (warm amber — primary brand gold, all general use)
   • GOLD_ACCENT  = #D4AF37  (richer museum-gold — Memorial Sanctuary UI only)
   • GOLD_BRIGHT  = #f5d982  (highlight / shimmer)
   • GOLD_DIM     = #b8860b  (deeper, gradient start)

   DO NOT introduce new gold hex values without updating this file first.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Primary Gold (all general UI) ──────────────────────────────────────── */
export const GOLD       = "#d4a843";
export const GOLD_DIM   = "#b8860b";
export const GOLD_BRIGHT = "#f5d982";
export const GOLD_GRAD  = "linear-gradient(135deg, #b8860b 0%, #d4a843 50%, #f0c96a 100%)";

/* ── Memorial Sanctuary Gold (3D scene & profile sheet only) ─────────────── */
export const GOLD_SANCTUARY = "#D4AF37";

/* ── Card & Surface Tokens ───────────────────────────────────────────────── */
export const DARK_CARD   = "rgba(212,168,67,0.06)";
export const BORDER_GOLD = "rgba(212,168,67,0.25)";
export const SURFACE_0   = "rgba(0,0,0,0.85)";
export const SURFACE_1   = "rgba(255,255,255,0.04)";
export const SURFACE_2   = "rgba(255,255,255,0.07)";

/* ── Typography Scale ────────────────────────────────────────────────────── */
export const TEXT = {
  xs:   9,
  sm:   11,
  base: 13,
  md:   15,
  lg:   17,
  xl:   20,
  "2xl": 24,
  "3xl": 30,
} as const;

/* ── Spacing Scale (px) ──────────────────────────────────────────────────── */
export const SPACE = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
} as const;

/* ── Border Radii ────────────────────────────────────────────────────────── */
export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  "2xl": 28,
  full: 9999,
} as const;
