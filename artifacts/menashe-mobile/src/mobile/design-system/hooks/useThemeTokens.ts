/**
 * MMDL — useThemeTokens
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Primary consumer hook for the entire MMDL design system.
 * Returns all semantic tokens scoped to the current theme.
 *
 * Usage:
 *   import { useThemeTokens } from "@/src/mobile/design-system";
 *
 *   function MyComponent() {
 *     const { colors, type, sp, rd, shadow, glass, motion, icon, layout } = useThemeTokens();
 *     return (
 *       <View style={{ backgroundColor: colors.card, borderRadius: rd.lg, ...shadow.level2 }}>
 *         <Text style={[type.heading, { color: colors.textPrimary }]}>Hello</Text>
 *       </View>
 *     );
 *   }
 */

import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import type { ThemeKey } from "@/constants/colors";

import { COLOR_TOKENS,   type ColorTokens } from "../tokens/colors";
import { TYPE,           type TypeKey      } from "../tokens/typography";
import { SP,             type SpacingKey   } from "../tokens/spacing";
import { RD, COMPONENT_RADIUS              } from "../tokens/radius";
import { SHADOW, BLUR, platformShadow      } from "../tokens/elevation";
import {
  GLASS_SPEC,
  GLASS_CARD, GLASS_DARK, GLASS_HEADER,
  GLASS_LIGHT, GLASS_NAVIGATION, GLASS_OVERLAY,
} from "../tokens/glass";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING, MOTION_RECIPE } from "../tokens/motion";
import { ICON_SIZE, ICON_STROKE, ICON_PADDING, ICON_COLOR_KEY, ICON_MAP } from "../tokens/iconography";
import { LAYOUT } from "../tokens/layout";

// ─── Return type ──────────────────────────────────────────────────────────────

export interface ThemeTokens {
  /** Current active theme name */
  theme:    ThemeKey;

  /** Semantic color tokens for the active theme */
  colors:   ColorTokens;

  /** Full MMDL typography scale */
  type:     typeof TYPE;

  /** Spacing scale (SP[0] … SP[32]) */
  sp:       typeof SP;

  /** Border radius tokens */
  rd:       typeof RD;

  /** Semantic component radius aliases */
  cr:       typeof COMPONENT_RADIUS;

  /** Shadow / elevation tokens */
  shadow:   typeof SHADOW;

  /** Blur intensity values */
  blur:     typeof BLUR;

  /** Platform-safe shadow helper */
  platformShadow: typeof platformShadow;

  /** Glass specification map */
  glass: {
    light:      typeof GLASS_LIGHT;
    dark:       typeof GLASS_DARK;
    navigation: typeof GLASS_NAVIGATION;
    header:     typeof GLASS_HEADER;
    card:       typeof GLASS_CARD;
    overlay:    typeof GLASS_OVERLAY;
  };

  /** Current-theme glass shorthand (most common accessor) */
  glassForTheme: {
    light:      (typeof GLASS_LIGHT)[ThemeKey];
    dark:       (typeof GLASS_DARK)[ThemeKey];
    navigation: (typeof GLASS_NAVIGATION)[ThemeKey];
    header:     (typeof GLASS_HEADER)[ThemeKey];
    card:       (typeof GLASS_CARD)[ThemeKey];
    overlay:    (typeof GLASS_OVERLAY)[ThemeKey];
  };

  /** Motion tokens */
  motion: {
    duration: typeof MOTION_DURATION;
    ease:     typeof MOTION_EASE;
    spring:   typeof MOTION_SPRING;
    recipe:   typeof MOTION_RECIPE;
  };

  /** Iconography tokens */
  icon: {
    size:     typeof ICON_SIZE;
    stroke:   typeof ICON_STROKE;
    padding:  typeof ICON_PADDING;
    colorKey: typeof ICON_COLOR_KEY;
    map:      typeof ICON_MAP;
  };

  /** Layout tokens */
  layout:   typeof LAYOUT;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useThemeTokens(): ThemeTokens {
  const ctx   = useContext(AppContext);
  const theme = (ctx?.theme ?? "dark") as ThemeKey;
  const colors = COLOR_TOKENS[theme];

  return {
    theme,
    colors,
    type:   TYPE,
    sp:     SP,
    rd:     RD,
    cr:     COMPONENT_RADIUS,
    shadow: SHADOW,
    blur:   BLUR,
    platformShadow,
    glass: {
      light:      GLASS_LIGHT,
      dark:       GLASS_DARK,
      navigation: GLASS_NAVIGATION,
      header:     GLASS_HEADER,
      card:       GLASS_CARD,
      overlay:    GLASS_OVERLAY,
    },
    glassForTheme: {
      light:      GLASS_LIGHT[theme],
      dark:       GLASS_DARK[theme],
      navigation: GLASS_NAVIGATION[theme],
      header:     GLASS_HEADER[theme],
      card:       GLASS_CARD[theme],
      overlay:    GLASS_OVERLAY[theme],
    },
    motion: {
      duration: MOTION_DURATION,
      ease:     MOTION_EASE,
      spring:   MOTION_SPRING,
      recipe:   MOTION_RECIPE,
    },
    icon: {
      size:     ICON_SIZE,
      stroke:   ICON_STROKE,
      padding:  ICON_PADDING,
      colorKey: ICON_COLOR_KEY,
      map:      ICON_MAP,
    },
    layout: LAYOUT,
  };
}
