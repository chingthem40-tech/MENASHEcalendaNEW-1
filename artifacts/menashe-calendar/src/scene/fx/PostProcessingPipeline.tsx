/**
 * scene/fx/PostProcessingPipeline.tsx — Phase 5 (quality-aware)
 *
 * Active effects (ordered):
 *  1. SMAA    — temporal-stable anti-aliasing
 *  2. N8AO    — ambient occlusion (high/medium tiers; disabled on battery)
 *  3. Bloom   — HDR glow on candles / lanterns
 *  4. Vignette — cinematic edge darkening
 *
 * N8AO is rendered at full-res on high, half-res on medium, and skipped
 * entirely on battery (the whole EffectComposer is also skipped on battery).
 *
 * Tuning philosophy (SPR-038C): the AO must be felt, not noticed.
 * Target — natural limestone contact shadow, warm candle grounding, soft
 * tree-root connection.  No black corners, no muddy stone.
 */
import { BlendFunction } from "postprocessing";
import { EffectComposer, SMAA, Bloom, Vignette, N8AO } from "@react-three/postprocessing";
import { useQuality } from "../QualityContext";

interface PostProcessingPipelineProps {
  enableSMAA?:      boolean;
  enableBloom?:     boolean;
  bloomIntensity?:  number;
  bloomThreshold?:  number;
}

export function PostProcessingPipeline({
  enableSMAA     = true,
  enableBloom    = true,
  bloomIntensity,
  bloomThreshold,
}: PostProcessingPipelineProps) {
  const q = useQuality();

  if (!q.postProcessing) return null;

  const intensity  = bloomIntensity  ?? q.bloomIntensity;
  const threshold  = bloomThreshold  ?? q.bloomThreshold;

  /* ── N8AO tuning ──────────────────────────────────────────────────────────
   *  aoRadius      — world-space search radius.  2 m covers stone-block gaps
   *                  and candle-base contact; 1.5 m for medium saves bandwidth.
   *  intensity     — kept low so AO feels like contact shadow, not mud.
   *  aoSamples     — 16 for high quality, 8 for medium (half + fewer samples).
   *  denoiseSamples — temporal denoising; 8/4 gives stable, jitter-free AO.
   *  denoiseRadius  — spatial denoising footprint in pixels.
   *  distanceFalloff — 1.0 = linear; keeps far stone walls natural.
   *  depthAwareUpsampling — improves half-res quality on medium tier.
   * ──────────────────────────────────────────────────────────────────────── */
  const isHigh = q.tier === "high";

  return (
    <EffectComposer multisampling={0}>
      {enableSMAA ? <SMAA /> : <></>}

      {q.aoEnabled ? (
        <N8AO
          aoRadius={isHigh ? 2.0 : 1.5}
          intensity={isHigh ? 5.5 : 4.5}
          aoSamples={isHigh ? 16 : 8}
          denoiseSamples={isHigh ? 8 : 4}
          denoiseRadius={isHigh ? 12 : 8}
          distanceFalloff={1.0}
          halfRes={q.aoHalfRes}
          depthAwareUpsampling={q.aoHalfRes}
          screenSpaceRadius={false}
          color="black"
          quality={isHigh ? "high" : "low"}
        />
      ) : <></>}

      <Bloom
        intensity={enableBloom && q.bloomEnabled ? intensity : 0}
        luminanceThreshold={threshold}
        luminanceSmoothing={0.85}
        mipmapBlur
        blendFunction={BlendFunction.ADD}
        levels={isHigh ? 8 : 5}
      />

      <Vignette
        offset={0.32}
        darkness={0.52}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
