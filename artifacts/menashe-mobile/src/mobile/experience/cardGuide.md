# cardGuide.md
### Menashe Experience Language — Phase 3: Card Language

---

The card is the fundamental unit of information display in Menashe Calendar.
All content is expressed through one of the ten official card families.
No screen invents a new card type without Chief Architect approval.

---

## Card Family Overview

| Family | Hierarchy Level | Typical Height | Columns |
|---|---|---|---|
| Hero Card | 1 | 220–280dp | Full-width |
| Countdown Card | 1 | 100–120dp | Full-width |
| Feature Card | 3 | 140–165dp | 2-col pair |
| Information Card | 2 | 80–120dp | 1 or 2-col |
| Learning Card | 2 | 100–140dp | Full-width |
| Statistic Card | 2–3 | 80–100dp | 2-col |
| Action Card | 2 | 52dp icon | 4–5-col grid |
| Preview Card | 3 | 160–200dp | 2-col |
| Gallery Card | 3 | 160–220dp | Horizontal scroll |
| Alert Card | 3 | 56–80dp | Full-width |

---

## 1. Hero Card

**Purpose:** The dominant content block. Anchors the screen's primary information.
One Hero Card per screen — never two.

**Maximum Height:** 280dp

**Padding:** 20dp horizontal, 18dp top, 0dp bottom (bottom reserved for the zmanim bar or CTA)

**Typography:**
- Overline / label: Caption (9–11dp), `fontWeight: 500`, muted color
- Primary headline: DisplayXL (36–44dp) or Heading1 (28–32dp), `fontWeight: 800`
- Sub-headline: Heading3 (18–20dp), `fontWeight: 600`
- Hebrew numeral: Body (15–16dp), `fontWeight: 600`, gold color

**Illustration rules:**
- Background: LinearGradient using theme-appropriate hero gradient colors
- Right-side artwork column (optional): warm golden gradient with thematic emoji / SVG
- No photographs in hero cards — gradients only in v1.0
- Decorative bird/landscape elements at ≤80px emoji size, opacity 0.6–0.75

**CTA placement:** None directly in hero. Hero is informational. CTA lives below.

**Animation style:** Entrance delay 0ms, duration 380ms, translateY 14dp → 0, opacity 0 → 1.

---

## 2. Countdown Card

**Purpose:** Displays time remaining until a time-critical Jewish event (Shabbat, Yom Tov, candle lighting).

**Maximum Height:** 120dp

**Padding:** 16dp all sides

**Typography:**
- Label: Overline (10–11dp), `fontWeight: 700`, gold color, letter-spacing 1.5
- Time display: DisplayXL (40–48dp) monospaced or `fontWeight: 800`
- Sub-label: Caption (11dp), muted

**Illustration rules:**
- No illustration. The countdown number is the illustration.
- Background: dark gradient (navy → deep indigo). Candle or flame emoji (optional) at right.
- Pulse animation permitted on the seconds digit when ≤ 30 minutes remain.

**CTA placement:** None. The card is informational.

**Animation style:** Entrance delay 40ms, duration 380ms. Timer updates every second with no animation (number swap only).

---

## 3. Feature Card

**Purpose:** Entry point to a major product feature. Always appears in a 2-column pair.
Current pair: Memorial Sanctuary + Rav Menashe AI.

**Maximum Height:** 165dp

**Padding:** 14dp all sides

**Typography:**
- Overline: 10–11dp, `fontWeight: 700`, accent color (gold for Sanctuary, indigo for AI)
- Description: 12dp, `fontWeight: 400`, muted color, `lineHeight: 18`
- CTA button: PillButton component, small variant

**Illustration rules:**
- Central artwork emoji at 38–42dp, centered horizontally
- Background: dark gradient unique to the feature's identity
  - Memorial: `["#2d1a0e", "#1a0f00", "#3d2410"]` (deep amber warmth)
  - AI: `["#060e1e", "#0c1830", "#0a1428"]` (deep night sapphire)
- No photography

**CTA placement:** Bottom of card, after description and artwork. PillButton full-width within card.

**Animation style:** Both cards in the pair share the same entrance group (a7). Delay 320ms, duration 380ms.

---

## 4. Information Card

**Purpose:** Displays structured Jewish calendar information — Parashah, Holiday, Daf, Announcement.
May be full-width or in a 2-column grid.

**Maximum Height:** 120dp (2-col), 100dp (full-width)

**Padding:** 14dp all sides

**Typography:**
- Overline label: 10dp, `fontWeight: 700`, muted
- Title: 15–16dp, `fontWeight: 700`, primary text
- Body: 12–13dp, `fontWeight: 400`, muted, `lineHeight: 18`

**Illustration rules:**
- Icon: Feather icon or themed emoji at 20–24dp. Top-left or top-right of card.
- Background: Surface color with subtle gradient or flat. Never a full bleed gradient.
- No photographs.

**CTA placement:** None embedded. Entire card is tappable → navigates to detail.

**Animation style:** Entrance at group delay (varies by screen position), 380ms.

---

## 5. Learning Card

**Purpose:** Presents a Torah insight, quote, or daily study text.
Encourages dwelling, not scanning.

**Maximum Height:** 140dp

**Padding:** 20dp horizontal, 16dp vertical

**Typography:**
- Quote / primary text: 17–19dp, `fontWeight: 600` or italic, primary text color
- Attribution: 12dp, muted, `fontWeight: 400`
- Optional Hebrew source: 15dp, right-aligned, gold

**Illustration rules:**
- No illustration. Typography is the illustration.
- Left border accent: 3dp solid, gold color
- Background: flat surface or very subtle parchment gradient

**CTA placement:** None. Card is read, not acted on. If tapping is meaningful → navigate.

**Animation style:** Entrance delay 200–260ms, 380ms duration.

---

## 6. Statistic Card

**Purpose:** Displays a community or personal number — yahrzeit count, member count, streak.

**Maximum Height:** 100dp

**Padding:** 16dp all sides

**Typography:**
- Number: DisplayXL (36–44dp), `fontWeight: 800`, primary or gold
- Label: Caption (11dp), `fontWeight: 500`, muted, below the number
- Subtext: Caption (10dp), even more muted

**Illustration rules:**
- Minimal. Icon above or beside number (Feather, 18dp, muted).
- Background: flat or subtle gradient surface.

**CTA placement:** None embedded. Entire card tappable if detail exists.

**Animation style:** Number enters with translateY only (no counter animation in v1.0).

---

## 7. Action Card

**Purpose:** Quick navigation shortcut. Appears in a horizontal row of 4–5.

**Maximum Height:** Icon 52dp, label 16dp below. Total visible height ~80dp.

**Padding:** Icon padding 14dp. Label: 4dp below icon.

**Typography:**
- Label: Caption (10–11dp), `fontWeight: 500`, centered below icon

**Illustration rules:**
- Icon: Feather icon at 22dp within a 52×52 circular/rounded container
- Container background: surface color with subtle elevation
- Active state: gold tint on icon + container

**CTA placement:** The entire item is the CTA.

**Animation style:** Grid entrance as a group, delay 160–200ms, 380ms duration.

---

## 8. Preview Card

**Purpose:** Thumbnail + caption for content that has a visual — gallery entry, event photo.

**Maximum Height:** 200dp

**Padding:** Image: none (edge-to-edge). Caption: 12dp below image.

**Typography:**
- Caption: 12dp, `fontWeight: 500`, primary

**Illustration rules:**
- Image fills the card from edge to edge (no horizontal margin on the image).
- Images must follow photographyGuide.md standards.
- Placeholder while loading: Skeleton at card dimensions.

**CTA placement:** Entire card is tappable → detail view.

**Animation style:** Fade-in only (no translateY) to avoid image jumping, delay 280ms.

---

## 9. Gallery Card

**Purpose:** Horizontal scroll of multiple Preview Cards — photo archive, community gallery.

**Maximum Height:** 220dp (container), 180dp (individual items within)

**Padding:** Container: 0dp horizontal (bleeds to edge). Items: 12dp gap, first item 16dp left margin.

**Typography:**
- Section title above: Overline (11dp), `fontWeight: 700`, muted

**Illustration rules:**
- Images follow photographyGuide.md.
- Horizontal snap scrolling. Show 2.2 items to signal scrollability.
- No pagination dots.

**CTA placement:** "See all" text link top-right of the section title.

**Animation style:** Container fades in, items are already loaded (no stagger within gallery).

---

## 10. Alert Card

**Purpose:** Non-disruptive in-screen banner for recoverable situations only —
system notice, subscription prompt, offline mode.

**Maximum Height:** 80dp

**Padding:** 16dp horizontal, 12dp vertical

**Typography:**
- Headline: 13–14dp, `fontWeight: 600`, primary
- Body: 12dp, `fontWeight: 400`, muted

**Illustration rules:**
- Icon: 18–20dp Feather icon, left-aligned. Gold for notice, red for error.
- Border: 1dp left border in accent color (gold / red).
- Background: surface with very low opacity accent tint.

**CTA placement:** Text link or small PillButton right-aligned or below body.

**Animation style:** Entrance from top (translateY -20 → 0), duration 250ms. Used for contextual alerts only.

---

## Rules That Apply to All Cards

1. **Never nest card families.** A Hero Card does not contain an Information Card.
2. **Radius is always `RD.lg` (16dp) or `RD.xl` (20dp) for outer cards.** Inner elements use `RD.md` or smaller.
3. **Shadow is always `shadow.level2` or `shadow.level3` for cards.** Never `level1` (invisible) or `modal` (too heavy).
4. **All card backgrounds come from the theme.** Never hardcode a background hex that isn't in `COLOR_TOKENS`.
5. **Gold (#d4a843 dark / #8b6914 light) is used once per card** — for the single highest-priority label or CTA. Not for decoration.
6. **Cards never clip content.** If text overflows, the card grows — it does not truncate without an explicit `numberOfLines` with ellipsis.
7. **All cards support Reduced Motion.** When `useReducedMotion()` is true, remove translateY from entrance — opacity fade only.
