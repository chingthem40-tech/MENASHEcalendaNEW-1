---
name: Memorial Sanctuary — camera reset root cause
description: Why the 3D walk-mode camera teleported back to spawn, and the three-part fix
---

## The bug

`AAAFocusCamera.useEffect` had `entries` in its dependency array.

The parent modal polls `/api/community/yahrzeit` every 30 s. Each poll updates `entries` state →
`litEntries` (a `useMemo` of `entries.slice(...)`) gets a new array reference → `AAAFocusCamera`
re-fires → `selectedId` is null → else branch runs → `animating.current = true` → `useFrame`
lerps `camera.position.x/z` to `SCENE_VIEWS[sceneView].cam` (spawn). Camera teleports the player
back to the entrance on every API poll.

Additionally, `AAAFocusCamera.useFrame` had no `walkMode` guard, so it fought
`FirstPersonController` for ownership of `camera.position.x/z`.

## Three-part fix (SPR-034B)

1. **`AAAFocusCamera` — entriesRef pattern**
   Move `entries` out of the dep array; keep it current via a companion
   `useEffect(() => { entriesRef.current = entries; }, [entries])` defined BEFORE the main effect.
   The main effect reads `entriesRef.current` when `selectedId` is non-null.

2. **`AAAFocusCamera` — walkMode prop + animType ref**
   Add `walkMode: boolean` prop. Add `animType = useRef<'candle'|'overview'>('overview')`.
   - `useEffect`: `if (walkMode && !selectedId) { animating.current = false; return; }`
   - `useFrame`: `if (animType.current === 'overview' && walkMode) { animating.current = false; return; }`
   This allows candle-focus animations in walk mode but blocks overview-return animations.

3. **`AAACamera` — terrain-aware spawn Y**
   Replace hardcoded `camera.position.set(0, 1.7, 22)` with
   `const spawnY = terrainHeightAt(0, 22) + 1.7` (≈ 4.7 units).
   Camera no longer rises from underground on first entry.

## Call site

`AAAValleyScene` JSX: `<AAAFocusCamera ... walkMode={walkMode} />`

**Why:** R3F `useMemo` and parent state always create new array references; any stable-looking
array in a `useEffect` dep list is a latent teleport trigger. Candle-focus animations are safe in
walk mode; overview-return animations are not — the player owns the camera.
