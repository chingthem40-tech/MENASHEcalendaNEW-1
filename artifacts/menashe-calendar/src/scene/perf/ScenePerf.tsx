/**
 * scene/perf/ScenePerf.tsx
 *
 * Performance monitoring overlay — STUBBED OUT.
 *
 * r3f-perf 7.x is incompatible with @react-three/fiber v9.x: the `Perf`
 * component accesses internal R3F APIs that were redesigned in v9, causing
 * the R3F reconciler to throw on every frame and crash the entire Canvas.
 *
 * This stub exports the same API surface so no call sites need to change,
 * but always returns null, keeping the import graph clean and the scene
 * healthy.  If a compatible version of r3f-perf ships for R3F v9, re-enable
 * by swapping this file for the real implementation.
 */

interface ScenePerfProps {
  forceShow?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function ScenePerf(_props: ScenePerfProps) {
  return null;
}
