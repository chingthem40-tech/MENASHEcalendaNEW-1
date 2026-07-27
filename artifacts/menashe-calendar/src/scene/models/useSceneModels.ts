/**
 * scene/models/useSceneModels.ts
 *
 * Phase 2 — Typed model-loading hooks for every scene asset.
 *
 * Each hook wraps `useGLTF` (with Draco configured via loaders.ts) and
 * returns typed nodes/materials so callers get autocomplete and safe access.
 *
 * When a real photogrammetry or hand-crafted GLB replaces a generated one,
 * only the file in /public/models/ changes — no scene code changes required.
 *
 * Usage:
 *   const { scene: tree }  = useOliveTree();
 *   const { scene: bench } = useStoneBench();
 */
import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

/* ── Model paths (served from /public/models/) ────────────────────────── */
export const MODEL_PATHS = {
  oliveTree:  "/models/olive-tree.glb",
  stoneBench: "/models/stone-bench.glb",
  stoneArch:  "/models/stone-arch.glb",
} as const;

type ModelKey = keyof typeof MODEL_PATHS;

/* ── Preload all models at app startup ────────────────────────────────── */
export function preloadSceneModels(): void {
  Object.values(MODEL_PATHS).forEach(path => useGLTF.preload(path));
}

/* ── Individual hooks ─────────────────────────────────────────────────── */

/** Mature olive tree — trunk + branches + multi-sphere canopy */
export function useOliveTree(): GLTF {
  return useGLTF(MODEL_PATHS.oliveTree) as unknown as GLTF;
}

/** Jerusalem limestone bench — seat + legs + armrest knobs */
export function useStoneBench(): GLTF {
  return useGLTF(MODEL_PATHS.stoneBench) as unknown as GLTF;
}

/** Stone arch bridge span — arch stones + deck + parapets + abutments */
export function useStoneArch(): GLTF {
  return useGLTF(MODEL_PATHS.stoneArch) as unknown as GLTF;
}

/* ── Generic loader (for future assets) ──────────────────────────────── */
export function useSceneModel(key: ModelKey): GLTF {
  return useGLTF(MODEL_PATHS[key]) as unknown as GLTF;
}
