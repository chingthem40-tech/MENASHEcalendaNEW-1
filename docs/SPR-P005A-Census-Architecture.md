# SPR-P005A — Census Platform Architecture Report

**Date:** 2026-07-05  
**Scope:** Read-only audit · No implementation  
**Chief Architect:** Samuel & ChatGPT

---

## 1. Current Census Architecture

### 1.1 Database Layer

Three tables, all in Postgres via `@workspace/db` (`pool.query` raw SQL, no Drizzle ORM):

| Table | Key Constraint | Storage Strategy | Purpose |
|---|---|---|---|
| `census_branches` | `owner_user_id UNIQUE` | `families JSONB` blob | One branch per local admin; holds all families as an opaque JSON array |
| `census_submissions` | `owner_user_id` (soft — one upserted submission per user) | `branch_data JSONB` | Snapshot of a branch submitted for global admin review |
| `census_member_submissions` | `id TEXT PK` | `head_census JSONB` + `members JSONB` | Community member self-submissions; intentionally unauthenticated |

**Key structural fact:** `families` and `branch_data` are JSONB blobs. The full `CensusRow` field set (12 fields per person) lives inside Postgres as untyped JSON — not validated at the column level.

### 1.2 API Layer

File: `artifacts/api-server/src/routes/census.ts`  
Mounted under: `/api/census/*`

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/census/branch` | `requireAuth` | Fetch caller's branch |
| `PUT` | `/census/branch` | `requireAuth` | Upsert branch (full replacement) |
| `GET` | `/census/submissions` | `requireAdmin` | All branch submissions |
| `POST` | `/census/submissions` | `requireAuth` | Submit branch for review (upsert per user) |
| `PATCH` | `/census/submissions/:id` | `requireAdmin` | Approve or reject a submission |
| `GET` | `/census/member-submissions` | `requireAdmin` | All member self-submissions |
| `POST` | `/census/member-submissions` | **none — public** | Community member self-submit (no sign-in required) |
| `PATCH` | `/census/member-submissions/:id` | `requireAdmin` | Review a member submission |

**Authentication middleware:**
- `requireAuth` — verifies Clerk JWT Bearer token, attaches `req.userId`
- `requireAdmin` — additionally asserts Clerk org role `org:admin`

**Zod validation — current gaps:**

```ts
// branchSchema treats families as a raw opaque array:
families: z.array(z.record(z.unknown())).max(500).optional()

// familyMemberSchema uses .passthrough() — extra fields silently accepted:
z.object({ name, relation, age }).passthrough()
```

The 12-field `CensusRow` structure (passport, Hebrew name, dates, etc.) is not validated at the API boundary. Any JSON shape is accepted inside `families`.

### 1.3 Domain Model

Defined (identically) in two places: `CensusModal.tsx` and `SharePage.tsx`. No shared source.

```
CensusRow                         — the official paper-form row
  surname                         — family surname
  namePerPassport                 — legal name per government passport
  hebrewName                      — Hebrew/Jewish name
  maritalStatus                   — Single | Married | Widow | Divorced | Separated
  sex                             — M | F
  dob                             — date of birth
  fatherName                      — father's name
  motherName                      — mother's name
  dateOfJudaismPractice           — when Judaism practice formally began
  passportNo                      — passport / ID number
  passportIssueDate               — passport issue date
  passportExpiryDate              — passport expiry date

FamilyMember extends CensusRow
  id                              — local identifier
  relation                        — spouse | son | daughter | grandson | granddaughter
                                    | daughter_in_law | son_in_law | other
  aliyahStatus                    — in_israel | awaiting | unknown

Family
  id                              — local identifier
  headName                        — display name for the head of family
  headAliyah                      — AliyahStatus of the head
  headCensus: CensusRow           — row 1 of the official form (head)
  members: FamilyMember[]         — rows 2–10 (max 9 members)

Branch
  id, name                        — branch identifier and display name
  cityId, cityName                — city / location
  adminName?                      — local admin's name
  established?                    — year established
  families: Family[]              — all families in the branch
```

**Form constraint:** 1 head + max 9 members = 10 rows per family, matching the official BNEI MENASHE COUNCIL INDIA paper form.

### 1.4 Web Client

| File | Role |
|---|---|
| `src/modals/CensusModal.tsx` | Monolithic hub. Three tabs: `dashboard` (stats), `admin` (global review), `localadmin` (branch management + family forms) |
| `src/pages/SharePage.tsx` | Public deep-link page. Community member fills their own household data and generates a return code. No authentication. |
| `src/lib/userApi.ts` | 8 typed API client functions + 3 interface definitions (`CensusBranchApi`, `CensusSubmissionApi`, `CensusMemberSubmissionApi`) |

**Export capabilities** (all browser-side, all in `CensusModal.tsx`):
- CSV download — matches official form columns
- PDF generation — per-family A4 pages with signature lines
- Print layout — browser `window.print()` with styled HTML

**Share/import mechanism:**
1. Local admin adds a family and selects "Share form"
2. App generates a shareable WhatsApp-ready link
3. Family head fills form at `SharePage` (no account needed)
4. SharePage generates a "return code" (encoded payload)
5. Local admin pastes return code to import the completed data

### 1.5 Role Hierarchy

```
org:admin  (Clerk org role)
  └─ Global admin tab in CensusModal
  └─ Approve/reject branch submissions
  └─ Review all member self-submissions
  └─ Access full statistics dashboard

Any authenticated user  (Clerk sign-in)
  └─ Owns exactly one Branch (one per Clerk user ID)
  └─ Manages families within their branch
  └─ Submits branch for review
  └─ Generates share links for community members

Public / unauthenticated
  └─ POST /census/member-submissions
  └─ Fill SharePage form (invited via link)
```

### 1.6 Mobile & Shared Core: Current State

**`@workspace/shared-core`** — zero census exports:
```
lib/shared-core/src/
  calendar/        ✓ exported
  zmanim/          ✓ exported
  parasha/         ✓ exported
  locations/       ✓ exported
  utils/           ✓ exported
  translations/    ✓ exported — includes homeCensusTitle, settingsCensus (labels only)
  census/          ✗ does not exist
```

**`artifacts/menashe-mobile`** — zero census implementation:
- No census API client
- No census screens or routes
- No census components
- Translation keys are defined (`homeCensusTitle`, `homeCensusDesc`, `settingsCensus`, `settingsCensusSub`) but lead nowhere

---

## 2. Existing Reusable APIs

All 8 census API endpoints are production-ready and immediately reusable from mobile. No server-side changes are needed.

| Endpoint | Mobile-ready? | Notes |
|---|---|---|
| `GET /census/branch` | ✓ | Requires Bearer token — same Clerk Expo pattern already used in app |
| `PUT /census/branch` | ✓ | Full branch upsert |
| `POST /census/submissions` | ✓ | Submit for review |
| `POST /census/member-submissions` | ✓ | Public — no auth needed |
| `GET /census/submissions` | ✓ (admin only) | Only usable by `org:admin` users |
| `PATCH /census/submissions/:id` | ✓ (admin only) | Approve/reject |
| `GET /census/member-submissions` | ✓ (admin only) | |
| `PATCH /census/member-submissions/:id` | ✓ (admin only) | |

**Response shapes** are stable and documented in `userApi.ts`. Mobile can consume them directly.

**Existing shared infrastructure usable by census:**

| Module | Location | What it provides |
|---|---|---|
| `hebrewCalendar` | `@workspace/shared-core/calendar` | Hebrew date for census timestamps, yahrzeit links |
| `locations` | `@workspace/shared-core/locations` | City/country lists already used in profile — census cities can draw from this |
| `apiFetch` pattern | `artifacts/menashe-mobile/lib/*.ts` | Bearer token attach pattern already established in `announcementsApi`, `communityApi` etc. |
| `requireAuth` / `requireAdmin` | `artifacts/api-server/src/lib/` | Already used — no changes needed |

---

## 3. Shared Core Modules Available

What is already in `@workspace/shared-core` that census should consume or integrate with:

```
hebrewCalendar  → format a member's dob or dateOfJudaismPractice in Hebrew
                  compute upcoming yahrzeit for a deceased family member
zmanim          → (indirect) timestamps for any census event
locations       → city/country picker for Branch.cityId + Branch.cityName
translations    → labels already exist for census navigation entries
parasha         → no direct census relevance
```

What is **missing** and should be added to `@workspace/shared-core`:
- `CensusRow`, `FamilyMember`, `Family`, `Branch` TypeScript interfaces
- `AliyahStatus`, `Relation`, `MaritalStatus` as const union types
- Zod schemas for each (validate once, import everywhere)
- Label maps: `ALIYAH_LABELS`, `RELATION_LABELS`, `MARITAL_STATUS_LABELS`
- Statistics utilities: `branchFamilyCount()`, `aliyahBreakdown()`, `memberCount()`
- CSV/export serialization (currently web-only, cannot be reused on mobile)

---

## 4. Platform Data Ownership Map

### Identity

The census `CensusRow` is the most complete identity record in the platform. It holds fields no other system has:

```
CensusRow field             → Platform identity connection
───────────────────────────────────────────────────────
hebrewName                  → user_public_profiles.display_name complement
dateOfJudaismPractice       → platform onboarding context ("years observant")
passportNo / dates          → government ID (sensitive — keep server-side only)
fatherName / motherName     → family lineage (feeds Memorial family tree)
dob                         → age cohort for community statistics
maritalStatus               → household composition
```

**Identity is the foundation.** `CensusRow` is what makes a Bnei Menashe community record official. Everything else references it.

### Community

```
Branch                      → the congregation / community unit
  name                      → congregation display name
  cityId / cityName         → location; maps to locations module
  established               → community history
  families[]                → congregation membership count
  adminName                 → local leader
```

The Branch is the community unit. A `census_branch` row represents one congregation. The community features (announcements, events, prayer board, yahrzeit board) all implicitly belong to a Branch. Currently they are not linked.

**Gap:** Community features have no foreign key to `census_branches`. A future `branch_id` on `community_announcements`, `community_yahrzeit`, `prayer_requests`, etc. would let the platform scope community content to a congregation.

### Memorial

```
FamilyMember.relation       → establishes the family graph needed for memorials
FamilyMember.aliyahStatus   → "unknown" members may be deceased
Family.headName             → the primary identity for memorial linking
CensusRow.fatherName / motherName  → generational links in the memorial tree
```

The census is the only place in the platform that holds a family graph. The Memorial system (which tracks yahrzeit for deceased individuals) currently has no connection to the Census family records. A deceased family member in the census naturally has a corresponding memorial — but the two systems are islands.

**Opportunity:** When a local admin marks a member's `aliyahStatus` as (future) `"deceased"`, or when an admin creates a memorial, the platform could suggest linking to the census family record.

### AI (Rav Menashe)

The AI gateway currently injects Hebrew date and zmanim into its system prompt. Census adds two new context layers:

```
Community demographics context
  → Total families in the user's branch: N
  → Aliyah breakdown: X in Israel, Y awaiting, Z unknown
  → City / congregation: Churachandpur / Imphal / etc.

Personal/family context (requires auth)
  → User's census record exists / does not exist
  → Family size
  → dateOfJudaismPractice (how long observant)
```

This context allows Rav Menashe to answer questions like "How many families are still waiting for aliyah?" with real data instead of deflection. It also personalises study recommendations based on years of observance.

### Journey

Census connects to Journey in two ways:

1. **Milestone card** — "Complete your community census" appears in the Continue Journey engine when the user has no census branch record. Once completed, it drops off. This is a one-time onboarding task.

2. **Aliyah status driver** — If `headAliyah === "awaiting"` or any family member's `aliyahStatus === "awaiting"`, Journey can surface an "Prepare for Aliyah" priority card linking to relevant resources. This is live data already in the API.

---

## 5. Recommended Platform Architecture

### Principle

> The Census is not a feature. It is the identity and community fabric of the platform. Every experience should be able to read from it. Nothing should duplicate its data model.

### Proposed Layer Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│              @workspace/shared-core/census  (NEW)                    │
│                                                                      │
│  Interfaces:  CensusRow · FamilyMember · Family · Branch            │
│  Enums:       AliyahStatus · Relation · MaritalStatus               │
│  Zod schemas: censusRowSchema · familySchema · branchSchema         │
│  Label maps:  ALIYAH_LABELS · RELATION_LABELS · MARITAL_LABELS      │
│  Utils:       memberCount() · aliyahBreakdown() · branchStats()     │
└──────────────────────┬───────────────────────┬───────────────────────┘
                       │                       │
         ┌─────────────▼──────┐   ┌───────────▼────────────┐
         │  API Server        │   │  Clients               │
         │  census.ts         │   │                        │
         │                    │   │  Web: CensusModal.tsx  │
         │  Import Zod from   │   │       SharePage.tsx    │
         │  shared-core →     │   │       userApi.ts       │
         │  strong validation │   │                        │
         │  on all 12 fields  │   │  Mobile: censusApi.ts  │
         │                    │   │  (new — mirrors web)   │
         └────────────────────┘   └────────────────────────┘
```

### 5.1 Shared Core Census Module

Create `lib/shared-core/src/census/` with:

```
census/
  types.ts       — CensusRow, FamilyMember, Family, Branch interfaces
  enums.ts       — AliyahStatus, Relation, MaritalStatus as const unions
  schemas.ts     — Zod schemas for all types (import in API + clients)
  labels.ts      — ALIYAH_LABELS, RELATION_LABELS, MARITAL_LABELS display maps
  stats.ts       — memberCount(), aliyahBreakdown(), branchStats() pure functions
  index.ts       — barrel export
```

Add to `package.json` exports: `"./census": "./src/census/index.ts"`

**Why:** `CensusRow` is currently defined in two web files with no shared source. Mobile cannot use it at all. The Zod schemas in the API are too loose. Moving types to shared-core gives every consumer — web, mobile, API — a single typed source of truth with one validation implementation.

### 5.2 API Layer — Strengthen Validation

Replace the current loose `z.record(z.unknown())` families schema with the shared Zod `familySchema`. Validates all 12 `CensusRow` fields at the API boundary. **No database change needed** — storage remains JSONB; validation happens at write time.

### 5.3 Mobile API Client

Create `artifacts/menashe-mobile/lib/censusApi.ts` mirroring the web `userApi.ts` census section. Use the Clerk Expo `getToken()` pattern already established by `communityApi.ts` and `announcementsApi.ts`. Wire to the 8 existing endpoints — zero server changes needed.

### 5.4 Database — No Changes Needed Now

The JSONB blob strategy is the correct tradeoff for this stage:
- Census form fields evolve frequently (aliyah statuses change, new government ID formats appear)
- JSONB avoids column migrations on every form field change
- Statistics queries work via `jsonb_array_elements` when needed

**Future:** If demographic queries become slow, add a GIN index on `census_branches.families` and a materialized view for community statistics. This is a future concern.

### 5.5 Platform Integration Points

These are the clean integration seams — none require restructuring existing features:

```
Community Hub
  Branch.name / cityName  →  community header "Congregation name, City"
  branchStats()           →  demographics card in community tab
  (future) branch_id FK   →  scope announcements/events to congregation

Memorial Sanctuary
  FamilyMember[]          →  "Add to memorial" suggestion for each family member
  fatherName / motherName →  pre-populate memorial person fields
  hebrewName              →  pre-populate Hebrew name in memorial record

AI Gateway (Rav Menashe)
  buildSystemPrompt()     →  inject branchStats() for authenticated users
                             "User is part of [Branch], city [City],
                              [N] families, [X] awaiting aliyah"

Journey Screen
  /census/branch 404      →  "Complete Census" milestone card in priority engine
  headAliyah === "awaiting"  →  "Prepare for Aliyah" priority card

User Profile (user_public_profiles)
  Branch.cityName         →  profile.city
  Branch.name             →  profile.congregation
  CensusRow.hebrewName    →  complement to profile.display_name
```

### 5.6 Authentication Architecture (No Changes Needed)

The two-tier auth model is correct and complete:

```
Public tier   → POST /census/member-submissions  (SharePage invitees)
Auth tier     → GET/PUT /census/branch           (local admins — any signed-in user)
Admin tier    → all review/approval endpoints    (org:admin Clerk role)
```

No new roles are needed. The implicit "local admin = any user with a branch" maps naturally to the platform's congregation leader model.

---

## Summary: What Exists, What Is Missing

| Layer | Status | Immediate gap |
|---|---|---|
| Database tables | ✓ Complete — 3 tables | None |
| API endpoints | ✓ Complete — 8 endpoints | Zod validation too loose on family fields |
| Auth middleware | ✓ Complete | None |
| Web domain types | ⚠ Duplicated — in 2 web files | Move to shared-core |
| Web API client | ✓ Complete — `userApi.ts` | None |
| Web UI | ✓ Complete — `CensusModal` + `SharePage` | None |
| Shared Core types | ✗ Missing — no `census/` module | Create `shared-core/census` |
| Mobile API client | ✗ Missing | Create `censusApi.ts` |
| Mobile screens | ✗ Missing | Not in this sprint |
| AI context injection | ✗ Missing | Wire branchStats into system prompt |
| Memorial linking | ✗ Missing | Family → memorial suggestion |
| Community FK | ✗ Missing | branch_id on community tables |
| Journey milestone | ✗ Missing | Census completion card |

**The single highest-leverage action is creating `@workspace/shared-core/census`.** Everything downstream — tighter API validation, mobile client, AI context, Journey card — imports from that one module. Nothing else can be done correctly until the domain model has a canonical home.
