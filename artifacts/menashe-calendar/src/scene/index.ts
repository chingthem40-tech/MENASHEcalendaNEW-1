/**
 * scene/index.ts — Phase 1 public API
 *
 * Re-exports all stable foundation pieces so consumers import from a
 * single path that won't change as internal layout evolves.
 */
export { SceneFoundation }           from "./SceneFoundation";
export { GoldenHourLighting }        from "./lighting/GoldenHourLighting";
export { PostProcessingPipeline }    from "./fx/PostProcessingPipeline";
export { SceneEnvironment, HDR_PRESETS } from "./env/SceneEnvironment";
export { ScenePerf }                 from "./perf/ScenePerf";
export { QualityProvider, useQuality, useSetQuality } from "./QualityContext";
export type { QualityTier, QualitySettings } from "./QualityContext";
export { FPSAdaptation } from "./fx/FPSAdaptation";
export {
  configureLoaders,
  preloadAssets,
  ASSET_MANIFEST,
  DRACO_DECODER_PATH,
  BASIS_TRANSCODER_PATH,
} from "./loaders";
export type { AssetKey }             from "./loaders";
