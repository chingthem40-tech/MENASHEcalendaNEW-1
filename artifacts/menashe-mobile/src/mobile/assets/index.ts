/**
 * SPR-M001 Phase 1 — Mobile Assets Registry
 *
 * Central manifest of all static assets used in the mobile app.
 * Import asset paths from here — never use string literals in components.
 *
 * ─── Current assets ───────────────────────────────────────────────────────────
 */

export const ASSETS = {
  icon:            require("@/assets/images/icon.png"),
  logoBeneiMenashe: require("@/assets/images/logo-benei-menashe.png"),
  saipikhuPhoto:   require("@/assets/images/saipikhup-photo.jpg"),
} as const;

export type AssetKey = keyof typeof ASSETS;
