---
name: Replit Auth provisioning
description: Replit Auth is a managed workspace capability and must be provisioned before application code can use its generated session contract.
---

Replit Auth must be enabled through the workspace Auth flow before migrating an
existing application. In this workspace, enabling Auth did not generate a
repository middleware or client package, so the application uses the managed
OIDC discovery contract with its own signed session bridge. Verify discovery,
the client identifier, and the public callback hostname before rollout.

**Why:** The workspace can have Clerk configured while exposing no Replit Auth
connector, package, environment contract, or generated files. Implementing a
guessed OIDC flow risks breaking session security and diverging from Replit's
managed setup. During a staged migration, Clerk middleware may also populate
`req.auth`; managed sessions must use a separate request field so signed-out
Clerk state cannot be treated as a Replit login.

**How to apply:** Check the workspace Auth setup first. Confirm
`/.well-known/openid-configuration`, use PKCE and a server-side state/verifier
store, derive the callback from forwarded public-host headers, and keep Clerk
only as an explicit transition fallback until identity mappings are accepted.