/**
 * MMDL — Iconography System
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Icon token system for @expo/vector-icons (Feather set, installed).
 * All icon usage must reference these tokens — no scattered size/color values.
 *
 * Usage:
 *   import { ICON } from "@/src/mobile/design-system";
 *   <Feather name="home" size={ICON.size.md} color={colors[ICON.state.active]} />
 */

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const ICON_SIZE = {
  /** 14dp — inline text icons, badges */
  xs:   14,
  /** 18dp — small UI icons (chip prefix, list item accessory) */
  sm:   18,
  /** 22dp — standard navigation, action icons */
  md:   22,
  /** 26dp — hero icons, section headers */
  lg:   26,
  /** 32dp — feature icons, empty states */
  xl:   32,
  /** 48dp — splash / onboarding illustrations */
  "2xl": 48,
} as const;

export type IconSizeKey = keyof typeof ICON_SIZE;

// ─── Stroke width ─────────────────────────────────────────────────────────────
// Feather icons use a consistent 2px stroke at 24dp.
// These values inform custom SVG icon creation.

export const ICON_STROKE = {
  thin:     1.0,
  regular:  1.5,
  /** Default Feather stroke */
  medium:   2.0,
  bold:     2.5,
} as const;

// ─── Touch padding ────────────────────────────────────────────────────────────
// Padding added around icons in IconButton to reach 44dp minimum touch target.

export const ICON_PADDING = {
  xs:  15,   // 14 + 15*2 = 44dp total
  sm:  13,   // 18 + 13*2 = 44dp total
  md:  11,   // 22 + 11*2 = 44dp total
  lg:   9,   // 26 +  9*2 = 44dp total
  xl:   6,   // 32 +  6*2 = 44dp total
} as const;

// ─── State-based color keys ───────────────────────────────────────────────────
// Map to ColorTokens keys — components apply the actual color from useThemeTokens().

export const ICON_COLOR_KEY = {
  /** Default resting state */
  default:  "textMuted",
  /** Active / selected (e.g., focused tab) */
  active:   "primary",
  /** Interactive hover (desktop / web) */
  hover:    "textSecondary",
  /** Pressed / tapped */
  pressed:  "interactiveActive",
  /** Disabled */
  disabled: "textDisabled",
  /** On a gold/primary background */
  onPrimary: "primaryForeground",
  /** Destructive action */
  danger:   "error",
  /** Success confirmation */
  success:  "success",
} as const;

export type IconColorKey = keyof typeof ICON_COLOR_KEY;

// ─── Standard icon set reference ─────────────────────────────────────────────
// Documents which Feather icon maps to which semantic action.
// Import this for consistency — don't pick icons ad-hoc.

export const ICON_MAP = {
  // Navigation tabs
  home:        "home",
  calendar:    "calendar",
  zmanim:      "clock",
  community:   "users",
  torah:       "book-open",
  settings:    "settings",

  // Actions
  back:        "arrow-left",
  close:       "x",
  menu:        "menu",
  search:      "search",
  filter:      "sliders",
  share:       "share-2",
  add:         "plus",
  edit:        "edit-2",
  delete:      "trash-2",
  save:        "bookmark",
  saved:       "bookmark",
  download:    "download",
  upload:      "upload",
  refresh:     "refresh-cw",
  more:        "more-horizontal",

  // Status
  success:     "check-circle",
  warning:     "alert-triangle",
  error:       "x-circle",
  info:        "info",
  notification: "bell",
  notifOff:    "bell-off",

  // Content
  star:        "star",
  heart:       "heart",
  globe:       "globe",
  lock:        "lock",
  unlock:      "unlock",
  eye:         "eye",
  eyeOff:      "eye-off",
  location:    "map-pin",
  link:        "link",
  image:       "image",
  ai:          "cpu",
  candle:      "feather",
  prayer:      "sun",
  heritage:    "award",
  book:        "book",
  scroll:      "file-text",
} as const;

export type IconMapKey = keyof typeof ICON_MAP;
