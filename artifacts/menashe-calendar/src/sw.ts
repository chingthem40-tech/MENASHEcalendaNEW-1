/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

/* ------------------------------------------------------------
   Menashe Calendar — Service Worker (Workbox edition)

   Precache manifest (self.__WB_MANIFEST) is injected at build
   time by vite-plugin-pwa.  It contains every hashed JS/CSS/PNG
   file produced by the Vite build — except vendor-three which is
   excluded via globIgnores (too large to pre-warm at install).

   Caching architecture:
     Precache          → all hashed JS/CSS/PNG chunks at install
     NavigationRoute   → NetworkFirst (5 s timeout) → "/" fallback
     /assets/*.js      → StaleWhileRevalidate (runtime; covers
                         vendor-three + any chunk missed above)
     Push/click        → unchanged from v4 manual SW
   ------------------------------------------------------------ */

/* ── Precache all hashed build artifacts ── */
// self.__WB_MANIFEST is injected by vite-plugin-pwa; fall back to []
// in dev mode (where injectManifest never runs).
precacheAndRoute(self.__WB_MANIFEST ?? []);

/* ── Remove caches from outdated SW versions ── */
cleanupOutdatedCaches();

/* ── Navigation: network-first with cached-shell fallback ──
   Pass-through API and auth routes so we never cache identity calls. */
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "menashe-navigation",
      networkTimeoutSeconds: 5,
      plugins: [],
    }),
    {
      denylist: [
        /^\/api\//,
        /accounts\.dev/,
        /\/@/,
        /\/node_modules\//,
        /__/,
        /repl/,
      ],
    },
  ),
);

setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    return (await matchPrecache("index.html")) ?? Response.error();
  }
  return Response.error();
});

/* ── Runtime cache: JS chunks not in precache (e.g. vendor-three) ──
   Stale-while-revalidate: serve cached copy immediately, refresh in
   background.  Handles lazy chunks that arrive after initial load too. */
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith("/assets/") &&
    (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")),
  new StaleWhileRevalidate({ cacheName: "menashe-assets-runtime" }),
);

/* ── Activate: take control of all clients immediately ── */
self.addEventListener("activate", () => {
  self.clients.claim();
});

/* ── Message: respond to SKIP_WAITING from the update toast ──
   When the user taps "Update", the React app posts this message to
   the waiting SW.  skipWaiting() causes this SW to activate immediately
   instead of waiting for all old clients to close, which triggers a
   `controllerchange` event in the browser — usePWAUpdate then reloads. */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ── Push notifications ── */
self.addEventListener("push", (event) => {
  let data: {
    title?: string;
    body?: string;
    tag?: string;
    icon?: string;
    url?: string;
  } = {
    title: "Menashe Calendar",
    body: "You have a new notification.",
    tag: "menashe-default",
    icon: "/icon-192.png",
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // ignore malformed push payload
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Menashe Calendar", {
      body: data.body,
      tag: data.tag,
      icon: data.icon ?? "/icon-192.png",
      badge: "/icon-192.png",
      // @ts-expect-error vibrate is a valid browser Notification API property not yet in TypeScript's lib definitions
      vibrate: [100, 50, 100],
      data: { url: data.url ?? self.location.origin },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl =
    (event.notification.data as { url?: string } | undefined)?.url ??
    "/";
  let targetUrl = new URL("/", self.location.origin).href;
  try {
    const parsed = new URL(requestedUrl, self.location.origin);
    const safeProtocol = parsed.protocol === "https:" ||
      (parsed.protocol === "http:" && self.location.protocol === "http:");
    const safePath = parsed.pathname.startsWith("/") &&
      !parsed.pathname.startsWith("/api/") &&
      !parsed.pathname.startsWith("//");
    if (parsed.origin === self.location.origin && safeProtocol && safePath) {
      targetUrl = parsed.href;
    }
  } catch {
    // Use the safe application root for malformed destinations.
  }
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (new URL(client.url).origin === self.location.origin && "focus" in client) {
            if ("navigate" in client && client.url !== targetUrl) {
              return (client as WindowClient).navigate(targetUrl).then(() => client.focus());
            }
            return (client as WindowClient).focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
