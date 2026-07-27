# Mobile UX Guidelines — Memorial Sanctuary

*Menashe Platform — SPR-018*

---

## Purpose

These guidelines define the design language, layout principles, and component rules for the Memorial Sanctuary feature. Every decision serves one goal: reducing cognitive load so users can focus on remembrance.

---

## Layout Principles

### Reading Order

Every screen follows one clear top-to-bottom reading path:

1. **Header** — Context and navigation. Sticky, minimal.
2. **Hero** — Identity of the space. Icon + title + search.
3. **Featured Content** — The most important content first.
4. **Primary Action** — One clear call to action.
5. **World Preview** — The 3D environment as a background experience, not a dominant element.
6. **Recent Activity** — Secondary content in horizontal scroll strips.
7. **Bottom Navigation** — Always reachable with one thumb.

### One Screen, One Purpose

Each screen has one primary purpose. Secondary content is visually subordinate — never competing with the primary flow.

### Whitespace as Respect

Empty space is intentional. It communicates reverence. Do not fill gaps with filler content, empty states, or promotional UI unless directly useful to the user.

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Icon gaps, inline spacing |
| `space-sm` | 8px | Between related elements |
| `space-md` | 14px | Between components |
| `space-lg` | 20px | Section gaps |
| `space-xl` | 28px | Between major sections |
| `space-2xl` | 32px | After featured sections |

**Page padding:** `16px` horizontal, `28px` top, `110px` bottom (for bottom nav clearance).

**Card padding:** `16px` vertical, `18px` horizontal.

---

## Typography Scale

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Page title | 17px | 800 | Gold `#D4A843` |
| Hero title | 24px | 900 | Gold |
| Section title | 13px | 700 | `rgba(255,255,255,0.62)` |
| Card name | 15px | 700 | `rgba(255,255,255,0.92)` |
| Hebrew name | 12px | 400 | `rgba(212,168,67,0.72)` |
| Date / meta | 12px | 400 | `rgba(255,255,255,0.32)` |
| Body text | 14px | 400 | `rgba(255,255,255,0.48)` |
| Button label | 13–16px | 700 | Gold or white |
| Subtitle | 12px | 400 | `rgba(255,255,255,0.38)` |

**Line heights:** Body `1.55`, titles `1.2`, buttons `1.0`.

**Avoid:** ALL-CAPS labels, letter-spacing over `0.05em`, font sizes below `12px`.

---

## Component Rules

### SanctuaryHeader

- Sticky at top, `z-index: 50`
- Back button: **44×44px minimum** tap target, rounded rectangle (not circle)
- Title: 17px, weight 800, Gold
- Subtitle: 12px, 38% white opacity
- Backdrop blur: `blur(20px)` with `rgba(8,14,26,0.94)` background
- One optional action slot on the right

### SanctuaryHero

- Flame icon + title text displayed **side by side** (not stacked) for compact vertical height
- Flame icon: 56×56px, 18px border-radius
- Title: 24px weight 900
- Subtitle: 14px, 48% white
- Search bar: 14px padding, 16px font size, 14px border-radius
- Search icon: 17px, Gold at 60% opacity
- Clear button: 26×26px circle

### MemorialPlaceholderCard

- Minimum height: 44px (WCAG tap target)
- Border-radius: 16px
- Padding: 16px top/bottom, 18px left/right
- Avatar: 48×48px, 14px border-radius
- Name: 15px, weight 700
- Hebrew name: 12px, Georgia serif
- Date: 12px, 32% white
- Candle count: 12px, Gold, weight 700
- Keyboard accessible: responds to Enter and Space keys

### GlassPanel

- Border-radius: 18px
- Padding: 18px
- Default: `rgba(255,255,255,0.04)` background, `rgba(255,255,255,0.06)` border
- Gold variant: `rgba(212,168,67,0.1)` background, `rgba(212,168,67,0.26)` border

### SectionTitle

- Icon: 16px
- Label: 13px, weight 700, NOT all-caps
- Letter-spacing: `0.04em` maximum
- Action (e.g. "See all"): 12px, Gold, no border
- Margin below: 14px

### SanctuaryWorldPreview

- Height: 160px fixed
- Border-radius: 20px
- The 3D world is shown as a **background experience** — a decorative viewport panel suggesting the night-sky sanctuary landscape
- Never fills the full screen at the browse/discovery level
- "Enter →" button: 44px tall minimum, overlaid at bottom-right
- The full 3D canvas only launches when user explicitly taps "Enter"

### Collection Strips

**Featured strip (Recently Remembered):**
- Full-width vertical list
- Shows up to 5 items
- Each card is full width

**Scroll strips (secondary sections):**
- Horizontal scroll, card width 210px
- `scrollbar-width: none` (hidden scrollbar)
- `-webkit-overflow-scrolling: touch` for momentum scrolling
- Gap: 10px between cards
- Sections with zero items are **hidden entirely** (not shown as empty states)

---

## Navigation Rules

1. **Back button** is always the first tap target, top-left
2. **One primary action per screen** — currently "Create Memorial"
3. Do not show duplicated actions (e.g., Create CTA appeared twice previously — removed)
4. Bottom navigation is always visible and not obscured by content

---

## Motion & Animation

- Transitions on interactive elements: `0.15s ease` for `background` and `border-color`
- No entry animations on page load (reduces perceived delay)
- No looping animations in list views
- The 3D world's animations (flames, water, atmosphere) only run inside the full 3D view
- State changes (loading → content) should not jump the layout

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Minimum tap target | 44×44px on all interactive elements |
| Keyboard navigation | Cards support `Enter` and `Space` key activation |
| ARIA labels | Back button has `aria-label="Back"`, clear button has `aria-label="Clear search"` |
| Color contrast | Gold `#D4A843` on `#080e1a` = 5.8:1 (passes AA large) |
| RTL support | All flex layouts are direction-agnostic; Hebrew text in `Georgia, serif` |
| Screen reader roles | Cards use `role="button"` with `tabIndex=0` when interactive |
| Reduced motion | Respect `prefers-reduced-motion` for any future animations |

---

## Future Design Language

### Colour Palette

| Name | Value | Usage |
|------|-------|-------|
| Background | `#080e1a` | Page background |
| Gold | `#D4A843` | Primary accent, titles, CTAs |
| Gold dim | `rgba(212,168,67,0.55)` | Subtitles, secondary labels |
| Gold glow | `rgba(212,168,67,0.12)` | Subtle tint backgrounds |
| Surface | `rgba(255,255,255,0.04)` | Card backgrounds |
| Border | `rgba(255,255,255,0.07)` | Card borders |
| Gold border | `rgba(212,168,67,0.26)` | Gold-accented borders |
| Text primary | `rgba(255,255,255,0.92)` | Main readable text |
| Text secondary | `rgba(255,255,255,0.48)` | Body text, descriptions |
| Text muted | `rgba(255,255,255,0.32)` | Dates, meta |

### Tone of Voice

- Warm, reverent, unhurried
- Never use marketing language in memorial context
- Labels should feel like a quiet companion, not a product
- Hebrew names always rendered in `Georgia, serif`

### What to Never Add

- Notification badges on memorial cards
- Promotional banners
- Auto-playing video or audio
- Social sharing counts prominently displayed
- Gamification elements (streaks, achievements)

---

*Last updated: SPR-018 — Premium Mobile UX Renaissance*
