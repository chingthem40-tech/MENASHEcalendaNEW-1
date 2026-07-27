# Database Overview

> Purpose: Complete reference for the PostgreSQL schema, migration strategy, ORM usage, and data access patterns.
> Last updated: 2026-06-26 (SPR-001)

---

## Technology Stack

- **Database:** PostgreSQL (Replit managed)
- **ORM:** Drizzle ORM (`drizzle-orm/node-postgres`)
- **Schema definitions:** `lib/db/src/schema/`
- **Migration tool:** Drizzle Kit (`drizzle-kit push`) for development; raw SQL in `artifacts/api-server/src/migrate.ts` for runtime startup

---

## Migration Strategy (Current)

On every server start, `runMigrations()` in `migrate.ts` executes a series of `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` raw SQL statements.

**Problems with this approach:**
1. No migration version tracking — impossible to know which changes have been applied
2. No rollback capability — a bad migration cannot be undone automatically
3. Every startup re-runs all statements — adds latency and noise to logs
4. Diverges from Drizzle Kit's intended workflow

**Recommended fix (SPR-002):** Replace with Drizzle Kit migration files (`drizzle-kit generate` + `drizzle-kit migrate`), stored in `lib/db/migrations/`. Remove the raw SQL startup script.

---

## Complete Table Reference

### `books`
Siddur library entries managed by admin.
| Column | Type | Notes |
|---|---|---|
| `id` | Serial PK | |
| `title` | Text | Required |
| `language` | Text | `"en"`, `"tk"`, `"he"` |
| `category` | Text | Filter grouping |
| `description` | Text | |
| `cover_emoji` | Text | Fallback when no image |
| `cover_color` | Text | Background color hex |
| `file_url` | Text | PDF or EPUB URL |
| `is_premium` | Boolean | Gated behind premium |
| `published` | Boolean | Visibility toggle |
| `sort_order` | Integer | Manual ordering |
| `cover_image_url` | Text | Optional image override |
| `created_at` | Timestamptz | |
| `updated_at` | Timestamptz | |

### `user_profiles`
Private per-user settings synced from client.
| Column | Type | Notes |
|---|---|---|
| `user_id` | Text PK | Clerk user ID |
| `theme` | Text | `"dark"`, `"light"`, `"sapphire"` |
| `location` | JSONB | `{ lat, lng, name, tz, candleLightingMinutes }` |
| `is_premium` | Boolean | |
| `candle_enabled` | Boolean | Memorial Sanctuary candle opt-in |
| `language` | Text | `"en"` or `"tk"` |
| `notif_prefs` | JSONB | Map of event type → boolean |
| `lead_time` | Integer | Minutes before event for notification |
| `updated_at` | Timestamptz | |

### `user_public_profiles`
Searchable community directory entry.
| Column | Type | Notes |
|---|---|---|
| `user_id` | Text PK | Clerk user ID |
| `display_name` | Text | |
| `congregation` | Text | |
| `bio` | Text | |
| `role` | Text | Community role label |
| `city` | Text | |
| `country` | Text | |
| `avatar_emoji` | Text | |
| `profile_photo_url` | Text | GCS URL |
| `updated_at` | Timestamptz | |

### `yahrzeit_entries`
Personal memorial dates (private).
| Column | Type | Notes |
|---|---|---|
| `id` | Text | UUID |
| `user_id` | Text | Clerk user ID |
| `name` | Text | Name of the deceased |
| `hebrew_day` | Integer | |
| `hebrew_month` | Integer | |
| `display_date` | Text | Human-readable label |
| `was_after_sunset` | Boolean | Determines effective date |
| `created_at` | Timestamptz | |
**PK:** `(user_id, id)`

### `torah_tracker_entries`
Daily Torah study log.
| Column | Type | Notes |
|---|---|---|
| `id` | Text | UUID |
| `user_id` | Text | Clerk user ID |
| `date` | Text | YYYY-MM-DD |
| `subject` | Text | Gemara, Parasha, Halacha, etc. |
| `description` | Text | |
| `duration` | Integer | Minutes studied |
| `notes` | Text | |
| `created_at` | Timestamptz | |
**PK:** `(user_id, id)`

### `torah_tracker_goals`
Daily study time target per user.
| Column | Type | Notes |
|---|---|---|
| `user_id` | Text PK | Clerk user ID |
| `goal_mins` | Integer | |
| `updated_at` | Timestamptz | |

### `community_yahrzeit`
Public memorial board entries.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `user_id` | Text | Creator's Clerk ID |
| `deceased_name` | Text | |
| `hebrew_day` | Integer | |
| `hebrew_month` | Integer | |
| `display_date` | Text | |
| `passing_year` | Integer | |
| `message` | Text | Memorial message |
| `candle_lit` | Boolean | |
| `candle_lit_by` | Text | Display name of lighter |
| `candle_lit_at` | Timestamptz | |
| `donor_display_name` | Text | |
| `created_at` | Timestamptz | |

### `community_yahrzeit_learners`
Active study dedications linked to a community memorial.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `entry_id` | Text | FK → `community_yahrzeit.id` (implicit) |
| `user_id` | Text | Clerk user ID |
| `learner_name` | Text | |
| `study_subject` | Text | |
| `active_until` | Timestamptz | Expiry of dedication |
| `created_at` | Timestamptz | |

### `push_subscriptions`
Web Push VAPID subscriptions.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `endpoint` | Text | Push service URL |
| `p256dh` | Text | Encryption key |
| `auth` | Text | Auth secret |
| `schedule` | JSONB | Notification schedule prefs |
| `user_id` | Text | Clerk user ID (nullable) |
| `added_at` | Timestamptz | |
| `updated_at` | Timestamptz | |
**Index:** `push_subscriptions(user_id)`

### `expo_push_tokens`
Mobile Expo push tokens.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `user_id` | Text | Clerk user ID |
| `token` | Text UNIQUE | Expo push token |
| `location` | JSONB | User's location at token registration |
| `notif_prefs` | JSONB | Notification preferences |
| `lead_mins` | Integer | Alert lead time |
| `updated_at` | Timestamptz | |
| `created_at` | Timestamptz | |
**Index:** `expo_push_tokens(user_id)`

### `census_branches`
Local community branch records (one per admin user).
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `owner_user_id` | Text UNIQUE | Clerk user ID |
| `name` | Text | Branch name |
| `city_id` | Text | |
| `city_name` | Text | |
| `admin_name` | Text | |
| `established` | Text | Year or date string |
| `families` | JSONB | ⚠️ Unvalidated array of family records |
| `updated_at` / `created_at` | Timestamptz | |

### `census_submissions`
Branch-level review queue.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `owner_user_id` | Text | Clerk user ID |
| `branch_data` | JSONB | ⚠️ Snapshot of branch at submission time |
| `status` | Text | `"pending"`, `"approved"`, `"rejected"` |
| `submitted_at` | Timestamptz | |
| `reviewed_at` | Timestamptz | |
| `review_note` | Text | |

### `census_member_submissions`
Individual family/member census forms.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `branch_id` | Text | FK → `census_branches.id` (implicit) |
| `branch_name` | Text | |
| `submitter_name` | Text | |
| `submitter_note` | Text | |
| `head_census` | JSONB | ⚠️ Unvalidated household head data |
| `members` | JSONB | ⚠️ Unvalidated array of member records |
| `status` | Text | |
| `submitted_at` / `reviewed_at` | Timestamptz | |
| `review_note` | Text | |

### `community_announcements`
Admin-broadcast messages.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `emoji` | Text | |
| `title` | Text | |
| `body` | Text | |
| `status` | Text | `"active"`, `"draft"`, `"archived"` |
| `pinned` | Boolean | |
| `scheduled_at` | Timestamptz | |
| `sent_at` | Timestamptz | |
| `created_at` / `updated_at` | Timestamptz | |

### `premium_requests`
User applications for premium status.
| Column | Type | Notes |
|---|---|---|
| `id` | Text PK | UUID |
| `user_id` | Text UNIQUE | One request per user |
| `status` | Text | `"pending"`, `"approved"`, `"rejected"` |
| `note` | Text | User-submitted reason |
| `display_name` / `avatar_emoji` / `congregation` / `city` / `country` | Text | Profile snapshot |
| `requested_at` / `reviewed_at` | Timestamptz | |

### `payment_records`
Razorpay transaction log.
| Column | Type | Notes |
|---|---|---|
| `id` | Serial PK | |
| `user_id` | Text | Clerk user ID |
| `order_id` | Text | Razorpay order ID |
| `payment_id` | Text UNIQUE | Razorpay payment ID |
| `plan` | Text | `"monthly"`, `"annual"` |
| `amount` | Integer | Amount in paise |
| `status` | Text | `"success"`, `"failed"` |
| `created_at` | Timestamptz | |

### `scheduled_broadcasts`
Scheduled push notification queue.
| Column | Type | Notes |
|---|---|---|
| `id` | Serial PK | |
| `emoji` / `title` / `body` | Text | Message content |
| `fire_at` | Timestamptz | When to send |
| `sent_at` | Timestamptz | Null until delivered |
| `created_at` | Timestamptz | |

---

## Missing Constraints (Technical Debt)

| Issue | Tables Affected | Priority |
|---|---|---|
| No foreign key constraints | `community_yahrzeit_learners.entry_id`, `census_member_submissions.branch_id` | High |
| No indexes on `user_id` in most tables | `yahrzeit_entries`, `torah_tracker_*`, `community_yahrzeit`, `census_*`, `premium_requests`, `payment_records` | High |
| JSONB columns without Zod validation before insert | `census_branches.families`, `census_member_submissions.head_census`, `census_member_submissions.members` | Critical |
| No soft-delete pattern | All tables | Low |
