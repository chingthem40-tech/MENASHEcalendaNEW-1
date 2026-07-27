# motionGuide.md
### Menashe Experience Language — Phase 4: Motion Language

---

> Motion should never distract. It should guide.

Every animation in Menashe Calendar has a written purpose. If you cannot state
what information your animation communicates, remove it.

---

## Token Reference

All durations and easings come from `src/mobile/theme/animation.ts`.
Never hardcode milliseconds or cubic-bezier values outside these tokens.

```
DURATION
  instant   0ms    ← State swaps that should feel immediate
  fastest   80ms   ← Micro-feedback (ripple, icon state)
  fast      150ms  ← Press response, toggle, chip select
  normal    250ms  ← Collapse / expand, tab indicator
  slow      350ms  ← Navigation transitions, bottom sheet
  slower    500ms  ← Hero entrance, large modal
  slowest   800ms  ← Reserved. Full-screen reveals only.

EASE
  standard     cubic-bezier(0.4, 0.0, 0.2, 1)  ← Default for most motion
  accelerate   cubic-bezier(0.4, 0.0, 1.0, 1)  ← Exit / dismiss
  decelerate   cubic-bezier(0.0, 0.0, 0.2, 1)  ← Entrance / arrive
  elastic      spring tension 1.2               ← Playful confirmation only
  linear       linear                           ← Loader, progress bar only
```

---

## Motion Patterns

### 1. Entrance

Cards and content enter when a screen first loads or after a navigation event.

**Mechanism:** `Animated.timing` — `opacity: 0→1`, `translateY: 14→0`

**Stagger:** Each card group enters 80ms after the previous.

```
Delay schedule (home screen example):
  Hero Card          0ms
  Quick Actions    100ms
  Shabbat          160ms
  Today's Focus    200ms
  Parasha / Cards  240ms
  Memorial / AI    320ms
  Premium          400ms
```

**Duration:** 380ms per element

**Easing:** `decelerate` — content decelerates as it arrives, like setting something down gently.

**Reduced Motion:** Remove `translateY`. Retain `opacity` fade only (duration 250ms).

---

### 2. Exit

Content exits when dismissed by the user or when the screen unmounts.

**Mechanism:** `Animated.timing` — `opacity: 1→0`, `translateY: 0→-8`

**Duration:** 200ms

**Easing:** `accelerate` — exits fast. The user initiated it; don't make them wait.

**Rule:** Exit animations are only added when the disappearance would be jarring without one (e.g., a card being removed from a list). Navigation exits are handled by the navigator — do not duplicate.

---

### 3. Press

Confirms that a tap was registered. Applied to all tappable cards and buttons.

**Mechanism:** `Animated.spring` or `Pressable` `onPressIn` / `onPressOut`

```
onPressIn:   scale → 0.97, duration 80ms
onPressOut:  scale → 1.00, duration 150ms
```

**Easing:** `elastic` for spring, or `fast` timing.

**Rule:** Press scale is always 0.97. Never 0.90 (too dramatic) or 0.99 (invisible).

**Reduced Motion:** Remove scale. Apply opacity: 1→0.7→1 instead.

---

### 4. Scroll

Scrolling is native. It is never intercepted by application code.

**Rules:**
- Never lock scroll position during content loading.
- Never auto-scroll the user without a visible trigger and user intent.
- ScrollView `bounces` is `true` on iOS (default). Never disable it.
- Sticky headers are permitted only for navigation / tab bar headers, not for content.
- `onScroll` events may update the header collapse state only. No other side effects.

---

### 5. Collapse / Expand

Used for accordion sections, collapsible headers, and expandable cards.

**Mechanism:** `Animated.timing` on `maxHeight` + `opacity`

**Duration:** 250ms (`normal`)

**Easing:** `standard`

**Rule:** Collapsed height is always 0 (fully hidden). Never partially collapsed.
The chevron icon rotates 0→180° (collapse) or 180→0° (expand) in sync.

---

### 6. Expand (detail reveal)

When tapping a card reveals additional content inline (not navigating away).

**Duration:** 300ms

**Easing:** `decelerate` (content arrives gently)

**Rule:** Expanding a card pushes content below it downward — never overlaps.

---

### 7. Bottom Sheet

**Mechanism:** Native bottom sheet or `react-native-reanimated` `useSharedValue`

**Enter:** Slide from `y: screenHeight → 0`, duration 350ms (`slow`), easing `decelerate`

**Exit:** Slide to `y: screenHeight`, duration 250ms (`normal`), easing `accelerate`

**Backdrop:** `opacity: 0 → 0.5`, duration 300ms. Tap backdrop → triggers exit.

**Rule:** Bottom sheets are used for:
1. Confirmations of destructive actions
2. Filter / sort panels
3. Date pickers
4. Additional options (long-press context)

Never use a bottom sheet for primary navigation.

---

### 8. Dialog

**Mechanism:** Scale + fade

**Enter:** `scale: 0.92→1.0`, `opacity: 0→1`, duration 300ms, easing `decelerate`

**Exit:** `scale: 1.0→0.92`, `opacity: 1→0`, duration 200ms, easing `accelerate`

**Rule:** Dialogs (system-level modals) are used only for:
1. Error states that require explicit acknowledgement
2. Permission explanations before system permission requests
3. Critical information that blocks workflow

Never use a dialog for:
- Confirmations (use Bottom Sheet)
- Information (use Alert Card or Toast)
- Navigation

---

### 9. Hero Entrance

The Hero Card has its own entrance rhythm — slower and more deliberate than other cards.

**Mechanism:** `opacity: 0→1`, `translateY: 20→0`

**Duration:** 500ms (`slower`)

**Easing:** `decelerate`

**Stagger:** The hero text content may stagger internally:
- Greeting: 0ms
- Hebrew date: 60ms
- Hebrew numeral: 100ms
- Zmanim bar: 150ms

**Rule:** The hero may only animate once per screen mount. Not on scroll. Not on data refresh.

---

### 10. Navigation Transitions

Handled by Expo Router / React Navigation. Application code does not add custom navigation animations.

**Tab switch:** Fade + scale, duration 350ms. Managed by `ShellNavigation.tsx`.

**Stack push:** Slide from right, duration 350ms. Standard iOS/Android native behaviour.

**Stack pop:** Slide to right, duration 250ms.

**Rule:** Never intercept or override navigator transition animations.

---

## Motion Philosophy Summary

| Principle | Rule |
|---|---|
| Purpose first | No animation without a stated communicative purpose |
| Speed matches intent | User-initiated exits are fast. System-initiated entrances are gentle. |
| Hierarchy through timing | Level 1 content enters first. Always. |
| Reduced Motion | Every animation must have a static fallback |
| No loops | No looping animations except the Memorial flame (single cycle) |
| No physics for navigation | Spring/elastic only for feedback, never for navigation |

---

## Reduced Motion Reference

When `AccessibilityInfo.isReduceMotionEnabled()` returns `true`:

| Normal | Reduced Motion |
|---|---|
| translateY + opacity | opacity only |
| scale press (0.97) | opacity dip (0.7) |
| Bottom sheet slide | Instant snap |
| Dialog scale | Instant snap |
| Tab cross-fade | Instant swap |
| Hero stagger | Single fade-in, no stagger |
