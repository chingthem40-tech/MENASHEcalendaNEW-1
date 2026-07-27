---
name: SPR-M012 Sacred Wisdom — Rav Menashe
description: Architecture decisions for the Sacred Wisdom mobile screen (Rav Menashe AI companion).
---

## Key decisions

- **Single file**: `artifacts/menashe-mobile/app/sacred-wisdom.tsx` — home + chat in one self-contained screen.
- **Streaming**: `import { fetch } from 'expo/fetch'` with async generator SSE parser. Standard `fetch` does NOT support `getReader()` on all RN platforms — must use `expo/fetch`.
- **Entry point**: Registered as a stack screen in `app/_layout.tsx` (`name="sacred-wisdom"`) and accessed from the Torah tab via a sapphire-blue feature card inserted before section 3.
- **Conversation persistence**: AsyncStorage via `storageGet/storageSet` from `@/lib/storageUtils`, key `menashe-sacred-wisdom-convs-v1`, max 20 conversations.
- **Auth**: `useAuth().getToken()` from `@clerk/expo` — same pattern as settings.tsx.
- **Touch targets**: All interactive controls enforced to ≥48dp height (learning chips: minHeight 48, send/stop: 48px circle). 36px is NOT compliant.

**Why:**
- `expo/fetch` is required for streaming SSE on native (iOS/Android) in Expo SDK 54.
- Single-file approach keeps the SPR scope contained and avoids prop-drilling across many files.
- Learning Suggestions (Section 4) render inside MessageBubble after each completed assistant response — this is intentional per spec "After every response, suggest…".

**How to apply:**
- Any future chat feature on mobile MUST use `expo/fetch`, not native `fetch`.
- Do NOT add new AI backend routes — always reuse `POST /api/chat`.
- Torah tab entry card uses hardcoded sapphire hex values (#050c1a, #0c1830, #6382FF) because it lives in a dark-themed gradient block, not inside the theme system.
