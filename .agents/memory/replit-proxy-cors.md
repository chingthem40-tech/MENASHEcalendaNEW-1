---
name: Replit proxy CORS
description: Same-origin browser requests can arrive at the API through Replit with forwarded public-host headers.
---

Production CORS must allow a request when its `Origin` matches the trusted
`X-Forwarded-Host` and `X-Forwarded-Proto` origin, while still requiring other
cross-origin requests to match the explicit allowlist.

**Why:** The web app and API share a public origin behind Replit's reverse
proxy, but the API may not have that public host in `ALLOWED_ORIGINS`.
Rejecting it prevents authenticated browser writes even though reads may appear
to work.

**How to apply:** Resolve the first forwarded host/protocol pair per request,
use it only for exact same-origin comparison, and keep regression tests proving
that unrelated origins remain rejected.