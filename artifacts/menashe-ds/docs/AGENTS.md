# Menashe Design System — Agent Consumption Guide

**Package:** `@workspace/menashe-ds`  
**Slug:** `menashe-ds`  
**Mockup entry URL:** `https://${REPLIT_DEV_DOMAIN}/__mockup/src/ds/menashe-ds/#/{ComponentName}`  
**Mockup component path:** `artifacts/mockup-sandbox/src/ds/menashe-ds/mockups/<ComponentName>.tsx`

---

## Identity

Menashe DS is extracted from the Bnei Menashe sacred calendar app — a Jewish community platform serving Hebrew prayer times, Shabbat, Torah, community tools, and memorial features. The aesthetic is **Royal Midnight**: near-black navy surfaces with warm amber-gold accents, an orange CTA, Hebrew typography, glass blur, inset highlights, and restrained gold glows. It is sacred, ceremonial, and quietly luminous — not loud, not generic SaaS.

Three themes coexist:

| Theme | Class | Character |
|---|---|---|
| Royal Midnight | *(default)* | Deep navy, amber gold, orange CTA |
| Parchment Light | `light-theme` | Pale cyan-white, cyan primary, brown gold |
| Deep Sapphire | `sapphire-theme` | Deeper blue, electric periwinkle, gold secondary |

---

## How to Import

In a mockup file under `artifacts/mockup-sandbox/src/ds/menashe-ds/mockups/`, styles arrive automatically via the entry's `styles.css`. Do **not** add another `@import` — it is already loaded.

In any other context:
```css
@import '@workspace/menashe-ds/styles.css';
```

---

## Applying a Theme

Wrap the component in a div with the theme class. Default (no class) = Royal Midnight.

```tsx
// Royal Midnight (default)
<div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>
  …
</div>

// Parchment Light
<div className="light-theme" style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>
  …
</div>

// Deep Sapphire
<div className="sapphire-theme" style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>
  …
</div>
```

---

## Color Tokens

Use as CSS custom properties (`var(--token)`) or Tailwind classes (`bg-background`, `text-foreground`, etc.).

### Surfaces

| Token | Tailwind | Royal Midnight | Parchment Light | Deep Sapphire |
|---|---|---|---|---|
| `--background` | `bg-background` | `#080e1a` | `#f3fbfd` | `#060e1e` |
| `--foreground` | `text-foreground` | `#f8fafc` | `#0f172a` | `#e8f0ff` |
| `--card` | `bg-card` | `#111827` | `#ffffff` | `#0c1830` |
| `--card-secondary` | `bg-card-secondary` | `#1a2540` | `#eefbfe` | `#111f3c` |
| `--elevated` | `bg-elevated` | `#1a2540` | `#eefbfe` | `#111f3c` |

### Borders & Muted

| Token | Tailwind | Royal Midnight | Parchment Light | Deep Sapphire |
|---|---|---|---|---|
| `--border` | `border-border` | `#1e2d4a` | `#ade7f5` | `#1a2e58` |
| `--muted` | `bg-muted` | `#1e2d4a` | `#d7f4fb` | `#1a2e58` |
| `--muted-foreground` | `text-muted-foreground` | `#64748b` | `#64748b` | `#4a6090` |

### Brand & Accent

| Token | Tailwind | Royal Midnight | Parchment Light | Deep Sapphire |
|---|---|---|---|---|
| `--primary` | `bg-primary` | `#ff631f` | `#41bedd` | `#6382ff` |
| `--primary-foreground` | `text-primary-foreground` | `#ffffff` | `#ffffff` | `#ffffff` |
| `--gold` | `text-gold` / `bg-gold` | `#d4a843` | `#b8860b` | `#d4a843` |
| `--gold-light` | `text-gold-light` | `#f0c96a` | `#d4a843` | `#f0c96a` |
| `--accent` | `bg-accent` | `#d4a843` | `#41bedd` | `#6382ff` |

### Text

| Token | Tailwind | Usage |
|---|---|---|
| `--text-primary` | `text-text-primary` | Main readable text |
| `--text-secondary` | `text-text-secondary` | Supporting / metadata |
| `--text-muted` | `text-text-muted` | Placeholders, labels, disabled |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--green` | `#16a34a` | Success, approved, Aliyah |
| `--red` | `#ef4444` | Error, removed, alerts |

---

## Typography

### Font Families

| Family | Variable | Usage |
|---|---|---|
| Inter | `var(--app-font-sans)` | All UI text — default |
| Noto Serif Hebrew | — | Sacred text, Hebrew verses, Torah references |

Apply Hebrew via the component class or inline:
```tsx
<p className="mds-hebrew text-xl">שְׁמַע יְהוָה</p>
// or inline:
<p style={{ fontFamily: "'Noto Serif Hebrew', serif", direction: 'rtl' }}>…</p>
```

### Type Scale (px)

| Name | Size | Usage |
|---|---|---|
| xs | 9px | Badge labels, metadata |
| sm | 11px | Secondary metadata, legal |
| base | 13px | Body copy, list items |
| md | 15px | Emphasized body, buttons |
| lg | 17px | Subheadings |
| xl | 20px | Section headings |
| 2xl | 24px | Page titles |
| 3xl | 30px | Hero / display |

---

## Spacing & Radii

### Spacing scale (4px base)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48px` — use Tailwind spacing utilities (`p-4`, `gap-6`, etc.) or `var(--radius)` for standard gaps.

### Border radii

| Token | px | Usage |
|---|---|---|
| `--radius` (CSS var) | `0.75rem / 12px` | Default card/modal |
| `rounded-sm` (Tailwind) | 8px | Tags, badges, inputs |
| `rounded-lg` (Tailwind) | 16px | Large cards |
| `rounded-xl` (Tailwind) | 20px | Modal sheets |
| `rounded-2xl` (Tailwind) | 28px | Popup cards |
| `rounded-full` (Tailwind) | 9999px | Pills, avatars |

---

## Motion

### Easing

| Variable | Curve | Use for |
|---|---|---|
| `var(--ease-spring)` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Entrances, sheet slides |
| `var(--ease-out)` | `cubic-bezier(0.22, 1, 0.36, 1)` | Overlays, fades |
| `var(--ease-in)` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| `var(--ease-inout)` | `cubic-bezier(0.4, 0, 0.2, 1)` | Toggle transitions |

### Duration

| Variable | ms | Use for |
|---|---|---|
| `var(--dur-instant)` | 80ms | Hover colour/border micro |
| `var(--dur-fast)` | 180ms | Buttons, inputs, small transitions |
| `var(--dur-normal)` | 280ms | Overlays, cards |
| `var(--dur-slow)` | 420ms | Full-sheet entrances |

### Standard hover pattern
```css
transition:
  border-color var(--dur-fast) var(--ease-out),
  box-shadow var(--dur-fast) var(--ease-out),
  transform var(--dur-fast) var(--ease-out);
```

---

## Component Classes

All classes are defined in `styles.css` and theme-aware.

### Cards

| Class | Description |
|---|---|
| `mds-card` | Elevated surface with border and subtle shadow |
| `mds-card-interactive` | Card that lifts on hover with gold border glow |
| `mds-card-secondary` | Slightly more muted background variant |

```tsx
<div className="mds-card p-4">…</div>
<button className="mds-card-interactive p-4 text-left w-full">…</button>
```

### Buttons

| Class | Description |
|---|---|
| `mds-btn-primary` | Pill-shaped primary — orange/cyan/periwinkle per theme |
| `mds-btn-gold` | Amber gradient, dark text — for sacred/featured actions |
| `mds-btn-close` | Small circular ghost close button |

```tsx
<button className="mds-btn-primary">Sign In</button>
<button className="mds-btn-gold">💛 Give a Blessing</button>
<button className="mds-btn-close" aria-label="Close">✕</button>
```

### Modals

| Class | Description |
|---|---|
| `mds-modal-overlay` | Fixed blurred full-screen overlay |
| `mds-modal-sheet` | Bottom sheet panel, slides up with spring |
| `mds-modal-handle` | Pill drag handle at top of sheet |

```tsx
<div className="mds-modal-overlay" role="dialog" aria-modal="true">
  <div className="mds-modal-sheet p-4">
    <div className="mds-modal-handle" />
    …
  </div>
</div>
```

### Sacred / Decorative

| Class | Description |
|---|---|
| `mds-gold-divider` | Fading gold ornament line between sections |
| `mds-hebrew` | RTL Hebrew text with Noto Serif Hebrew, gold colour |

### Animations

| Class | Description |
|---|---|
| `mds-fade-in` | Fade + 6px upward enter |
| `mds-slide-up` | Spring slide from below |
| `mds-stagger-item` | Staggered item — set `style={{ '--i': index }}` |
| `mds-pulse-gold` | Repeating gold ring pulse (prayer attention) |
| `mds-skeleton` | Shimmer placeholder for loading states |

```tsx
<div className="mds-fade-in">…</div>
{items.map((item, i) => (
  <div key={item.id} className="mds-stagger-item" style={{ '--i': i } as React.CSSProperties}>
    {item.name}
  </div>
))}
```

### Accessibility

| Class | Description |
|---|---|
| `mds-skip-link` | Keyboard skip-to-content link, appears on focus |
| `mds-sr-only` | Visually hidden but screen-reader accessible |

---

## Gold Tokens (JS)

For Three.js, canvas, SVG, or inline `style` values where CSS variables don't reach:

```ts
// Gold palette
const GOLD           = '#d4a843';  // All UI — cards, badges, icons
const GOLD_DIM       = '#b8860b';  // Light-theme gold, subtle accents
const GOLD_BRIGHT    = '#f5d982';  // Hover highlights
const GOLD_SANCTUARY = '#D4AF37';  // 3D Memorial Sanctuary ONLY — do not use in 2D UI
const GOLD_GRADIENT  = 'linear-gradient(135deg, #b8860b 0%, #d4a843 50%, #f0c96a 100%)';

// Translucent overlays
const DARK_CARD      = 'rgba(212,168,67,0.06)';
const BORDER_GOLD    = 'rgba(212,168,67,0.25)';
const SURFACE_0      = 'rgba(0,0,0,0.85)';
const SURFACE_1      = 'rgba(255,255,255,0.04)';
const SURFACE_2      = 'rgba(255,255,255,0.07)';
```

**Important:** `GOLD_SANCTUARY` (#D4AF37) is reserved for the 3D Memorial Sanctuary canvas. All 2D UI must use `GOLD` (#d4a843). These look similar but are intentionally distinct — do not swap them.

---

## Rules & Anti-Patterns

### Do
- Use `var(--token)` for all colours — never hardcode hex in component CSS unless it's a one-off 3D/canvas value
- Apply one theme class per subtree; never mix theme classes on nested elements
- Use `mds-stagger-item` with `--i` index for all list entrances
- Apply `role="dialog" aria-modal="true" aria-labelledby="…"` on every modal sheet
- Use `mds-sr-only` for icon-only buttons — always pair with `aria-label`
- Always include `mds-skip-link` in full-page mockups
- Respect `prefers-reduced-motion` — the DS resets all animations to instant when set

### Don't
- ❌ Hardcode `#080e1a`, `#f8fafc`, or any other theme hex in component CSS — use tokens
- ❌ Import `src/index.css` from the main app — it is not part of this package
- ❌ Use `GOLD_SANCTUARY` in any 2D surface
- ❌ Put Hebrew text in Inter — always use Noto Serif Hebrew
- ❌ Create light-on-dark-background buttons with the gold gradient — the gradient has dark text only
- ❌ Skip `backdrop-filter: blur()` on overlay overlays — it is the primary glass effect of the system

---

## Mockup File Template

```tsx
// artifacts/mockup-sandbox/src/ds/menashe-ds/mockups/MyComponent.tsx

export function MyComponent() {
  return (
    // No wrapper theme class = Royal Midnight (default)
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', padding: 24 }}>
      <a href="#main" className="mds-skip-link">Skip to content</a>

      <main id="main">
        <div className="mds-card p-4 mds-fade-in">
          <p className="mds-hebrew text-xl mb-2">יְהִי רָצוֹן</p>
          <div className="mds-gold-divider" />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            May it be God's will
          </p>
          <button className="mds-btn-gold mt-4">🙏 Amen</button>
        </div>
      </main>
    </div>
  );
}
```

---

## Preview URL Pattern

```
https://${REPLIT_DEV_DOMAIN}/__mockup/src/ds/menashe-ds/#/MyComponent
```

For nested files:
```
https://${REPLIT_DEV_DOMAIN}/__mockup/src/ds/menashe-ds/#/subfolder/MyComponent
```
