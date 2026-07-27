/**
 * scene/fx/FPSAdaptation.tsx
 *
 * Invisible R3F component that watches the live frame rate and silently
 * demotes or promotes the quality tier so the Sanctuary stays smooth
 * on every device without any manual configuration.
 *
 * Ladder:    high ←→ medium ←→ battery
 *
 * Rules
 * ─────
 *  Demote  — FPS sustained below DEMOTE_FPS for DEMOTE_GRACE seconds
 *  Promote — FPS sustained above PROMOTE_FPS for PROMOTE_GRACE seconds
 *              AND at least PROMOTE_COOLDOWN ms have passed since the
 *              last demotion (prevents oscillation on borderline hardware)
 *  Settle  — after any tier change, ignore the next SETTLE_SECONDS of
 *              frames (re-renders + shader recompilation cause a brief dip)
 *
 * This component must be placed inside the R3F Canvas.
 * QualityProvider (which wraps the Canvas) must be its ancestor.
 */
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useQuality, useSetQuality } from "../QualityContext";
import type { QualityTier } from "../QualityContext";

/* ── Thresholds ───────────────────────────────────────────────────────────── */
const DEMOTE_FPS        = 40;          // sustained below this → step down
const PROMOTE_FPS       = 55;          // sustained above this → step up
const DEMOTE_GRACE      = 3;           // seconds below threshold before demotion
const PROMOTE_GRACE     = 12;          // seconds above threshold before promotion
const PROMOTE_COOLDOWN  = 45_000;      // ms after demotion before promotion allowed
const SETTLE_SECONDS    = 2.5;         // ignore FPS for this long after tier change
const MAX_DELTA         = 0.2;         // clamp single-frame deltas (tab-switch, etc.)

/* ── Transition maps ──────────────────────────────────────────────────────── */
const DEMOTE_MAP: Partial<Record<QualityTier, QualityTier>> = {
  high:   "medium",
  medium: "battery",
};
const PROMOTE_MAP: Partial<Record<QualityTier, QualityTier>> = {
  battery: "medium",
  medium:  "high",
};

export function FPSAdaptation() {
  const { tier } = useQuality();
  const setTier   = useSetQuality();

  /* Keep tier in a ref so the useFrame closure never goes stale */
  const tierRef     = useRef<QualityTier>(tier);
  const underTimer  = useRef(0);   // seconds of consecutive below-threshold FPS
  const overTimer   = useRef(0);   // seconds of consecutive above-threshold FPS
  const demotedAt   = useRef<number | null>(null);
  const settleTimer = useRef(SETTLE_SECONDS); // start with a warm-up grace period

  useEffect(() => { tierRef.current = tier; }, [tier]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DELTA);

    /* ── Settling: ignore frames right after a tier switch ── */
    if (settleTimer.current > 0) {
      settleTimer.current -= dt;
      return;
    }

    const fps = 1 / delta;

    if (fps < DEMOTE_FPS) {
      /* ── FPS is low — accumulate demote timer ── */
      underTimer.current += dt;
      overTimer.current   = 0;

      if (underTimer.current >= DEMOTE_GRACE) {
        const next = DEMOTE_MAP[tierRef.current];
        underTimer.current = 0;
        if (next) {
          settleTimer.current = SETTLE_SECONDS;
          demotedAt.current   = Date.now();
          setTier(next);
        }
        /* If already at battery, stop: we can't go lower */
      }
    } else if (fps > PROMOTE_FPS) {
      /* ── FPS is high — accumulate promote timer ── */
      overTimer.current  += dt;
      underTimer.current  = 0;

      const cooldownOk = !demotedAt.current ||
        (Date.now() - demotedAt.current) > PROMOTE_COOLDOWN;

      if (overTimer.current >= PROMOTE_GRACE && cooldownOk) {
        const next = PROMOTE_MAP[tierRef.current];
        overTimer.current = 0;
        if (next) {
          settleTimer.current = SETTLE_SECONDS;
          setTier(next);
        }
        /* If already at high, stop: we can't go higher */
      }
    } else {
      /* ── FPS is in the acceptable band — gently decay both timers ── */
      underTimer.current = Math.max(0, underTimer.current - dt * 0.4);
      overTimer.current  = Math.max(0, overTimer.current  - dt * 0.4);
    }
  });

  return null;
}
