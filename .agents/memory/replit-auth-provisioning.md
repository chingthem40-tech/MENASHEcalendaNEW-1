---
name: Replit Auth provisioning
description: Replit Auth is a managed workspace capability and must be provisioned before application code can use its generated session contract.
---

Replit Auth must be enabled through the workspace Auth flow before migrating an
existing application. The platform supplies the middleware, routes, session
configuration, and user identity contract; do not infer or hand-roll those
details when no generated setup is present.

**Why:** The workspace can have Clerk configured while exposing no Replit Auth
connector, package, environment contract, or generated files. Implementing a
guessed OIDC flow risks breaking session security and diverging from Replit's
managed setup.

**How to apply:** Check for the managed Auth setup before changing provider
imports. If it is absent, have the user enable Replit Auth in the workspace Auth
tool, then resume the provider-neutral migration using the generated contract.