---
name: SPR-010 security Zod schema gaps
description: Known Zod validation schema gaps found during SPR-010.5 validation that would cause 400 errors for valid frontend data.
---

## Rules

**Theme enum:** `profileSchema.theme` must be `z.enum(["dark", "light", "sapphire"])`. The frontend has 3 themes — "sapphire" is the premium blue theme. Missing it causes 400 on profile save for Sapphire users.

**Role enum:** `publicProfileSchema.role` must include all values from ProfileModal.tsx `ROLES` array:
`["Member", "Community Leader", "Rabbi", "Cantor", "Youth Leader", "Women's Group", "Student", "Elder", "Admin"]`
Plus legacy fallbacks: `"Leader"`, `"Teacher"`, `"Other"`.

**Community yahrzeit admin path:** The `communityYahrzeitRouter` is mounted at `/community` prefix in routes/index.ts. Admin routes inside that router are therefore at `/api/community/admin/yahrzeit` and `/api/community/admin/yahrzeit/:id` — NOT at `/api/admin/yahrzeit`. AdminModal must call `/community/admin/yahrzeit`.

**Why:** These gaps would silently reject valid user data with HTTP 400 errors that look like server bugs to users.
