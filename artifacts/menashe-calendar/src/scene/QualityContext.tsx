/**
 * scene/QualityContext.tsx
 *
 * Phase 5 — Adaptive quality tier system.
 *
 * Auto-detects device capability on mount and provides a context with
 * per-tier rendering settings.  All scene components read this context
 * to scale particle counts, enable/disable effects, and cap DPR.
 *
 * Tiers
 * ─────
 *  high        desktop with ≥8 cores / ≥8 GB — full visual fidelity
 *  medium      mid-range desktop or modern mobile — balanced
 *  battery     low-end or constrained — minimal GPU load
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type QualityTier = "high" | "medium" | "battery";

export interface QualitySettings {
  tier:               QualityTier;
  /** Max device pixel ratio passed to Canvas */
  dprMax:             number;
  /** Whether shadow maps are enabled */
  shadowsEnabled:     boolean;
  /** Shadow map resolution (px) */
  shadowMapSize:      number;
  /** Whether EffectComposer post-processing is active */
  postProcessing:     boolean;
  bloomEnabled:       boolean;
  bloomIntensity:     number;
  bloomThreshold:     number;
  /**
   * Fraction of the full particle count to use (0–1).
   * Components multiply their array lengths by this value.
   */
  particleScale:      number;
  /**
   * Number of per-candle point lights to keep active.
   * Candles beyond this index skip their point light entirely.
   */
  lightPoolSize:      number;
  /** Whether N8AO ambient occlusion is active (disabled on battery tier) */
  aoEnabled:          boolean;
  /**
   * Render N8AO at half resolution for performance.
   * true on medium — saves significant GPU bandwidth with minor quality loss.
   */
  aoHalfRes:          boolean;
}

const PRESETS: Record<QualityTier, QualitySettings> = {
  high: {
    tier:             "high",
    dprMax:           1.75,
    shadowsEnabled:   true,
    shadowMapSize:    1024,
    postProcessing:   true,
    bloomEnabled:     true,
    bloomIntensity:   0.92, /* SPR-034D: reduced from 1.4 — avoids overexposed bloom */
    bloomThreshold:   0.34, /* SPR-034D: raised from 0.28 — fewer surfaces bloom */
    particleScale:    1.0,
    lightPoolSize:    8,
    aoEnabled:        true,
    aoHalfRes:        false,
  },
  medium: {
    tier:             "medium",
    dprMax:           1.5,
    shadowsEnabled:   true,
    shadowMapSize:    512,
    postProcessing:   true,
    bloomEnabled:     true,
    bloomIntensity:   0.9,
    bloomThreshold:   0.38,
    particleScale:    0.50,
    lightPoolSize:    3,
    aoEnabled:        true,
    aoHalfRes:        true,
  },
  battery: {
    tier:             "battery",
    dprMax:           1.0,
    shadowsEnabled:   false,
    shadowMapSize:    256,
    postProcessing:   false,
    bloomEnabled:     false,
    bloomIntensity:   0,
    bloomThreshold:   1.0,
    particleScale:    0.22,
    lightPoolSize:    0,
    aoEnabled:        false,
    aoHalfRes:        true,
  },
};

function detectTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  const cores  = navigator.hardwareConcurrency ?? 4;
  const mem    = ((navigator as unknown) as Record<string, unknown>).deviceMemory as number ?? 4; // Chrome only
  const touch  = navigator.maxTouchPoints > 1;
  const px     = window.innerWidth * window.innerHeight * (window.devicePixelRatio ?? 1);

  /* Battery signals: very few cores, low RAM, or small touch-device screen */
  if (cores <= 2 || mem <= 2 || (touch && px < 800_000)) return "battery";

  /* Touch devices (phones/tablets) are capped at medium regardless of core/RAM count.
   * The Memorial Valley 3D scene is heavy: bloom + particles + shadows on mobile GPU
   * will cause frame drops and unresponsive UI even on high-end phones. */
  if (touch) return "medium";

  /* Desktop: medium on moderate hardware, high on powerful machines */
  if (cores <= 4 || mem <= 4) return "medium";
  return "high";
}

const QualityContext         = createContext<QualitySettings>(PRESETS.high);
const QualityDispatchContext = createContext<(tier: QualityTier) => void>(() => {});

export function QualityProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<QualityTier>(detectTier);
  const settings = useMemo(() => PRESETS[tier], [tier]);
  return (
    <QualityDispatchContext.Provider value={setTier}>
      <QualityContext.Provider value={settings}>
        {children}
      </QualityContext.Provider>
    </QualityDispatchContext.Provider>
  );
}

/** Read the current quality settings. Works inside and outside the R3F Canvas. */
export function useQuality(): QualitySettings {
  return useContext(QualityContext);
}

/**
 * Returns a stable setter that promotes/demotes the quality tier at runtime.
 * Must be called inside a QualityProvider.  Used by FPSAdaptation.
 */
export function useSetQuality(): (tier: QualityTier) => void {
  return useContext(QualityDispatchContext);
}
