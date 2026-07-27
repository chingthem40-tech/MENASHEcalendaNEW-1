/**
 * SPR-M001 Phase 1 — Mobile Hooks Index
 *
 * Central export point for all mobile-specific hooks.
 * Add new hook files under src/mobile/hooks/ and re-export here.
 *
 * ─── Currently available hooks ────────────────────────────────────────────────
 *
 *  useColors()    — @/hooks/useColors       — Current theme palette tokens
 *  useApp()       — @/context/AppContext    — Theme, location, notifications
 *  useLanguage()  — @/context/LanguageContext — EN / TK translations
 *
 * ─── Hooks planned for future SPRs ───────────────────────────────────────────
 *
 *  useHaptic()        — Haptic feedback wrapper (expo-haptics)
 *  useOrientation()   — Live landscape / portrait detection
 *  useKeyboard()      — Keyboard height + visibility
 *  useNetworkStatus() — Online / offline state
 *  useAppState()      — Foreground / background state
 *  useLocalAuth()     — Biometric authentication (expo-local-authentication)
 */

export { useColors }   from "@/hooks/useColors";
export { useApp }      from "@/context/AppContext";
export { useLanguage } from "@/context/LanguageContext";
