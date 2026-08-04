# Menashe Platform — Release Notes v1.0

**Release Date:** August 2026  
**Release Candidate:** RC1  
**Platform:** Web (Vite + React), Mobile (Expo / React Native), API (Express + PostgreSQL)

---

## Overview

v1.0 is the inaugural production release of the Bnei Menashe sacred calendar platform — a full-stack community application serving the Bnei Menashe community worldwide with tools for prayer, remembrance, community connection, and Torah study.

---

## What's Included

### Sacred Calendar & Zmanim
- Full Hebrew calendar with parasha, holidays, zmanim, daf yomi, omer count
- Location-aware prayer times with precise zmanim calculations
- Mikveh calendar, Tahara guide
- Holiday halacha and insights (AI-powered when configured)

### Torah & Prayer
- Siddur viewer with bilingual (EN / TK) support
- Torah tracker — personal reading log with server sync
- Daf Yomi tracker
- Musar study section
- Sefaria search integration
- Sacred Wisdom chat (AI-powered; requires API keys)

### Community
- Community Yahrzeit / Memorial Sanctuary — 3D candle-lighting experience
- Prayer Board with community Amen support
- Community Events calendar
- Member Directory with moderation workflow
- Announcements with push notification broadcast
- Census system with branch-level data collection

### Memorial System
- Full memorial profiles with photos, tributes, and family relationships
- Memorial browser panel with search and filtering
- Upcoming yahrzeits feed

### Feedback & Support (PEP-705)
- Full Feedback Center with 8 views: bug reports, feature requests, appreciation, help requests, ratings, submission history, admin panel
- Reference numbers (FB-XXXXXX) for every submission
- Admin panel: filter, bulk-update, CSV export, admin notes

### Premium System
- Premium membership request flow
- Razorpay payment integration (UPI + card)
- Admin approval/deny workflow

### Settings & Profile
- Bilingual interface (English / Tedim)
- Theme system (Dark, Light, Sapphire)
- Notification preferences (push + in-app)
- Profile management with public profile
- Family Timeline
- Birthday tracker
- Yahrzeit reminders

### Offline Support
- Service worker with shell + asset caches
- Graceful offline state indicators

---

## Security Highlights

- All admin routes protected by Clerk `org:admin` role verification
- Push subscription endpoint hardened — userId derived from authenticated session only
- Helmet security headers on all API responses
- Request body size cap (512KB)
- Per-feature rate limiting (global 300/15min, AI 20/15min, payments 10/15min, push 20/hr)
- User-owned resource operations include ownership predicates (IDOR protection)
- Input validation via Zod on all mutation endpoints
- CORS restricted to known origins in production

---

## Known Issues

See `docs/KNOWN_ISSUES.md`.

---

## Configuration Required

See `docs/DEPLOYMENT_CHECKLIST.md` for the full list of required environment variables.

---

## Breaking Changes

N/A — this is the initial release.
