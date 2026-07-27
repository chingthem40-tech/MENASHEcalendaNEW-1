/**
 * MMDL — Component Specifications
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Specification contracts for all 21 MMDL primitive components.
 * NO implementation. These types are the design contract.
 * Every future component SPR must satisfy the spec defined here.
 *
 * States defined for each component:
 *   default · pressed · disabled · loading · focused · selected
 */

import type { ColorTokens } from "../tokens/colors";
import type { RadiusKey } from "../tokens/radius";
import type { ShadowKey } from "../tokens/elevation";
import type { TypeKey } from "../tokens/typography";
import type { SpacingKey } from "../tokens/spacing";

// ─── Shared state shape ───────────────────────────────────────────────────────

export interface ComponentStates {
  default:  boolean;
  pressed:  boolean;
  disabled: boolean;
  loading:  boolean;
  focused:  boolean;
  selected: boolean;
}

/** A reference to a semantic color token key. */
type ColorRef = keyof ColorTokens;

// ═════════════════════════════════════════════════════════════════════════════
// 1. MenasheButton
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheButtonSpec {
  purpose:      "Primary CTA, secondary action, outline, ghost/text action, destructive action";
  variants:     ["primary", "secondary", "outline", "ghost", "destructive"];
  sizes:        ["sm", "md", "lg", "pill"];
  paddingX:     { sm: SpacingKey; md: SpacingKey; lg: SpacingKey };
  paddingY:     { sm: SpacingKey; md: SpacingKey; lg: SpacingKey };
  radius:       { default: RadiusKey; pill: "pill" };
  typography:   { label: TypeKey };
  elevation:    ShadowKey;
  colors: {
    primary:     { bg: ColorRef; text: ColorRef; border: ColorRef };
    secondary:   { bg: ColorRef; text: ColorRef; border: ColorRef };
    outline:     { bg: "transparent"; text: ColorRef; border: ColorRef };
    ghost:       { bg: "transparent"; text: ColorRef; border: "transparent" };
    destructive: { bg: ColorRef; text: ColorRef; border: "transparent" };
  };
  states: {
    pressed:    { scaleDown: 0.96; opacityFactor: 0.9 };
    disabled:   { bg: ColorRef; text: ColorRef; opacity: 0.5 };
    loading:    { showSpinner: true; disableInteraction: true };
  };
  minHeight:    { sm: 36; md: 44; lg: 52 };
  iconSupport:  { leading: true; trailing: true; iconOnly: true };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. MenasheCard
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheCardSpec {
  purpose:     "General-purpose content container";
  variants:    ["default", "glass", "bordered", "elevated", "flat"];
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  radius:      RadiusKey;
  elevation:   ShadowKey;
  colors: {
    default:   { bg: ColorRef; border: ColorRef };
    glass:     "GLASS_CARD tokens";
    bordered:  { bg: ColorRef; border: ColorRef; borderWidth: 1 };
  };
  states: {
    pressed:   { scaleDown: 0.98; duration: "fast" };
    disabled:  { opacity: 0.5 };
    selected:  { borderColor: ColorRef; borderWidth: 2 };
  };
  subComponents: ["CardHeader", "CardBody", "CardFooter", "CardDivider"];
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. MenasheSurface
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheSurfaceSpec {
  purpose:     "Background surface wrapper (screen, section, panel)";
  variants:    ["screen", "section", "panel", "inset"];
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  radius:      { panel: RadiusKey; section: RadiusKey };
  colors: {
    screen:    { bg: ColorRef };
    section:   { bg: ColorRef };
    panel:     { bg: ColorRef };
    inset:     { bg: ColorRef };
  };
  notes:       "Use as the outermost wrapper for screens; handles safe-area padding";
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. MenasheHeader
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheHeaderSpec {
  purpose:     "Screen header with title, back button, and actions";
  variants:    ["standard", "large", "transparent", "glass"];
  height:      { standard: 56; large: 88 };
  paddingX:    SpacingKey;
  typography:  { title: TypeKey; subtitle: TypeKey };
  colors: {
    standard:  { bg: ColorRef; title: ColorRef; icon: ColorRef };
    glass:     "GLASS_HEADER tokens";
  };
  states: {
    scrolled:  { showBorder: true; elevation: ShadowKey };
  };
  slots:       ["leading (back/menu)", "title", "subtitle", "trailing (actions 1-3)"];
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. MenasheSection
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheSectionSpec {
  purpose:     "Named content section with title, optional action, and body";
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  titleGap:    SpacingKey;
  radius:      RadiusKey;
  typography:  { title: TypeKey; action: TypeKey };
  colors:      { title: ColorRef; action: ColorRef };
  slots:       ["title", "trailing action (text button)", "body (any content)"];
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. MenasheChip
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheChipSpec {
  purpose:     "Filter chips, tags, and category pills";
  variants:    ["filter", "tag", "status", "selectable"];
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  radius:      "pill";
  typography:  TypeKey;
  colors: {
    default:   { bg: ColorRef; text: ColorRef; border: ColorRef };
    selected:  { bg: ColorRef; text: ColorRef; border: ColorRef };
    disabled:  { opacity: 0.5 };
  };
  states:      { selected: true; pressed: true; disabled: true };
  iconSupport: { leading: true; trailing: true };
  minHeight:   32;
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. MenasheBadge
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheBadgeSpec {
  purpose:     "Notification count, status indicator, label badge";
  variants:    ["count", "dot", "label", "status"];
  sizes:       ["sm", "md"];
  radius:      "pill";
  typography:  TypeKey;
  colors: {
    default:   { bg: ColorRef; text: ColorRef };
    error:     { bg: ColorRef; text: ColorRef };
    success:   { bg: ColorRef; text: ColorRef };
    gold:      { bg: ColorRef; text: ColorRef };
  };
  maxCount:    99;
  minSize:     { dot: 8; sm: 18; md: 22 };
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. MenasheAvatar
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheAvatarSpec {
  purpose:     "User avatar with image, initials, or icon fallback";
  sizes:       ["xs", "sm", "md", "lg", "xl"];
  sizePx:      { xs: 24; sm: 32; md: 40; lg: 56; xl: 72 };
  radius:      "circle";
  colors: {
    fallbackBg: ColorRef;
    fallbackText: ColorRef;
    border:    ColorRef;
  };
  borderWidth: 1.5;
  states:      { online: { dotColor: ColorRef }; offline: {} };
  badge:       "Supports MenasheBadge overlay at bottom-right";
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. MenasheIconButton
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheIconButtonSpec {
  purpose:     "Icon-only tappable action with minimum touch target";
  variants:    ["ghost", "filled", "outlined", "gold"];
  sizes:       ["sm", "md", "lg"];
  minTouchTarget: 44;
  padding:     { sm: 13; md: 11; lg: 9 };
  radius:      { ghost: 0; filled: RadiusKey; outlined: RadiusKey };
  iconSize:    { sm: 18; md: 22; lg: 26 };
  states:      { pressed: { scale: 0.92 }; disabled: { opacity: 0.4 } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. MenasheBottomTab
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheBottomTabSpec {
  purpose:     "Single tab item in the bottom navigation bar";
  height:      { native: 64; web: 68 };
  iconSize:    { active: 23; inactive: 21 };
  labelStyle:  TypeKey;
  paddingTop:  SpacingKey;
  paddingBottom: SpacingKey;
  colors: {
    active:    { icon: ColorRef; label: ColorRef };
    inactive:  { icon: ColorRef; label: ColorRef };
  };
  background:  "GLASS_NAVIGATION tokens (iOS BlurView / solid fallback)";
  borderTop:   { width: 1; color: ColorRef };
  states:      { active: true; inactive: true; pressed: { scale: 0.94 } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. MenasheCalendarCell
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheCalendarCellSpec {
  purpose:     "Single day cell in the calendar grid";
  aspectRatio: "square";
  radius:      RadiusKey;
  typography: {
    gregorian: TypeKey;
    hebrew:    TypeKey;
  };
  colors: {
    default:   { bg: "transparent"; text: ColorRef };
    today:     { bg: ColorRef; text: ColorRef };
    selected:  { bg: ColorRef; text: ColorRef; borderColor: ColorRef };
    holiday:   { dotColor: ColorRef };
    shabbat:   { text: ColorRef };
    otherMonth: { text: ColorRef };
  };
  eventDot:    { size: 4; maxDots: 3; gap: 2 };
  states:      { today: true; selected: true; pressed: true; disabled: true };
}

// ═════════════════════════════════════════════════════════════════════════════
// 12. MenasheListTile
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheListTileSpec {
  purpose:     "Standard list row with leading icon/avatar, title, subtitle, trailing";
  minHeight:   56;
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  typography: {
    title:    TypeKey;
    subtitle: TypeKey;
    trailing: TypeKey;
  };
  colors: {
    title:    ColorRef;
    subtitle: ColorRef;
    trailing: ColorRef;
    divider:  ColorRef;
  };
  slots:       ["leading (icon/avatar/image)", "title", "subtitle", "trailing (text/icon/badge)"];
  states:      { pressed: { bg: ColorRef }; selected: { bg: ColorRef }; disabled: { opacity: 0.5 } };
  separator:   { show: true; insetLeft: SpacingKey };
}

// ═════════════════════════════════════════════════════════════════════════════
// 13. MenasheStatisticCard
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheStatisticCardSpec {
  purpose:     "KPI card showing a metric with label and optional trend";
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  radius:      RadiusKey;
  elevation:   ShadowKey;
  typography: {
    value:    TypeKey;
    label:    TypeKey;
    trend:    TypeKey;
  };
  colors: {
    value:    ColorRef;
    label:    ColorRef;
    trendUp:  ColorRef;
    trendDown: ColorRef;
    accent:   ColorRef;
  };
  iconSize:    24;
}

// ═════════════════════════════════════════════════════════════════════════════
// 14. MenasheDateCard
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheDateCardSpec {
  purpose:     "Prominent Hebrew/Gregorian date display card (Home screen hero)";
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  radius:      RadiusKey;
  elevation:   ShadowKey;
  typography: {
    hebrewDate:  TypeKey;
    gregorianDate: TypeKey;
    hebrewMonth: TypeKey;
    dayOfWeek:   TypeKey;
  };
  colors: {
    hebrewDate:   ColorRef;
    gregorianDate: ColorRef;
    hebrewMonth:  ColorRef;
    goldAccent:   ColorRef;
  };
  goldDivider:    { width: 40; height: 1; color: ColorRef };
  background:     "gradient or card bg";
}

// ═════════════════════════════════════════════════════════════════════════════
// 15. MenashePrayerCard
// ═════════════════════════════════════════════════════════════════════════════

export interface MenashePrayerCardSpec {
  purpose:     "Single prayer time row (Zmanim screen)";
  minHeight:   52;
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  radius:      RadiusKey;
  typography: {
    name:     TypeKey;
    time:     TypeKey;
    diff:     TypeKey;
  };
  colors: {
    name:     ColorRef;
    time:     ColorRef;
    diff:     ColorRef;
    highlight: ColorRef;
    divider:  ColorRef;
  };
  states: {
    next:     { indicator: ColorRef; bold: true };
    passed:   { opacity: 0.55 };
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 16. MenasheParashaCard
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheParashaCardSpec {
  purpose:     "Weekly Torah portion card (Home + Torah screen)";
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  radius:      RadiusKey;
  elevation:   ShadowKey;
  typography: {
    label:    TypeKey;
    name:     TypeKey;
    hebrewName: TypeKey;
    summary:  TypeKey;
  };
  colors: {
    label:    ColorRef;
    name:     ColorRef;
    hebrewName: ColorRef;
    summary:  ColorRef;
    goldAccent: ColorRef;
  };
  goldBar:     { width: 3; radius: 2; color: ColorRef };
}

// ═════════════════════════════════════════════════════════════════════════════
// 17. MenasheQuickToolCard
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheQuickToolCardSpec {
  purpose:     "Quick-access shortcut tile (grid layout on Home)";
  aspectRatio: "square";
  radius:      RadiusKey;
  elevation:   ShadowKey;
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  iconSize:    28;
  typography: {
    label:    TypeKey;
    sub:      TypeKey;
  };
  colors: {
    bg:       ColorRef;
    icon:     ColorRef;
    label:    ColorRef;
    border:   ColorRef;
  };
  states:      { pressed: { scale: 0.96 } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 18. MenasheSearchBar
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheSearchBarSpec {
  purpose:     "Full-width search input with icon prefix and optional clear";
  height:      48;
  paddingX:    SpacingKey;
  radius:      RadiusKey;
  typography:  TypeKey;
  colors: {
    bg:        ColorRef;
    placeholder: ColorRef;
    text:      ColorRef;
    icon:      ColorRef;
    focusBorder: ColorRef;
    border:    ColorRef;
  };
  iconSize:    18;
  clearButton: true;
  states:      { focused: { borderColor: ColorRef }; disabled: { opacity: 0.5 } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 19. MenasheFloatingButton
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheFloatingButtonSpec {
  purpose:     "Floating action button (FAB) — primary screen action";
  variants:    ["standard", "extended", "mini"];
  size:        { standard: 56; mini: 40 };
  radius:      "circle";
  elevation:   ShadowKey;
  iconSize:    { standard: 24; mini: 18 };
  colors: {
    bg:        ColorRef;
    icon:      ColorRef;
    label:     ColorRef;
  };
  states:      { pressed: { scale: 0.94; elevation: ShadowKey } };
  position:    { bottom: number; right: number };
}

// ═════════════════════════════════════════════════════════════════════════════
// 20. MenasheDialog
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheDialogSpec {
  purpose:     "Alert dialog / confirmation dialog with overlay backdrop";
  maxWidth:    360;
  radius:      RadiusKey;
  elevation:   ShadowKey;
  paddingX:    SpacingKey;
  paddingY:    SpacingKey;
  typography: {
    title:    TypeKey;
    body:     TypeKey;
    action:   TypeKey;
  };
  colors: {
    bg:       ColorRef;
    overlay:  ColorRef;
    title:    ColorRef;
    body:     ColorRef;
    divider:  ColorRef;
  };
  actionLayout: "horizontal (≤2 actions) | vertical (≥3 actions)";
  animation:    "fadeIn overlay + spring card";
  states:       { open: true; closing: true };
}

// ═════════════════════════════════════════════════════════════════════════════
// 21. MenasheBottomSheet
// ═════════════════════════════════════════════════════════════════════════════

export interface MenasheBottomSheetSpec {
  purpose:     "Draggable bottom sheet for contextual content / actions";
  radius:      { topLeft: RadiusKey; topRight: RadiusKey };
  elevation:   ShadowKey;
  paddingX:    SpacingKey;
  handle: {
    width:     40;
    height:    4;
    radius:    "pill";
    color:     ColorRef;
    marginTop: SpacingKey;
  };
  snapPoints:  "percentage or dp values, defined per usage";
  colors: {
    bg:        ColorRef;
    overlay:   ColorRef;
  };
  animation:   "spring entrance · accelerate exit";
  gesture:     "react-native-gesture-handler Pan gesture";
  states:      { collapsed: true; expanded: true; fullscreen: true; closing: true };
}

// ─── Component inventory ──────────────────────────────────────────────────────

export const COMPONENT_INVENTORY = [
  "MenasheButton",
  "MenasheCard",
  "MenasheSurface",
  "MenasheHeader",
  "MenasheSection",
  "MenasheChip",
  "MenasheBadge",
  "MenasheAvatar",
  "MenasheIconButton",
  "MenasheBottomTab",
  "MenasheCalendarCell",
  "MenasheListTile",
  "MenasheStatisticCard",
  "MenasheDateCard",
  "MenashePrayerCard",
  "MenasheParashaCard",
  "MenasheQuickToolCard",
  "MenasheSearchBar",
  "MenasheFloatingButton",
  "MenasheDialog",
  "MenasheBottomSheet",
] as const;

export type ComponentName = typeof COMPONENT_INVENTORY[number];
