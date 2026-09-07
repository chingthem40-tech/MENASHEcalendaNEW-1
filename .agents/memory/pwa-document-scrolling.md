---
name: PWA document scrolling
description: Mobile scrolling behavior for the Menashe web PWA
---

Installed mobile PWAs should use document-level scrolling on narrow screens rather than relying on a nested overflow scroller inside an overflow-hidden app shell. The bottom navigation can remain fixed while the document grows behind it with reserved bottom space.

**Why:** Standalone PWA viewport behavior can prevent touch gestures from reaching a nested flex scroller even when the CSS appears correct in a normal browser tab.

**How to apply:** Keep desktop/tablet screens on their contained scroll model, but switch narrow mobile layouts to an auto-height shell with body/document overflow enabled and fixed navigation kept outside normal flow.