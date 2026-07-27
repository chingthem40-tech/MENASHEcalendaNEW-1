---
name: r3f-perf crashes R3F canvas
description: The <Perf> component from r3f-perf patches R3F's reconciler internals and causes "Cannot set data-component-name" errors every frame, which trip the R3FErrorBoundary showing "3D scene could not be loaded".
---

## Rule
Never include `<ScenePerf>` (or `<Perf>` from `r3f-perf`) inside `MemorialValley3D` or any R3F Canvas in this project.

**Why:** `r3f-perf` hooks into R3F's fiber reconciler to gather GPU timing. In this project's R3F version it emits `R3F: Cannot set "data-component-name". Ensure it is an object before setting "component-name"` on every render frame. React treats these as uncaught render errors, which trip the `R3FErrorBoundary` in `MemorialSanctuaryModal.tsx` and permanently show "3D scene could not be loaded" — even though the scene geometry is fine.

**How to apply:** If performance monitoring is needed in future, use browser DevTools / WebGL Inspector instead. Do not re-add `ScenePerf` to the scene. The `ScenePerf` component and its import may remain in `src/scene/` for reference but must not be rendered.
