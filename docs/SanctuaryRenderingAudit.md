# Sanctuary World Rendering Audit — SPR-030
**Date:** 2026-06-28  
**File:** `artifacts/menashe-calendar/src/components/MemorialValley3D.tsx` (2,700+ lines)

---

## Scene Inventory

### Meshes & Draw Calls (pre-SPR-030)

| Component | Type | Draw Calls (before) | Draw Calls (after) |
|---|---|---|---|
| AAATerrain – main terrain | PlaneGeometry 100×100 / 160×160 segs | 1 | 1 |
| AAATerrain – courtyard, lawn, terrace caps | Static meshes | 5 | 5 |
| AAATerraceWalls – 3 tiers × 48 stones | **144 individual BoxGeometry** | **144** | **3** ✅ |
| AAAStonePathways – cross + diagonal paths | Static slabs | 4 | 4 |
| AAAStonePathways – circular pool stones | **56 individual BoxGeometry** | **56** | **1** ✅ |
| AAAStonePathways – stone edging | **32 individual BoxGeometry** | **32** | **1** ✅ |
| AAAStonePathways – terrace step edges | **3 × 40 BoxGeometry** | **120** | **1** ✅ |
| AAAWaterSystem – pool, basin, rim, rivers | Shader + standard | 6 | 6 |
| AAAWaterfall (×3) | Cascade planes | ~9 | ~9 |
| AAABridge (×2) | Box meshes | ~12 | ~12 |
| AAAArchitecture – columns, arches | Box/cylinder | ~30 | ~30 |
| AAAOliveTrees – instanced | 5 InstancedMesh groups | 5 | 5 |
| AAAMediterraneanVegetation – instanced | 6 InstancedMesh groups | 6 | 6 |
| AAAStoneBenches – 8 groups × 3 meshes | 24 individual | 24 | 24 |
| AAAEternalAltar | ~6 meshes | 6 | 6 |
| AAABackgroundCandles – instanced | 2 InstancedMesh (~230 instances each) | 2 | 2 |
| AAAEntryCandle (per memorial) | ~4 meshes each | N×4 | N×4 |
| AAABirdFlock – 7 birds × 3 meshes | 21 individual | 21 | 21 |
| AAAButterflies – 10 × 2 meshes | 20 individual | 20 | 20 |
| AAAGrassBlades | 1 InstancedMesh (200) | 1 | 1 |
| AAADriftingLeaves | 1 InstancedMesh (55) | 1 | 1 |
| AAAPollenParticles | 1 InstancedMesh (220) | 1 | 1 |
| AAAGoldenDust | 1 InstancedMesh (150) | 1 | 1 |
| AAAGodRays | 1 InstancedMesh (16) | 1 | 1 |
| AAACandleSmoke | 1 InstancedMesh | 1 | 1 |
| AAAWaterfallMist (×3) | 3 InstancedMesh | 3 | 3 |
| AAAGroundMist | 3 shader planes | 3 | 3 |
| AAAMovingClouds – 4 groups × 5 spheres | 20 individual | 20 | 20 |
| AAAFloatingLanterns – instanced | ~3 meshes × N active | ~30 | ~30 |
| AAASkyDome | 1 shader sphere | 1 | 1 |
| AAAStarField | 1 Points (1400 pts) | 1 | 1 |
| AAAMoon | 3 circles | 3 | 3 |
| GroundClickPlane | 1 transparent plane | 1 | 1 |

**Total estimated draw calls: ~620 → ~270 (−56%) ✅**

---

## Materials

| Material Type | Usage |
|---|---|
| MeshStandardMaterial | Dominant — terrain, vegetation, stones, candles |
| ShaderMaterial | Water (WATER_VERT/FRAG), Flame (FLAME_VERT/FRAG), Sky (SKY_VERT/FRAG), Mist (MIST_VERT/FRAG) |
| MeshBasicMaterial | God rays (additive), Moon disc/halo, Star field |
| PointsMaterial | Star field |

All key materials use PBR parameters (roughness/metalness). No MeshPhongMaterial.

---

## Lighting

| Light | Type | Shadows | Cost |
|---|---|---|---|
| DayNightLighting – sun | DirectionalLight | castShadow, 4096px → **2048px** ✅ | Medium |
| DayNightLighting – fill | DirectionalLight | none | Low |
| DayNightLighting – ground bounce | DirectionalLight | none | Low |
| DayNightLighting – ambient | AmbientLight | n/a | Low |
| Hemisphere light | HemisphereLight | n/a | Low |
| Background candle clusters | 8 PointLights | none | Low |
| Entry candles (pooled) | Up to `lightPoolSize` PointLights | none | Low–Medium |
| AAAEternalAltar | PointLight | **castShadow removed** ✅ | Low |
| AAAFloatingLanterns | PointLight × lightPoolSize | none | Low |

---

## Textures / Environment

- **No custom .hdr files** — uses drei `Environment preset="sunset"` for IBL
- **Custom procedural sky** via AAASkyDome shader (bypasses drei Sky)
- IBL `environmentIntensity = 0.55`
- Shadow map type: PCFSoftShadowMap

---

## Post-Processing

| Effect | Status | Notes |
|---|---|---|
| SMAA | ✅ Active on high/medium | Temporal-stable AA |
| Bloom | ✅ Active, intensity 1.4, threshold 0.28 | mipmap blur, 8 levels (high) / 5 (medium) |
| Vignette | **Tuned: darkness 0.82 → 0.44, offset 0.20 → 0.32** ✅ | Reduced black crush |
| SSAO | Disabled | Too expensive on mobile |

---

## Performance Bottlenecks (pre-SPR-030)

| Bottleneck | Severity | Fix |
|---|---|---|
| 144 individual stone wall meshes | 🔴 Critical | → AAATerraceWalls InstancedMesh (3 DC) |
| 208 individual stone path meshes | 🔴 Critical | → AAAStonePathways InstancedMesh (3 DC) |
| 4096×4096 shadow map | 🟠 High | → 2048×2048 |
| Altar PointLight castShadow | 🟠 High | → castShadow removed |
| Grass blades missing depthWrite={false} | 🟡 Medium | → Fixed |
| Vignette crushing dark areas (darkness=0.82) | 🟡 Medium (visual) | → 0.44 |
| Tone mapping exposure too low (1.46) | 🟡 Medium (visual) | → 1.62 |

---

## FPS Targets vs Actual

| Platform | Target | Estimated pre-SPR-030 | Estimated post-SPR-030 |
|---|---|---|---|
| Desktop Chrome | 60 FPS | 45–60 FPS | 58–60 FPS |
| Android (mid-range) | 45–60 FPS | 30–45 FPS | 40–55 FPS |
| Low-end Android (battery tier) | 30 FPS | 20–30 FPS | 28–35 FPS |

---

## Atmosphere Inventory

| Effect | Present | Notes |
|---|---|---|
| FogExp2 (distance) | ✅ | Dynamically updated by day/night cycle |
| Ground mist (3 shader layers) | ✅ | Denser at night |
| Pollen particles (220, instanced) | ✅ | Scale by quality tier |
| Golden dust (150, instanced) | ✅ | |
| Drifting leaves (55, instanced) | ✅ | |
| Candle smoke (instanced) | ✅ | |
| Waterfall mist (3 × 20 instanced) | ✅ | |
| God rays (16 instanced planes) | ✅ | Additive blend |
| Floating lanterns (32) | ✅ | Quality-scaled |

---

## SPR-030 Changes Implemented

### Performance
1. ✅ `AAATerraceWalls` — 144 individual meshes → 3 InstancedMesh (−141 draw calls)
2. ✅ `AAAStonePathways` — 208 individual meshes → 3 InstancedMesh (−205 draw calls)
3. ✅ `DayNightLighting` shadow map 4096×4096 → 2048×2048 (−4× GPU memory)
4. ✅ `AAAEternalAltar` PointLight `castShadow` removed (point shadow cubemap eliminated)

### Visual Quality
5. ✅ Vignette `darkness` 0.82 → 0.44, `offset` 0.20 → 0.32 (much less crushing)
6. ✅ Tone mapping exposure 1.46 → 1.62 (warmer, brighter output)
7. ✅ Grass blade material `depthWrite={false}` (correct transparency sorting)

### Camera
8. ✅ `CameraIdleDrift` component — subtle breathing after 3 s idle, fades in over 2.5 s, reverts instantly on interaction

---

## Quality Tier Reference

| Tier | DPR cap | Shadow map | Post-proc | Bloom | particleScale | lightPoolSize |
|---|---|---|---|---|---|---|
| high | 1.75× | 1024 px | ✅ | 1.4 @ 0.28 | 100% | 8 |
| medium | 1.5× | 512 px | ✅ | 0.9 @ 0.38 | 50% | 3 |
| battery | 1.0× | 256 px | ❌ | off | 22% | 0 |

*Note: `DayNightLighting` hard-codes 2048 px shadow map (post-SPR-030), which overrides QualityContext's `shadowMapSize` for the directional sun. This is intentional — the QualityContext value is used by `GoldenHourLighting` only.*
