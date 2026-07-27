# typographyGuide.md
### Menashe Experience Language — Phase 7: Typography Usage Rules

---

Typography in Menashe Calendar is never guessed. Every text element maps to a
defined scale and role. The rules below are binding.

---

## Token Reference

All values come from `src/mobile/design-system/tokens/typography.ts`.

```
FONT_SIZE
  2xs    9dp    ← Legal, footnote, smallest badge label
  xs    11dp    ← Caption, Overline
  sm    13dp    ← BodySmall
  base  15dp    ← Body (default reading size)
  md    17dp    ← BodyLarge, subheading
  lg    20dp    ← Heading3
  xl    24dp    ← Heading2
  2xl   28dp    ← Heading1
  3xl   34dp    ← DisplaySM
  4xl   40dp    ← DisplayMD
  5xl   46dp    ← DisplayLG
  6xl   52dp    ← DisplayXL (Hebrew date in hero only)

FONT (weight names)
  thin       100
  regular    400
  medium     500
  semiBold   600
  bold       700
  extraBold  800

FONT_TRACKING (letter spacing)
  caps    2.0dp   ← Overline / all-caps labels only
```

---

## Scale Assignments

### DisplayXL (52dp, extraBold)
**Use:** The primary Hebrew date in the Hero Card. Nothing else.
**Never use for:** Section titles, card headlines, body content.
**Reasoning:** This is the highest-weight visual element on any screen. It must belong to
the most sacred piece of data — today's Hebrew date.

---

### DisplayLG – DisplayMD – DisplaySM (46–34dp, extraBold)
**Use:** Large countdown numbers (Shabbat countdown timer). Large statistics in Statistic Cards.
**Never use for:** Running text, section headers, card titles.
**Reasoning:** These sizes are for numbers that the user needs to read instantly from a distance.

---

### Heading1 (28dp, bold / extraBold)
**Use:** Screen-level page title (e.g., "Torah", "Community" in the LargeHeader).
**Never use for:** Card-level content.

---

### Heading2 (24dp, bold)
**Use:** The primary headline within an Information Card or Learning Card when that
card is full-width and the information is Level 2.
**Never use for:** Two-column card grids (text is too large for the reduced column width).

---

### Heading3 (20dp, semiBold)
**Use:** Sub-headline within the Hero Card (greeting, secondary date). Section titles
above card groups ("This Week", "Daily Prayers").
**Never use for:** Body text, captions, card labels.

---

### BodyLarge (17dp, medium or semiBold)
**Use:** The primary text inside Information Cards and Learning Cards. Torah insight
quotes (paired with `fontStyle: "italic"`).
**Never use for:** Card labels, actions.

---

### Body (15dp, regular or medium)
**Use:** Default reading text. Description paragraphs in Feature Cards. Hebrew numeral
date in Hero (15dp, semiBold, gold color).
**Never use for:** Labels, overlines.

---

### BodySmall (13dp, regular)
**Use:** Secondary body text. Sub-descriptions below card headlines. The text inside
Action Cards that appears below the icon.
**Never use for:** Captions.

---

### Caption (11dp, regular or medium)
**Use:** Timestamps, sub-labels, secondary meta-information. Zmanim time values.
Feature Card descriptions (12dp, which is between sm and base — use 12dp exactly here).
**Never use for:** Interactive labels (too small for tap targets).

---

### Overline (11dp, bold, letter-spacing 1.5–2.0)
**Use:** Section-level category labels above cards ("MEMORIAL SANCTUARY", "RAV MENASHE AI",
"TODAY'S PARASHA"). Always all-caps. Always in gold or accent color.
**Never use for:** Body text, interactive labels, running text.

---

### Legal / Footnote (9dp)
**Use:** App version numbers, legal disclosures, attribution footnotes.
**Frequency:** Rare. Settings screen only.

---

## Hebrew Typography Hierarchy

Hebrew and English text coexist throughout the app. The following rules govern their relationship.

### Hebrew Date Hierarchy (Home Hero)
```
Level 1 — Gregorian date:      Caption (11dp), muted, LEFT-aligned
Level 1 — Greeting:            Heading3 (20dp), gold accent, LEFT-aligned
Level 1 — Hebrew date (EN):    DisplayXL (52dp) or Heading1 (30dp), extraBold, LEFT-aligned
Level 1 — Hebrew date (HEB):   Body (15dp), semiBold, gold, LEFT-aligned
```

### Hebrew Text Alignment
- Hebrew text is **always** `textAlign: "right"` and `writingDirection: "rtl"`.
- If a single text element contains both Hebrew and English, use `I18nManager` and
  BiDi rules. Do not manually reverse strings.
- Hebrew date strings (from `formatHebrewDateHebrew`) are **never** left-aligned —
  even when adjacent to left-aligned English text, the Hebrew string itself is RTL.

### Hebrew Date in Calendar Grid
- Hebrew day number: Caption (11dp), medium weight, top-right of each cell
- Hebrew month label (column header): BodySmall (13dp), muted

### Hebrew Scripture Quotes
- Body (15dp) or BodyLarge (17dp), `fontStyle: "italic"`, primary text color
- Source attribution: Caption (11dp), muted, right-aligned

---

## English Typography Hierarchy

### Screen-level heading (tab name, large header)
Heading1 (28dp), bold, primary text color.

### Section title (above a card group)
Heading3 (20dp) or BodyLarge (17dp) semiBold, primary text color. Overline in gold
above it (optional).

### Card headline
Heading2 (24dp, full-width cards) or Heading3 (20dp, 2-col cards), bold.

### Card body text
Body (15dp) or BodySmall (13dp), regular, muted color.

### CTA / Button label
Body (15dp), semiBold, button foreground color.

### Tab bar labels
Caption (11dp), medium. Active: gold. Inactive: muted.

---

## Rules That Apply to All Typography

1. **Never hardcode a font size.** Always use `FONT_SIZE.*` or the equivalent dp value
   that maps to the scale above. No ad-hoc sizes (e.g., 22, 31, 38).
2. **Line height is always ≥ 1.4× the font size for reading text.** Body at 15dp → `lineHeight: 22` minimum.
3. **Letter spacing for running text is 0.** Only Overline uses positive tracking.
4. **Never mix `fontFamily` outside the approved system font.** The app uses the system
   font (San Francisco on iOS, Roboto on Android). Custom Hebrew fonts may be added in v2.0
   only after cultural review.
5. **Gold typography is used once per card.** The Overline label or the Hebrew numeral —
   not both — carries the gold color within a single card.
6. **All-caps is only used for Overline.** All other text is sentence-case or title-case.
7. **Text never clips.** Use `numberOfLines` with `ellipsizeMode="tail"` on titles that
   may overflow, and ensure the card grows if the content is expandable.
