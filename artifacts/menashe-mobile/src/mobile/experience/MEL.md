# MEL — Menashe Experience Language
### Version 1.0 · Menashe Calendar Mobile

---

> **MMDL** defines WHAT things look like.  
> **Components** define WHAT things are.  
> **MEL** defines HOW people feel.

MEL is the permanent experience constitution of the Menashe Calendar mobile application.
Every future screen must inherit it. No screen invents its own experience.

---

## Index

| Document | Purpose |
|---|---|
| [EXPERIENCE_PRINCIPLES.md](./EXPERIENCE_PRINCIPLES.md) | The 10 foundational principles that govern all experience decisions |
| [informationHierarchy.ts](./informationHierarchy.ts) | Typed constants defining 3-level visual priority hierarchy |
| [cardGuide.md](./cardGuide.md) | Official card families, specs, and usage rules |
| [motionGuide.md](./motionGuide.md) | All motion patterns — entrance, exit, press, scroll, and more |
| [illustrationGuide.md](./illustrationGuide.md) | Artwork standards — palette, subjects, texture, forbidden patterns |
| [photographyGuide.md](./photographyGuide.md) | Photography standards — lighting, grading, crop, AI guidance |
| [typographyGuide.md](./typographyGuide.md) | When each type scale is used, Hebrew + English hierarchy |
| [spacingGuide.md](./spacingGuide.md) | Spacing rules — margins, card rhythm, safe area, breathing room |
| [interactionGuide.md](./interactionGuide.md) | Tap, swipe, haptics, confirmation, feedback patterns |
| [loadingGuide.md](./loadingGuide.md) | Skeleton, loading, refreshing, offline, retry, progress standards |
| [emptyStatesGuide.md](./emptyStatesGuide.md) | Empty state anatomy — illustration, headline, CTA, tone |
| [errorGuide.md](./errorGuide.md) | Error language — friendly, human, recovery-first |
| [accessibilityGuide.md](./accessibilityGuide.md) | Dynamic Type, Reduced Motion, VoiceOver, contrast, targets |
| [futureExperience.md](./futureExperience.md) | Reserved guidance for Widget, Watch, Tablet, CarPlay, Vision Pro |
| [experienceChecklist.md](./experienceChecklist.md) | Per-screen checklist for every new or updated screen |
| [contributionRules.md](./contributionRules.md) | How to propose changes to MEL |

---

## Experience Folder Tree

```
artifacts/menashe-mobile/src/mobile/experience/
├── MEL.md                      ← This file. Master index.
├── EXPERIENCE_PRINCIPLES.md    ← Phase 1 — Philosophy
├── informationHierarchy.ts     ← Phase 2 — Visual Priority (typed)
├── cardGuide.md                ← Phase 3 — Card Families
├── motionGuide.md              ← Phase 4 — Motion Language
├── illustrationGuide.md        ← Phase 5 — Illustration Standards
├── photographyGuide.md         ← Phase 6 — Photography Standards
├── typographyGuide.md          ← Phase 7 — Type Usage Rules
├── spacingGuide.md             ← Phase 8 — Spacing Language
├── interactionGuide.md         ← Phase 9 — Interaction Language
├── loadingGuide.md             ← Phase 10 — Loading Language
├── emptyStatesGuide.md         ← Phase 11 — Empty States
├── errorGuide.md               ← Phase 12 — Error Language
├── accessibilityGuide.md       ← Phase 13 — Accessibility Language
├── futureExperience.md         ← Phase 14 — Future Platforms
├── experienceChecklist.md      ← Per-screen verification checklist
└── contributionRules.md        ← How MEL evolves
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   USER EXPERIENCE                        │
│              "How Menashe Calendar feels"               │
└──────────────────────┬──────────────────────────────────┘
                       │ governed by
┌──────────────────────▼──────────────────────────────────┐
│               MEL  (This Document Set)                   │
│  Philosophy · Hierarchy · Motion · Illustration          │
│  Typography · Spacing · Interaction · Accessibility      │
└────────┬──────────────┬──────────────┬───────────────────┘
         │ references   │ references   │ references
┌────────▼───────┐ ┌────▼───────┐ ┌───▼────────────────────┐
│ Design System  │ │ Components │ │ Business Logic / APIs   │
│ (MMDL tokens)  │ │ (src/mobile│ │ (api-server, shared-    │
│ colors,spacing,│ │/components)│ │ core, hebrewCalendar)   │
│ typography,    │ │            │ │                         │
│ motion, radius │ │            │ │                         │
└────────────────┘ └────────────┘ └─────────────────────────┘
```

---

## Experience Diagram

```
CALM ──────────────────────────────────────────────► SACRED
  │                                                      │
  │  Every screen opens calm.                            │
  │  Content reveals itself in hierarchy order.          │
  │  Motion is purposeful, never decorative.             │
  │  Typography breathes — it is never crammed.          │
  │  Jewish identity is felt, not announced.             │
  │                                                      │
  └──── The user feels trusted, respected, and at home. ─┘
```

---

## Card Hierarchy

```
HERO CARD          ← Maximum visual weight. One per screen. Gradient bg.
COUNTDOWN CARD     ← Time-sensitive. High urgency. Pulse animation allowed.
FEATURE CARD       ← Two-column pairing. Sanctuary + AI. Compact (~150dp).
INFORMATION CARD   ← Parashah, Holiday, Daf. 2-col grid. Icon + title + text.
LEARNING CARD      ← Torah insight, quote. Full-width. Serif-weight headline.
STATISTIC CARD     ← Yahrzeit count, community stats. Large number + label.
ACTION CARD        ← Quick actions. 52×52 icon, label below. 4-5 per row.
PREVIEW CARD       ← Thumbnail image + caption. Gallery context.
GALLERY CARD       ← Image collection. Scroll horizontal. No clip of art.
ALERT CARD         ← Full-width banner. Gold border. Recoverable error only.
```

---

## Motion Hierarchy

```
NAVIGATION         350ms decelerate  ← Between tabs/screens
ENTRANCE           380ms standard    ← Cards staggering in (14dp translateY)
HERO               500ms decelerate  ← Hero card entrance
DIALOG/SHEET       300ms decelerate  ← Bottom sheet, modal
PRESS              150ms             ← Scale 1.0 → 0.97 → 1.0
COLLAPSE/EXPAND    250ms standard    ← Accordion, section toggle
SCROLL             Native momentum   ← Never intercepted
EXIT               200ms accelerate  ← Fast — user initiated dismissal
```

---

## Interaction Hierarchy

```
TAP          ← Primary action. Visual + haptic feedback required.
SWIPE        ← Dismissal or navigation only. Always directional.
LONG PRESS   ← Secondary/destructive actions. Confirmation required.
PULL         ← Refresh only. Native iOS/Android spring physics.
SCROLL       ← Information discovery. Never blocked by floating UI.
SELECTION    ← Toggle state. Checkmark or highlight. Immediate feedback.
CONFIRMATION ← Destructive actions only. Bottom sheet — never alert().
```

---

## Verification Checklist (Summary)

See [experienceChecklist.md](./experienceChecklist.md) for the full per-screen list.

- [ ] No new color invented outside MMDL tokens
- [ ] Information hierarchy Level 1 is visually dominant
- [ ] All motion uses MEL-specified durations and easings
- [ ] Empty states follow emptyStatesGuide.md anatomy
- [ ] Errors are friendly, human, recovery-first
- [ ] All interactive elements meet 44×44dp minimum touch target
- [ ] Reduced Motion respected — no required animations
- [ ] VoiceOver/TalkBack labels on all interactive elements
- [ ] Hebrew text renders with correct RTL alignment
- [ ] No hardcoded strings — all text via LanguageContext
- [ ] TypeScript passes (`tsc --noEmit`)
- [ ] Web app untouched

---

*MEL is a living document. Changes require Chief Architect approval. See [contributionRules.md](./contributionRules.md).*
