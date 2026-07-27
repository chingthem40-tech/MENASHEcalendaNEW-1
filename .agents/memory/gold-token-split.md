---
name: Gold token split (GOLD vs GOLD_SANCTUARY)
description: Two canonical gold values exist — which to use where, and why they differ.
---

# Gold Token Split

## The rule
- `GOLD = #d4a843` — warm amber; all general UI (buttons, headings, borders, cards)
- `GOLD_SANCTUARY = #D4AF37` — museum gold; Memorial Sanctuary 3D scene and profile sheet ONLY

Defined in `artifacts/menashe-calendar/src/lib/theme.ts` (web) and documented in `docs/DesignSystem.md`.
Mobile: `constants/colors.ts` dark.primary/tint = `#d4a843`.

## Why two values?
The Memorial Sanctuary needs a visually distinct atmosphere — cooler, more solemn. `#D4AF37` has a greener undertone vs the warmer `#d4a843`. This distinction is intentional, not a historical bug.

## How to apply
- New UI anywhere outside MemorialSanctuaryModal → use `GOLD` (`#d4a843`)
- MemorialSanctuaryModal.tsx 3D scene, entrance card, profile sheet → keep existing `#D4AF37` / `GOLD_SANCTUARY`
- Do NOT introduce a third gold value without updating both theme.ts and this note.
