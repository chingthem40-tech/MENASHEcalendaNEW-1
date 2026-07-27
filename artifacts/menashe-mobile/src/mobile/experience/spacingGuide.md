# spacingGuide.md
### Menashe Experience Language — Phase 8: Spacing Language

---

Spacing in Menashe Calendar is not arbitrary. It is a language of rhythm and
breathing room. Every gap communicates a relationship between elements.

---

## Token Reference

All values come from `src/mobile/design-system/tokens/spacing.ts`.

```
SP scale (multiples of 4dp base unit)
  SP[0]    0dp
  SP[0.5]  2dp
  SP[1]    4dp
  SP[1.5]  6dp
  SP[2]    8dp
  SP[2.5] 10dp
  SP[3]   12dp
  SP[3.5] 14dp
  SP[4]   16dp
  SP[5]   20dp
  SP[6]   24dp
  SP[7]   28dp
  SP[8]   32dp
  SP[9]   36dp
  SP[10]  40dp
  SP[11]  44dp
  SP[12]  48dp
  SP[14]  56dp
  SP[16]  64dp
  SP[20]  80dp
  SP[24]  96dp
  SP[32] 128dp

LAYOUT_SPACE aliases
  screenPaddingX    16dp   ← Horizontal margin from screen edge to content
  sectionGap        32dp   ← Vertical gap between distinct content sections
  cardGap           12dp   ← Vertical gap between cards within a section
```

---

## Screen Margins

**Horizontal screen padding: 16dp** (`LAYOUT_SPACE.screenPaddingX`)

All ScrollView content is padded 16dp from the left and right edges.
This value is used in `app/(tabs)/index.tsx` as `HX = 16`.

```
┌─────────────────────────────────────┐
│ 16dp │   content area   │ 16dp      │
└─────────────────────────────────────┘
```

**Exception:** Cards that intentionally bleed to the screen edge (full-bleed hero,
gallery) use `marginHorizontal: 0` and handle their own inner padding.

**Safe Area:** The top safe area inset is never overlapped by content.
`SafeAreaLayout` or `useSafeAreaInsets()` is used on every screen.
Bottom safe area: Add `paddingBottom: insets.bottom + 16dp` to ScrollView content.

---

## Section Gaps

**Between distinct content sections: 32dp** (`LAYOUT_SPACE.sectionGap`)

A "section" is a meaningful group of related cards (e.g., the Quick Actions group,
the Parashah / Daf grid, the Feature Card pair). The 32dp gap signals a topic change.

**Within a section (between cards): 12dp** (`LAYOUT_SPACE.cardGap`)

Cards in the same thematic group are separated by 12dp. This signals they are related.

```
[Hero Card]
↕ 14dp    ← Hero has its own marginBottom (slightly tighter)
[Quick Actions]
↕ 32dp    ← Section gap — new topic
[Shabbat Countdown]
↕ 12dp    ← Same section
[Today's Focus]
↕ 32dp    ← Section gap — new topic
[Parasha / Daf grid]
↕ 32dp    ← Section gap
[Memorial / AI pair]
↕ 32dp    ← Section gap
[Premium Banner]
```

---

## Card Padding

All cards use consistent internal padding derived from the SP scale.

| Card Family | Padding |
|---|---|
| Hero Card | 20dp horizontal, 18dp top |
| Countdown Card | 16dp all sides |
| Feature Card | 14dp all sides |
| Information Card (full-width) | 16dp all sides |
| Information Card (2-col) | 14dp all sides |
| Learning Card | 20dp horizontal, 16dp vertical |
| Statistic Card | 16dp all sides |
| Action Card | 14dp icon container padding |
| Alert Card | 16dp horizontal, 12dp vertical |

**Minimum card padding: 12dp.** No card may have less than 12dp of internal padding
on any side. Below this threshold, content feels cramped and premium quality is lost.

---

## Card Rhythm

Within the home screen ScrollView, the vertical rhythm follows this pattern:

```
paddingTop: 8dp   (below header)
Hero:       marginBottom 14dp    ← Slightly tighter — hero is part of the opening
Actions:    marginBottom 14dp
Countdown:  marginBottom 14dp
Today/Para: marginBottom 32dp   ← Section gap here
Feature:    marginBottom 14dp
Premium:    marginBottom 32dp   ← Final section gap before bottom safe area
paddingBottom: safeAreaBottom + 16dp
```

The rhythm is **not perfectly uniform**. Hero and closely-related cards are marginally
tighter (14dp) to feel cohesive. Section breaks are always 32dp.

---

## Reading Rhythm

For text-heavy cards (Learning Cards, long descriptions), line height enforces reading rhythm:

```
Body (15dp)       → lineHeight: 22dp  (ratio 1.47)
BodySmall (13dp)  → lineHeight: 20dp  (ratio 1.54)
Caption (11dp)    → lineHeight: 16dp  (ratio 1.45)
Heading3 (20dp)   → lineHeight: 28dp  (ratio 1.40)
```

**Paragraph spacing:** When two paragraphs appear in sequence (rare in cards),
add `marginBottom: 8dp` between them.

---

## Two-Column Grid Gaps

Used for Information Cards, Feature Cards, and Quick Actions grids.

```
Column gap:   10dp   (LAYOUT_SPACE.cardGap - 2dp)
Row gap:      10dp
```

Two-column cards use `flex: 1` on each column within a `flexDirection: "row"` wrapper
that itself has `marginHorizontal: 16dp` and `gap: 10dp`.

---

## Icon Spacing

Action Card icons: 52×52dp container with 14dp padding around the icon.
Feature Card emojis: 38–42dp, centered horizontally with 8dp vertical margin above and below.
Header icons: 24×24dp tappable area with 8dp outer padding.

**Minimum icon touch target: 44×44dp** (see accessibilityGuide.md).

---

## Breathing Room Rule

If a card looks "full" — if you feel the urge to see more content — add space, not content.

When content is absent (empty state), the layout does not collapse.
Empty state components maintain the same vertical footprint as the content they replace.
This prevents the screen from jumping and signals that this space is intentional.

---

## Forbidden Spacing

| Pattern | Why |
|---|---|
| `margin: 7` | Not on the SP scale. Use 8 (SP[2]) instead. |
| `padding: 11` | Not on the SP scale. Use 12 (SP[3]) instead. |
| `gap: 5` | Not on the SP scale. Use 4 (SP[1]) or 6 (SP[1.5]). |
| `marginTop: 3` | Too small to be meaningful. Use 0 or 4. |
| Negative margins | Only used internally in the design system for overlap effects. Never in screen layouts. |
| `flex: 0.3` | Only `flex: 1` or `flex: 2` in two-column layouts. No fractional flex ratios. |
