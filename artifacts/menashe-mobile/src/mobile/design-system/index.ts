/**
 * MMDL — Menashe Mobile Design Language
 * SPR-M002 | Official design system for Menashe Calendar Mobile
 *
 * Single import point for all design tokens, specs, and hooks.
 *
 * ─── Quick reference ──────────────────────────────────────────────────────────
 *
 *  useThemeTokens()  → All tokens for the active theme (primary hook)
 *  useReducedMotion() → Accessibility: reduce motion preference
 *  useScreenReader()  → Accessibility: screen reader active
 *
 *  Tokens (static, theme-independent):
 *    TYPE     → Typography scale (DisplayXL → Overline)
 *    SP       → Spacing scale (2dp → 128dp)
 *    RD       → Border radius (xs=4 → pill=9999)
 *    CR       → Component radius aliases (button, card, modal…)
 *    SHADOW   → Elevation shadows (none → overlay)
 *    BLUR     → Blur intensity values
 *    GLASS_SPEC → 6 glass variants × 3 themes
 *    MOTION_DURATION / MOTION_EASE / MOTION_SPRING / MOTION_RECIPE
 *    ICON_SIZE / ICON_MAP / ICON_COLOR_KEY
 *    LAYOUT   → Screen chrome, section, card, list, modal, keyboard tokens
 *    A11Y_TOUCH / A11Y_CONTRAST / A11Y_ROLE
 *
 *  Token getters (theme-aware):
 *    getColorTokens(theme) → ColorTokens for that theme
 *    getPalette(theme)     → Raw base palette (use sparingly)
 *
 *  Design contract types:
 *    MenasheButtonSpec · MenasheCardSpec · MenasheSurfaceSpec …
 *    (21 component specs total — see specs/components.ts)
 *    COMPONENT_INVENTORY → readonly array of all 21 component names
 *
 * ─── Design philosophy ────────────────────────────────────────────────────────
 *
 *   Apple HIG + Luxury Reading App + Jewish Heritage + Modern Minimalism
 *   Calm · Spiritual · Premium · Timeless · Never busy · Never noisy
 *
 * ─── File tree ────────────────────────────────────────────────────────────────
 *
 *  design-system/
 *  ├── tokens/
 *  │   ├── colors.ts        Semantic color tokens (3 themes)
 *  │   ├── typography.ts    Full type scale (DisplayXL → Overline)
 *  │   ├── spacing.ts       SP scale + LAYOUT_SPACE aliases
 *  │   ├── radius.ts        RD scale + COMPONENT_RADIUS
 *  │   ├── elevation.ts     SHADOW levels + BLUR + platformShadow()
 *  │   ├── glass.ts         6 glass variants × 3 themes
 *  │   ├── motion.ts        Duration · Ease · Spring · MOTION_RECIPE
 *  │   ├── iconography.ts   ICON_SIZE · ICON_MAP · ICON_COLOR_KEY
 *  │   └── layout.ts        Screen chrome, sections, cards, modals
 *  ├── specs/
 *  │   └── components.ts    21 component specifications (types only)
 *  ├── accessibility/
 *  │   └── index.ts         A11Y standards + useReducedMotion + useScreenReader
 *  └── hooks/
 *      └── useThemeTokens.ts  Primary design-system consumer hook
 */

export * from "./tokens";
export * from "./specs";
export * from "./accessibility";
export * from "./hooks/useThemeTokens";
