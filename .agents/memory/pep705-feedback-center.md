---
name: PEP-705 Feedback Center
description: Architecture and integration points for the Community Feedback & Support Center built in PEP-705.
---

## What was built
Full Community Feedback & Support Center — 7 files across DB, API, and web frontend.

## Entry point
Settings → Help & Support section → opens `FeedbackCenterModal` (modal key: `"feedback-center"`).

## Frontend
- `artifacts/menashe-calendar/src/modals/FeedbackCenterModal.tsx` — self-contained modal with 8 views: home, bug, feature, appreciation, help, rating, my-feedback, admin. No external deps beyond React + useUser/useOrganization + useLanguage.
- Self-contained `authedFetch()` helper inside the modal file.
- Admin panel only visible when `isAdmin` prop is true (passed from App.tsx).
- Success screen always shows reference number (FB-XXXXXX format).

## Wiring
- `App.tsx`: added `"feedback-center"` to Modal type, `FeedbackCenterModal` lazy import, `showFeedbackCenter` callback, rendered at `{modal === "feedback-center"}`.
- `SettingsPage.tsx`: added `onFeedbackCenter: () => void` prop; "HELP & SUPPORT" section added before "ACCOUNT" section with 3 rows.
- `translations.ts`: added `fcHelpSupportSection` / `fcHelpSupportSub` keys to interface + EN + TK objects.

## Backend
- `artifacts/api-server/src/routes/feedback.ts` — full REST API:
  - `POST /feedback` — creates any feedback type, returns `{ id, referenceNumber }` (FB-XXXXXX)
  - `GET /feedback/my` — requireAuth, returns user's own submissions
  - `GET /feedback?type=&category=&priority=&platform=&status=&search=&limit=&offset=` — requireAdmin, paginated with total
  - `GET /feedback/export` — requireAdmin, returns CSV download
  - `PATCH /feedback/:id` — requireAdmin, update status + adminNote
  - `POST /feedback/bulk` — requireAdmin, bulk status update
  - `DELETE /feedback/:id` — requireAdmin

## Database
- `lib/db/src/schema/feedback.ts` — Drizzle schema with all PEP-705 columns.
- `artifacts/api-server/src/migrate.ts` — idempotent ALTER TABLE ADD COLUMN IF NOT EXISTS for all new columns + backfill reference_number for pre-existing rows.

**Why:** New columns added via ALTER TABLE (not table recreation) so existing feedback rows are preserved.
**How to apply:** Migration runs automatically on API server startup.

## Status values
New statuses: `new | reviewed | in_progress | planned | completed | closed` (old: open/resolved/wont_fix still displayed by StatusBadge as-is).
