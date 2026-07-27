---
name: Translations file split (web vs mobile)
description: The web calendar app and the mobile app do NOT share one translations file — adding bilingual keys to the wrong one silently does nothing for the other platform.
---

- `artifacts/menashe-calendar/src/context/LanguageContext.tsx` (web) uses its own standalone `translations.ts` (~1800+ lines) local to that app.
- `artifacts/menashe-mobile/context/LanguageContext.tsx` (mobile) re-exports translations from `lib/shared-core/src/translations/translations.ts` (`SharedTranslations` interface + `sharedEn` + `sharedTk` objects).
- **Why it matters:** a new bilingual UI string needed only on mobile must be added to `lib/shared-core/src/translations/translations.ts` (interface + both language objects). A string needed only on the web modal/page goes in the web app's own `translations.ts`. Adding to the wrong file compiles fine but the string is simply undefined at runtime on the other platform.
- The web app's own modals often skip `t.*` entirely and hardcode English strings directly (e.g. the original Member Directory modal) — this is inconsistent with the "no hardcoded English" rule but is the existing pattern in some older modals; don't assume every web string already flows through `t.*`.
