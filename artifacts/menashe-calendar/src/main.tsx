import { createRoot } from "react-dom/client";
import { useState, useCallback } from "react";
import { Router as WouterRouter } from "wouter";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import SplashScreen from "./components/SplashScreen";
import OnboardingFlow, { hasSeenOnboarding } from "./components/OnboardingFlow";
import OfflineBanner from "./components/OfflineBanner";
import PWAInstallBanner from "./components/PWAInstallBanner";
import UpdateToast from "./components/UpdateToast";
import "./index.css";

/* ─── Suppress R3F v9 + React 19 Strict Mode transient error ────────────────
 * React 19 Strict Mode discards the first render pass to flush side-effects.
 * During that pass, @react-three/fiber's Zustand canvas-store hasn't committed
 * its context yet, so any scene component that calls useFrame/useThree tries to
 * destructure { subscribe } from null → TypeError.
 *
 * R3F recovers from this automatically on the second real render, but the
 * @replit/vite-plugin-runtime-error-modal intercepts console.error and
 * window.onerror BEFORE R3F can handle it, showing the error overlay.
 *
 * This filter runs at the very top of the module graph (before the plugin
 * installs its listeners) and silently drops only this one known transient
 * error, leaving all other errors visible.  It is dev-only; production builds
 * don't include this plugin at all.
 * ──────────────────────────────────────────────────────────────────────────── */
if (import.meta.env.DEV) {
  const isR3FStrictModeError = (msg: unknown): boolean => {
    const s = typeof msg === "string" ? msg
      : msg instanceof Error ? msg.message
      : "";
    return s.includes("Cannot destructure property 'subscribe'");
  };

  // Wrap console.error — the plugin hooks this to show the overlay
  const _consoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (isR3FStrictModeError(args[0])) return;
    _consoleError(...args);
  };

  // Wrap window.onerror — the plugin also hooks this
  const _windowOnError = window.onerror?.bind(window);
  window.onerror = (msg, src, line, col, err) => {
    if (isR3FStrictModeError(msg) || isR3FStrictModeError(err)) return true;
    return _windowOnError?.(msg, src, line, col, err) ?? false;
  };

  // Wrap unhandledrejection for completeness
  window.addEventListener("error", (e) => {
    if (isR3FStrictModeError(e.message) || isR3FStrictModeError(e.error)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true /* capture phase — fires before plugin's bubble listener */);
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const DEV_PREVIEW = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("preview") === "1";

/* Register service worker on startup so offline caching is active
   immediately — independent of whether push notifications are enabled. */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    })
    .catch(() => {});
}

function Root() {
  const [splashDone, setSplashDone] = useState(() => DEV_PREVIEW);
  const [onboardingDone, setOnboardingDone] = useState(() => DEV_PREVIEW || hasSeenOnboarding());

  const onSplashFinished = useCallback(() => setSplashDone(true), []);
  const onOnboardingFinished = useCallback(() => setOnboardingDone(true), []);

  return (
    <>
      <OfflineBanner />
      <PWAInstallBanner />
      <UpdateToast />
      {!splashDone && <SplashScreen onFinished={onSplashFinished} />}
      {splashDone && !onboardingDone && (
        <OnboardingFlow onFinished={onOnboardingFinished} />
      )}
      <App />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <WouterRouter base={basePath}>
      <Root />
    </WouterRouter>
  </ErrorBoundary>
);
