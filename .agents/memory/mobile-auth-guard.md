---
name: Mobile auth guard pattern
description: Correct pattern for protecting authenticated screens in the Expo app
---

**Rule:** The single auth gate is `isSignedIn` from `useAuth()` in `app/(tabs)/_layout.tsx`. Do NOT add secondary guards (AsyncStorage keys, custom flags) anywhere in tab screens.

**Why:** A secondary `AsyncStorage.getItem("menashe-mobile-signed-in")` check was found in `app/(tabs)/index.tsx` with no corresponding write path — meaning the key was always null, causing a permanent redirect to sign-in even for authenticated users. This is a app-breaking crash pattern.

**How to apply:** Any screen inside `(tabs)` can assume the user is authenticated — the layout already handles the redirect. Never add custom "is signed in" logic inside individual tab screens.
