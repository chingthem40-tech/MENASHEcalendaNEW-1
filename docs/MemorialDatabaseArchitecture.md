# Memorial Sanctuary — Database Architecture

> **Sprint:** SPR-012
> **Role:** Senior Database Architect
> **Status:** Architecture Only — No implementation, no migrations, no SQL execution
> **Builds on:** `docs/MemorialArchitecture.md` (SPR-011)
> **Last updated:** 2026-06-27

---

## Table of Contents

1. [Stack & Conventions](#stack--conventions)
2. [Table Designs](#table-designs)
3. [Relationship Diagrams](#relationship-diagrams)
4. [Row Level Security](#row-level-security)
5. [Storage Architecture](#storage-architecture)
6. [Performance Architecture](#performance-architecture)
7. [Privacy Architecture](#privacy-architecture)
8. [Migration Roadmap](#migration-roadmap)

---

## Stack & Conventions

### Technology Stack

| Layer | Technology |
|---|---|
| Database engine | PostgreSQL 16 |
| ORM | Drizzle ORM (`drizzle-orm/pg-core`) |
| Schema validation | `drizzle-zod` + `zod/v4` |
| Connection | `pg.Pool` via `DATABASE_URL` env var |
| File storage | Google Cloud Storage (GCS) |
| Auth identifiers | Clerk `userId` (string, e.g. `user_2abc…`) |

### Naming Conventions

| Convention | Rule |
|---|---|
| Table names | `snake_case`, plural (e.g. `memorial_candles`) |
| Column names | `snake_case` (e.g. `created_at`, `family_id`) |
| Primary keys | `id` — UUID v4, `gen_random_uuid()` default |
| Foreign keys | `{entity}_id` (e.g. `memorial_id`, `person_id`) |
| Soft-delete | `deleted_at TIMESTAMPTZ NULL` — NULL = active |
| Timestamps | `created_at`, `updated_at` — always `TIMESTAMPTZ NOT NULL DEFAULT now()` |
| Enums | PostgreSQL native `CREATE TYPE … AS ENUM` |
| Boolean defaults | Explicit `DEFAULT false` or `DEFAULT true` always stated |
| Indexes | `idx_{table}_{column(s)}` |
| Unique constraints | `uq_{table}_{column(s)}` |
| Check constraints | `chk_{table}_{rule}` |

### UUID Strategy

All primary keys are `UUID` generated server-side via `gen_random_uuid()`. This enables:
- Safe cross-shard distribution (future-proof)
- No sequential ID enumeration (security)
- Pre-generation of IDs before insert (idempotent writes)

The existing `books` table uses `serial` (integer PK) — Memorial tables adopt the newer UUID standard established for all new domains.

---

## Table Designs

### Enum Types

Define all enum types before table creation. These are PostgreSQL native enums.

```
memorial_status         draft | published | archived | removed
privacy_level           private | family | community | public
interaction_permission  nobody | family | community | public
candle_type             yahrzeit | shabbat | memorial | neshama | shloshim
flower_type             rose | lily | marigold | sunflower | white_flower | wildflower
tribute_status          pending | approved | rejected | removed
prayer_type             kaddish | el_maleh | tehillim | mishnah | general | yizkor
story_status            draft | published | archived
timeline_event_type     birth | aliyah | marriage | achievement | community | historical | death
location_type           burial | birthplace | hometown | synagogue | other
family_member_role      admin | member | viewer
notification_type       yahrzeit_reminder | new_candle | new_tribute | new_prayer |
                        moderation_required | yahrzeit_anniversary | new_visitor |
                        story_published
notification_channel    push | email | in_app
notification_status     pending | sent | failed | read
relationship_type       spouse | parent | child | sibling | grandparent | grandchild |
                        aunt_uncle | niece_nephew | cousin | community_elder | rabbi | friend
media_mime_category     image | audio | document
visit_platform          web | mobile | share_link
moderation_item_type    tribute | photo | story
```

---

### Table: `memorial_communities`

Represents a named community (Bnei Menashe congregation or sub-group).

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
name                    TEXT              NOT NULL  —                min 2 chars
description             TEXT              NULL      —
created_by              TEXT              NOT NULL  —                Clerk userId
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —                soft-delete
member_count            INTEGER           NOT NULL  0                denormalised
memorial_count          INTEGER           NOT NULL  0                denormalised
```

**Indexes:**
- `idx_memorial_communities_created_by` on `(created_by)`
- `idx_memorial_communities_deleted_at` on `(deleted_at)` WHERE `deleted_at IS NULL`

**Constraints:**
- `chk_memorial_communities_name_len` — `length(name) >= 2`

---

### Table: `memorial_families`

A family unit that stewards one or more memorials.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
name                    TEXT              NOT NULL  —                e.g. "The Ben-David Family"
community_id            UUID              NULL      —                FK → memorial_communities.id
primary_contact_id      TEXT              NOT NULL  —                Clerk userId (FamilyAdmin)
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —                soft-delete
member_count            INTEGER           NOT NULL  0                denormalised
```

**Foreign keys:**
- `community_id` → `memorial_communities(id)` ON DELETE SET NULL

**Indexes:**
- `idx_memorial_families_community` on `(community_id)` WHERE `deleted_at IS NULL`
- `idx_memorial_families_contact` on `(primary_contact_id)` WHERE `deleted_at IS NULL`

---

### Table: `memorial_family_members`

Junction: Clerk user ↔ Family with a role.

```
Column                  Type                  Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID                  NOT NULL  gen_random_uuid() PK
family_id               UUID                  NOT NULL  —                FK → memorial_families.id
user_id                 TEXT                  NOT NULL  —                Clerk userId
role                    family_member_role    NOT NULL  'member'
joined_at               TIMESTAMPTZ           NOT NULL  now()
invited_by              TEXT                  NULL      —                Clerk userId
```

**Foreign keys:**
- `family_id` → `memorial_families(id)` ON DELETE CASCADE

**Unique constraint:**
- `uq_family_members_family_user` on `(family_id, user_id)`

**Indexes:**
- `idx_family_members_user` on `(user_id)`
- `idx_family_members_family` on `(family_id)`

**Constraints:**
- Enforced at service layer: at least one `admin` role must exist per family at all times

---

### Table: `memorial_persons`

Biographical record of the deceased.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
full_name               TEXT              NOT NULL  —                secular or transliterated
hebrew_name             TEXT              NULL      —                שם בן/בת
hebrew_father_name      TEXT              NULL      —
hebrew_mother_name      TEXT              NULL      —
birth_date              DATE              NULL      —
birth_date_hebrew       TEXT              NULL      —                e.g. "כ׳ תמוז תשמ״ה"
death_date              DATE              NOT NULL  —                required for publication
death_date_hebrew       TEXT              NULL      —
birth_city              TEXT              NULL      —
birth_country           TEXT              NULL      —                ISO 3166-1 alpha-2
death_city              TEXT              NULL      —
death_country           TEXT              NULL      —                ISO 3166-1 alpha-2
tribe_affiliation       TEXT              NULL      —                Bnei Menashe context
occupation              TEXT              NULL      —
biography               TEXT              NULL      —                long-form, no hard limit
profile_photo_id        UUID              NULL      —                FK → memorial_photos.id (deferred)
biography_tsv           TSVECTOR          NULL      —                full-text search vector
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —                soft-delete
```

**Constraints:**
- `chk_persons_death_not_future` — `death_date <= CURRENT_DATE`
- `chk_persons_birth_before_death` — `birth_date IS NULL OR birth_date < death_date`
- `chk_persons_full_name_len` — `length(full_name) >= 2`

**Indexes:**
- `idx_persons_full_name_tsv` — GIN on `biography_tsv` (full-text search)
- `idx_persons_death_date` on `(death_date)`
- `idx_persons_deleted_at` on `(deleted_at)` WHERE `deleted_at IS NULL`

**Computed column trigger (on insert/update):**
```
biography_tsv = to_tsvector('english',
    coalesce(full_name, '') || ' ' ||
    coalesce(hebrew_name, '') || ' ' ||
    coalesce(biography, '')
)
```

---

### Table: `memorials`

Central aggregate root. One per deceased person.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
slug                    TEXT              NOT NULL  —                URL-safe, globally unique
person_id               UUID              NOT NULL  —                FK → memorial_persons.id
family_id               UUID              NOT NULL  —                FK → memorial_families.id
community_id            UUID              NULL      —                FK → memorial_communities.id
status                  memorial_status   NOT NULL  'draft'
created_by              TEXT              NOT NULL  —                Clerk userId
published_at            TIMESTAMPTZ       NULL      —
last_activity_at        TIMESTAMPTZ       NOT NULL  now()
featured_photo_id       UUID              NULL      —                FK → memorial_photos.id (deferred)
featured_story_id       UUID              NULL      —                FK → memorial_stories.id (deferred)
candle_count            INTEGER           NOT NULL  0                denormalised cache
flower_count            INTEGER           NOT NULL  0                denormalised cache
tribute_count           INTEGER           NOT NULL  0                denormalised cache
prayer_count            INTEGER           NOT NULL  0                denormalised cache
view_count              INTEGER           NOT NULL  0                denormalised cache
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —                soft-delete
```

**Foreign keys:**
- `person_id` → `memorial_persons(id)` ON DELETE RESTRICT
- `family_id` → `memorial_families(id)` ON DELETE RESTRICT
- `community_id` → `memorial_communities(id)` ON DELETE SET NULL
- `featured_photo_id` → `memorial_photos(id)` ON DELETE SET NULL (deferred)
- `featured_story_id` → `memorial_stories(id)` ON DELETE SET NULL (deferred)

**Unique constraint:**
- `uq_memorials_slug` on `(slug)`
- `uq_memorials_person` on `(person_id)` — one memorial per person

**Indexes:**
- `idx_memorials_family` on `(family_id)` WHERE `deleted_at IS NULL`
- `idx_memorials_community` on `(community_id)` WHERE `deleted_at IS NULL`
- `idx_memorials_status` on `(status)` WHERE `deleted_at IS NULL`
- `idx_memorials_last_activity` on `(last_activity_at DESC)` WHERE `status = 'published'`
- `idx_memorials_slug` on `(slug)` WHERE `deleted_at IS NULL`

**Constraints:**
- `chk_memorials_slug_format` — `slug ~ '^[a-z0-9][a-z0-9\-]{1,78}[a-z0-9]$'`

---

### Table: `memorial_privacy`

One-to-one with `memorials`. Controls visibility and interaction caps.

```
Column                      Type                    Nullable  Default
──────────────────────────────────────────────────────────────────────────────
id                          UUID                    NOT NULL  gen_random_uuid()  PK
memorial_id                 UUID                    NOT NULL  —                  FK → memorials.id
visibility_level            privacy_level           NOT NULL  'family'
can_light_candles           interaction_permission  NOT NULL  'community'
can_leave_flowers           interaction_permission  NOT NULL  'community'
can_leave_tributes          interaction_permission  NOT NULL  'family'
can_leave_prayers           interaction_permission  NOT NULL  'community'
can_view_photos             interaction_permission  NOT NULL  'family'
can_view_stories            interaction_permission  NOT NULL  'family'
require_moderation          BOOLEAN                 NOT NULL  true
allow_guest_interaction     BOOLEAN                 NOT NULL  false
allow_search_indexing       BOOLEAN                 NOT NULL  true
updated_at                  TIMESTAMPTZ             NOT NULL  now()
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE

**Unique constraint:**
- `uq_memorial_privacy_memorial` on `(memorial_id)`

**Business rule (enforced at service layer):**
- No `can_*` column may have a more permissive value than `visibility_level`

---

### Table: `memorial_candles`

Virtual candles lit at a memorial.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NOT NULL  —                FK → memorials.id
user_id                 TEXT              NULL      —                Clerk userId; NULL = guest
guest_name              TEXT              NULL      —                required if user_id IS NULL
message                 TEXT              NULL      —                max 280 chars
candle_type             candle_type       NOT NULL  'memorial'
is_anonymous            BOOLEAN           NOT NULL  false
ip_hash                 TEXT              NULL      —                SHA-256 of IP, for rate limiting
lit_at                  TIMESTAMPTZ       NOT NULL  now()
expires_at              TIMESTAMPTZ       NULL      —                NULL = permanent
deleted_at              TIMESTAMPTZ       NULL      —                soft-delete (moderator removal)
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE

**Indexes:**
- `idx_candles_memorial` on `(memorial_id)` WHERE `deleted_at IS NULL`
- `idx_candles_user` on `(user_id)` WHERE `user_id IS NOT NULL`
- `idx_candles_expires` on `(expires_at)` WHERE `expires_at IS NOT NULL AND deleted_at IS NULL`
- `idx_candles_ip_hash` on `(memorial_id, ip_hash, lit_at)` — rate limit lookup

**Constraints:**
- `chk_candles_guest_name` — `user_id IS NOT NULL OR (guest_name IS NOT NULL AND length(guest_name) > 0)`
- `chk_candles_message_len` — `message IS NULL OR length(message) <= 280`

---

### Table: `memorial_flowers`

Virtual flowers left at a memorial.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NOT NULL  —                FK → memorials.id
user_id                 TEXT              NULL      —                Clerk userId; NULL = guest
guest_name              TEXT              NULL      —
flower_type             flower_type       NOT NULL  'white_flower'
message                 TEXT              NULL      —                max 140 chars
is_anonymous            BOOLEAN           NOT NULL  false
ip_hash                 TEXT              NULL      —
left_at                 TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE

**Indexes:**
- `idx_flowers_memorial` on `(memorial_id)` WHERE `deleted_at IS NULL`
- `idx_flowers_user` on `(user_id)` WHERE `user_id IS NOT NULL`
- `idx_flowers_ip_hash` on `(memorial_id, ip_hash, left_at)` — rate limit lookup

**Constraints:**
- `chk_flowers_guest_name` — `user_id IS NOT NULL OR (guest_name IS NOT NULL AND length(guest_name) > 0)`
- `chk_flowers_message_len` — `message IS NULL OR length(message) <= 140`

---

### Table: `memorial_tributes`

Written condolences with moderation workflow.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NOT NULL  —                FK → memorials.id
user_id                 TEXT              NULL      —                Clerk userId; NULL = guest
guest_name              TEXT              NULL      —
guest_email             TEXT              NULL      —                not stored in plain text — see Privacy §
title                   TEXT              NULL      —                max 100 chars
body                    TEXT              NOT NULL  —                max 2000 chars, min 10 chars
language                TEXT              NOT NULL  'en'             en | tk | he
is_anonymous            BOOLEAN           NOT NULL  false
status                  tribute_status    NOT NULL  'pending'
moderated_by            TEXT              NULL      —                Clerk userId
moderated_at            TIMESTAMPTZ       NULL      —
rejection_reason        TEXT              NULL      —
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE

**Indexes:**
- `idx_tributes_memorial_status` on `(memorial_id, status)` WHERE `deleted_at IS NULL`
- `idx_tributes_user` on `(user_id)` WHERE `user_id IS NOT NULL`
- `idx_tributes_pending` on `(status, created_at)` WHERE `status = 'pending' AND deleted_at IS NULL`

**Constraints:**
- `chk_tributes_body_min` — `length(body) >= 10`
- `chk_tributes_body_max` — `length(body) <= 2000`
- `chk_tributes_title_max` — `title IS NULL OR length(title) <= 100`
- `chk_tributes_guest_name` — `user_id IS NOT NULL OR (guest_name IS NOT NULL AND length(guest_name) > 0)`

---

### Table: `memorial_prayers`

Prayer / Kaddish / Tehillim records.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NOT NULL  —                FK → memorials.id
user_id                 TEXT              NULL      —                Clerk userId; NULL = guest
guest_name              TEXT              NULL      —
prayer_type             prayer_type       NOT NULL  'general'
dedication_text         TEXT              NULL      —                max 500 chars
hebrew_name             TEXT              NULL      —                departed's name in prayer
is_anonymous            BOOLEAN           NOT NULL  false
prayed_at               TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE

**Indexes:**
- `idx_prayers_memorial` on `(memorial_id)` WHERE `deleted_at IS NULL`
- `idx_prayers_type` on `(memorial_id, prayer_type)` WHERE `deleted_at IS NULL`
- `idx_prayers_user` on `(user_id)` WHERE `user_id IS NOT NULL`

**Constraints:**
- `chk_prayers_dedication_len` — `dedication_text IS NULL OR length(dedication_text) <= 500`

---

### Table: `memorial_media`

Normalised file asset registry. Actual bytes live in GCS.

```
Column                  Type                Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID                NOT NULL  gen_random_uuid() PK
uploaded_by             TEXT                NOT NULL  —                Clerk userId
storage_key             TEXT                NOT NULL  —                GCS object path
storage_bucket          TEXT                NOT NULL  —                GCS bucket name
mime_type               TEXT                NOT NULL  —                e.g. image/jpeg
mime_category           media_mime_category NOT NULL  —                image|audio|document
size_bytes              BIGINT              NOT NULL  —
width                   INTEGER             NULL      —                images only
height                  INTEGER             NULL      —                images only
duration_seconds        INTEGER             NULL      —                audio/video only
original_filename       TEXT                NULL      —
is_processed            BOOLEAN             NOT NULL  false
created_at              TIMESTAMPTZ         NOT NULL  now()
deleted_at              TIMESTAMPTZ         NULL      —
```

**Unique constraint:**
- `uq_media_storage_key` on `(storage_key)`

**Indexes:**
- `idx_media_uploaded_by` on `(uploaded_by)`
- `idx_media_orphan_check` on `(created_at)` WHERE `deleted_at IS NULL`

---

### Table: `memorial_photos`

Photo records linked to memorials, persons, or tributes.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NULL      —                FK → memorials.id
person_id               UUID              NULL      —                FK → memorial_persons.id
tribute_id              UUID              NULL      —                FK → memorial_tributes.id
uploaded_by             TEXT              NOT NULL  —                Clerk userId
media_id                UUID              NOT NULL  —                FK → memorial_media.id
caption                 TEXT              NULL      —                max 200 chars
taken_year              INTEGER           NULL      —
taken_location          TEXT              NULL      —
is_featured             BOOLEAN           NOT NULL  false
is_approved             BOOLEAN           NOT NULL  false
created_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE
- `person_id` → `memorial_persons(id)` ON DELETE CASCADE
- `tribute_id` → `memorial_tributes(id)` ON DELETE CASCADE
- `media_id` → `memorial_media(id)` ON DELETE RESTRICT

**Indexes:**
- `idx_photos_memorial` on `(memorial_id)` WHERE `deleted_at IS NULL`
- `idx_photos_person` on `(person_id)` WHERE `deleted_at IS NULL`
- `idx_photos_featured` on `(memorial_id, is_featured)` WHERE `is_featured = true AND deleted_at IS NULL`

**Constraints:**
- `chk_photos_caption_len` — `caption IS NULL OR length(caption) <= 200`
- `chk_photos_taken_year` — `taken_year IS NULL OR (taken_year >= 1800 AND taken_year <= EXTRACT(YEAR FROM now()))`
- `chk_photos_parent` — `memorial_id IS NOT NULL OR person_id IS NOT NULL OR tribute_id IS NOT NULL`

**Unique partial index:**
- `uq_photos_memorial_featured` — unique on `(memorial_id)` WHERE `is_featured = true AND deleted_at IS NULL`

---

### Table: `memorial_stories`

Long-form narratives, eulogies, life stories.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NOT NULL  —                FK → memorials.id
author_id               TEXT              NOT NULL  —                Clerk userId
title                   TEXT              NOT NULL  —                max 200 chars
body                    TEXT              NOT NULL  —                Markdown; max 20,000 chars
language                TEXT              NOT NULL  'en'             en | tk | he
status                  story_status      NOT NULL  'draft'
is_featured             BOOLEAN           NOT NULL  false
published_at            TIMESTAMPTZ       NULL      —
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —
body_tsv                TSVECTOR          NULL      —                full-text search vector
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE

**Indexes:**
- `idx_stories_memorial_status` on `(memorial_id, status)` WHERE `deleted_at IS NULL`
- `idx_stories_author` on `(author_id)` WHERE `deleted_at IS NULL`
- `idx_stories_tsv` — GIN on `body_tsv`

**Unique partial index:**
- `uq_stories_memorial_featured` — unique on `(memorial_id)` WHERE `is_featured = true AND deleted_at IS NULL`

**Constraints:**
- `chk_stories_title_len` — `length(title) >= 1 AND length(title) <= 200`
- `chk_stories_body_len` — `length(body) >= 50 AND length(body) <= 20000`

---

### Table: `memorial_timelines`

One timeline per memorial (parent container).

```
Column                  Type              Nullable  Default
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid()  PK
memorial_id             UUID              NOT NULL  —                  FK → memorials.id
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE

**Unique constraint:**
- `uq_timelines_memorial` on `(memorial_id)`

---

### Table: `memorial_timeline_events`

Individual life events within a timeline.

```
Column                  Type                  Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID                  NOT NULL  gen_random_uuid() PK
timeline_id             UUID                  NOT NULL  —                FK → memorial_timelines.id
year                    INTEGER               NOT NULL  —
hebrew_year             TEXT                  NULL      —                e.g. "תשמ״ה"
title                   TEXT                  NOT NULL  —                max 200 chars
description             TEXT                  NULL      —                max 1000 chars
event_type              timeline_event_type   NOT NULL  'historical'
media_id                UUID                  NULL      —                FK → memorial_media.id
sort_order              INTEGER               NOT NULL  0
created_at              TIMESTAMPTZ           NOT NULL  now()
updated_at              TIMESTAMPTZ           NOT NULL  now()
deleted_at              TIMESTAMPTZ           NULL      —
```

**Foreign keys:**
- `timeline_id` → `memorial_timelines(id)` ON DELETE CASCADE
- `media_id` → `memorial_media(id)` ON DELETE SET NULL

**Unique constraint:**
- `uq_timeline_events_order` on `(timeline_id, sort_order)` WHERE `deleted_at IS NULL`

**Indexes:**
- `idx_timeline_events_timeline` on `(timeline_id, sort_order)` WHERE `deleted_at IS NULL`

**Constraints:**
- `chk_timeline_events_year` — `year <= EXTRACT(YEAR FROM now())`
- `chk_timeline_events_title_len` — `length(title) >= 1 AND length(title) <= 200`

---

### Table: `memorial_yahrzeits`

Hebrew death anniversary record per memorial.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NOT NULL  —                FK → memorials.id
person_id               UUID              NOT NULL  —                FK → memorial_persons.id
hebrew_death_month      INTEGER           NOT NULL  —                1–13
hebrew_death_day        INTEGER           NOT NULL  —                1–30
gregorian_death_date    DATE              NOT NULL  —                sourced from Person
next_yahrzeit_date      DATE              NULL      —                precomputed, refreshed annually
last_reminder_sent_at   TIMESTAMPTZ       NULL      —
created_at              TIMESTAMPTZ       NOT NULL  now()
updated_at              TIMESTAMPTZ       NOT NULL  now()
```

**Foreign keys:**
- `memorial_id` → `memorials(id)` ON DELETE CASCADE
- `person_id` → `memorial_persons(id)` ON DELETE RESTRICT

**Unique constraint:**
- `uq_yahrzeits_memorial` on `(memorial_id)`

**Indexes:**
- `idx_yahrzeits_next_date` on `(next_yahrzeit_date)` WHERE `next_yahrzeit_date IS NOT NULL`

**Constraints:**
- `chk_yahrzeits_month` — `hebrew_death_month >= 1 AND hebrew_death_month <= 13`
- `chk_yahrzeits_day` — `hebrew_death_day >= 1 AND hebrew_death_day <= 30`

---

### Table: `memorial_yahrzeit_subscribers`

Users subscribed to reminders for a given Yahrzeit.

```
Column                  Type              Nullable  Default
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid()  PK
yahrzeit_id             UUID              NOT NULL  —                  FK → memorial_yahrzeits.id
user_id                 TEXT              NOT NULL  —                  Clerk userId
subscribed_at           TIMESTAMPTZ       NOT NULL  now()
```

**Foreign keys:**
- `yahrzeit_id` → `memorial_yahrzeits(id)` ON DELETE CASCADE

**Unique constraint:**
- `uq_yahrzeit_subs` on `(yahrzeit_id, user_id)`

**Indexes:**
- `idx_yahrzeit_subs_user` on `(user_id)`

---

### Table: `memorial_locations`

Physical places associated with the deceased.

```
Column                  Type              Nullable  Default
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
person_id               UUID              NOT NULL  —                FK → memorial_persons.id
location_type           location_type     NOT NULL  'burial'
label                   TEXT              NOT NULL  —                max 100 chars
address                 TEXT              NULL      —
city                    TEXT              NULL      —
country                 TEXT              NULL      —                ISO 3166-1 alpha-2
latitude                NUMERIC(10,8)     NULL      —
longitude               NUMERIC(11,8)     NULL      —
notes                   TEXT              NULL      —
created_at              TIMESTAMPTZ       NOT NULL  now()
deleted_at              TIMESTAMPTZ       NULL      —
```

**Foreign keys:**
- `person_id` → `memorial_persons(id)` ON DELETE CASCADE

**Indexes:**
- `idx_locations_person` on `(person_id)` WHERE `deleted_at IS NULL`
- `idx_locations_geo` — GIST on `(point(longitude, latitude))` WHERE `latitude IS NOT NULL AND longitude IS NOT NULL`

---

### Table: `memorial_relationships`

Genealogical / community links between two persons.

```
Column                  Type                Nullable  Default
──────────────────────────────────────────────────────────────────────────────
id                      UUID                NOT NULL  gen_random_uuid()  PK
from_person_id          UUID                NOT NULL  —                  FK → memorial_persons.id
to_person_id            UUID                NOT NULL  —                  FK → memorial_persons.id
relationship_type       relationship_type   NOT NULL  —
label                   TEXT                NULL      —                  custom override
created_at              TIMESTAMPTZ         NOT NULL  now()
```

**Foreign keys:**
- `from_person_id` → `memorial_persons(id)` ON DELETE CASCADE
- `to_person_id` → `memorial_persons(id)` ON DELETE CASCADE

**Unique constraint:**
- `uq_relationships_triplet` on `(from_person_id, to_person_id, relationship_type)`

**Constraints:**
- `chk_relationships_no_self` — `from_person_id <> to_person_id`

---

### Table: `memorial_visitor_log`

Append-only visit tracking. Partitioned by month.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
memorial_id             UUID              NOT NULL  —                FK → memorials.id (no cascade — log only)
user_id                 TEXT              NULL      —                Clerk userId
session_id              TEXT              NOT NULL  —                anonymous session token
visited_at              TIMESTAMPTZ       NOT NULL  now()            partition key
duration_seconds        INTEGER           NULL      —
referrer                TEXT              NULL      —
country                 TEXT              NULL      —                2-letter ISO
platform                visit_platform    NOT NULL  'web'
```

**Partition strategy:** Range partition on `visited_at` — one partition per month.
**Retention:** 24-month rolling window. Older partitions dropped automatically.
**No soft-delete:** Log records are never modified. Drop entire old partitions.

**Indexes (per partition):**
- `idx_visitor_log_memorial_time` on `(memorial_id, visited_at DESC)`
- `idx_visitor_log_session` on `(session_id, memorial_id, visited_at)` — deduplication window

---

### Table: `memorial_notifications`

Outbound notification log. Partitioned by month.

```
Column                  Type                  Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID                  NOT NULL  gen_random_uuid() PK
recipient_user_id       TEXT                  NOT NULL  —                Clerk userId
memorial_id             UUID                  NULL      —                no FK constraint (log table)
notification_type       notification_type     NOT NULL  —
channel                 notification_channel  NOT NULL  —
status                  notification_status   NOT NULL  'pending'
scheduled_for           TIMESTAMPTZ           NOT NULL  —                partition key
sent_at                 TIMESTAMPTZ           NULL      —
payload                 JSONB                 NOT NULL  '{}'
error_message           TEXT                  NULL      —
```

**Partition strategy:** Range partition on `scheduled_for` — one partition per month.
**Retention:** 12-month rolling window.

**Indexes (per partition):**
- `idx_notifications_pending` on `(status, scheduled_for)` WHERE `status = 'pending'`
- `idx_notifications_user` on `(recipient_user_id, scheduled_for DESC)`

---

### Table: `memorial_audit_log`

Immutable audit trail for all sensitive mutations.

```
Column                  Type              Nullable  Default          Notes
──────────────────────────────────────────────────────────────────────────────
id                      UUID              NOT NULL  gen_random_uuid() PK
actor_user_id           TEXT              NOT NULL  —                Clerk userId
action                  TEXT              NOT NULL  —                e.g. 'memorial.published'
target_table            TEXT              NOT NULL  —                e.g. 'memorials'
target_id               UUID              NOT NULL  —
old_values              JSONB             NULL      —                before-state snapshot
new_values              JSONB             NULL      —                after-state snapshot
ip_hash                 TEXT              NULL      —
occurred_at             TIMESTAMPTZ       NOT NULL  now()            partition key
```

**Partition strategy:** Range partition on `occurred_at` — one partition per quarter.
**Retention:** 7 years (legal/compliance).
**Immutable:** No UPDATE or DELETE ever permitted on this table (RLS enforces INSERT-only).

**Indexes (per partition):**
- `idx_audit_target` on `(target_table, target_id, occurred_at DESC)`
- `idx_audit_actor` on `(actor_user_id, occurred_at DESC)`

---

## Relationship Diagrams

### Primary Ownership Hierarchy

```
memorial_communities (1)
    └── memorial_families (many)
            └── memorial_family_members (many)   [junction: user ↔ family]
            └── memorials (many)
                    │
                    ├── memorial_persons (1:1)
                    │       ├── memorial_locations (many)
                    │       └── memorial_relationships (many:many via self-join)
                    │
                    ├── memorial_privacy (1:1)
                    │
                    ├── memorial_yahrzeits (1:1)
                    │       └── memorial_yahrzeit_subscribers (many)
                    │
                    └── memorial_timelines (1:1)
                            └── memorial_timeline_events (many)
```

### Interaction Ring (Visitor-contributed)

```
memorials (1)
    ├── memorial_candles (many)
    ├── memorial_flowers (many)
    ├── memorial_prayers (many)
    ├── memorial_tributes (many)
    │       └── memorial_photos (many, via tribute_id)
    ├── memorial_photos (many, via memorial_id)
    ├── memorial_stories (many)
    └── memorial_visitor_log (many, append-only)
```

### Media References

```
memorial_media (1)
    ├── referenced by memorial_photos.media_id (1:1)
    └── referenced by memorial_timeline_events.media_id (1:1)
```

### Cascade Rules Summary

| Parent deleted | Child table | Cascade action |
|---|---|---|
| `memorials` | `memorial_privacy` | CASCADE |
| `memorials` | `memorial_candles` | CASCADE |
| `memorials` | `memorial_flowers` | CASCADE |
| `memorials` | `memorial_prayers` | CASCADE |
| `memorials` | `memorial_tributes` | CASCADE |
| `memorials` | `memorial_photos` (memorial_id) | CASCADE |
| `memorials` | `memorial_stories` | CASCADE |
| `memorials` | `memorial_timelines` | CASCADE |
| `memorials` | `memorial_yahrzeits` | CASCADE |
| `memorials` | `memorial_visitor_log` | NO ACTION (log table — no FK) |
| `memorial_timelines` | `memorial_timeline_events` | CASCADE |
| `memorial_persons` | `memorial_locations` | CASCADE |
| `memorial_persons` | `memorial_relationships` | CASCADE |
| `memorial_persons` | `memorial_yahrzeits` | RESTRICT |
| `memorial_persons` | `memorial_photos` (person_id) | CASCADE |
| `memorial_families` | `memorial_family_members` | CASCADE |
| `memorial_families` | `memorials` | RESTRICT (cannot delete family with memorials) |
| `memorial_communities` | `memorial_families` | SET NULL |
| `memorial_communities` | `memorials` | SET NULL |
| `memorial_tributes` | `memorial_photos` (tribute_id) | CASCADE |
| `memorial_yahrzeits` | `memorial_yahrzeit_subscribers` | CASCADE |
| `memorial_media` | `memorial_photos` (media_id) | RESTRICT |
| `memorial_media` | `memorial_timeline_events` (media_id) | SET NULL |

---

## Row Level Security

RLS is defined using PostgreSQL native policies. The auth identity is the Clerk `userId` passed as a session variable: `current_setting('app.current_user_id', true)`.

All tables have `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. The application service role uses a dedicated DB role (`memorial_app`) that is subject to RLS.

---

### Helper Functions (defined once, reused in all policies)

```
-- Returns current Clerk userId from session variable
auth.uid() → TEXT
  RETURN current_setting('app.current_user_id', true);

-- Returns true if uid is a member of the given family (any role)
auth.is_family_member(family_id UUID) → BOOLEAN
  RETURN EXISTS (
    SELECT 1 FROM memorial_family_members
    WHERE family_id = $1 AND user_id = auth.uid()
  );

-- Returns true if uid is a FamilyAdmin of the given family
auth.is_family_admin(family_id UUID) → BOOLEAN
  RETURN EXISTS (
    SELECT 1 FROM memorial_family_members
    WHERE family_id = $1 AND user_id = auth.uid() AND role = 'admin'
  );

-- Returns true if uid is a moderator or admin of the given community
auth.is_community_moderator(community_id UUID) → BOOLEAN
  RETURN EXISTS (
    SELECT 1 FROM memorial_community_roles
    WHERE community_id = $1 AND user_id = auth.uid()
      AND role IN ('moderator', 'admin')
  );

-- Returns true if uid is a Platform Administrator
auth.is_platform_admin() → BOOLEAN
  RETURN current_setting('app.is_platform_admin', true)::boolean;
```

---

### RLS: `memorials`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `memorials_select_public` | SELECT | All (including anon) | `status = 'published' AND deleted_at IS NULL AND privacy.visibility_level = 'public'` |
| `memorials_select_community` | SELECT | Authenticated users | `status = 'published' AND deleted_at IS NULL AND privacy.visibility_level IN ('public','community')` |
| `memorials_select_family` | SELECT | Family members | `deleted_at IS NULL AND auth.is_family_member(family_id)` |
| `memorials_select_private` | SELECT | Family members | `deleted_at IS NULL AND auth.is_family_member(family_id)` (covers private) |
| `memorials_select_admin` | SELECT | Platform admin | `TRUE` — bypass |
| `memorials_insert` | INSERT | Authenticated users | `created_by = auth.uid()` |
| `memorials_update` | UPDATE | FamilyAdmin | `auth.is_family_admin(family_id) AND deleted_at IS NULL` |
| `memorials_update_admin` | UPDATE | Platform admin | `TRUE` |
| `memorials_delete` | DELETE | Platform admin only | `auth.is_platform_admin()` — hard delete never used; soft-delete via UPDATE |

**Note:** SELECT policies join with `memorial_privacy` via memorial_id to evaluate visibility_level. Privacy is always checked inline in the SELECT policy condition.

---

### RLS: `memorial_candles`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `candles_select` | SELECT | Anyone | `deleted_at IS NULL AND` memorial is readable (via privacy policy) |
| `candles_insert_auth` | INSERT | Authenticated | `user_id = auth.uid()` |
| `candles_insert_guest` | INSERT | Anon | `user_id IS NULL AND guest_name IS NOT NULL` (when privacy allows guests) |
| `candles_delete_own` | DELETE (soft) | Author | `user_id = auth.uid()` |
| `candles_delete_mod` | DELETE (soft) | Moderator/FamilyAdmin | `auth.is_community_moderator(…) OR auth.is_family_admin(…)` |

Identical RLS shape applies to `memorial_flowers` and `memorial_prayers`.

---

### RLS: `memorial_tributes`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `tributes_select_approved` | SELECT | Community+ | `status = 'approved' AND deleted_at IS NULL AND` memorial readable |
| `tributes_select_own` | SELECT | Author | `user_id = auth.uid()` |
| `tributes_select_family` | SELECT | FamilyAdmin | `auth.is_family_admin(memorial.family_id)` |
| `tributes_select_mod` | SELECT | Moderator | All statuses for their community |
| `tributes_insert` | INSERT | Authenticated + guests | `user_id = auth.uid() OR (user_id IS NULL AND guest_name IS NOT NULL)` |
| `tributes_update_own` | UPDATE | Author | `user_id = auth.uid() AND status = 'pending'` |
| `tributes_update_mod` | UPDATE | Moderator/FamilyAdmin | `status` field only (approve/reject) |
| `tributes_delete` | DELETE (soft) | Author, FamilyAdmin, Moderator, Admin | role-based |

---

### RLS: `memorial_photos`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `photos_select_approved` | SELECT | Per privacy.can_view_photos | `is_approved = true AND deleted_at IS NULL` |
| `photos_select_family` | SELECT | FamilyMember | All photos including unapproved |
| `photos_insert` | INSERT | FamilyMember | `uploaded_by = auth.uid() AND auth.is_family_member(memorial.family_id)` |
| `photos_approve` | UPDATE | FamilyAdmin, Moderator | `is_approved` field only |
| `photos_delete` | DELETE (soft) | Uploader, FamilyAdmin, Moderator | role-based |

---

### RLS: `memorial_stories`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `stories_select_published` | SELECT | Per privacy.can_view_stories | `status = 'published' AND deleted_at IS NULL` |
| `stories_select_own` | SELECT | Author | `author_id = auth.uid()` |
| `stories_select_family` | SELECT | FamilyMember | All statuses |
| `stories_insert` | INSERT | Authenticated | `author_id = auth.uid() AND auth.uid() IS NOT NULL` |
| `stories_update` | UPDATE | Author | `author_id = auth.uid()` |
| `stories_delete` | DELETE (soft) | Author, FamilyAdmin | role-based |

---

### RLS: `memorial_privacy`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `privacy_select` | SELECT | Anyone | Readable with the parent memorial |
| `privacy_update` | UPDATE | FamilyAdmin | `auth.is_family_admin(memorial.family_id)` |

No INSERT policy — privacy row created atomically with memorial via service layer.

---

### RLS: `memorial_audit_log`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `audit_insert` | INSERT | App service role | `TRUE` — all mutations insert audit rows |
| `audit_select` | SELECT | Platform admin | `auth.is_platform_admin()` |
| `audit_update` | UPDATE | NONE | Denied for all — immutable |
| `audit_delete` | DELETE | NONE | Denied for all — immutable |

---

### RLS: `memorial_visitor_log`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `visitor_insert` | INSERT | All (anon OK) | `TRUE` — rate-limited at service layer |
| `visitor_select` | SELECT | FamilyAdmin | `auth.is_family_admin(memorial.family_id)` for their memorials |
| `visitor_select_admin` | SELECT | Platform admin | `TRUE` |
| `visitor_update` | UPDATE | NONE | Denied — append-only |
| `visitor_delete` | DELETE | NONE | Denied — partition drop only |

---

### RLS: `memorial_family_members`

| Policy | Command | Who | Condition |
|---|---|---|---|
| `fam_members_select` | SELECT | FamilyMember | `auth.is_family_member(family_id)` |
| `fam_members_insert` | INSERT | FamilyAdmin | `auth.is_family_admin(family_id)` |
| `fam_members_update` | UPDATE | FamilyAdmin | `auth.is_family_admin(family_id)` (role changes only) |
| `fam_members_delete` | DELETE | FamilyAdmin | `auth.is_family_admin(family_id)` |

**Constraint:** Platform admin ensures at least one `admin` row always exists (service-layer guard, cannot drop last admin).

---

## Storage Architecture

All binary assets are stored in Google Cloud Storage (GCS). The `memorial_media` table stores only metadata.

### Bucket Design

#### `menashe-memorial-photos` (public-read)

- **Contents:** Approved, published memorial photos and person profile pictures
- **Object path:** `memorials/{memorial_id}/photos/{media_id}/{filename}`
- **Access:** Public read (CDN-served), authenticated write via signed upload URL
- **CORS:** Allow GET from all origins; PUT/POST from `*.replit.app` and production domain only
- **Lifecycle rule:** No automatic deletion; objects removed only when `memorial_media.deleted_at` is set and confirmed by cleanup job

#### `menashe-memorial-media-private` (private)

- **Contents:** Pending/unapproved photos, story inline images, audio tributes, documents
- **Object path:** `private/{user_id}/{media_id}/{filename}`
- **Access:** No public read. Serve via short-lived signed URLs generated server-side (15-minute expiry)
- **Lifecycle rule:** Objects older than 30 days with no `memorial_media` reference are auto-deleted (orphan cleanup)

#### `menashe-memorial-stories` (private)

- **Contents:** Story body backups and exported PDFs (future premium feature)
- **Object path:** `stories/{memorial_id}/{story_id}/{version}.md`
- **Access:** Signed URL only, 60-minute expiry
- **Versioning:** GCS object versioning enabled — keep last 10 versions per story

#### `menashe-memorial-audio` (private)

- **Contents:** Voice tribute recordings, audio dedications
- **Object path:** `audio/{memorial_id}/{media_id}.{ext}`
- **Access:** Signed URL only, 30-minute expiry
- **Format:** Accept only `audio/webm`, `audio/mp4`, `audio/mpeg`; transcode to `audio/mp4` via background job
- **Max size:** 10 MB per file

#### `menashe-memorial-documents` (private)

- **Contents:** Uploaded memorial booklets, scanned historical records (future)
- **Object path:** `documents/{memorial_id}/{media_id}.pdf`
- **Access:** Signed URL, 60-minute expiry
- **Max size:** 25 MB per file

### Upload Flow

```
Client → POST /api/media/upload-url  (authenticated)
       → Server validates mime type, size, memorial membership
       → Server creates memorial_media row (is_processed = false)
       → Server returns signed GCS upload URL (15-minute expiry)
       → Client uploads directly to GCS (bypasses server)
       → GCS triggers Cloud Function → sets is_processed = true
           (or: client calls POST /api/media/{id}/confirm after upload)
```

### Signed URL Policy

| Bucket | Read URL TTL | Write URL TTL | Who can generate |
|---|---|---|---|
| `photos` (public) | N/A (CDN) | 15 min | FamilyMember+ |
| `media-private` | 15 min | 15 min | FamilyMember+ |
| `stories` | 60 min | 60 min | Author + FamilyAdmin |
| `audio` | 30 min | 15 min | Any authenticated |
| `documents` | 60 min | 15 min | FamilyAdmin+ |

---

## Performance Architecture

### Index Strategy

#### Read-critical query patterns and their covering indexes

| Query pattern | Table | Index |
|---|---|---|
| Memorial by slug (public page load) | `memorials` | Unique on `(slug)` WHERE `deleted_at IS NULL` |
| All memorials for a family | `memorials` | `(family_id, status)` WHERE `deleted_at IS NULL` |
| Active candles for a memorial | `memorial_candles` | `(memorial_id, lit_at DESC)` WHERE `deleted_at IS NULL` |
| Prayers by type for Kaddish board | `memorial_prayers` | `(memorial_id, prayer_type, prayed_at DESC)` WHERE `deleted_at IS NULL` |
| Pending tributes (moderation queue) | `memorial_tributes` | `(status, created_at ASC)` WHERE `status = 'pending' AND deleted_at IS NULL` |
| Upcoming yahrzeits (scheduler) | `memorial_yahrzeits` | `(next_yahrzeit_date)` WHERE `next_yahrzeit_date IS NOT NULL` |
| Person name full-text search | `memorial_persons` | GIN on `biography_tsv` |
| Story search | `memorial_stories` | GIN on `body_tsv` |
| Burial location map | `memorial_locations` | GIST on `(point(longitude, latitude))` WHERE type = 'burial' |
| Rate limit — candle | `memorial_candles` | `(memorial_id, ip_hash, lit_at)` — partial 24h window |
| Rate limit — flower | `memorial_flowers` | `(memorial_id, ip_hash, left_at)` |
| Visitor deduplication | `memorial_visitor_log` | `(session_id, memorial_id, visited_at)` per partition |
| Notifications pending dispatch | `memorial_notifications` | `(status, scheduled_for)` per partition |
| User's yahrzeit subscriptions | `memorial_yahrzeit_subscribers` | `(user_id)` |

---

### Full-Text Search Strategy

**Level 1 — PostgreSQL `tsvector` (implemented at V1):**

- `memorial_persons.biography_tsv` — weighted `tsvector`:
  - Weight A: `full_name` (highest)
  - Weight B: `hebrew_name`
  - Weight C: `biography`
- `memorial_stories.body_tsv` — weighted `tsvector`:
  - Weight A: `title`
  - Weight B: first 500 chars of `body`
- Both updated via trigger on INSERT/UPDATE
- Search via `to_tsquery('english', ?)` with `plainto_tsquery` fallback for phrase queries
- Hebrew text: use `simple` dictionary (no stemming) for `hebrew_name` / `hebrew_year`

**Level 2 — External search index (V2+):**

When memorial count exceeds ~50,000 records, consider syncing to a dedicated search service (e.g. Typesense or Meilisearch). The `memorial_persons.biography_tsv` + `memorials` fields are the projection dataset.

---

### Pagination Strategy

**Cursor-based pagination** for all public-facing list endpoints:

```
Cursor = base64(last_row.sort_key + ':' + last_row.id)

SELECT … FROM memorial_candles
WHERE memorial_id = $1
  AND deleted_at IS NULL
  AND (lit_at, id) < ($cursor_lit_at, $cursor_id)   -- forward cursor
ORDER BY lit_at DESC, id DESC
LIMIT $page_size                                      -- max 50
```

Cursor pagination avoids the `OFFSET` performance cliff and is stable under concurrent inserts.

**Page size limits:**
| Entity | Default page size | Max page size |
|---|---|---|
| Candles | 20 | 50 |
| Flowers | 20 | 50 |
| Tributes | 10 | 25 |
| Prayers | 20 | 50 |
| Photos | 12 | 48 |
| Stories | 5 | 20 |
| Timeline events | 50 | 100 |
| Memorial search results | 10 | 30 |

---

### Counter Cache Strategy

The `memorials` table stores five denormalised counters:

```
candle_count    flower_count    tribute_count    prayer_count    view_count
```

**Rules:**
1. Counters are NEVER incremented in the synchronous write path (no `UPDATE memorials SET candle_count = candle_count + 1`)
2. A background job runs every 60 seconds: `SELECT COUNT(*) FROM memorial_candles WHERE memorial_id = $1 AND deleted_at IS NULL` → `UPDATE memorials SET candle_count = $count`
3. For high-traffic memorials (viewCount updating frequently), use PostgreSQL `LISTEN/NOTIFY`: the insert trigger notifies channel `memorial_counter_update:{memorial_id}` and an in-process listener batches the refresh
4. Counter reads are fast (single column on the memorials row); slight staleness (≤60s) is acceptable

---

### Materialised Views

Define these views for the V2 phase when query complexity grows:

#### `mv_memorial_summary`

Pre-joined view for search result cards:

```
Columns: memorial.id, memorial.slug, memorial.status, memorial.candle_count,
         memorial.flower_count, memorial.tribute_count, person.full_name,
         person.hebrew_name, person.death_date, person.death_date_hebrew,
         person.birth_date, person.biography (first 280 chars),
         privacy.visibility_level, featured_photo.media_id (for URL construction)
```

Refreshed: every 5 minutes via `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_memorial_summary`

#### `mv_yahrzeit_upcoming`

Pre-computed 30-day Yahrzeit window:

```
Columns: yahrzeit.id, yahrzeit.memorial_id, yahrzeit.next_yahrzeit_date,
         person.full_name, person.hebrew_name, memorial.slug,
         subscriber_count (from yahrzeit_subscribers)
```

Refreshed: nightly at midnight UTC

---

### Partition Recommendations

#### `memorial_visitor_log` — Monthly range partition

```
Partition name: memorial_visitor_log_YYYY_MM
Partition key:  visited_at
Retention:      24 months (older partitions detached and dropped)
Automation:     pg_partman extension or manual scheduled DROP PARTITION
```

#### `memorial_notifications` — Monthly range partition

```
Partition name: memorial_notifications_YYYY_MM
Partition key:  scheduled_for
Retention:      12 months
```

#### `memorial_audit_log` — Quarterly range partition

```
Partition name: memorial_audit_log_YYYY_QN
Partition key:  occurred_at
Retention:      7 years (immutable; archive to cold storage after 2 years)
```

**Future:** If `memorial_tributes` or `memorial_candles` exceed 10 million rows, add hash partition on `memorial_id` (8 buckets). No action needed at V1.

---

## Privacy Architecture

### Soft Delete

All mutable tables include `deleted_at TIMESTAMPTZ NULL`. A NULL value means the record is active.

**Rules:**
- Application code NEVER issues hard `DELETE` on any memorial domain table (except via migration or platform admin tool)
- "Delete" at the service layer = `UPDATE … SET deleted_at = now()`
- All queries add `WHERE deleted_at IS NULL` — enforced via Drizzle ORM query builder helpers, not relied on alone (RLS provides the second layer)
- Soft-deleted records are excluded from all RLS SELECT policies automatically

**Purge schedule (GDPR compliance):**
- Soft-deleted records older than 30 days are eligible for hard deletion by the scheduled purge job
- Hard purge exemption: `memorial_audit_log` (7-year retention regardless of soft-delete)

---

### Audit Trail

Every state-changing operation on sensitive tables appends a row to `memorial_audit_log`.

**Tables that trigger audit inserts:**

| Table | Audited actions |
|---|---|
| `memorials` | INSERT, status change, soft-delete, slug assignment |
| `memorial_persons` | INSERT, UPDATE, soft-delete |
| `memorial_privacy` | UPDATE |
| `memorial_tributes` | status transitions (pending→approved→rejected), soft-delete |
| `memorial_photos` | is_approved change, soft-delete |
| `memorial_stories` | status transitions, soft-delete |
| `memorial_family_members` | INSERT, role change, DELETE |
| `memorial_yahrzeits` | hebrew date override |

**Implementation:** PostgreSQL trigger on each table — fires AFTER INSERT/UPDATE/DELETE, writes `old_values` (JSON of old row) and `new_values` (JSON of new row) to `memorial_audit_log`.

---

### GDPR-Style Data Erasure

When a user requests erasure:

**Step 1 — Anonymise (immediate):**
- `memorial_candles`: SET `user_id = NULL`, `guest_name = 'Anonymous'`, `message = NULL`, `ip_hash = NULL`
- `memorial_flowers`: SET `user_id = NULL`, `guest_name = 'Anonymous'`, `ip_hash = NULL`
- `memorial_tributes`: SET `user_id = NULL`, `guest_name = 'Anonymous'`, `guest_email = NULL`
- `memorial_prayers`: SET `user_id = NULL`, `guest_name = 'Anonymous'`
- `memorial_visitor_log`: SET `user_id = NULL`, `session_id = gen_random_uuid()::text`
- `memorial_stories`: if `status = 'draft'` → soft-delete; if `status = 'published'` → SET `author_id = '[deleted]'`
- `memorial_family_members`: soft-delete the membership row

**Step 2 — Media (within 30 days):**
- GCS objects uploaded by the user: delete from GCS, set `memorial_media.deleted_at = now()`
- Featured photos: unset `memorials.featured_photo_id` if pointing to their photo

**Step 3 — Audit log:**
- Audit log entries referencing the user's `actor_user_id` are NOT erased (legal requirement)
- The `actor_user_id` value is replaced with a pseudonymous hash: `hash_md5(user_id || salt)` — preserves audit trail integrity without storing PII

**Step 4 — Notification log:**
- `memorial_notifications` rows for this recipient: set `recipient_user_id = '[erased]'`, clear `payload`

**Step 5 — Confirmation:**
- Erasure record written to a separate `user_erasure_requests` table (outside the memorial domain — platform-level)

---

### Visibility Enforcement

Privacy visibility is applied at three independent layers (defence in depth):

```
Layer 1: RLS policy on SELECT (database level — cannot be bypassed by app)
Layer 2: Repository query filter in WHERE clause (Drizzle ORM — defence in depth)
Layer 3: Service layer PrivacyContext check before returning data (application level)
```

Concretely: a `public` memorial is readable to everyone. A `family` memorial returns 0 rows from the DB to a non-family authenticated user — they cannot see it even if they guess the slug or ID.

---

### Family Privacy Boundaries

- A Family member can see **all** content on their family's memorials regardless of Privacy settings (they are the stewards)
- Family members CANNOT see other families' `private` memorials even if they are part of the same Community
- Community membership grants visibility to `community`-level memorials only
- `private` memorials: visible only to their own Family members and Platform Admins

---

## Migration Roadmap

### Version 1 — Core Memorial Domain

**Scope:** Everything needed for a single family to create, publish, and receive tributes on a memorial.

**Tables:**
```
memorial_communities
memorial_families
memorial_family_members
memorial_persons
memorials
memorial_privacy
memorial_candles
memorial_flowers
memorial_tributes
memorial_prayers
memorial_photos
memorial_media
memorial_timelines
memorial_timeline_events
memorial_yahrzeits
memorial_yahrzeit_subscribers
memorial_locations
memorial_relationships
memorial_visitor_log       (unpartitioned at V1, partition added at V1.1)
memorial_notifications     (reuse existing push_subscriptions pattern)
memorial_audit_log
```

**Enums:** All 15 enum types

**Indexes:** All indexes marked as V1 above

**RLS:** Full RLS on all tables

**GCS buckets:** `menashe-memorial-photos`, `menashe-memorial-media-private`

---

### Version 1.1 — Partition & Search

**Trigger:** 10,000 visitor log rows OR 6 months of operation

**Changes:**
- Convert `memorial_visitor_log` to monthly range-partitioned table
- Convert `memorial_notifications` to monthly range-partitioned table
- Add `memorial_audit_log` quarterly partitioning
- Enable `biography_tsv` trigger on `memorial_persons`
- Enable `body_tsv` trigger on `memorial_stories`
- Create `mv_memorial_summary` materialised view
- Add GIST index on `memorial_locations (point(longitude, latitude))`
- Add `pg_partman` configuration for automatic monthly partition creation

---

### Version 2 — Stories, Audio & Premium

**Trigger:** Feature flag enabled for Premium tier

**Changes:**
- Add `memorial_stories` with Markdown support (already in V1 schema, V2 = feature flag)
- Add `menashe-memorial-stories` and `menashe-memorial-audio` GCS buckets
- Add `mv_yahrzeit_upcoming` materialised view
- Implement counter-refresh background job
- Add `LISTEN/NOTIFY` counter update pipeline for high-traffic memorials
- Add `memorial_community_roles` table (separate moderator/admin role table extracted from Community)
- Extend `memorial_media` with `transcoded_key` column for audio transcoding

---

### Version 3 — Scale & Search Upgrade

**Trigger:** 50,000 memorial records OR search latency > 200ms p95

**Changes:**
- External search index sync (Typesense/Meilisearch) from `mv_memorial_summary`
- Hash partition `memorial_candles` and `memorial_tributes` on `memorial_id` (8 buckets)
- Add read replica routing for SELECT queries on `memorial_visitor_log` stats
- Archive `memorial_audit_log` partitions older than 2 years to cold GCS bucket
- Implement `memorial_bulk_import` pipeline for community historical records
- `memorial_documents` GCS bucket + `memorial_media` document references

---

### Version 4 — AI & Eulogy Features

**Trigger:** AI Eulogy Assist feature sprint approved

**Changes:**
- Add `memorial_ai_generations` table: `(id, memorial_id, requested_by, model_used, prompt_hash, generated_text, created_at)` — audit trail for AI output
- Add `story_source` column to `memorial_stories`: `enum: human | ai_draft | ai_assisted`
- Extend `memorial_persons.biography_tsv` to include timeline event descriptions

---

*End of SPR-012 — Memorial Database Architecture. Awaiting Chief Architect review.*
