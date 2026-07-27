/**
 * MMDL — Layout Tokens
 * SPR-M002 | Menashe Mobile Design Language
 *
 * All layout structural values in one place.
 * Covers screen chrome, safe areas, keyboard, landscape, and breakpoints.
 */

import { Platform } from "react-native";
import { SP } from "./spacing";
import { BREAKPOINTS } from "@/src/mobile/utils/responsive";

export { BREAKPOINTS };

// ─── Screen chrome ────────────────────────────────────────────────────────────

export const LAYOUT = {
  screen: {
    /** Horizontal edge padding for all screen content */
    paddingX:       SP[4],    // 16dp
    /** Vertical padding below the header / top inset */
    paddingTop:     SP[3],    // 12dp
    /** Vertical padding above the tab bar / bottom inset */
    paddingBottom:  SP[5],    // 20dp
    /** Max content width (keeps text readable on large screens) */
    maxContentWidth: 680,
  },

  header: {
    /** Standard header height (below status bar) */
    height:         56,
    /** Large header height (parallax / hero headers) */
    heightLarge:    88,
    /** Padding inside header horizontally */
    paddingX:       SP[4],    // 16dp
  },

  statusBar: {
    /** iOS: dynamic island / notch offset — use useSafeInsets() at runtime */
    estimatedHeight: Platform.OS === "ios" ? 50 : 28,
  },

  bottomNav: {
    /** Height of the bottom tab bar */
    height:         Platform.OS === "web" ? 68 : 64,
    /** Padding above tab icons */
    paddingTop:     SP[2],    // 8dp
    /** Padding below tab labels (before home indicator) */
    paddingBottom:  Platform.OS === "web" ? SP[2] : SP[2.5],
  },

  section: {
    /** Vertical gap between major page sections */
    gap:            SP[8],    // 32dp
    /** Vertical padding inside a section container */
    paddingY:       SP[5],    // 20dp
    /** Horizontal padding inside a section (matches screen) */
    paddingX:       SP[4],    // 16dp
    /** Gap between section title and section content */
    titleGap:       SP[3],    // 12dp
  },

  card: {
    /** Gap between adjacent cards in a list / grid */
    gap:            SP[3],    // 12dp
    /** Standard card internal horizontal padding */
    paddingX:       SP[4],    // 16dp
    /** Standard card internal vertical padding */
    paddingY:       SP[3],    // 12dp
    /** Small card padding */
    paddingXSm:     SP[3],    // 12dp
    paddingYSm:     SP[2.5],  // 10dp
  },

  list: {
    /** Gap between list items */
    itemGap:        SP[2],    // 8dp
    /** Horizontal padding for list items */
    itemPaddingX:   SP[4],    // 16dp
    /** Vertical padding for list items */
    itemPaddingY:   SP[2.5],  // 10dp
    /** Separator inset from leading edge */
    separatorInset: SP[4],    // 16dp
  },

  modal: {
    /** Bottom sheet top border radius */
    sheetRadius:    24,
    /** Bottom sheet handle width */
    handleWidth:    40,
    /** Bottom sheet handle height */
    handleHeight:   4,
    /** Bottom sheet handle top margin */
    handleMarginTop: SP[2],   // 8dp
    /** Dialog max width */
    dialogMaxWidth: 360,
    /** Dialog horizontal margin */
    dialogMarginX:  SP[5],    // 20dp
    /** Dialog internal padding */
    dialogPaddingX: SP[5],    // 20dp
    dialogPaddingY: SP[6],    // 24dp
  },

  grid: {
    /** 2-column grid gap */
    gap2:           SP[3],    // 12dp
    /** 3-column grid gap */
    gap3:           SP[2],    // 8dp
  },

  // ─── Responsive overrides ─────────────────────────────────────────────────
  // Values that change on tablet / landscape

  tablet: {
    paddingX:        SP[8],   // 32dp
    maxContentWidth: 800,
    cardGap:         SP[4],   // 16dp
  },

  landscape: {
    paddingX:        SP[6],   // 24dp
    bottomNavHeight: 56,
  },

  foldable: {
    paddingX:        SP[6],   // 24dp
    maxContentWidth: 640,
  },

  // ─── Keyboard avoidance ───────────────────────────────────────────────────
  // Use KeyboardAwareScrollViewCompat (already in @/components) for forms.
  // Extra bottom padding when keyboard is visible.

  keyboard: {
    extraPadding:    SP[4],   // 16dp additional bottom padding
  },
} as const;
