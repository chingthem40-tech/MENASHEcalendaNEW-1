/**
 * scene/SceneFoundation.tsx — Phase 5 (quality-aware)
 *
 * Reads QualitySettings from QualityContext to configure:
 *  • Device pixel ratio cap (dprMax)
 *  • Shadow map type and resolution
 *  • Tone mapping / color space
 *
 * The QualityProvider must wrap SceneFoundation in the parent component.
 */
import { Suspense, useEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { configureLoaders } from "./loaders";
import { useQuality } from "./QualityContext";

function LoaderSetup() {
  const { gl } = useThree();
  useEffect(() => { configureLoaders(); void gl; }, [gl]);
  return null;
}

function RendererConfig() {
  const { gl, scene } = useThree();
  const q = useQuality();

  useEffect(() => {
    gl.shadowMap.enabled = q.shadowsEnabled;
    gl.shadowMap.type    = q.shadowsEnabled ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    gl.toneMapping         = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.48;
    gl.outputColorSpace    = THREE.SRGBColorSpace;

    scene.backgroundBlurriness = 0;
  }, [gl, scene, q.shadowsEnabled]);
  return null;
}

const GL_PROPS: React.ComponentProps<typeof Canvas>["gl"] = {
  antialias:                    false,
  alpha:                        false,
  stencil:                      false,
  depth:                        true,
  powerPreference:              "high-performance",
  failIfMajorPerformanceCaveat: false,
  preserveDrawingBuffer:        false,
};

interface SceneFoundationProps {
  children:     ReactNode;
  fov?:         number;
  className?:   string;
  style?:       React.CSSProperties;
  /**
   * Optional DOM element to use as the R3F event source.
   * When set, the Canvas receives pointer-events:none and R3F listens on
   * this element instead — allowing UI overlays to sit above the canvas
   * and receive their own pointer events without 3D-raycast interference.
   */
  eventSource?: React.RefObject<HTMLElement | null>;
}

export function SceneFoundation({ children, fov = 44, className, style, eventSource }: SceneFoundationProps) {
  const q = useQuality();

  return (
    <Canvas
      shadows={q.shadowsEnabled}
      camera={{ fov, near: 0.15, far: 320, position: [0, 4.2, 18] }}
      gl={GL_PROPS}
      dpr={[1, q.dprMax]}
      frameloop="always"
      performance={{ min: 0.5 }}
      className={className}
      eventSource={eventSource as React.RefObject<HTMLElement> | undefined}
      eventPrefix={eventSource ? "client" : undefined}
      style={{
        width: "100%", height: "100%",
        ...style,
      }}
    >
      <LoaderSetup />
      <RendererConfig />
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
}
