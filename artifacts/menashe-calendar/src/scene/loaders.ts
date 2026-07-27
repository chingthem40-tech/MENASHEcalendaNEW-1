/**
 * scene/loaders.ts
 *
 * Phase 1 — Central asset-loading configuration.
 *
 * Registers Draco decoder globally so every subsequent `useGLTF()` call
 * automatically supports Draco-compressed .glb files.
 *
 * KTX2 (Basis Universal) requires a WebGLRenderer reference and per-loader
 * configuration; a ready-to-use `makeKTX2Loader` helper is provided for
 * Phase 2 when compressed textures are added.
 *
 * Usage:
 *   Call `configureLoaders()` once (no arguments needed) before any useGLTF
 *   call fires.  Best placed in a component that mounts inside the Canvas.
 */
import { useGLTF } from "@react-three/drei";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import type * as THREE from "three";

/** Decoder paths served from /public */
export const DRACO_DECODER_PATH  = "/draco/";
export const BASIS_TRANSCODER_PATH = "/basis/";

/**
 * Configure Draco decoder globally on useGLTF.
 * Safe to call multiple times (idempotent).
 */
export function configureLoaders(): void {
  useGLTF.setDecoderPath(DRACO_DECODER_PATH);
}

/**
 * Build a KTX2Loader ready to attach to a GLTFLoader.
 * Call this in Phase 2 when adding Basis-compressed texture assets.
 *
 * @example
 *   const ktx2 = makeKTX2Loader(gl);
 *   const gltfLoader = new GLTFLoader();
 *   gltfLoader.setKTX2Loader(ktx2);
 */
export function makeKTX2Loader(gl: THREE.WebGLRenderer): KTX2Loader {
  const ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath(BASIS_TRANSCODER_PATH);
  ktx2.detectSupport(gl);
  return ktx2;
}

/**
 * Preload a set of GLTF/GLB paths so they are cached before first render.
 * Call at module level (outside components) for critical assets.
 *
 * @example
 *   preloadAssets(["/models/sanctuary.glb", "/models/olive-tree.glb"]);
 */
export function preloadAssets(paths: string[]): void {
  paths.forEach(p => useGLTF.preload(p));
}

/**
 * Asset manifest — populate as GLB models are produced (Phase 2+).
 * Use `AssetKey` type to reference manifest entries safely.
 */
export const ASSET_MANIFEST = {
  // sanctuary:  "/models/sanctuary.glb",
  // oliveTree:  "/models/olive-tree.glb",
  // stoneBench: "/models/bench.glb",
  // waterfall:  "/models/waterfall.glb",
} as const;

export type AssetKey = keyof typeof ASSET_MANIFEST;
