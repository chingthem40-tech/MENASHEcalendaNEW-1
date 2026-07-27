import { useState, useEffect } from "react";

/**
 * usePWAUpdate
 *
 * Detects when a new Workbox service worker has installed and is waiting
 * to take control.  Returns:
 *
 *   needRefresh  — true when a new SW is waiting (show the toast)
 *   applyUpdate  — call this when the user taps "Update": posts SKIP_WAITING
 *                  to the waiting SW, then reloads the page once the new SW
 *                  takes control
 *   dismiss      — call this to hide the toast without updating
 *
 * Flow:
 *   new build deployed → old SW fetches new sw.js → new SW installs →
 *   new SW enters "waiting" state (won't take over until old clients close) →
 *   this hook detects "waiting" → shows toast → user taps "Update" →
 *   SKIP_WAITING message → new SW activates → window.location.reload()
 */
export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloadPending = false;

    // When the new SW activates, reload so users get the fresh page.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadPending) window.location.reload();
    });

    function checkWaiting(registration: ServiceRegistration) {
      if (registration.waiting && navigator.serviceWorker.controller) {
        // A new SW has installed and is waiting
        setWaitingWorker(registration.waiting);
        setNeedRefresh(true);
      }
    }

    navigator.serviceWorker.ready.then((registration) => {
      // Check immediately (e.g. if page reloaded after update was found)
      checkWaiting(registration);

      // Watch for new SW installations triggered by the browser's periodic
      // update check or the manual registration.update() call below
      registration.addEventListener("updatefound", () => {
        const incoming = registration.installing;
        if (!incoming) return;
        incoming.addEventListener("statechange", () => {
          if (incoming.state === "installed") {
            checkWaiting(registration);
          }
        });
      });

      // Trigger a SW update check every hour so long-running sessions
      // eventually learn about new deployments without requiring a reload
      const hourMs = 60 * 60 * 1000;
      const intervalId = setInterval(() => {
        registration.update().catch(() => {});
      }, hourMs);

      return () => clearInterval(intervalId);
    });
  }, []);

  function applyUpdate() {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }
    // SKIP_WAITING tells the waiting SW to activate immediately
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    // controllerchange listener above will reload once the SW activates
    (window as Window & { _pwaReloadPending?: boolean })._pwaReloadPending = true;
  }

  function dismiss() {
    setNeedRefresh(false);
  }

  return { needRefresh, applyUpdate, dismiss };
}

// Workaround: TypeScript doesn't have ServiceRegistration as a type alias
type ServiceRegistration = ServiceWorkerRegistration;
