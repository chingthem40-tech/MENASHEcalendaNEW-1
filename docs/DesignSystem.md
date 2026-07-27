# Menashe Calendar — Design System

## Overview

The Menashe Calendar design system ensures a consistent visual language across the web app (React + Vite) and the mobile app (Expo / React Native). It is rooted in the sacred aesthetic of the Bnei Menashe community: deep navy/near-black backgrounds, warm amber gold accents, and soft Hebrew typography.

---

## Color Tokens

### Canonical Gold Palette

| Token | Value | Usage |
|---|---|---|
| `GOLD` | `#d4a843` | Primary brand gold — all general UI |
| `GOLD_DIM` | `#b8860b` | Gradient start, pressed states |
| `GOLD_BRIGHT` | `#f5d982` | Shimmer, highlights |
| `GOLD_SANCTUARY` | `#D4AF37` | Memorial Sanctuary 3D scene only |
| `GOLD_GRAD` | `135deg → #b8860b → #d4a843 → #f0c96a` | Button gradients, card accents |

> **Rule**: Do not introduce new gold hex values. Always use a token from this table. `#D4AF37` is reserved exclusively for the Memorial Sanctuary 3D UI to maintain its unique atmosphere.

### Semantic Tokens (Web)

Defined in `artifacts/menashe-calendar/src/lib/theme.ts`:

```ts
GOLD, GOLD_DIM, GOLD_BRIGHT, GOLD_GRAD, GOLD_SANCTUARY
DARK_CARD, BORDER_GOLD
SURFACE_0, SURFACE_1, SURFACE_2
```

### Theme Palettes (Mobile)

Defined in `artifacts/menashe-mobile/constants/colors.ts` under `dark`, `light`, and `sapphire` keys. The mobile always accesses colors via `useColors()` hook which reads the current theme from `AppContext`.

---

## Typography Scale

| Name | Web (px) | Mobile (dp) |
|---|---|---|
| `xs` | 9 | 10 |
| `sm` | 11 | 12 |
| `base` | 13 | 14 |
| `md` | 15 | 16 |
| `lg` | 17 | 18 |
| `xl` | 20 | 22 |
| `2xl` | 24 | 26 |
| `3xl` | 30 | 32 |

**Font families**:
- UI text: system sans-serif (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`)
- Hebrew text: `'Noto Serif Hebrew', serif`
- Monospace: system mono

---

## Spacing Scale

Both platforms use an 4px base grid. Exported as `SPACE` from their respective token files.

| Token | Value |
|---|---|
| `SPACE[1]` | 4px / 4dp |
| `SPACE[2]` | 8 |
| `SPACE[3]` | 12 |
| `SPACE[4]` | 16 |
| `SPACE[5]` | 20 |
| `SPACE[6]` | 24 |
| `SPACE[8]` | 32 |
| `SPACE[10]` | 40 |
| `SPACE[12]` | 48 |

---

## Border Radii

| Token | Value |
|---|---|
| `RADIUS.sm` | 8 |
| `RADIUS.md` | 12 |
| `RADIUS.lg` | 16 |
| `RADIUS.xl` | 20 |
| `RADIUS.full` | 9999 (pill) |

---

## Component Patterns

### Cards

Web cards use: `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(212,168,67,0.25)`, `border-radius: 20px`.

Mobile cards use: `backgroundColor: colors.card`, `borderColor: colors.border`, `borderRadius: colors.radius`.

### Interactive states

- Hover / press: `scale(1.02)` + border brightens to `rgba(212,168,67,0.5)`
- Active / selected: gold text `#d4a843`, gold dot indicator
- Disabled: `opacity: 0.38`

### Hebrew text

Always rendered with `fontFamily: "'Noto Serif Hebrew', serif"` and `direction: rtl`. Color is gold at `rgba(212,175,55,0.85)` inside dark contexts.

---

## Bilingual System

All visible UI strings must go through the translation system. See `artifacts/menashe-calendar/src/lib/translations.ts` for the `Translations` interface. Access via `useLanguage()` → `t.xxx`. Never hardcode English-only strings.

- New keys must be added to: interface, `en` object, and `tk` object
- TK (Thadou Kuki) translations can be reviewed by the community via the in-app Translation Editor

---

## Accessibility

- Minimum touch target: 44×44dp (mobile), 36×36px (web)
- Colour contrast: maintain ≥ 4.5:1 for body text, ≥ 3:1 for large/decorative text
- `role="button"` + `tabIndex={0}` + `onKeyDown` for web interactive divs
- `accessibilityLabel` on all icon-only mobile buttons
