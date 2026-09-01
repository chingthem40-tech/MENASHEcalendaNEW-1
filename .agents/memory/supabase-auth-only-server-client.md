---
name: Supabase auth-only server client
description: Avoiding Supabase Realtime initialization when an API server only validates access tokens.
---

For server middleware that only validates Supabase access tokens, instantiate the
auth-only client exported by `@supabase/supabase-js` and call `getUser(token)`
directly. Do not construct the full Supabase client solely for authentication on
the current Node 20 runtime.

**Why:** Current Supabase packages eagerly initialize Realtime when the full
client is constructed. On Node 20 this requires a native WebSocket that is not
available, causing malformed-token requests to return 500 before authentication
can fail closed. Supabase has also ended Node 20 support.

**How to apply:** Keep browser usage unchanged. Apply this only to server-side
auth middleware until the project runtime is upgraded to a supported Node
version; preserve remote `getUser(token)` validation and test verifier exceptions
as 401 responses.