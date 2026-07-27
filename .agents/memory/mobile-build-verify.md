---
name: Mobile production build verification
description: How to verify the Expo mobile app's production build actually passes, not just tsc --noEmit
---

`tsc --noEmit` only checks types — it does not verify the Expo production bundle
actually builds. When a spec explicitly requires "production build passes",
run the real build:

```
cd artifacts/menashe-mobile && node scripts/build.js
```

**Why:** This is the project's actual prod build script (bundles iOS + Android via
Metro, downloads bundles/manifests, copies assets, writes a deploy landing page).
It takes ~60-90s. A `[Metro Error] Input is required... Use port 8084 instead?` /
"Port 8081 is being used by another process" message is expected and harmless if
the `Mobile App` dev workflow is already running on 8081 — Metro just skips
starting a second dev server and continues the static bundle export on its own
port. Look for `Build complete! Deploy to: ...` and `EXIT:0` as the real success
signal, not the port-conflict warning.

**How to apply:** Whenever a task's verification checklist includes "production
build passes" for the mobile app, don't rely on typecheck alone — run this build
script and confirm it exits 0 with "Build complete!".
