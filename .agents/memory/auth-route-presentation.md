---
name: Auth route presentation
description: Presentation rule for the web app's sign-in and sign-up routes.
---

Authentication routes should render immediately without the global startup splash or onboarding overlay.

**Why:** A delayed or obscured sign-in page makes expired-link recovery and provider-outage messaging look broken, even when routing and API behavior are correct.

**How to apply:** When changing startup gating, detect `/sign-in` and `/sign-up` routes before rendering splash/onboarding UI, while leaving normal landing-page startup behavior unchanged.