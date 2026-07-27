---
name: R3F packages install method for menashe-calendar
description: Three.js/R3F packages must be installed with pnpm workspace filter, not the installLanguagePackages tool.
---

The `installLanguagePackages` tool tries to add to workspace root and fails with ERR_PNPM_ADDING_TO_ROOT.

**How to apply:** Always install Three.js/R3F packages directly into the package:
```
pnpm --filter @workspace/menashe-calendar add three @react-three/fiber @react-three/drei @react-three/postprocessing
```

**Why:** pnpm workspace root blocks direct installs without `-w` flag; the skill tool doesn't pass that flag.

Packages confirmed installed as of 2025-06-25: `three@0.184.0`, `@react-three/fiber@9.6.1`, `@react-three/drei`, `@react-three/postprocessing`, `r3f-perf@7.2.3`.
