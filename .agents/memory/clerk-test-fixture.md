---
name: Clerk test fixture
description: Requirements for simulating Clerk Express auth in provider-neutral authorization tests
---

Clerk Express `getAuth` only treats a test request as Clerk-authenticated when
`req.auth` is a branded function and its returned object has a signed-in
session shape; a plain `{ userId, orgRole }` object is treated as unavailable.

**Why:** The adapter deliberately checks Clerk's request brand and auth-object
state so unrelated middleware cannot impersonate Clerk authentication.

**How to apply:** In server authorization tests, brand the fixture with
`Symbol.for("@clerk/express.auth")`, return `isAuthenticated: true`,
`tokenType: "session_token"`, and non-null session claims for signed-in cases.