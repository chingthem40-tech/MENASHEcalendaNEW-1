# Menashe Design System

**Slug:** `menashe-ds`  
**Package:** `@workspace/menashe-ds`  
**Source:** Menashe Calendar web application

Menashe is a sacred calendar and community platform for Bnei Menashe. Its visual language is **Royal Midnight**: a deep, quiet navy foundation, warm amber-gold ritual accents, restrained orange calls to action, textile and candlelight references, and typography that gives Hebrew and sacred content room to breathe.

The system is intentionally ceremonial without becoming ornamental. Information remains primary; glow, gradients, and motion are used to guide attention rather than decorate every surface.

## Theme families

| Theme | Wrapper class | Personality | Primary |
|---|---|---|---|
| Royal Midnight | none | Sacred, nocturnal, warm | `#ff631f` orange |
| Parchment Light | `.light-theme` | Airy, archival, readable | `#41bedd` cyan |
| Deep Sapphire | `.sapphire-theme` | Focused, contemplative, blue | `#6382ff` periwinkle |

Use one theme class at the root of a page or feature subtree. The default theme is Royal Midnight.

## Color roles

Use CSS custom properties rather than raw colors in UI components.

### Surfaces

| Token | Royal Midnight | Parchment Light | Deep Sapphire |
|---|---:|---:|---:|
| `--background` | `#080e1a` | `#f3fbfd` | `#060e1e` |
| `--card` | `#111827` | `#ffffff` | `#0c1830` |
| `--card-secondary` | `#1a2540` | `#eefbfe` | `#111f3c` |
| `--elevated` | `#1a2540` | `#eefbfe` | `#111f3c` |
| `--border` | `#1e2d4a` | `#ade7f5` | `#1a2e58` |

### Content and action

| Token | Royal Midnight | Parchment Light | Deep Sapphire | Role |
|---|---:|---:|---:|---|
| `--foreground` | `#f8fafc` | `#0f172a` | `#e8f0ff` | Default readable text |
| `--text-secondary` | `#94a3b8` | `#334155` | `#8aaeff` | Supporting content |
| `--text-muted` | `#64748b` | `#64748b` | `#4a6090` | Metadata and disabled content |
| `--gold` | `#d4a843` | `#b8860b` | `#d4a843` | Brand, sacred emphasis |
| `--gold-light` | `#f0c96a` | `#d4a843` | `#f0c96a` | Highlight and focus |
| `--primary` | `#ff631f` | `#41bedd` | `#6382ff` | Primary action |
| `--green` | `#16a34a` | `#16a34a` | `#16a34a` | Success and approved state |
| `--red` | `#ef4444` | `#ef4444` | `#ef4444` | Error and destructive state |

`GOLD_SANCTUARY` (`#D4AF37`) is reserved for the 3D Memorial Sanctuary. General 2D UI uses `--gold` / `GOLD` (`#d4a843`).

## Typography

- **UI and body:** Inter, via `var(--app-font-sans)`.
- **Hebrew and sacred text:** Noto Serif Hebrew, via `.mds-hebrew`.
- **Display restraint:** Use `30px` only for hero/display moments; use `24px` for page titles and `20px` for section headings.
- **Body readability:** Use `13px` as the compact app baseline, `15px` for emphasized body copy, and `11px` only for metadata or legal text.
- **Hebrew treatment:** Apply `.mds-hebrew`, preserve RTL direction, and never place Hebrew verses in the UI sans face.

## Layout, spacing, and shape

Use the 4px spacing rhythm:

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48px`

| Shape token | Value | Use |
|---|---:|---|
| `--radius` | `12px` | Standard cards and controls |
| Small radius | `8px` | Tags, badges, compact inputs |
| Large radius | `16px` | Prominent cards |
| Sheet radius | `20px` | Modal sheets |
| Popup radius | `28px` | Floating feature cards |
| Full radius | `9999px` | Pills and avatars |

Keep primary content within a readable column. On mobile, use full-width cards with 16px horizontal page padding; on desktop, allow a centered content column while preserving generous negative space around ceremonial surfaces.

## Component language

### Cards

- `.mds-card`: standard elevated surface.
- `.mds-card-secondary`: quieter grouping surface.
- `.mds-card-interactive`: clickable surface with a small lift and gold border glow.

Cards use a single clear purpose. Do not stack several competing gradients or add decorative borders that do not communicate hierarchy.

### Buttons

- `.mds-btn-primary`: the main action for the current task.
- `.mds-btn-gold`: featured or sacred action with dark text.
- `.mds-btn-close`: compact circular close control.

Every view should have one visually dominant action. Disabled and loading states must preserve the button footprint and explain that work is in progress.

### Overlays and sheets

- `.mds-modal-overlay`: blurred dismissal layer.
- `.mds-modal-sheet`: bottom sheet surface.
- `.mds-modal-handle`: drag affordance.

Modal sheets must have `role="dialog"`, `aria-modal="true"`, and a labelled heading. Provide a visible close or cancel route.

### Sacred accents

- `.mds-gold-divider`: quiet gold rule for separating meaningful sections.
- `.mds-hebrew`: RTL Hebrew content with the sacred serif face.

Use these accents at section boundaries, not on every card.

## Auth and trust pattern

App-owned authentication screens use the Royal Midnight card treatment:

1. Brand mark or textile header.
2. Short eyebrow identifying the calendar/community context.
3. Plain-language purpose statement.
4. One Replit action.
5. Compact “What happens next” guidance.
6. Recovery message near the action when a callback fails.
7. A safe back path and a clear sign-in/sign-up switch.

The external Replit consent page is provider-controlled. Do not imitate or attempt to restyle its controls. Keep provider-specific testing instructions contextual to Preview/development and out of the normal member flow.

## Motion

Use the shared motion tokens:

| Token | Value | Use |
|---|---|---|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Sheets and intentional entrances |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Fades and overlays |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits |
| `--dur-fast` | `180ms` | Buttons and controls |
| `--dur-normal` | `280ms` | Cards and overlays |
| `--dur-slow` | `420ms` | Full-sheet entrances |

Animate opacity and transforms rather than layout dimensions. The system disables motion under `prefers-reduced-motion: reduce`.

## Accessibility contract

- Maintain visible `:focus-visible` rings using the theme accent.
- Keep interactive targets at least 44px where possible.
- Pair icon-only controls with an accessible name.
- Do not communicate state through color alone.
- Keep body text readable and line-height near 1.5.
- Preserve keyboard order and provide skip links on full-page mockups.
- Keep error copy beside the action or field it explains.
- Respect RTL for Hebrew content and do not rely on direction-neutral punctuation.

## Consumption

```css
@import '@workspace/menashe-ds/styles.css';
```

The complete token implementation and component classes live in `styles.css`. The visual reference is available in the `DSShowcase` mockup entry. Read `docs/AGENTS.md` before authoring any new UI with this system.