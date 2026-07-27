# Memorial Sanctuary — Domain Architecture

> **Sprint:** SPR-011 (architecture) · SPR-015–SPR-017 (implementation)
> **Role:** Senior Software Architect / Domain Architect / Database Architect
> **Status:** Living Memorial Experience implemented (SPR-017)
> **Last updated:** 2026-06-27

## SPR-017 Implementation Status

SPR-017 delivered the **Living Memorial Experience** — transforming memorial profiles into active places of remembrance:

### Completed (frontend)
- **Extended types**: `relationship` + `community` on `MemorialCandle`/`LightCandleInput`; `TributeType` enum + `tributeType` on `MemorialTribute`/`AddTributeInput`; `sort` param on `SearchMemorialParams`
- **`useFamilyManagement` hook**: fetches family + members, provides invite / updateRole / remove
- **`useCollections` hook**: 5 parallel collection queries with sort hints (recentlyRemembered, mostVisited, recentlyLit, upcomingYahrzeit, communityPicks)
- **`MemorialProfilePage` enhanced**: candle tabs (Recent/Today/Community), tribute type filter chips, Load More for both candles and tributes, YahrzeitAlert banner (today = full card with suggestions; ≤7 days = subtle banner), Family Management Sheet (invite + role + remove), enhanced CandleSheet (relationship picker + community text), enhanced TributeSheet (tribute type picker)
- **`MemorialSanctuaryPage` enhanced**: 5 live collection strips using `useCollections`, horizontal scroll layout
- **40 new bilingual translation keys** (EN + TK) for all SPR-017 UI

### Pending (server / DB)
- `relationship` and `community` columns on `memorial_candles` table → Drizzle migration needed
- `tribute_type` column on `memorial_tributes` table → Drizzle migration needed
- `sort` query param support on `GET /memorials/search` → API route update needed
- Once DB columns exist, the frontend will receive and display them automatically (types already extended)

---

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Domain Overview](#domain-overview)
3. [Core Domain Entities](#core-domain-entities)
4. [Domain Relationship Diagram](#domain-relationship-diagram)
5. [Repository Architecture](#repository-architecture)
6. [Service Layer Architecture](#service-layer-architecture)
7. [Future API Design](#future-api-design)
8. [Permission Model](#permission-model)
9. [Scalability Recommendations](#scalability-recommendations)
10. [Future Expansion Notes](#future-expansion-notes)

---

## Executive Summary

The Community Memorial Sanctuary is a sacred digital space for the Bnei Menashe community to honour, remember, and maintain connection with those who have passed. It combines Jewish memorial traditions (Yahrzeit, Kaddish, candle lighting) with a persistent communal record accessible to families across the world.

The architecture must support:

- Thousands of individual memorials over time
- Family-based ownership and multi-generational stewardship
- Jewish calendar integration (Yahrzeit dates, Yizkor, Shloshim)
- Community-visible tributes, prayers, candles, and flowers
- Privacy tiers (private, family-only, community, public)
- Moderation at community and administrator level
- Future media uploads (photos, voice recordings, stories)

This document defines the domain model, repositories, services, APIs, and permissions that form the architectural foundation. **No UI, no 3D world, no React components, no database migrations, and no route implementations are included here.**

---

## Domain Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MEMORIAL SANCTUARY DOMAIN                       │
│                                                                     │
│   Family ──── owns ────→ Memorial ────────────────────────────────┐ │
│                              │                                    │ │
│                    ┌─────────┼──────────────────┐                │ │
│                    ↓         ↓                  ↓                │ │
│                 Person    Yahrzeit           Privacy              │ │
│                    │         │                                    │ │
│                    ↓         ↓                                    │ │
│               Timeline   Notification                             │ │
│                                                                   │ │
│   Visitor ──── visits ──→ Memorial ────────────────────────────→ │ │
│                              │                                    │ │
│              ┌───────────────┼──────────────────────┐            │ │
│              ↓               ↓                      ↓            │ │
│           Candle           Flower                Tribute          │ │
│              │               │                      │            │ │
│              └───────────────┴──────────────────────┘            │ │
│                              ↓                                   │ │
│                           Prayer                                  │ │
│                              │                                    │ │
│              ┌───────────────┼──────────────────────┐            │ │
│              ↓               ↓                      ↓            │ │
│            Photo           Story                Location          │ │
│                                                                   │ │
│   Community ──── moderates ──→ Memorial                          │ │
│   Media ──── attached to ──→ Photo | Story | Tribute             │ │
│   Relationship ──── links ──→ Person ←→ Person                   │ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Domain Entities

### 1. Memorial

**Purpose:** The central aggregate root. Represents a single person's memorial page — the persistent sacred record of a community member who has passed.

**Primary fields:**
```
id                  UUID, primary key
slug                string, URL-safe unique identifier (e.g. "rabbi-yosef-ben-david")
personId            UUID → Person
familyId            UUID → Family (primary owning family)
privacyId           UUID → Privacy
status              enum: draft | published | archived | removed
createdBy           UUID → userId (Clerk)
createdAt           timestamp
publishedAt         timestamp | null
lastActivityAt      timestamp
viewCount           integer
candleCount         integer (denormalised counter)
flowerCount         integer (denormalised counter)
tributeCount        integer (denormalised counter)
prayerCount         integer (denormalised counter)
featuredPhotoId     UUID → Photo | null
featuredStoryId     UUID → Story | null
communityId         UUID → Community | null
```

**Relationships:**
- Belongs to one `Person`
- Belongs to one `Family` (primary steward)
- Has one `Privacy` configuration
- Has many `Candle`
- Has many `Flower`
- Has many `Tribute`
- Has many `Photo`
- Has many `Story`
- Has many `Prayer`
- Has many `Visitor` (through VisitLog)
- Has many `Yahrzeit` entries
- Has one `Timeline`
- Optionally belongs to one `Community`

**Ownership:** Created by a family member or community admin. Transferred via explicit stewardship grant.

**Lifecycle:** `draft → published → (archived | removed)`

**Validation rules:**
- `slug` must be globally unique, 3–80 chars, URL-safe
- Cannot publish without a linked `Person` with at least `fullName` and `deathDate`
- `viewCount`, `candleCount`, etc. are eventually-consistent counters — never directly updated by visitor writes

---

### 2. Person

**Purpose:** The biographical record of the deceased. Separated from `Memorial` so that multiple memorials are not possible for one person, and biographical data is cleanly owned.

**Primary fields:**
```
id                  UUID, primary key
fullName            string (secular or Hebrew as entered)
hebrewName          string | null (שם בן/בת אב)
hebrewFatherName    string | null
hebrewMotherName    string | null
birthDate           date | null
birthDateHebrew     string | null (e.g. "כ׳ תמוז תשמ״ה")
deathDate           date (required for published memorial)
deathDateHebrew     string | null
birthCity           string | null
birthCountry        string | null
deathCity           string | null
deathCountry        string | null
tribeAffiliation    string | null (Bnei Menashe community context)
occupation          string | null
biography           text | null
profilePhotoId      UUID → Photo | null
```

**Relationships:**
- Has one `Memorial`
- Has many `Relationship` (links to other Persons)
- Has one `Timeline` (via Memorial)

**Ownership:** Owned by the linked `Family`; biographical edits restricted to Family Admin or above.

**Lifecycle:** Created with memorial draft; not independently deleted.

**Validation rules:**
- `deathDate` must not be in the future
- `birthDate` must be before `deathDate` if both supplied
- `fullName` minimum 2 characters

---

### 3. Family

**Purpose:** Represents the family unit that stewards a memorial. Enables multi-member family administration and generational handoff.

**Primary fields:**
```
id                  UUID, primary key
name                string (e.g. "The Ben-David Family")
primaryContactId    UUID → userId (Clerk) — Family Admin
communityId         UUID → Community | null
createdAt           timestamp
memberCount         integer (denormalised)
```

**Relationships:**
- Has many `FamilyMember` (junction: userId + role)
- Has many `Memorial`
- Optionally belongs to one `Community`

**Ownership:** Families are self-governing; a `FamilyAdmin` can add/remove members.

**Lifecycle:** Families persist independently of individual memorials.

**Validation rules:**
- Must have at least one `FamilyAdmin` at all times
- Cannot be deleted while active published memorials exist

---

### 4. FamilyMember

**Purpose:** Junction entity linking a Clerk user to a Family with a specific role.

**Primary fields:**
```
id                  UUID, primary key
familyId            UUID → Family
userId              string (Clerk userId)
role                enum: admin | member | viewer
joinedAt            timestamp
invitedBy           UUID → userId | null
```

**Relationships:**
- Belongs to one `Family`
- Represents one Clerk user

---

### 5. Candle

**Purpose:** A virtual memorial candle lit by a visitor or family member. Core memorial interaction — deeply rooted in Jewish tradition (Yahrzeit candle, Neshama candle).

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
userId              string | null (Clerk userId, null = guest)
guestName           string | null
message             text | null (max 280 chars)
candleType          enum: yahrzeit | shabbat | memorial | neshama | shloshim
litAt               timestamp
expiresAt           timestamp | null (some candles burn for 24h, some indefinitely)
isAnonymous         boolean
ipHash              string | null (rate limiting, hashed)
```

**Relationships:**
- Belongs to one `Memorial`
- Optionally linked to a Clerk user

**Ownership:** Immutable after creation. No edits — only deletion by owner or moderator.

**Lifecycle:** Created → expires naturally (if `expiresAt` set) or persists.

**Validation rules:**
- Max 1 candle per userId per memorial per 24-hour window (rate limit)
- Guest candles require non-empty `guestName`
- `message` max 280 chars

---

### 6. Tribute

**Purpose:** A written tribute, condolence message, or memory left by visitors. The digital equivalent of signing a condolence book.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
userId              string | null
guestName           string | null
guestEmail          string | null
title               string | null (max 100 chars)
body                text (max 2000 chars)
language            enum: en | tk | he
isAnonymous         boolean
status              enum: pending | approved | rejected | removed
moderatedBy         UUID → userId | null
moderatedAt         timestamp | null
createdAt           timestamp
updatedAt           timestamp
```

**Relationships:**
- Belongs to one `Memorial`
- Has many `Media` (attached images)
- May be moderated by Community Moderator or Admin

**Ownership:** Author-owned; family and moderators can remove.

**Lifecycle:** `pending → approved → (rejected | removed)`

**Validation rules:**
- Guest tributes require moderation before display if privacy level is `community` or `public`
- Authenticated user tributes on `family` privacy memorials are auto-approved
- `body` minimum 10 characters

---

### 7. Flower

**Purpose:** A virtual flower left at the memorial. Lighter-weight than a tribute — no text required. Represents respectful presence.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
userId              string | null
guestName           string | null
flowerType          enum: rose | lily | marigold | sunflower | white_flower | wildflower
message             text | null (max 140 chars)
leftAt              timestamp
isAnonymous         boolean
ipHash              string | null
```

**Relationships:**
- Belongs to one `Memorial`

**Ownership:** Immutable after creation.

**Lifecycle:** Permanent (no expiry, unlike candles).

**Validation rules:**
- Max 3 flowers per userId per memorial per 24-hour window
- Guest flowers require non-empty `guestName`

---

### 8. Visitor

**Purpose:** Tracks visits to a memorial page for analytics and family notification. Not personal identifying data — aggregated for family awareness.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
userId              string | null
sessionId           string (anonymous session token)
visitedAt           timestamp
durationSeconds     integer | null
referrer            string | null
country             string | null (IP-derived, 2-letter code)
platform            enum: web | mobile | share_link
```

**Relationships:**
- Belongs to one `Memorial`

**Ownership:** System-generated; never user-editable.

**Lifecycle:** Append-only log. Purge after configurable retention period (default: 2 years).

**Validation rules:**
- Deduplicate: same `userId` + same `memorialId` within 1 hour = single visit record

---

### 9. Prayer

**Purpose:** A prayer or Kaddish dedication left at the memorial. Spiritually distinct from a tribute — structured around Jewish prayer types.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
userId              string | null
guestName           string | null
prayerType          enum: kaddish | el_maleh | tehillim | mishnah | general | yizkor
dedicationText      text | null (max 500 chars)
prayedAt            timestamp
isAnonymous         boolean
hebrewName          string | null (name of the departed in the prayer)
```

**Relationships:**
- Belongs to one `Memorial`

**Ownership:** Author-owned; family and moderators can remove.

**Lifecycle:** Permanent.

**Validation rules:**
- `prayerType` must be a recognised Jewish prayer type
- `dedicationText` max 500 chars

---

### 10. Photo

**Purpose:** A photograph or image attached to a memorial, person biography, or tribute.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial | null
personId            UUID → Person | null
tributeId           UUID → Tribute | null
uploadedBy          UUID → userId
mediaId             UUID → Media
caption             string | null (max 200 chars)
takenYear           integer | null
takenLocation       string | null
isFeatured          boolean
isApproved          boolean
createdAt           timestamp
```

**Relationships:**
- Belongs to one `Memorial`, `Person`, or `Tribute`
- Has one `Media` (stores actual file reference)
- Featured photo referenced by `Memorial.featuredPhotoId`

**Ownership:** Uploader-owned; Family Admin and above can approve/remove.

**Lifecycle:** `uploaded → approved → (removed)`

**Validation rules:**
- Only JPEG, PNG, WEBP, HEIC formats accepted
- Max file size: 10 MB per photo
- Max 100 photos per memorial

---

### 11. Story

**Purpose:** A longer narrative — a life story, eulogy, memory, or tribute essay. Richer than a tribute; supports chapters/sections.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
authorId            UUID → userId
title               string (max 200 chars)
body                text (max 20,000 chars, Markdown supported)
language            enum: en | tk | he
status              enum: draft | published | archived
isFeatured          boolean
publishedAt         timestamp | null
updatedAt           timestamp
```

**Relationships:**
- Belongs to one `Memorial`
- Has many `Media` (inline images within story body)

**Ownership:** Author-owned; Family Admin can feature or remove.

**Lifecycle:** `draft → published → archived`

**Validation rules:**
- Only authenticated users (not guests) may author stories
- Minimum 50 characters for publication
- Max 1 featured story per memorial (`isFeatured` enforced as unique constraint)

---

### 12. Timeline

**Purpose:** An ordered sequence of life events on the memorial. Contextualises the person's life within Jewish history and the Bnei Menashe journey.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
```

**TimelineEvent (child entity):**
```
id                  UUID, primary key
timelineId          UUID → Timeline
year                integer
hebrewYear          string | null
title               string (max 200 chars)
description         text | null (max 1000 chars)
eventType           enum: birth | aliyah | marriage | achievement | community | historical | death
mediaId             UUID → Media | null
sortOrder           integer
```

**Relationships:**
- `Timeline` belongs to one `Memorial`
- `TimelineEvent` belongs to one `Timeline`

**Ownership:** Family-managed.

**Lifecycle:** Events may be added, edited, or removed by Family Admins.

**Validation rules:**
- `year` must be ≤ current year
- `sortOrder` must be unique within a Timeline

---

### 13. Privacy

**Purpose:** Governs visibility and interaction permissions for a memorial.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
visibilityLevel     enum: private | family | community | public
canLightCandles     enum: nobody | family | community | public
canLeaveFlowers     enum: nobody | family | community | public
canLeaveTributes    enum: nobody | family | community | public
canLeavePrayers     enum: nobody | family | community | public
canViewPhotos       enum: nobody | family | community | public
canViewStories      enum: nobody | family | community | public
requireModeration   boolean (tributes require approval before display)
allowGuestInteraction boolean
allowSearchIndexing boolean
```

**Relationships:**
- Belongs to one `Memorial` (1:1)

**Ownership:** Set and modified by Family Admin.

**Lifecycle:** Updates take effect immediately.

**Validation rules:**
- `canLightCandles` permission tier cannot exceed `visibilityLevel`
- `requireModeration` = true is enforced when `visibilityLevel` = `public`

---

### 14. Community

**Purpose:** Represents the Bnei Menashe community (or a sub-community/congregation) that can collectively manage a pool of memorials.

**Primary fields:**
```
id                  UUID, primary key
name                string
description         text | null
adminUserIds        string[] (Clerk userIds with Community Admin role)
moderatorUserIds    string[] (Clerk userIds with Moderator role)
createdAt           timestamp
memberCount         integer
memorialCount       integer
```

**Relationships:**
- Has many `Memorial` (community-claimed memorials)
- Has many `Family`

**Ownership:** Platform administrators provision Communities.

**Lifecycle:** Long-lived; never deleted while memorials exist.

---

### 15. Yahrzeit

**Purpose:** Stores the annual Jewish death anniversary for a memorial. Enables automated reminders and Yahrzeit board features.

**Primary fields:**
```
id                  UUID, primary key
memorialId          UUID → Memorial
personId            UUID → Person
hebrewDeathMonth    integer (1–13, Adar/Adar II aware)
hebrewDeathDay      integer (1–30)
gregorianDeathDate  date
nextYahrzeitDate    date (precomputed, refreshed annually)
subscriberUserIds   string[] (Clerk userIds subscribed to reminders)
lastReminderSentAt  timestamp | null
```

**Relationships:**
- Belongs to one `Memorial`
- Belongs to one `Person`

**Ownership:** System-managed (computed from Person.deathDate); Family Admin may override Hebrew date.

**Lifecycle:** Yahrzeit dates are recomputed by the scheduler each year.

**Validation rules:**
- `hebrewDeathMonth` / `hebrewDeathDay` must form a valid Hebrew calendar date
- `nextYahrzeitDate` refreshed by background job after each anniversary passes

---

### 16. Location

**Purpose:** Captures burial location and places of significance associated with the person.

**Primary fields:**
```
id                  UUID, primary key
personId            UUID → Person
locationType        enum: burial | birthplace | hometown | synagogue | other
label               string (max 100 chars)
address             string | null
city                string | null
country             string | null
latitude            decimal(10, 8) | null
longitude           decimal(11, 8) | null
notes               text | null
```

**Relationships:**
- Belongs to one `Person`

**Ownership:** Family-managed.

**Lifecycle:** May be updated or removed by Family Admins.

---

### 17. Media

**Purpose:** Normalised media record for any file asset attached to the domain (photos, voice recordings, documents).

**Primary fields:**
```
id                  UUID, primary key
uploadedBy          UUID → userId
storageKey          string (GCS object key)
storageProvider     enum: gcs | local
mimeType            string
sizeBytes           integer
width               integer | null (images)
height              integer | null (images)
durationSeconds     integer | null (audio/video)
originalFilename    string | null
isProcessed         boolean
createdAt           timestamp
```

**Relationships:**
- Referenced by `Photo`, `Story`, `TimelineEvent`

**Ownership:** Uploader-owned; platform manages storage lifecycle.

**Lifecycle:** Orphaned media (no references) eligible for cleanup after 30-day grace period.

**Validation rules:**
- `storageKey` must be globally unique
- `mimeType` restricted to: `image/*`, `audio/*`, `application/pdf`

---

### 18. Notification

**Purpose:** Tracks outbound notifications to family members and subscribers (email, push, in-app).

**Primary fields:**
```
id                  UUID, primary key
recipientUserId     string (Clerk userId)
memorialId          UUID → Memorial | null
notificationType    enum: yahrzeit_reminder | new_candle | new_tribute | new_prayer | moderation_required | yahrzeit_anniversary | new_visitor | story_published
channel             enum: push | email | in_app
status              enum: pending | sent | failed | read
scheduledFor        timestamp
sentAt              timestamp | null
payload             jsonb (notification-specific data)
```

**Relationships:**
- Optionally linked to a `Memorial`

**Ownership:** System-generated; users can suppress by unsubscribing.

**Lifecycle:** Append-only log; purge after 1 year.

---

### 19. Relationship

**Purpose:** Expresses genealogical or communal relationships between two Person records.

**Primary fields:**
```
id                  UUID, primary key
fromPersonId        UUID → Person
toPersonId          UUID → Person
relationshipType    enum: spouse | parent | child | sibling | grandparent | grandchild | aunt_uncle | niece_nephew | cousin | community_elder | rabbi | friend
label               string | null (custom label override)
```

**Relationships:**
- Links two `Person` records

**Ownership:** Family-managed; bidirectional relationships created as pairs.

**Lifecycle:** May be added/removed by Family Admins.

**Validation rules:**
- `fromPersonId` ≠ `toPersonId`
- No duplicate `(fromPersonId, toPersonId, relationshipType)` triplet

---

## Domain Relationship Diagram

```
Community
    │
    ├── Family (many)
    │       │
    │       ├── FamilyMember (userId + role) (many)
    │       │
    │       └── Memorial (many) ◄──────────────────────┐
    │               │                                   │
    │               ├── Person (1:1)                    │
    │               │       │                           │
    │               │       ├── Location (many)         │
    │               │       └── Relationship (many)     │
    │               │                                   │
    │               ├── Privacy (1:1)                   │
    │               │                                   │
    │               ├── Yahrzeit (1:1)                  │
    │               │                                   │
    │               ├── Timeline (1:1)                  │
    │               │       └── TimelineEvent (many)    │
    │               │                                   │
    │               ├── Candle (many) ←── Visitor ──────┘
    │               │                                   │
    │               ├── Flower (many) ←── Visitor       │
    │               │                                   │
    │               ├── Prayer (many) ←── Visitor       │
    │               │                                   │
    │               ├── Tribute (many) ←── Visitor      │
    │               │       └── Media (many)            │
    │               │                                   │
    │               ├── Photo (many)                    │
    │               │       └── Media (1:1)             │
    │               │                                   │
    │               └── Story (many)                    │
    │                       └── Media (many)            │
    │                                                   │
    └── Notification (many) ──────────────────────────→ Memorial
```

---

## Repository Architecture

Repositories abstract all persistence concerns. Each repository owns exactly one aggregate root or closely related sub-aggregate.

---

### MemorialRepository

**Responsibility:** CRUD for `Memorial` + `Privacy` (inseparable aggregate).

**Key operations:**
```typescript
findById(id: string): Promise<Memorial | null>
findBySlug(slug: string): Promise<Memorial | null>
findByFamily(familyId: string, opts: PaginationOpts): Promise<PaginatedResult<Memorial>>
findByCommunity(communityId: string, opts: PaginationOpts): Promise<PaginatedResult<Memorial>>
findPublished(opts: PaginationOpts & SearchOpts): Promise<PaginatedResult<Memorial>>
create(data: CreateMemorialInput): Promise<Memorial>
update(id: string, data: UpdateMemorialInput): Promise<Memorial>
publish(id: string): Promise<Memorial>
archive(id: string): Promise<void>
incrementCounter(id: string, field: CounterField): Promise<void>
updatePrivacy(id: string, privacy: UpdatePrivacyInput): Promise<void>
search(query: string, opts: PaginationOpts): Promise<PaginatedResult<Memorial>>
```

---

### PersonRepository

**Responsibility:** CRUD for `Person`, `Location`, `Relationship`.

**Key operations:**
```typescript
findById(id: string): Promise<Person | null>
findByMemorial(memorialId: string): Promise<Person | null>
create(data: CreatePersonInput): Promise<Person>
update(id: string, data: UpdatePersonInput): Promise<Person>
addLocation(personId: string, data: CreateLocationInput): Promise<Location>
removeLocation(locationId: string): Promise<void>
addRelationship(data: CreateRelationshipInput): Promise<Relationship>
removeRelationship(id: string): Promise<void>
getRelationships(personId: string): Promise<Relationship[]>
```

---

### FamilyRepository

**Responsibility:** CRUD for `Family` and `FamilyMember`.

**Key operations:**
```typescript
findById(id: string): Promise<Family | null>
findByUser(userId: string): Promise<Family[]>
create(data: CreateFamilyInput, creatorUserId: string): Promise<Family>
addMember(familyId: string, userId: string, role: FamilyMemberRole): Promise<FamilyMember>
removeMember(familyId: string, userId: string): Promise<void>
updateMemberRole(familyId: string, userId: string, role: FamilyMemberRole): Promise<void>
getMembers(familyId: string): Promise<FamilyMember[]>
transferAdmin(familyId: string, fromUserId: string, toUserId: string): Promise<void>
```

---

### CandleRepository

**Responsibility:** CRUD for `Candle`.

**Key operations:**
```typescript
findByMemorial(memorialId: string, opts: PaginationOpts): Promise<PaginatedResult<Candle>>
findActiveByMemorial(memorialId: string): Promise<Candle[]>
countByMemorial(memorialId: string): Promise<number>
findByUser(userId: string): Promise<Candle[]>
create(data: CreateCandleInput): Promise<Candle>
remove(id: string): Promise<void>
hasRecentlyLit(memorialId: string, userId: string, windowHours: number): Promise<boolean>
```

---

### FlowerRepository

**Responsibility:** CRUD for `Flower`.

**Key operations:**
```typescript
findByMemorial(memorialId: string, opts: PaginationOpts): Promise<PaginatedResult<Flower>>
countByMemorial(memorialId: string): Promise<number>
create(data: CreateFlowerInput): Promise<Flower>
remove(id: string): Promise<void>
hasRecentlyLeft(memorialId: string, userId: string, windowHours: number): Promise<boolean>
```

---

### TributeRepository

**Responsibility:** CRUD for `Tribute` including moderation state.

**Key operations:**
```typescript
findByMemorial(memorialId: string, status: TributeStatus, opts: PaginationOpts): Promise<PaginatedResult<Tribute>>
findPendingModeration(communityId?: string): Promise<Tribute[]>
findById(id: string): Promise<Tribute | null>
create(data: CreateTributeInput): Promise<Tribute>
approve(id: string, moderatorId: string): Promise<Tribute>
reject(id: string, moderatorId: string, reason?: string): Promise<void>
remove(id: string): Promise<void>
update(id: string, data: UpdateTributeInput): Promise<Tribute>
```

---

### PrayerRepository

**Responsibility:** CRUD for `Prayer`.

**Key operations:**
```typescript
findByMemorial(memorialId: string, opts: PaginationOpts): Promise<PaginatedResult<Prayer>>
countByMemorial(memorialId: string): Promise<number>
countByType(memorialId: string): Promise<Record<PrayerType, number>>
create(data: CreatePrayerInput): Promise<Prayer>
remove(id: string): Promise<void>
```

---

### PhotoRepository

**Responsibility:** CRUD for `Photo` and linking to `Media`.

**Key operations:**
```typescript
findByMemorial(memorialId: string, opts: PaginationOpts): Promise<PaginatedResult<Photo>>
findByPerson(personId: string): Promise<Photo[]>
findFeatured(memorialId: string): Promise<Photo | null>
create(data: CreatePhotoInput): Promise<Photo>
setFeatured(memorialId: string, photoId: string): Promise<void>
approve(id: string): Promise<void>
remove(id: string): Promise<void>
```

---

### StoryRepository

**Responsibility:** CRUD for `Story`.

**Key operations:**
```typescript
findByMemorial(memorialId: string, status: StoryStatus): Promise<Story[]>
findById(id: string): Promise<Story | null>
create(data: CreateStoryInput): Promise<Story>
update(id: string, data: UpdateStoryInput): Promise<Story>
publish(id: string): Promise<Story>
setFeatured(memorialId: string, storyId: string): Promise<void>
archive(id: string): Promise<void>
```

---

### VisitorRepository

**Responsibility:** Append-only visit log.

**Key operations:**
```typescript
logVisit(data: CreateVisitInput): Promise<void>
getStats(memorialId: string, period: DateRange): Promise<VisitorStats>
countUnique(memorialId: string, period: DateRange): Promise<number>
getRecentVisitors(memorialId: string, limit: number): Promise<VisitorSummary[]>
isDuplicate(memorialId: string, sessionId: string, windowMinutes: number): Promise<boolean>
```

---

### YahrzeitRepository

**Responsibility:** CRUD for `Yahrzeit` and subscriber management.

**Key operations:**
```typescript
findByMemorial(memorialId: string): Promise<Yahrzeit | null>
findUpcoming(daysAhead: number): Promise<Yahrzeit[]>
findBySubscriber(userId: string): Promise<Yahrzeit[]>
create(data: CreateYahrzeitInput): Promise<Yahrzeit>
update(id: string, data: UpdateYahrzeitInput): Promise<Yahrzeit>
addSubscriber(id: string, userId: string): Promise<void>
removeSubscriber(id: string, userId: string): Promise<void>
markReminderSent(id: string): Promise<void>
refreshNextDate(id: string, nextDate: Date): Promise<void>
```

---

### MediaRepository

**Responsibility:** CRUD for `Media` records (file metadata only; actual files in GCS).

**Key operations:**
```typescript
findById(id: string): Promise<Media | null>
create(data: CreateMediaInput): Promise<Media>
markProcessed(id: string): Promise<void>
findOrphaned(olderThanDays: number): Promise<Media[]>
remove(id: string): Promise<void>
```

---

### NotificationRepository

**Responsibility:** Notification log persistence.

**Key operations:**
```typescript
create(data: CreateNotificationInput): Promise<Notification>
markSent(id: string): Promise<void>
markRead(id: string): Promise<void>
markFailed(id: string, reason: string): Promise<void>
findPending(): Promise<Notification[]>
findByRecipient(userId: string, opts: PaginationOpts): Promise<PaginatedResult<Notification>>
```

---

## Service Layer Architecture

Services contain business logic and orchestrate repositories. No service directly touches the database — it delegates to repositories.

---

### MemorialService

**Responsibility:** Memorial lifecycle, slug generation, counter maintenance, search.

**Key operations:**
```typescript
createMemorial(input: CreateMemorialInput, userId: string): Promise<Memorial>
publishMemorial(memorialId: string, userId: string): Promise<Memorial>
archiveMemorial(memorialId: string, userId: string): Promise<void>
updateMemorial(memorialId: string, input: UpdateMemorialInput, userId: string): Promise<Memorial>
getMemorialBySlug(slug: string, viewerUserId?: string): Promise<MemorialWithAccess>
listFamilyMemorials(familyId: string, userId: string): Promise<Memorial[]>
searchMemorials(query: string, opts: SearchOpts): Promise<PaginatedResult<MemorialSummary>>
recordVisit(memorialId: string, visitData: VisitInput): Promise<void>
generateUniqueSlug(fullName: string): Promise<string>
transferOwnership(memorialId: string, toFamilyId: string, byUserId: string): Promise<void>
```

---

### CandleService

**Responsibility:** Candle lighting with rate limiting and counter synchronisation.

**Key operations:**
```typescript
lightCandle(input: LightCandleInput, userId?: string): Promise<Candle>
extinguishCandle(candleId: string, userId: string): Promise<void>
getActiveCandles(memorialId: string): Promise<Candle[]>
checkRateLimit(memorialId: string, userId?: string, ipHash?: string): Promise<RateLimitResult>
```

---

### FlowerService

**Responsibility:** Flower placement with rate limiting.

**Key operations:**
```typescript
leaveFlower(input: LeaveFlowerInput, userId?: string): Promise<Flower>
removeFlower(flowerId: string, userId: string): Promise<void>
getFlowers(memorialId: string, opts: PaginationOpts): Promise<PaginatedResult<Flower>>
checkRateLimit(memorialId: string, userId?: string, ipHash?: string): Promise<RateLimitResult>
```

---

### TributeService

**Responsibility:** Tribute submission, moderation workflow, notification triggers.

**Key operations:**
```typescript
submitTribute(input: SubmitTributeInput, userId?: string): Promise<Tribute>
approveTribute(tributeId: string, moderatorId: string): Promise<Tribute>
rejectTribute(tributeId: string, moderatorId: string, reason: string): Promise<void>
removeTribute(tributeId: string, actorId: string): Promise<void>
getTributes(memorialId: string, viewerUserId?: string, opts: PaginationOpts): Promise<PaginatedResult<Tribute>>
getPendingModeration(communityId: string, moderatorId: string): Promise<Tribute[]>
```

---

### PrayerService

**Responsibility:** Prayer recording and aggregation for Kaddish/Tehillim boards.

**Key operations:**
```typescript
recordPrayer(input: RecordPrayerInput, userId?: string): Promise<Prayer>
removePrayer(prayerId: string, actorId: string): Promise<void>
getPrayers(memorialId: string, opts: PaginationOpts): Promise<PaginatedResult<Prayer>>
getPrayerCounts(memorialId: string): Promise<Record<PrayerType, number>>
```

---

### YahrzeitService

**Responsibility:** Yahrzeit date computation, reminder scheduling, subscription management.

**Key operations:**
```typescript
createYahrzeit(personId: string, memorialId: string): Promise<Yahrzeit>
updateHebrewDate(yahrzeitId: string, month: number, day: number, familyAdminId: string): Promise<Yahrzeit>
subscribeUser(yahrzeitId: string, userId: string): Promise<void>
unsubscribeUser(yahrzeitId: string, userId: string): Promise<void>
getUpcomingYahrzeits(daysAhead: number): Promise<YahrzeitSummary[]>
refreshAllNextDates(): Promise<void>
```

---

### NotificationService

**Responsibility:** All outbound notification dispatch — push, email, in-app.

**Key operations:**
```typescript
sendYahrzeitReminder(yahrzeitId: string): Promise<void>
notifyFamilyNewCandle(memorialId: string, candle: Candle): Promise<void>
notifyFamilyNewTribute(memorialId: string, tribute: Tribute): Promise<void>
notifyModeratorPendingTribute(tribute: Tribute): Promise<void>
notifyFamilyNewPrayer(memorialId: string, prayer: Prayer): Promise<void>
notifyFamilyNewStory(memorialId: string, story: Story): Promise<void>
dispatchPush(userId: string, payload: PushPayload): Promise<void>
dispatchEmail(to: string, template: EmailTemplate, data: object): Promise<void>
scheduleYahrzeitReminders(): Promise<void>
```

---

### SearchService

**Responsibility:** Full-text search across memorials, persons, and stories.

**Key operations:**
```typescript
searchMemorials(query: string, opts: SearchOpts): Promise<PaginatedResult<MemorialSummary>>
searchByName(name: string): Promise<Person[]>
searchByHebrewName(hebrewName: string): Promise<Person[]>
searchByLocation(city: string, country: string): Promise<MemorialSummary[]>
searchByYearRange(fromYear: number, toYear: number): Promise<MemorialSummary[]>
```

---

### ModerationService

**Responsibility:** Content moderation for tributes, photos, and stories.

**Key operations:**
```typescript
getPendingContent(communityId: string): Promise<ModerationQueue>
approveItem(itemId: string, type: ModerationItemType, moderatorId: string): Promise<void>
rejectItem(itemId: string, type: ModerationItemType, moderatorId: string, reason: string): Promise<void>
flagItem(itemId: string, type: ModerationItemType, reporterId: string, reason: string): Promise<void>
getModerationHistory(communityId: string, opts: PaginationOpts): Promise<PaginatedResult<ModerationEvent>>
```

---

### VisitorService

**Responsibility:** Visit tracking, deduplication, analytics aggregation.

**Key operations:**
```typescript
recordVisit(memorialId: string, input: VisitInput): Promise<void>
getStats(memorialId: string, period: DateRange): Promise<VisitorStats>
getRecentVisitors(memorialId: string): Promise<VisitorSummary[]>
```

---

### FamilyService

**Responsibility:** Family management, membership, invitation workflow.

**Key operations:**
```typescript
createFamily(input: CreateFamilyInput, creatorId: string): Promise<Family>
inviteMember(familyId: string, email: string, role: FamilyMemberRole, inviterId: string): Promise<void>
acceptInvitation(inviteToken: string, userId: string): Promise<FamilyMember>
removeMember(familyId: string, userId: string, actorId: string): Promise<void>
transferAdmin(familyId: string, toUserId: string, fromUserId: string): Promise<void>
getFamily(familyId: string, requesterId: string): Promise<FamilyWithMembers>
```

---

## Future API Design

All endpoints below are **proposed only** — not yet implemented. All protected routes require a Clerk Bearer token unless noted as `public`.

### Memorial CRUD

```
POST   /api/memorials                    Create a new memorial (draft)
GET    /api/memorials/:slug              Get memorial by slug (public if published)
PATCH  /api/memorials/:id               Update memorial metadata
POST   /api/memorials/:id/publish        Publish memorial
POST   /api/memorials/:id/archive        Archive memorial
DELETE /api/memorials/:id               Remove memorial (admin only)
GET    /api/memorials/:id/stats          Visitor + engagement stats (family only)
```

### Search

```
GET    /api/memorials/search?q=          Full-text search (public)
GET    /api/memorials/search?name=       Name search (public)
GET    /api/memorials/search?city=       Location search (public)
```

### Candles

```
POST   /api/memorials/:id/candles        Light a candle
GET    /api/memorials/:id/candles        List active candles (public)
DELETE /api/memorials/:id/candles/:cid   Remove candle (owner or moderator)
```

### Flowers

```
POST   /api/memorials/:id/flowers        Leave a flower
GET    /api/memorials/:id/flowers        List flowers (public)
DELETE /api/memorials/:id/flowers/:fid   Remove flower (owner or moderator)
```

### Tributes

```
POST   /api/memorials/:id/tributes       Submit a tribute
GET    /api/memorials/:id/tributes       List approved tributes (public)
PATCH  /api/memorials/:id/tributes/:tid  Edit tribute (author only)
DELETE /api/memorials/:id/tributes/:tid  Remove tribute (author, family, moderator)
POST   /api/tributes/:tid/approve        Approve tribute (moderator)
POST   /api/tributes/:tid/reject         Reject tribute (moderator)
```

### Prayers

```
POST   /api/memorials/:id/prayers        Record a prayer
GET    /api/memorials/:id/prayers        List prayers (public)
GET    /api/memorials/:id/prayers/counts Prayer counts by type (public)
DELETE /api/memorials/:id/prayers/:pid   Remove prayer (author, family, moderator)
```

### Photos

```
POST   /api/memorials/:id/photos         Upload photo (family)
GET    /api/memorials/:id/photos         List photos (visibility-gated)
DELETE /api/memorials/:id/photos/:phid   Remove photo (family admin, moderator)
POST   /api/memorials/:id/photos/:phid/feature  Set as featured
```

### Stories

```
POST   /api/memorials/:id/stories        Create story (authenticated)
GET    /api/memorials/:id/stories        List published stories (visibility-gated)
GET    /api/memorials/:id/stories/:sid   Get story (visibility-gated)
PATCH  /api/memorials/:id/stories/:sid   Edit story (author)
POST   /api/memorials/:id/stories/:sid/publish  Publish story
DELETE /api/memorials/:id/stories/:sid   Archive story (author, family admin)
```

### Timeline

```
GET    /api/memorials/:id/timeline        Get timeline events (public)
POST   /api/memorials/:id/timeline        Add timeline event (family admin)
PATCH  /api/memorials/:id/timeline/:eid   Update event (family admin)
DELETE /api/memorials/:id/timeline/:eid   Remove event (family admin)
```

### Yahrzeit

```
GET    /api/memorials/:id/yahrzeit        Get yahrzeit info (family)
PATCH  /api/memorials/:id/yahrzeit        Override Hebrew date (family admin)
POST   /api/memorials/:id/yahrzeit/subscribe    Subscribe to reminders
DELETE /api/memorials/:id/yahrzeit/subscribe    Unsubscribe
GET    /api/yahrzeit/upcoming             Get user's upcoming yahrzeits
```

### Family Management

```
POST   /api/families                     Create family
GET    /api/families/:id                 Get family details (family member)
POST   /api/families/:id/invite          Invite member
POST   /api/families/:id/accept          Accept invitation (via token)
DELETE /api/families/:id/members/:uid    Remove member (family admin)
POST   /api/families/:id/transfer        Transfer admin role
```

### Privacy

```
GET    /api/memorials/:id/privacy        Get privacy settings (family admin)
PATCH  /api/memorials/:id/privacy        Update privacy settings (family admin)
```

### Moderation (Moderator+ only)

```
GET    /api/moderation/queue             Get pending items
POST   /api/moderation/:type/:id/approve Approve item
POST   /api/moderation/:type/:id/reject  Reject item
GET    /api/moderation/history           Moderation history log
```

### Visitor Tracking

```
POST   /api/memorials/:id/visit          Log a visit (anonymous, rate-limited)
```

---

## Permission Model

### Permission Tiers

```
Guest
  └── Visitor (authenticated)
        └── FamilyMember
              └── FamilyAdmin
                    └── CommunityModerator
                          └── CommunityAdmin
                                └── PlatformAdministrator
```

---

### Role Definitions

| Role | Description |
|---|---|
| **Guest** | Unauthenticated user. Can view `public` memorials, light candles, leave flowers and prayers if `allowGuestInteraction = true`. Cannot submit tributes or access stories. |
| **Visitor** | Authenticated Clerk user with no family link. Can view `community` and `public` memorials, interact per Privacy settings. |
| **FamilyMember** | Member of the owning Family. Can view all content on family memorials, submit tributes, photos, stories. |
| **FamilyAdmin** | Senior Family member. Can edit memorial/person data, manage Privacy settings, approve/remove photos, stories. Can invite/remove Family members. |
| **CommunityModerator** | Designated community member. Can approve/reject pending tributes, photos across community memorials. Cannot edit memorial data. |
| **CommunityAdmin** | Manages the Community object. Can designate moderators, set community defaults, access moderation history. |
| **PlatformAdministrator** | Full access. Can archive or remove any memorial, bypass Privacy for safety reasons, manage all communities. |
| **Premium** | Cross-cutting capability tier. Premium users may access additional features: candle type variety, animated tributes, private story visibility, export, etc. |

---

### Permission Matrix

| Action | Guest | Visitor | FamilyMember | FamilyAdmin | Moderator | CommunityAdmin | PlatformAdmin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View public memorial | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View family memorial | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| View private memorial | — | — | ✓ | ✓ | — | — | ✓ |
| Light candle (guest) | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Leave flower (guest) | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Leave prayer (guest) | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit tribute | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit guest tribute | ✓* | — | — | — | — | — | — |
| Upload photo | — | — | ✓ | ✓ | — | — | ✓ |
| Write story | — | — | ✓ | ✓ | — | — | ✓ |
| Edit memorial data | — | — | — | ✓ | — | — | ✓ |
| Manage privacy | — | — | — | ✓ | — | — | ✓ |
| Approve tribute | — | — | — | ✓ | ✓ | ✓ | ✓ |
| Reject tribute | — | — | — | ✓ | ✓ | ✓ | ✓ |
| Publish memorial | — | — | — | ✓ | — | — | ✓ |
| Archive memorial | — | — | — | ✓ | — | ✓ | ✓ |
| Remove memorial | — | — | — | — | — | — | ✓ |
| Invite family member | — | — | — | ✓ | — | — | ✓ |
| Manage moderators | — | — | — | — | — | ✓ | ✓ |
| Yahrzeit subscribe | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

> ✓* = only when `allowGuestInteraction = true` on Privacy

---

## Scalability Recommendations

### 1. Counter columns (denormalised)

`Memorial.candleCount`, `flowerCount`, `tributeCount`, `prayerCount`, and `viewCount` are denormalised counters on the Memorial row. **Never update them synchronously in the write path.** Use a debounced background job (or PostgreSQL `pg_notify` + a listener process) to recount and refresh. This avoids row contention at high throughput.

### 2. Activity-based partitioning

`Visitor` (append-only log) and `Notification` (log) tables should be partitioned by month on `visitedAt` / `sentAt` as the record count grows. Drizzle ORM supports range-partitioned tables; plan this before the table exceeds ~10 million rows.

### 3. Memorial search via full-text index

Use PostgreSQL `tsvector` on `(Person.fullName || ' ' || Person.hebrewName || ' ' || Person.biography)` for name and biography search. A `GIN` index on the tsvector column scales to millions of records. Avoid `ILIKE '%query%'` scans.

### 4. Media in GCS, not the database

All `Photo`, `Story` inline images, and audio are stored in Google Cloud Storage. The `Media` table only stores metadata. Sign short-lived GCS URLs server-side — never expose the storage key directly to clients.

### 5. Slug uniqueness at creation time

Generate `slug` during `MemorialService.createMemorial()` using a `slugify(fullName)` base and a numeric suffix disambiguation loop. Check uniqueness with a `SELECT FOR UPDATE` or a unique index constraint. Never allow slug changes after publication — it breaks all external links.

### 6. Rate limiting at service boundary

`CandleService`, `FlowerService`, and `VisitorService` must enforce rate limits in the service layer (not just the route layer) so they remain enforceable from any call path (HTTP, background jobs, future mobile SDK).

### 7. Yahrzeit refresh job

`YahrzeitService.refreshAllNextDates()` must run once per day (Rosh Chodesh Tishrei at minimum). Use the existing push scheduler infrastructure in `artifacts/api-server/src/routes/push.ts` as the pattern. Log failures to Pino; never silently swallow errors.

### 8. Community memorial counts

`Community.memorialCount` and `Family.memberCount` are denormalised. Refresh via background job, not per-write. Counts that drift by ±1 for a few minutes are acceptable; row contention from hundreds of concurrent writes is not.

### 9. Privacy query filter pattern

Every repository query for visitor-accessible content must accept a `PrivacyContext` parameter and apply a WHERE clause filter:

```sql
WHERE m.status = 'published'
  AND (
    privacy.visibilityLevel = 'public'
    OR (privacy.visibilityLevel = 'community' AND $isAuthenticatedUser)
    OR (privacy.visibilityLevel = 'family' AND $isFamilyMember)
    OR (privacy.visibilityLevel = 'private' AND $isOwner)
  )
```

Never return un-gated memorial data from any repository method.

### 10. Eventual consistency for view counts

`MemorialService.recordVisit()` should enqueue the counter increment asynchronously (e.g. via an in-process queue or a PostgreSQL `LISTEN/NOTIFY` channel). The `viewCount` column may lag real traffic by up to 60 seconds — this is acceptable and avoids high-frequency row updates on the Memorial row.

---

## Future Expansion Notes

### Virtual Cemetery Map
- `Location.latitude` / `longitude` on `Person` supports a future community map view
- All burial locations should be geocoded on entry

### Audio Tributes
- `Media` table already supports `durationSeconds` for audio
- Future: `Tribute.audioMediaId` → voice condolence recording

### Kaddish Board
- Aggregate `Prayer` records of type `kaddish` across all memorials on a given Hebrew date
- Display as a community-wide Kaddish board on Yom Kippur, Yizkor dates

### Memorial Sharing & QR Codes
- `/api/memorials/:slug` serves the public share view
- Generate a QR code linking to the slug for physical grave markers

### Bulk Import (Community Elder Records)
- Batch `POST /api/memorials/import` for importing historical community death records from CSV
- Validate Hebrew dates against `@hebcal/core` before persisting

### Premium Tiers
- Animated 3D candles (vs. static icon)
- Unlimited photo storage (vs. 100 photo cap)
- Private story visibility for family-only
- PDF memorial booklet export
- Priority moderation (tributes auto-approved)

### AI Eulogy Assist
- `POST /api/memorials/:id/eulogy/generate` — given `Person` biography + `Story[]`, generate a eulogy draft using the Gemini integration
- Store as a `Story` with `status = draft` for family editing

### Memorial Anniversary Notifications
- Extend Yahrzeit scheduler to send anniversary-of-passing community notifications
- `notificationType: yahrzeit_anniversary` already defined in `Notification` entity

---

*End of SPR-011 — Memorial Domain Architecture. Awaiting Chief Architect review.*

---

## SPR-013 Implementation Status

> **Sprint:** SPR-013 — Memorial Core Backend (V1)
> **Completed:** 2026-06-27
> **Role:** Senior Backend Engineer + Drizzle ORM Architect

---

### What Was Implemented

#### Database (Drizzle ORM schemas + PostgreSQL migration)

All 8 V1 tables are live in PostgreSQL, created idempotently on server startup via `migrate.ts`:

| Table | File | Status |
|---|---|---|
| `memorial_families` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorial_family_members` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorial_persons` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorials` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorial_privacy` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorial_candles` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorial_tributes` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorial_photos` | `lib/db/src/schema/memorial.ts` | ✅ |
| `memorial_locations` | `lib/db/src/schema/memorial.ts` | ✅ |

7 PostgreSQL enum types created: `memorial_status`, `memorial_privacy_level`, `memorial_interaction_permission`, `memorial_candle_type`, `memorial_tribute_status`, `memorial_family_member_role`, `memorial_location_type`.

#### Repository Layer

| Repository | File | Key methods |
|---|---|---|
| `MemorialRepository` | `artifacts/api-server/src/memorial/repositories/MemorialRepository.ts` | `findById`, `findBySlug`, `findByFamily`, `search`, `create`, `update`, `softDelete`, `incrementCounter` |
| `CandleRepository` | `artifacts/api-server/src/memorial/repositories/CandleRepository.ts` | `findByMemorial`, `create`, `remove`, `checkRateLimit` |
| `TributeRepository` | `artifacts/api-server/src/memorial/repositories/TributeRepository.ts` | `findByMemorial`, `findById`, `findPending`, `create`, `approve`, `reject`, `softDelete` |
| `PhotoRepository` | `artifacts/api-server/src/memorial/repositories/PhotoRepository.ts` | `findByMemorial`, `findById`, `create`, `approve`, `setFeatured`, `softDelete` |
| `FamilyRepository` | `artifacts/api-server/src/memorial/repositories/FamilyRepository.ts` | `findById`, `findByUser`, `create`, `addMember`, `removeMember`, `getMembers`, `isMember`, `isAdmin` |

#### Service Layer

| Service | File | Responsibilities |
|---|---|---|
| `MemorialService` | `artifacts/api-server/src/memorial/services/MemorialService.ts` | Create memorial + auto-family, visibility gating, slug generation, update, search |
| `CandleService` | `artifacts/api-server/src/memorial/services/CandleService.ts` | Permission check, rate-limit enforcement, candle creation, counter increment |
| `TributeService` | `artifacts/api-server/src/memorial/services/TributeService.ts` | Permission check, auto-approve for family members, moderation (approve/reject) |

#### API Routes (`artifacts/api-server/src/routes/memorials.ts`)

All routes mounted at `/api` via the existing Express router:

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/memorials` | Required | Create memorial + person + auto-family |
| `GET` | `/api/memorials/search?q=` | Optional | Full-name search, public/community only |
| `GET` | `/api/memorials/:id` | Optional | Fetch by UUID or slug, visibility gated |
| `PATCH` | `/api/memorials/:id` | Required (FamilyAdmin) | Update status (draft→published→archived) |
| `POST` | `/api/memorials/:id/candles` | Optional (guest OK) | Light a candle, rate-limited by userId+IP |
| `POST` | `/api/memorials/:id/tributes` | Optional (guest OK) | Submit tribute, enters moderation queue |
| `POST` | `/api/memorials/:id/photos` | Required | Upload photo URL, auto-approved for family |

---

### What Was NOT Implemented (deferred to V2+)

Per sprint scope:

- Stories / audio
- Notifications / push
- Visitor analytics
- Genealogical relationships
- Timeline events
- AI Eulogy Assist
- Premium features
- External search index
- Yahrzeit subscriber scheduler

---

### Security Notes

- `requireAuth` (Clerk JWT) enforced on write routes; read routes use optional auth for visibility gating
- Ownership checks: FamilyAdmin required for memorial update; family membership required for photo upload
- Rate limiting: candles rate-limited per `(memorialId, userId)` or `(memorialId, ipHash)` with 60-minute window
- Guest interactions: allowed only when `memorial_privacy.allow_guest_interaction = true`
- Tribute moderation: all tributes enter `pending` status by default; family members are auto-approved
- Soft delete: no hard deletes on any memorial data; `deleted_at` column pattern throughout

---

### How to Verify

```bash
# Confirm tables exist
curl http://localhost:8080/api/memorials/search?q=test
# → 200 []

# Confirm auth gate
curl -X POST http://localhost:8080/api/memorials -H "Content-Type: application/json" -d '{...}'
# → 401 Unauthorized

# Confirm not-found handling
curl http://localhost:8080/api/memorials/nonexistent-slug
# → 404 Not found
```
