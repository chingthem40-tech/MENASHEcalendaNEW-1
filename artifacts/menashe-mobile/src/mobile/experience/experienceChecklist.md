# experienceChecklist.md
### Menashe Experience Language — Per-Screen Verification Checklist

---

Every new screen and every updated screen must pass this checklist before it ships.
The checklist is signed off by the implementing engineer and reviewed by the Chief Architect.

Copy this checklist into your PR description and check each item.

---

## Section 1 — Information Hierarchy

- [ ] The screen has exactly **one Level 1 element** — the most important information, visually dominant.
- [ ] Level 1 content is **above the fold** on a 375×812dp screen (iPhone SE viewport).
- [ ] Level 2 content is visible **without scrolling on most devices** (≤ 810dp from top).
- [ ] Level 3 content is **discoverable** — it exists but does not compete with Level 1 or 2.
- [ ] The hierarchy assignment for each element matches [informationHierarchy.ts](./informationHierarchy.ts).

---

## Section 2 — Experience Principles

- [ ] The screen **opens calm** — no auto-playing media, no pulsing badges, no popovers on mount.
- [ ] All text is **legible before decoration** — contrast verified before adding gradients or overlays.
- [ ] There is adequate **breathing room** — no card feels cramped; 32dp between sections.
- [ ] Motion, if any, **guides attention** — each animation has a stated purpose.
- [ ] The screen uses **no new colors** outside MMDL `COLOR_TOKENS`.
- [ ] Gold is used **at most once per card** as an accent.
- [ ] The screen feels like **the same product** as Home, Calendar, and Torah.
- [ ] Hebrew heritage is expressed through **typography and palette** — not clip art or scattered symbols.

---

## Section 3 — Cards

- [ ] Every content block uses **one of the 10 official card families** from [cardGuide.md](./cardGuide.md).
- [ ] Card radius is `RD.lg` (16dp) or `RD.xl` (20dp) for outer containers.
- [ ] Card shadow is `shadow.level2` or `shadow.level3`.
- [ ] Internal card padding is **minimum 12dp** on all sides.
- [ ] No card clips its content. (`numberOfLines` + `ellipsizeMode` used where needed, card grows otherwise.)
- [ ] 2-column card pairs use `flex: 1` on each column for equal height.

---

## Section 4 — Motion

- [ ] All animation durations come from `DURATION` token (no ad-hoc millisecond values).
- [ ] All animation easings come from `EASE` token.
- [ ] Entrance animations stagger **top-to-bottom** matching content priority.
- [ ] Level 1 content enters **first** (delay 0–80ms). Level 3 content enters **last** (≥ 300ms).
- [ ] **No looping animations** other than the Memorial flame.
- [ ] All animations have a **Reduced Motion fallback** (opacity only, no translateY).
- [ ] `AccessibilityInfo.isReduceMotionEnabled()` is checked in all animated components.

---

## Section 5 — Typography

- [ ] Every text element maps to a **named scale** from [typographyGuide.md](./typographyGuide.md).
- [ ] **No hardcoded font sizes** outside the FONT_SIZE scale (no `fontSize: 22`, `fontSize: 31`, etc.).
- [ ] Reading text (`lineHeight` ≥ `fontSize × 1.4`).
- [ ] Hebrew text is `textAlign: "right"`, `writingDirection: "rtl"`.
- [ ] Hebrew text has `accessibilityLanguage="he"` and an English `accessibilityLabel`.
- [ ] Overline labels are **all-caps** and use gold or accent color only.
- [ ] **Only one gold typography element per card.**

---

## Section 6 — Spacing

- [ ] All spacing values come from the **SP scale** (multiples of 4dp).
- [ ] Horizontal screen margin: **16dp** (`LAYOUT_SPACE.screenPaddingX`).
- [ ] Gap between sections: **32dp** (`LAYOUT_SPACE.sectionGap`).
- [ ] Gap between cards within a section: **12dp** (`LAYOUT_SPACE.cardGap`).
- [ ] Bottom safe area inset respected (`useSafeAreaInsets().bottom + 16dp`).
- [ ] Top safe area inset never overlapped by content.
- [ ] **No magic numbers** (e.g., `margin: 7`, `padding: 11`, `gap: 5`).

---

## Section 7 — Illustration

- [ ] All illustrations use the **approved subject matter** from [illustrationGuide.md](./illustrationGuide.md).
- [ ] No **generic stock art** or clip art.
- [ ] Illustration occupies **≤ 30% of card visible area**.
- [ ] Illustration is always **behind text** in z-order.
- [ ] Emoji used at the **specified sizes** (38–42dp Feature Card, 80–90dp Hero artwork, 9–12dp decorative).
- [ ] Decorative emoji have **opacity 0.60–0.80**. Central artwork emoji: full opacity.

---

## Section 8 — Interaction

- [ ] All tappable elements have **visual press feedback** (scale 0.97 or opacity dip for Reduced Motion).
- [ ] Taps that trigger navigation use **Light haptic**.
- [ ] Destructive actions open a **Bottom Sheet for confirmation** — never execute directly.
- [ ] **No `Alert.alert()`** for non-critical errors.
- [ ] Error messages follow the **friendly, human, recovery-first** pattern from [errorGuide.md](./errorGuide.md).

---

## Section 9 — Loading States

- [ ] Initial load shows a **Skeleton** (not a spinner) that mirrors the real layout.
- [ ] Inline loading shows **ActivityIndicator** in gold.
- [ ] Offline state shows the **Offline UI** from [loadingGuide.md](./loadingGuide.md).
- [ ] Retry logic uses **exponential back-off** (max 3 retries: 1s, 2s, 4s).
- [ ] Skeleton shimmer uses **theme-appropriate warm colors**.

---

## Section 10 — Empty States

- [ ] Empty states contain all **5 required elements**: illustration, headline, description, primary action (optional), secondary action (optional).
- [ ] Headline is **3–6 words**, sentence case, does not start with "No" or "Error".
- [ ] Description is **1–2 sentences**, muted color, max 280dp width.
- [ ] Empty state occupies the **same vertical footprint** as the content it replaces.
- [ ] Empty states for this screen exist in the per-feature list in [emptyStatesGuide.md](./emptyStatesGuide.md) or are documented here with Chief Architect approval.

---

## Section 11 — Accessibility

- [ ] All interactive elements have a descriptive **`accessibilityLabel`**.
- [ ] All interactive elements have the correct **`accessibilityRole`**.
- [ ] Decorative elements have **`aria-hidden={true}`** or `importantForAccessibility="no-hide-descendants"`.
- [ ] All touch targets are **≥ 44×44dp** (use `hitSlop` where needed).
- [ ] Text contrast **≥ 4.5:1** verified for all text/background combinations.
- [ ] Screen tested with **VoiceOver (iOS)** — all elements reachable and labelled.
- [ ] Screen tested at **Dynamic Type "Accessibility Large"** — no text clipped.
- [ ] **Reduced Motion** tested — no translateY animations, no shimmer.
- [ ] Hebrew text has `accessibilityLanguage="he"` and English transliteration in `accessibilityLabel`.

---

## Section 12 — Code Quality

- [ ] **TypeScript passes** — `pnpm --filter @workspace/menashe-mobile exec tsc --noEmit` reports no new errors.
- [ ] **No hardcoded strings** — all user-visible text goes through `LanguageContext` (or has a translation key added).
- [ ] **Web app untouched** — no files in `artifacts/menashe-calendar` modified.
- [ ] **API server untouched** — no files in `artifacts/api-server` modified (unless this PR is explicitly a backend PR).
- [ ] **Shared core untouched** — no files in `lib/shared-core` modified (unless explicitly a shared-core PR).
- [ ] **No new `any` types** introduced in the modified files.
- [ ] **No console.log** statements left in production code.

---

## Sign-off

```
Screen:          _______________________________
Engineer:        _______________________________
Date:            _______________________________
MEL Version:     1.0
All items above: ✅ Checked
Chief Architect: _______________________________
```
