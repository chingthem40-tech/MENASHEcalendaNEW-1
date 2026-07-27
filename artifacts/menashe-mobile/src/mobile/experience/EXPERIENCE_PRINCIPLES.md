# EXPERIENCE_PRINCIPLES.md
### Menashe Experience Language — Phase 1: Philosophy

---

These ten principles govern every experience decision in Menashe Calendar.
They are not suggestions. They are the constitution.

When two design choices are in conflict, these principles resolve it.

---

## Principle 1 — Calm Before Excitement

The application opens calm. It does not announce itself.
The first thing a user feels is stillness — the calendar is already working,
the date is already known, the day has already been interpreted.

**In practice:**
- Hero cards fade in gently. They do not slam into view.
- No autoplay video, no pulsing badges on first load.
- Push notifications are earned by the user — never demanded on first open.
- Shabbat and Yom Tov contexts suppress all non-essential UI motion.

**Why:** Menashe Calendar users open the app in moments of intention — morning prayer, Shabbat preparation, yahrzeit remembrance. They deserve to be met with peace.

---

## Principle 2 — Reading Before Decoration

Information is always legible before it is beautiful.

Typography is set first. Contrast is validated first.
Only after readability is guaranteed may visual decoration be added.

**In practice:**
- Text contrast ratio ≥ 4.5:1 (WCAG AA) on every background.
- Gradient overlays never reduce text legibility below 4.5:1.
- Illustration and artwork are always behind text — never in front of it.
- Drop shadows on text are only permitted on photograph backgrounds.

**Why:** The calendar carries sacred dates, prayer times, and yahrzeit names. A user misreading a zman time or a name because of poor contrast is an inexcusable failure.

---

## Principle 3 — White Space Is a Feature

Empty space is not emptiness. It is the pause between notes that makes music.

Screens are never filled. Cards breathe. Sections are separated by meaningful gaps.
The user's eye is never fatigued.

**In practice:**
- Section gaps: 32dp minimum between distinct content areas.
- Card padding: 16dp minimum on all sides.
- No card should feel "full" — always leave 20% visual breathing room.
- When content is missing, an empty state is shown — the layout does not collapse inward.

**Why:** Visual density signals low quality and creates cognitive load. A calm, spaced layout signals trust, premium quality, and respect for the user's attention.

---

## Principle 4 — Motion Guides Attention

Animation exists to direct the user's eye, not to impress them.

Motion that does not communicate information is noise.
The user should never watch an animation and think "that was cool."
They should simply arrive at the right place.

**In practice:**
- Entrance animations stagger cards top-to-bottom to signal reading direction.
- The Hero card enters first (highest priority). Secondary cards follow.
- Press animations (scale 0.97) confirm that the tap was registered.
- No looping decorative animations except the Sanctuary's gentle flame.

**Why:** Gratuitous animation trains users to ignore motion, defeating its only purpose.

---

## Principle 5 — Information Has Hierarchy

Not all information is equal. The user's attention is not infinite.

Level 1 information is seen without searching.
Level 2 information rewards a moment of attention.
Level 3 information is discoverable when needed.

See [informationHierarchy.ts](./informationHierarchy.ts) for the typed constants.

**In practice:**
- The Hebrew date is Level 1. It is the first thing the eye lands on.
- Prayer times (zmanim) are Level 1 — displayed prominently in the hero bar.
- Community and AI features are Level 3 — present but not competing for immediate attention.

**Why:** Menashe Calendar carries dense Jewish calendar data. Without hierarchy, it becomes a wall of text. Hierarchy transforms it into a personal guide.

---

## Principle 6 — Every Animation Has Purpose

No animation is added without a written reason.

Before any motion is implemented, answer:
1. What user action triggers this?
2. What information does this motion communicate?
3. Would removing this animation break the user's understanding?

If the answer to #3 is "no" — the animation does not belong.

**In practice:**
- Staggered entrance: communicates content loading in priority order.
- Press scale: confirms tap registration.
- Bottom sheet slide: communicates panel origin (from below).
- Tab transition: communicates spatial position in the app.

**Why:** Purpose-built motion creates a coherent, trustworthy feel. Arbitrary motion feels cheap, inconsistent, and draining on battery.

---

## Principle 7 — Premium Through Simplicity

The Menashe Calendar is a premium Jewish calendar application.
Its premium nature is expressed through what is removed, not what is added.

**In practice:**
- One typeface family. No font mixing outside the Hebrew/English pairing.
- Three themes (Light, Dark, Sapphire). No custom theme invention per screen.
- Gold (#d4a843 / #8b6914) is used sparingly — for the highest-priority signal per screen only.
- No badges, tooltips, or modal dialogs without explicit user intent.

**Why:** Every unnecessary element competes for attention with the elements that matter. Restraint is the mark of quality.

---

## Principle 8 — Jewish Heritage Without Visual Clutter

The application celebrates Benei Menashe Jewish heritage through warmth, texture,
and cultural authenticity — not through visual overload.

**In practice:**
- Hebrew text is treated as typography, not decoration.
- The sanctuary / temple motif (⛩ equivalent) is used once per context — not repeated.
- Candlelight, parchment, Jerusalem limestone textures are evoked through color palette — not image tiles.
- Hebrew numeral dates (תשפ״ו) appear where culturally meaningful — hero, calendar — not everywhere.
- No clip art, no generic "Jewish symbols" scattered across screens.

**Why:** Menashe users are members of this heritage. They recognise authentic expression immediately — and they recognise kitsch just as quickly.

---

## Principle 9 — Beauty Through Consistency

A single beautifully designed screen surrounded by inconsistent screens destroys trust.

Every screen must feel like it was made by the same hand.

**In practice:**
- All spacing comes from the MMDL `SP` scale — no magic numbers.
- All colors come from `COLOR_TOKENS` and the active theme — no hardcoded hex.
- All radius values come from `RD` — no arbitrary border radii.
- All animation durations come from `DURATION` — no ad-hoc millisecond values.
- All typography comes from `FONT_SIZE` and `FONT` — no arbitrary font sizes.

**Why:** Consistency is the single most detectable signal of quality. Users cannot articulate it, but they feel it immediately when it is absent.

---

## Principle 10 — Respectful Interaction

The application never surprises the user with a destructive action.
It never demands attention it has not earned.
It never makes the user feel stupid for making a mistake.

**In practice:**
- Destructive actions (delete yahrzeit, leave community) always require confirmation via a bottom sheet — never a system `alert()`.
- Permissions (notifications, location) are requested contextually — only when the user has just performed an action that requires them. Never on first launch.
- Error messages are written in first-person ("We couldn't load…") — never second-person blame ("You haven't…").
- Undo is offered wherever technically feasible.

**Why:** The Menashe community includes elders, recent immigrants, and users for whom this app is their primary connection to their heritage. Every interaction carries that weight.

---

*These principles are the foundation. Every phase of MEL that follows is a specification of how these principles are applied.*
