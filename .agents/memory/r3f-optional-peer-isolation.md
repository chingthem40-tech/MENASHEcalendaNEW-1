---
name: R3F optional peer isolation
description: Why the web artifact must not inherit React Three/Fiber's optional Expo peers from the mobile workspace.
---

React Three/Fiber declares Expo and React Native packages as optional peers. In a mixed web/mobile pnpm workspace, pnpm can resolve those peers from the mobile artifact and then report Expo CLI dependencies as part of the web production graph.

**Why:** Browser bundling excludes these native packages, but dependency audits still attribute their advisories to the web importer unless the optional native peers are removed during package manifest resolution.

**How to apply:** Keep the scoped pnpm manifest hook limited to React Three/Fiber 9.x native peers. After Fiber or pnpm upgrades, force a lockfile re-resolution and verify `pnpm audit --prod --json` attributes Expo findings only to the mobile artifact.