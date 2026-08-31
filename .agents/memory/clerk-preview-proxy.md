---
name: Clerk Preview proxy
description: Reliable Clerk JavaScript loading through Replit's proxied Preview environment.
---

## Rule
When Replit Preview cannot validate the external Clerk Frontend API hostname, load Clerk through a relative same-origin proxy path. The development API process must explicitly opt into the existing Clerk proxy, and the frontend dev proxy must forward the public origin so Clerk redirects do not point at an internal localhost API address.

**Why:** Preview can expose a nested Clerk hostname whose certificate does not match the browser-visible host. Without the same-origin proxy, Clerk initialization fails. Without forwarded origin headers, the proxy can return a redirect to the internal API listener instead of a browser-reachable URL. In this environment, an arbitrary API workflow environment flag was not inherited reliably, while an explicit development-command export was.

**How to apply:** Keep the production guard unchanged. Use a relative Clerk proxy URL for Preview, enable the proxy only in the development command, and enable forwarded headers on the frontend-to-API dev proxy. Verify the initial redirect is followed by a `200` JavaScript response through both the local same-origin path and the public Preview URL. Replit Preview hostnames can rotate; an old `.sisko.repl.co` bookmark may fail DNS while the current `.sisko.replit.dev` host works.

## Replit-managed production domains

**Rule:** Treat the Clerk domain record's existing `proxy_url` as authoritative. Replit-managed provider domains can reject dashboard and Backend API edits, so the app's server route and client proxy URL must match the locked path.

**Why:** A path mismatch produced `host_invalid` even though the Clerk secret, production instance, primary domain, and certificates were valid. Direct use of the generated `clerk.<replit.app>` hostname also failed TLS because Replit served an internal proxy certificate.

**How to apply:** Read the domain record through the connected Clerk API without exposing credentials, align the app to its proxy path, then test the proxy with the published hostname forwarded to the local API. Localhost-based browser previews can still report `host_invalid` because their origin does not match the production domain; enable the existing development-only app preview mode in the web workflow so the dashboard does not become blank while Clerk is unresolved. The API development command must also clean up an older compiled server without relying on `fuser`, which is not installed in this environment.