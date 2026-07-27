/**
 * scene/env/SceneEnvironment.tsx
 *
 * Phase 1 — Scene environment: HDR image-based lighting, sky, fog, and
 * atmosphere parameters.
 *
 * Architecture:
 *  • Defaults to drei's built-in "sunset" preset (no .hdr file required).
 *  • Set `hdrPath` to load a custom .hdr file when assets are ready (Phase 2+).
 *    The .hdr is served from /public/env/ and loaded via RGBELoader under the hood.
 *  • Sky parameters match the golden-hour sun position in GoldenHourLighting.tsx.
 *  • FogExp2 provides atmospheric depth; tweak `fogDensity` for haze/clarity.
 */
import { Sky, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

interface SceneEnvironmentProps {
  /**
   * Path to a custom .hdr file (relative to /public).
   * Example: "/env/golden-hour.hdr"
   * If undefined, the `preset` is used instead.
   */
  hdrPath?: string;

  /**
   * drei Environment preset used when no hdrPath is supplied.
   * "sunset" matches golden-hour atmosphere.
   */
  preset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";

  /**
   * IBL contribution to scene lighting (0 = no env light, 1 = full).
   * Keep ≤ 0.55 while directional lights handle primary illumination.
   */
  envIntensity?: number;

  /** FogExp2 color. Should match sky horizon color. */
  fogColor?: string;

  /** FogExp2 density. Higher = thicker haze. Default 0.006 */
  fogDensity?: number;

  /** Show R3F Sky component. Default true. */
  showSky?: boolean;
}

/** Sun position vector for the Sky component — matches GoldenHourLighting azimuth. */
const SUN_POSITION: [number, number, number] = [0.62, 0.22, 0.15];

export function SceneEnvironment({
  hdrPath,
  preset = "sunset",
  envIntensity = 0.45,
  fogColor = "#ddc480",
  fogDensity = 0.0055,
  showSky = true,
}: SceneEnvironmentProps) {
  const { scene } = useThree();

  /* Apply FogExp2 imperatively so it survives re-renders */
  useEffect(() => {
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
    return () => { scene.fog = null; };
  }, [scene, fogColor, fogDensity]);

  return (
    <>
      {/* Image-based lighting — HDR file or preset */}
      <Environment
        files={hdrPath}
        preset={hdrPath ? undefined : preset}
        background={false}
        environmentIntensity={envIntensity}
        resolution={256}   /* 256 px env map — high quality/perf balance */
      />

      {/* Procedural sky — sits behind all geometry */}
      {showSky && (
        <Sky
          distance={450}
          sunPosition={SUN_POSITION}
          turbidity={5.5}
          rayleigh={1.1}
          mieCoefficient={0.007}
          mieDirectionalG={0.88}
          inclination={0.52}
          azimuth={0.24}
        />
      )}
    </>
  );
}

/**
 * HDR environment presets — swap `hdrPath` to any of these once .hdr
 * files are placed in /public/env/:
 *
 * "/env/golden-hour.hdr"      — warm sunset, highest realism
 * "/env/overcast.hdr"         — soft grey light
 * "/env/night-candles.hdr"    — dark scene, candlelight IBL
 */
export const HDR_PRESETS = {
  goldenHour:   "/env/golden-hour.hdr",
  overcast:     "/env/overcast.hdr",
  nightCandles: "/env/night-candles.hdr",
} as const;
