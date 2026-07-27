# loadingGuide.md
### Menashe Experience Language — Phase 10: Loading Language

---

Loading states are never an afterthought. The user's first impression of a screen
is often the loading state — it must feel as considered as the content itself.

---

## Core Rule

**Never use inconsistent loading UI.**

The loading pattern used for any given content type is always the same across the app.
A skeleton on the home screen means a skeleton everywhere content of that type loads.
A spinner in the Torah tab means the same spinner everywhere inline content loads.

---

## 1. Skeleton (Initial Page Load)

**Use when:** A screen is loading its primary content for the first time in the session,
or after a cold start where no cached data is available.

**Anatomy:**
The skeleton mirrors the layout of the real content at the correct dimensions.
It does not show generic rectangles — it shows card-shaped, correctly-proportioned
outlines that match the real card family.

```
Hero Skeleton         → Full-width, ~260dp tall, warm gradient sheen
Quick Actions         → 5 × 52dp circular placeholders
Countdown Skeleton    → Full-width, ~110dp, center countdown placeholder
Card Skeleton (2-col) → Two side-by-side, ~120dp, correct border-radius
```

**Animation:** Shimmer — a warm gold/neutral gradient wipes left-to-right at 1.2s per cycle.
The shimmer color respects the active theme.

```
Light:    from #f0e6ce  to #e0d0b0  to #f0e6ce
Dark:     from #12191e  to #1e2a30  to #12191e
Sapphire: from #0a1020  to #141e30  to #0a1020
```

**Duration:** Show skeleton for a maximum of 8 seconds. If data has not arrived by then,
transition to the Error state.

**Transition:** When data arrives, skeletons fade out (opacity 1→0, 300ms) while real
cards fade in (opacity 0→1, 380ms) with their standard entrance translateY animation.

**Reduced Motion:** Skeleton shimmer is removed — static placeholder colors only.

---

## 2. Loading Indicator (Inline / Action Loading)

**Use when:** A specific action is in progress (submitting a form, loading next page of results,
processing a payment, saving a yahrzeit record).

**Component:** `ActivityIndicator` from React Native (native spinner).

```
color:  gold (#d4a843 dark / #8b6914 light)
size:   "small" for inline  |  "large" for full-screen
```

**Full-screen loading:** Only used when the entire screen content depends on a single async
result that cannot be skeletonised (rare). Center the spinner with the Menashe app icon above it.

**Inline loading:** Replaces a button label or appears beside a text label.
Button loading state: Replace button text with `ActivityIndicator` (small, fg color). Disable button.

---

## 3. Refreshing (Pull-to-Refresh)

**Use when:** The user pulls down on a ScrollView to manually refresh content.

**Component:** `RefreshControl` from React Native.

```
refreshing={isRefreshing}
tintColor={gold}                    // iOS spinner color
colors={[gold]}                     // Android spinner color
title="Updating..."                 // iOS only
titleColor={textMuted}
```

**Behaviour:**
- Spinner appears as the user pulls past the threshold.
- Content does not disappear — it remains visible while new data loads in the background.
- When new data arrives, content updates in place. No full re-render flash.
- On success: dismiss spinner + show Toast "Updated" for 1.5s.
- On failure: dismiss spinner + show Toast "Could not refresh. Pull to try again."

---

## 4. Offline

**Use when:** The device has no network connection and the requested data cannot be served from cache.

**Anatomy:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [Moon + cloud emoji: 🌙☁️]              │
│                                                     │
│         You're offline                              │
│         (Heading3, primary)                         │
│                                                     │
│         Some content is available from              │
│         your last visit.                            │
│         (Body, muted)                               │
│                                                     │
│              [Show Cached Content]                  │
│              (PillButton, gold)                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- The offline state does NOT replace the entire screen. It replaces only the section
  that requires network (e.g., AI response area). Cached Hebrew date data still shows in the hero.
- The service worker (progressive web: `public/sw.js`) serves cached shell content on web.
- On mobile: zmanim, Hebrew date, and parasha are always available offline (calculated client-side).
- Offline indicator: A small `OfflineBanner` (Alert Card variant, muted) appears at the top of the screen.

---

## 5. Retry

**Use when:** A network request has failed after a timeout or server error.

**Anatomy (inline, within a card):**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Could not load prayer times.                   │
│       [Try again]  (text link, gold)                │
└─────────────────────────────────────────────────────┘
```

**Anatomy (full-section):** Use the Error state from emptyStatesGuide.md with a primary action of "Try again."

**Behaviour:**
- "Try again" triggers the same request with exponential back-off (1s, 2s, 4s, max 3 retries).
- After 3 failed retries, the retry button is replaced with: "Still not working. Check your connection."
- If a retry succeeds, the error/retry UI fades out and content loads with the standard skeleton → content transition.

---

## 6. Progress

**Use when:** An action has a known or estimated duration — file upload, data sync, bulk import of yahrzeit records.

**Component:** A horizontal progress bar using `Animated.View` width interpolation, or a circular progress ring.

```
Bar:
  height: 4dp
  borderRadius: 2dp (pill)
  background: muted (10% opacity primary)
  fill: gold gradient
  width: animates from 0% → 100%

Label above bar:
  "Importing 14 of 47 records..."  (Caption, muted)
```

**Indeterminate progress** (when duration is unknown): Use the Loading Indicator (ActivityIndicator) instead. Do not use an indeterminate progress bar animation — it implies false precision.

**Completion:** Progress bar fills to 100%, holds for 300ms, then fades out. Success Toast appears.

---

## Never Do

| Pattern | Why |
|---|---|
| Raw white/grey rectangle as skeleton | Not themed — breaks immersion |
| Spinner for initial page loads | Skeleton gives layout context; spinner gives none |
| "Loading..." plain text with no indicator | Ambiguous — user doesn't know if something is happening |
| Loading state that covers interactive content | Blocks the user unnecessarily |
| Auto-dismiss offline state when connection restores without notifying user | Jarring |
| Error message that says "Error 503" | See errorGuide.md |
