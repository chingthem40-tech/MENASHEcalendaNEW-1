---
name: Clerk API auth in apiFetch
description: How to attach Clerk JWT to all API calls — cookies alone don't work through Replit's proxy.
---

## Rule
`apiFetch` must include `Authorization: Bearer <token>` on every request. Cookies (`credentials: "include"`) alone are not forwarded to the API server through Replit's dev proxy.

**Why:** Replit's proxied dev environment does not forward session cookies from the Vite frontend to the Express API server across ports. `getAuth(req).userId` in `requireAuth` returns null without the Bearer header.

**How to apply:** In `apiFetch` (or any standalone fetch utility that is not a React hook), get the token with:
```ts
const token = await (window as any).Clerk?.session?.getToken() ?? null;
// then add to headers:
...(token ? { Authorization: `Bearer ${token}` } : {})
```

This fix applies to ALL authenticated routes — user profile, yahrzeit, community board, etc. If a new fetch utility is ever created, add this same pattern.
