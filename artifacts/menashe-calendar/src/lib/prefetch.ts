/**
 * prefetch.ts
 *
 * Fires dynamic import() calls during browser idle time so that the chunks
 * for adjacent pages / common modals are already in the module cache when
 * the user navigates.  Because React.lazy() and a bare import() both go
 * through the same ES module cache, the component renders instantly — no
 * Suspense spinner needed for pre-loaded routes.
 *
 * Usage:
 *   prefetchAdjacentPages("home");   // call in useEffect on activePage change
 */

type Page = "home" | "calendar" | "zmanim" | "siddur" | "settings" | "premium" | "journey" | "notifications" | "more";

type Importer = () => Promise<unknown>;

const idle: typeof requestIdleCallback =
  typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback
    : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 200) as unknown as number;

function schedule(importers: Importer[], deadline = 4_000): void {
  idle(
    (idleDeadline) => {
      let i = 0;
      while (i < importers.length) {
        importers[i]().catch(() => {});
        i++;
        if (idleDeadline.timeRemaining() < 5 && i < importers.length) {
          schedule(importers.slice(i), deadline);
          return;
        }
      }
    },
    { timeout: deadline },
  );
}

const PAGES: Record<Page, Importer[]> = {
  home: [
    () => import("../pages/CalendarPage"),
    () => import("../pages/ZmanimPage"),
    () => import("../pages/SiddurPage"),
    () => import("../modals/DayModal"),
    () => import("../modals/HolidaysModal"),
    () => import("../modals/ParashahModal"),
    () => import("../modals/AnnouncementsModal"),
  ],
  calendar: [
    () => import("../pages/Home"),
    () => import("../pages/ZmanimPage"),
    () => import("../modals/DayModal"),
    () => import("../modals/HolidaysModal"),
  ],
  zmanim: [
    () => import("../pages/Home"),
    () => import("../pages/CalendarPage"),
    () => import("../modals/ZmanimInfoModal"),
    () => import("../modals/PrayerTimesModal"),
  ],
  siddur: [
    () => import("../pages/Home"),
    () => import("../pages/SettingsPage"),
    () => import("../modals/BookReaderModal"),
  ],
  settings: [
    () => import("../pages/Home"),
    () => import("../pages/SiddurPage"),
    () => import("../modals/ProfileModal"),
    () => import("../modals/LocationModal"),
  ],
  premium: [
    () => import("../pages/Home"),
    () => import("../modals/PremiumModal"),
  ],
  journey: [
    () => import("../pages/Home"),
    () => import("../pages/SettingsPage"),
    () => import("../modals/ProfileModal"),
    () => import("../modals/TorahTrackerModal"),
  ],
  notifications: [
    () => import("../pages/Home"),
    () => import("../pages/NotificationsPage"),
  ],
  more: [
    () => import("../pages/Home"),
    () => import("../pages/SettingsPage"),
    () => import("../pages/MorePage"),
  ],
};

const prefetched = new Set<Page>();

export function prefetchAdjacentPages(page: Page): void {
  const importers = PAGES[page];
  if (!importers) return;

  const pending = importers.filter((_, idx) => {
    const key = `${page}:${idx}` as unknown as Page;
    if (prefetched.has(key)) return false;
    prefetched.add(key);
    return true;
  });

  if (pending.length > 0) schedule(pending);
}
