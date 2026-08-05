---
name: Menashe Design System
description: Design system extracted from the Menashe Calendar web app — tokens, themes, component classes, and mockup-sandbox entry.
---

# Menashe Design System

## Package
- Name: `@workspace/menashe-ds`
- Package dir: `artifacts/menashe-ds/`
- Main export: `artifacts/menashe-ds/styles.css`
- Agent docs: `artifacts/menashe-ds/docs/AGENTS.md` — read this before authoring any UI

## Mockup sandbox entry
- Entry dir: `artifacts/mockup-sandbox/src/ds/menashe-ds/`
- Mockup components go in: `artifacts/mockup-sandbox/src/ds/menashe-ds/mockups/`
- Preview URL pattern: `https://${REPLIT_DEV_DOMAIN}/__mockup/src/ds/menashe-ds/#/<ComponentName>`
- DS entry serves at `/__mockup/src/ds/menashe-ds/` (verified HTTP 200)

## Three themes
| Class | Name | Primary | Gold |
|---|---|---|---|
| (none) | Royal Midnight | `#ff631f` orange | `#d4a843` |
| `light-theme` | Parchment Light | `#41bedd` cyan | `#b8860b` |
| `sapphire-theme` | Deep Sapphire | `#6382ff` periwinkle | `#d4a843` |

## Key tokens
- `--background`, `--foreground`, `--card`, `--card-secondary`, `--elevated`
- `--border`, `--muted`, `--muted-foreground`
- `--primary`, `--primary-foreground`, `--gold`, `--gold-light`, `--accent`
- `--text-primary`, `--text-secondary`, `--text-muted`
- Motion: `--ease-spring/out/in/inout`, `--dur-instant/fast/normal/slow`

## Component classes (all theme-aware)
- Cards: `mds-card`, `mds-card-interactive`, `mds-card-secondary`
- Buttons: `mds-btn-primary`, `mds-btn-gold`, `mds-btn-close`
- Modal: `mds-modal-overlay`, `mds-modal-sheet`, `mds-modal-handle`
- Sacred: `mds-gold-divider`, `mds-hebrew`
- Animation: `mds-fade-in`, `mds-slide-up`, `mds-stagger-item`, `mds-pulse-gold`, `mds-skeleton`
- A11y: `mds-skip-link`, `mds-sr-only`

## Gold rule
GOLD=#d4a843 for all 2D UI. GOLD_SANCTUARY=#D4AF37 for 3D Memorial only. Never swap.

**Why:** Intentional distinction from original app; mixing them is a visual bug.
