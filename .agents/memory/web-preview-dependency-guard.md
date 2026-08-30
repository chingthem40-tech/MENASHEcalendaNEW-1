---
name: Web Preview dependency guard
description: Handling optional frontend peer dependencies that Vite still resolves during Preview startup.
---

## Rule
If Vite reports an unresolved optional peer dependency from a bundled frontend vendor chunk, install that peer directly in the consuming web artifact instead of relying on the parent package's optional-peer metadata.

**Why:** The browser bundle may contain a guarded reference to the optional peer, but Vite's dependency scanner still resolves the reference during development. Leaving it absent can make the Preview startup noisy or skip dependency pre-bundling.

**How to apply:** Scope the package addition to the web workspace, regenerate the lockfile, restart the web workflow, and verify the dependency-scan warning is gone and the production Vite build succeeds.