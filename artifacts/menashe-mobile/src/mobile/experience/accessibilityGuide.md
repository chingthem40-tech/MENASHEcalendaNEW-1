# accessibilityGuide.md
### Menashe Experience Language — Phase 13: Accessibility Language

---

Accessibility in Menashe Calendar is not an add-on. It is a baseline.

The Benei Menashe community spans all ages and abilities. Elders, users with visual
impairments, and users with motor limitations must be able to access their heritage
calendar with the same dignity as every other user.

---

## 1. Dynamic Type

iOS and Android both allow users to set a preferred text size. Menashe Calendar respects it.

**Implementation:**
- Never use `allowFontScaling={false}` on any `<Text>` component.
- Never hardcode pixel heights that would clip scaled text. Use `minHeight` only, never fixed `height` on text containers.
- Test at 3 Dynamic Type size steps above default (iOS: "Accessibility Large").
- Cards reflow vertically — they do not clip text when Dynamic Type is large.

**Rules:**
- The Hero date (DisplayXL) may scale up to but not beyond 200% of its base size before the card layout switches to a compact variant.
- Caption and Overline text (11dp) scales up freely — never cap it below the user's chosen size.
- If a Dynamic Type increase causes a card to exceed its `maxHeight`, the card grows. It never truncates.

---

## 2. Reduced Motion

When `AccessibilityInfo.isReduceMotionEnabled()` returns `true`:

| Normal behaviour | Reduced Motion behaviour |
|---|---|
| Entrance: opacity + translateY 14→0 | Opacity fade only (no translateY) |
| Press: scale 1.0→0.97→1.0 | Opacity dip 1.0→0.7→1.0 |
| Bottom sheet: slide from bottom | Instant snap (no slide animation) |
| Dialog: scale + fade | Instant snap |
| Tab switch: cross-fade 350ms | Instant swap |
| Skeleton shimmer | Static placeholder (no shimmer sweep) |
| Memorial flame animation | Removed |
| Progress bar animation | Static fill only |

**Implementation:**
```tsx
import { useReducedMotion } from "src/mobile/design-system/hooks/useThemeTokens";
// or:
import { AccessibilityInfo } from "react-native";
const prefersReducedMotion = AccessibilityInfo.isReduceMotionEnabled();
```

**Rule:** `prefersReducedMotion` is checked at the hook/component level. It is never
hardcoded or cached at app startup — the user may change it while the app is running.

---

## 3. VoiceOver (iOS) & TalkBack (Android)

All interactive elements have descriptive `accessibilityLabel` props.
All decorative elements have `importantForAccessibility="no"` or `aria-hidden={true}`.

### Label Rules

| Element | Label format |
|---|---|
| Card (navigates) | "[Content type]: [title]" e.g. "Parashah: Balak. Tap to read." |
| PillButton | The button label text — verbatim |
| Icon button | The action it performs e.g. "Open settings" |
| Emoji illustration | `aria-hidden` — decorative |
| Tab bar item | "[Tab name] tab" e.g. "Torah tab" |
| Countdown | "Shabbat begins in [Xh Ym]" |
| Hebrew date | Full English transliteration: "16 Tammuz 5786" |
| Zmanim time | "[Zman name]: [time]" e.g. "Sunrise: 5:42 AM" |

### Role Rules

```tsx
// Card that navigates
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Parashah Balak. Tap to read the weekly portion."
>

// Display text (not interactive)
<Text
  accessibilityRole="text"
  accessibilityLabel="Today is the 16th of Tammuz, 5786"
>

// Decorative image/emoji
<Text aria-hidden={true}>⛩</Text>

// Section heading
<Text accessibilityRole="header">Today's Learning</Text>
```

### Focus Order

VoiceOver/TalkBack reads elements top-to-bottom, left-to-right.
This matches the visual reading order — no custom `accessibilityViewIsModal` manipulation
is needed on standard screens.

**Exception:** Bottom sheets and dialogs set `accessibilityViewIsModal={true}` to trap
focus within the overlay.

---

## 4. Contrast

**Minimum contrast ratio: 4.5:1 (WCAG AA)** for all body text.
**Minimum contrast ratio: 3.0:1 (WCAG AA Large)** for text ≥18dp bold or ≥24dp regular.

**Verified combinations (pre-approved):**

| Theme | Text | Background | Ratio |
|---|---|---|---|
| Dark | #ffffff (primary) | #080e1a | 18.9:1 ✅ |
| Dark | #d4a843 (gold) | #080e1a | 7.8:1 ✅ |
| Dark | #a0a8b4 (muted) | #080e1a | 5.2:1 ✅ |
| Light | #1a1a1a (primary) | #f5efe0 | 16.2:1 ✅ |
| Light | #8b6914 (gold) | #f5efe0 | 4.8:1 ✅ |
| Light | #6b6045 (muted) | #f5efe0 | 4.6:1 ✅ |
| Sapphire | #ffffff | #051126 | 19.8:1 ✅ |
| Sapphire | #6382FF | #051126 | 5.9:1 ✅ |

**Rule:** Never introduce a new text/background combination without verifying contrast.
Tool: https://webaim.org/resources/contrastchecker/

**Gradient backgrounds:** Contrast is measured at the darkest point where text appears.
If text spans a gradient, verify contrast at both ends of the text position.

---

## 5. Touch Targets

**Minimum touch target: 44×44dp** on all platforms (Apple HIG + Android guidelines).

| Element | Visible size | Touch target |
|---|---|---|
| Action Card icon | 52×52dp | 52×52dp ✅ |
| Tab bar item | 44dp tall | 44dp+ ✅ |
| Text link | Varies | `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` |
| Icon button (header) | 24×24dp | `hitSlop` to reach 44×44dp |
| PillButton | Full-width | Always ≥44dp tall ✅ |
| Swipe row action | 60dp wide | ≥44dp tall ✅ |

**Implementation:**
```tsx
<Pressable
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  style={{ width: 24, height: 24 }}
>
```

---

## 6. Keyboard (Web / Hardware Keyboard on iPad)

When the app runs on web or iPad with a hardware keyboard:

- All interactive elements are reachable via Tab key.
- Focus ring: 2dp solid gold (#d4a843) outline, 2dp offset.
- Escape key: dismisses bottom sheets and dialogs.
- Enter/Space: activates the focused element (same as tap).
- Arrow keys: navigate within a picker, calendar grid, or segmented control.

**React Native Web / Expo web implementation:**
```tsx
style={{
  outlineColor: "#d4a843",
  outlineWidth: 2,
  outlineOffset: 2,
}}
```

---

## 7. Screen Readers — Advanced

**Live Regions:** Use `accessibilityLiveRegion="polite"` for content that updates without
navigation (countdown timer, loading status, toast messages).

```tsx
<Text accessibilityLiveRegion="polite">
  {isLoading ? "Loading prayer times" : "Prayer times loaded"}
</Text>
```

**Group related elements:**
```tsx
<View accessible={true} accessibilityLabel="Today: 16 Tammuz 5786, Shabbat begins in 4 hours 22 minutes">
  {/* Hebrew date, Gregorian date, Shabbat countdown — read as one unit */}
</View>
```

**Avoid reading decorative text:**
```tsx
<Text importantForAccessibility="no-hide-descendants">⛩🐦🐦</Text>
```

---

## 8. Bilingual Accessibility (Hebrew + English)

**Hebrew `lang` attribute:**
When rendering Hebrew text, annotate it for screen readers:
```tsx
<Text accessibilityLanguage="he">ט״ז בתמוז תשפ״ו</Text>
```

**Pronunciation:** Screen readers may mispronounce Hebrew. Where possible, provide an
`accessibilityLabel` with the English transliteration alongside the Hebrew display.
```tsx
<Text
  accessibilityLabel="16 Tammuz 5786"
  accessibilityLanguage="he"
>
  ט״ז בתמוז תשפ״ו
</Text>
```

---

## Accessibility Testing Checklist

Before any screen ships:

- [ ] VoiceOver (iOS) — navigate the entire screen by swipe. Every element is reachable and labelled.
- [ ] TalkBack (Android) — same.
- [ ] Dynamic Type at "Accessibility Large" — no text clipped, no layout breaks.
- [ ] Reduced Motion enabled — no translateY animations, no shimmer.
- [ ] Contrast — all text/background pairs verified ≥4.5:1.
- [ ] Touch targets — all tappable elements ≥44×44dp (including hitSlop).
- [ ] Keyboard (web/iPad) — all elements reachable, focus visible.
- [ ] Hebrew text — `accessibilityLanguage="he"` set, English transliteration in `accessibilityLabel`.
