---
name: Supabase identity continuity
description: Safety invariant for preserving legacy account ownership during Supabase first-login resolution.
---

On first Supabase login, auto-link only when a verified email resolves to exactly one legacy application account. If a configured authoritative legacy directory is temporarily unavailable and no local verified mapping exists, return a retriable unavailable state without persisting a fallback identity. When no legacy directory is intentionally configured, treat that as completed cutover and permit a new provider-owned account.

**Why:** Persisting a provider-prefixed fallback during an outage makes later recovery short-circuit on that mapping, permanently detaching legacy data, admin assignments, and branch roles until manual repair.

**How to apply:** Any future auth-provider migration or identity resolver must distinguish “not configured after cutover,” “confirmed no match,” and “configured but could not check.” Only the last state must defer.