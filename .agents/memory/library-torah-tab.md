---
name: Torah tab Library destination
description: Canonical navigation decision for the mobile Torah tab and legacy Siddur route
---

The mobile Torah bottom-tab destination is the premium Library experience. The legacy `/siddur` route must reuse the same Library screen rather than maintaining a second catalog UI.

**Why:** The user explicitly chose to replace the Sacred Study hub entirely with the uploaded premium Library direction, while preserving existing deep links and real book-opening behavior.

**How to apply:** Treat the Torah tab as the primary Library entry point. Keep `/siddur` for compatibility, but make it a thin reuse/wrapper route. Do not restore a second Torah hub as the tab destination unless the user changes this decision.