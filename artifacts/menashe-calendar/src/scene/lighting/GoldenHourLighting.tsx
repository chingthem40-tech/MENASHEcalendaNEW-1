/**
 * scene/lighting/GoldenHourLighting.tsx
 *
 * Phase 1 — Cinematic golden-hour lighting pipeline.
 *
 * Design goals:
 *  • Physically plausible: hemisphere sky/ground + directional sun + bounce fill
 *  • Golden-hour warmth: sun azimuth ~15° above horizon, orange-amber color
 *  • Soft PCF shadows at 2048 px (swappable to 4096 for high-end devices)
 *  • Animated sun drift (slow, imperceptible cycle) for living feel
 *  • All parameters are props so callers can tweak without touching internals
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GoldenHourLightingProps {
  /** Enable slow animated sun drift. Default true. */
  animate?: boolean;
  /** Overall brightness scale. Default 1.0. */
  exposure?: number;
  /** Shadow map resolution. Default 2048. */
  shadowMapSize?: number;
  /** Enable cast shadows on sun. Default true. */
  shadows?: boolean;
}

export function GoldenHourLighting({
  animate = true,
  shadowMapSize = 2048,
  shadows = true,
}: GoldenHourLightingProps) {
  const sunRef    = useRef<THREE.DirectionalLight>(null!);
  const fillRef   = useRef<THREE.DirectionalLight>(null!);

  useFrame(({ clock }) => {
    if (!animate) return;
    const t = clock.getElapsedTime() * 0.018; // very slow drift

    /* Sun arc — stays in golden-hour range (roughly 8–20° elevation) */
    const elev   = 14 + Math.sin(t * 0.9) * 5;          // degrees
    const az     = 225 + Math.cos(t * 0.7) * 12;        // degrees
    const elevR  = (elev  * Math.PI) / 180;
    const azR    = (az    * Math.PI) / 180;
    const dist   = 55;
    sunRef.current.position.set(
      Math.cos(elevR) * Math.cos(azR) * dist,
      Math.sin(elevR) * dist,
      Math.cos(elevR) * Math.sin(azR) * dist,
    );

    /* Warm amber flicker — very subtle */
    const warmth = 0.82 + Math.sin(t * 3.1) * 0.04;
    sunRef.current.color.setRGB(1.0, warmth * 0.72, warmth * 0.42);
    sunRef.current.intensity = 1.95 + Math.sin(t * 1.8) * 0.15;

    /* Cool sky fill drifts opposite */
    fillRef.current.position.x = -sunRef.current.position.x * 0.6;
    fillRef.current.position.z = -sunRef.current.position.z * 0.6;
  });

  return (
    <>
      {/* Hemisphere — warm sky / cool earth */}
      <hemisphereLight
        args={["#ffd4a0", "#2e4a1e", 0.7]}
        position={[0, 50, 0]}
      />

      {/* Primary sun — directional, casts soft shadows */}
      <directionalLight
        ref={sunRef}
        color="#ffbb66"
        intensity={2.1}
        position={[38, 22, 28]}
        castShadow={shadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />

      {/* Cool sky fill — bounced sky light from opposite direction */}
      <directionalLight
        ref={fillRef}
        color="#8ab8d8"
        intensity={0.38}
        position={[-22, 14, -18]}
        castShadow={false}
      />

      {/* Ground bounce — warm amber reflected from limestone */}
      <directionalLight
        color="#d49a50"
        intensity={0.22}
        position={[0, -8, 0]}
        castShadow={false}
      />

      {/* Ambient candle warmth — very low, fills shadow areas */}
      <ambientLight color="#ff9944" intensity={0.12} />
    </>
  );
}
