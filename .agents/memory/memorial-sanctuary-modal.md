---
name: Memorial Sanctuary modal architecture
description: Key decisions and constraints for MemorialSanctuaryModal.tsx and MemorialValley3D.tsx — the 3D memorial scene and its full UI overlay.
---

## Structure
Everything lives in two files:
- `artifacts/menashe-calendar/src/modals/MemorialSanctuaryModal.tsx` — all overlay UI panels (Home, Profile, Search, Music, Flowers, Candle form, Notifications)
- `artifacts/menashe-calendar/src/components/MemorialValley3D.tsx` — R3F scene with GLSL shaders, instanced geometry, and Phase 3/4 components

## Critical rules

### Virtual flowers — no per-flower point lights
Each placed flower must use emissive-only materials (no `pointLight`). Placement is unbounded from UI so dozens of dynamic lights will tank FPS.
**Why:** Found during Phase 3 code review. Fix: raise `emissiveIntensity` on petal/center materials instead.

### AmbientNotification — always use entriesRef for fire()
The `useEffect` that schedules notification fires runs with `[paused]` deps only. To avoid stale entries snapshot, keep a `entriesRef = useRef(entries)` and sync it in a separate `useEffect([entries])`. Fire reads `entriesRef.current`.
**Why:** Entries load async after mount; stale closure would always show wrong names.

### Virtual flowers cap
`MAX_VIRTUAL_FLOWERS = 40` — `AAAVirtualFlowers` slices to last 40 on render. No need to cap the state array itself.

### R3F mount guard
`canRender3D` state (initially `false`, set `true` after first `useEffect`) prevents R3F Canvas from mounting during React 19 Strict Mode's discarded first render. Never remove this guard.

### Scene camera hierarchy
Three camera drivers coexist:
1. `AAACamera` — sets initial position
2. `AAAFocusCamera` — smooth lerp to selected candle; on deselect restores to **active sceneView target**, not hardcoded HOME_TARGET
3. `AAASceneCameraDriver` — smooth lerp between SCENE_VIEWS presets when scene tab changes

All three share the same OrbitControls ref (`ctrlsRef`). Ordering matters: FocusCamera and SceneCameraDriver both write to `ctrl.target` — FocusCamera wins when a candle is selected.

## Phase 4 features added (MemorialSanctuaryModal.tsx)
- `SanctuaryHomePanel` — shown when `activeNav === "home"` & `!panelOpen`; replaces LeftStatsPanel; shows Hebrew date (HDate), community stats, today's Yahrzeit (hebrewDay/hebrewMonth match), recently lit, daily intention, light-a-candle CTA
- `AmbientNotification` — soft toast every ~30-45s; paused when panels open; uses entriesRef pattern
- Enhanced `MemorialProfileSheet` — life timeline (birth computed from passingYear), share (clipboard + cleanup via shareTimerRef), favorite toggle, glow ring avatar
- Keyboard handler — Escape progressively closes: selectedEntry → showForm → non-home nav → modal
- CSS: `prefers-reduced-motion` override, `ms-home-panel-override` + `ms-right-panel-override` responsive classes, `focus-visible` outlines on nav buttons

## How to add new right-side panels
Pattern used by MusicPanel and FlowersPanel:
1. Add `key: RightNav` value to `R_NAV_ITEMS`
2. Add `show[Panel] = activeNav === "key" && !panelOpen`
3. Create panel component: `position: absolute, right: 80, top: "50%", transform: "translateY(-50%)"`, spring animate x:80→0
4. Wrap in `<AnimatePresence>` in render
