/**
 * SPR-M001 Phase 8 — Performance Foundation
 *
 * Architecture stubs for lazy loading, prefetch, caching, and animation.
 * These are interfaces and contracts only — implementations arrive in later SPRs.
 *
 * ─── Capabilities planned ────────────────────────────────────────────────────
 *
 * LAZY SCREENS
 *   Use React.lazy() + Suspense for non-tab screens.
 *   Entry points: Sanctuary, AI, Library, Notifications.
 *   Driven by SCREEN_REGISTRY.isTab to automatically split tab vs modal stacks.
 *
 * SCREEN PREFETCH
 *   Use expo-router's <Link prefetch> or manual import() calls in idle callbacks
 *   to warm the JS bundle for screens the user is likely to visit next.
 *
 * IMAGE CACHE
 *   Use expo-image (already installed) which provides a built-in memory + disk
 *   cache.  Do NOT use <Image> from react-native directly for remote URLs.
 *
 * ASSET CACHE
 *   Use expo-asset for static images/fonts. Preload critical assets at splash
 *   screen time using Asset.loadAsync([...]).
 *
 * OFFLINE CACHE
 *   Use @react-native-async-storage/async-storage (already installed) for
 *   lightweight key-value persistence of API responses.
 *   For structured query caching, use TanStack Query's persister plugin.
 *
 * GESTURE ENGINE
 *   Use react-native-gesture-handler (already installed via GestureHandlerRootView
 *   in _layout.tsx). All swipe/drag gestures must be built with Gesture.Pan() etc.
 *
 * ANIMATION ENGINE
 *   Use react-native-reanimated (already installed) for 60/120 fps animations
 *   that run on the UI thread. Use Animated from react-native only for simple
 *   opacity/translate transitions where reanimated is overkill.
 */

// ─── Prefetch contract ────────────────────────────────────────────────────────

export interface PrefetchHint {
  /** Screen to prefetch */
  screen: string;
  /** Priority: "high" prefetches immediately, "idle" defers to requestIdleCallback */
  priority: "high" | "idle";
}

/**
 * Stub — implementation in a future Performance SPR.
 * Call this when you predict the user is about to navigate to a screen.
 */
export function prefetchScreen(_hint: PrefetchHint): void {
  // TODO: implement via dynamic import() + route warm-up
}

// ─── Offline cache contract ───────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

/** Stub — checks if a cache entry is still valid. */
export function isCacheValid<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.cachedAt < entry.ttlMs;
}

// ─── Image cache contract ─────────────────────────────────────────────────────

/**
 * Preferred image component for remote URLs.
 * Wraps expo-image to enforce caching policy.
 * Full implementation arrives in a UI SPR.
 */
export const IMAGE_CACHE_POLICY = "memory-disk" as const;
export type ImageCachePolicy = typeof IMAGE_CACHE_POLICY;
