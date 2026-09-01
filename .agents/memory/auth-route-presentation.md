---
name: Auth route presentation
description: Presentation rule for the web app's sign-in and sign-up routes.
---

Authentication routes should render immediately without the global startup splash or onboarding overlay.

**Why:** A delayed or obscured sign-in page makes expired-link recovery and provider-outage messaging look broken, even when routing and API behavior are correct.

**How to apply:** When changing startup gating, detect `/sign-in` and `/sign-up` routes before rendering splash/onboarding UI, while leaving normal landing-page startup behavior unchanged.

The Replit consent screen is provider-controlled, so MENASHE branding and instructions belong on the app-side screens before and after that redirect.

**Why:** Provider consent UI cannot be restyled safely; app-owned guidance is the reliable place to explain the redirect, permissions, cancellation, and Preview testing behavior.

**How to apply:** Keep provider-specific instructions compact and contextual, showing Preview/incognito guidance only in development Preview mode rather than to regular members.

Full-screen auth cards with recovery or Preview guidance must use overflow-safe vertical centering; ordinary centered flex alignment can clip the top of a card taller than the viewport.

**Why:** Auth variants have different heights, and losing the brand header or recovery context makes the page appear broken on shorter screens.

**How to apply:** Let the overlay scroll, use a column layout, and center the card with auto block margins so it centers when space exists and starts at the padded top when it does not.