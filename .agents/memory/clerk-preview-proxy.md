---
name: Clerk Preview proxy
description: Reliable Clerk JavaScript loading through Replit's proxied Preview environment.
---

## Rule
When Replit Preview cannot validate the external Clerk Frontend API hostname, load Clerk through a relative same-origin proxy path. The development API process must explicitly opt into the existing Clerk proxy, and the frontend dev proxy must forward the public origin so Clerk redirects do not point at an internal localhost API address.

**Why:** Preview can expose a nested Clerk hostname whose certificate does not match the browser-visible host. Without the same-origin proxy, Clerk initialization fails. Without forwarded origin headers, the proxy can return a redirect to the internal API listener instead of a browser-reachable URL. In this environment, an arbitrary API workflow environment flag was not inherited reliably, while an explicit development-command export was.

**How to apply:** Keep the production guard unchanged. Use a relative Clerk proxy URL for Preview, enable the proxy only in the development command, and enable forwarded headers on the frontend-to-API dev proxy. Verify the initial redirect is followed by a `200` JavaScript response through both the local same-origin path and the public Preview URL. Replit Preview hostnames can rotate; an old `.sisko.repl.co` bookmark may fail DNS while the current `.sisko.replit.dev` host works.