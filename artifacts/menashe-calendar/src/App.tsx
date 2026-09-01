import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
  memo,
} from "react";
import PageSkeleton from "./components/PageSkeleton";
import {
  SignIn,
  SignUp,
  Show,
  useAuthActions,
  useUser,
  useOrganization,
  useAuthState,
  SupabaseAuthProvider,
} from "./auth";
import {
  fetchUserProfile,
  saveUserProfile,
  fetchPublicProfile,
  type PublicProfile,
} from "./lib/userApi";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
// Pages are lazily loaded — only the active page is needed on first paint
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ZmanimPage = lazy(() => import("./pages/ZmanimPage"));
const SiddurPage = lazy(() => import("./pages/SiddurPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const JourneyPage = lazy(() => import("./pages/JourneyPage"));
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
import BottomNav from "./components/BottomNav";
import { useNotifications } from "./hooks/useNotifications";
import { useUnreadAnnouncements } from "./hooks/useUnreadAnnouncements";
import { usePushSubscription } from "./hooks/usePushSubscription";
import { useAnnouncements } from "./hooks/useAnnouncements";

// Modals are lazily loaded — they are not needed on first paint
const LocationModal = lazy(() => import("./modals/LocationModal"));
const LocationMapModal = lazy(() => import("./modals/LocationMapModal"));
const DayModal = lazy(() => import("./modals/DayModal"));
const HolidaysModal = lazy(() => import("./modals/HolidaysModal"));
const PremiumModal = lazy(() => import("./modals/PremiumModal"));
const ParashahModal = lazy(() => import("./modals/ParashahModal"));
const DafYomiModal = lazy(() => import("./modals/DafYomiModal"));
const SefariaSearchModal = lazy(() => import("./modals/SefariaSearchModal"));
const HebrewDateModal = lazy(() => import("./modals/HebrewDateModal"));
const LuachModal = lazy(() => import("./modals/LuachModal"));
const MussarModal = lazy(() => import("./modals/MussarModal"));
const ZmanimInfoModal = lazy(() => import("./modals/ZmanimInfoModal"));
const TorahNoteModal = lazy(() => import("./modals/TorahNoteModal"));
const BirthdayModal = lazy(() => import("./modals/BirthdayModal"));
const TaharaModal = lazy(() => import("./modals/TaharaModal"));
const MikvehCalendarModal = lazy(() => import("./modals/MikvehCalendarModal"));
const YartzeitModal = lazy(() => import("./modals/YartzeitModal"));
const RemembranceCenterModal = lazy(
  () => import("./modals/RemembranceCenterModal"),
);
const CommunityModal = lazy(() => import("./modals/CommunityModal"));
const CensusModal = lazy(() => import("./modals/CensusModal"));
const AnnouncementsModal = lazy(() => import("./modals/AnnouncementsModal"));
const EventsModal = lazy(() => import("./modals/EventsModal"));
const MemberDirectoryModal = lazy(
  () => import("./modals/MemberDirectoryModal"),
);
const PrayerBoardModal = lazy(() => import("./modals/PrayerBoardModal"));
const TorahTrackerModal = lazy(() => import("./modals/TorahTrackerModal"));
const ProfileModal = lazy(() => import("./modals/ProfileModal"));
const SharePage = lazy(() => import("./pages/SharePage"));
const BookReaderModal = lazy(() => import("./modals/BookReaderModal"));
const AdminModal = lazy(() => import("./modals/AdminModal"));
const OmerModal = lazy(() => import("./modals/OmerModal"));
const PrayerTimesModal = lazy(() => import("./modals/PrayerTimesModal"));
const CommunityYahrzeitModal = lazy(
  () => import("./modals/CommunityYahrzeitModal"),
);
const MoreToolsModal = lazy(() => import("./pages/MoreToolsModal"));
const MorePage = lazy(() => import("./pages/MorePage"));
const ChatModal = lazy(() => import("./modals/ChatModal"));
const NotificationDrawer = lazy(
  () => import("./components/NotificationDrawer"),
);
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const InstallPrompt = lazy(() => import("./components/InstallPrompt"));
const ShabbatBanner = lazy(() => import("./components/ShabbatBanner"));
const WhatsNewModal = lazy(() => import("./modals/WhatsNewModal"));
const FeedbackCenterModal = lazy(() => import("./modals/FeedbackCenterModal"));
// Plain constants — import from the tiny side-effect-free module, not the full modal
import { APP_VERSION, VERSION_KEY } from "./modals/whatsNewVersion";
import { prefetchAdjacentPages } from "./lib/prefetch";
import { shortcutPageFromPath } from "./lib/appRoutes";

import { LOCATIONS, Location } from "./lib/locations";
import type { Book } from "./pages/SiddurPage";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

type Page =
  | "home"
  | "calendar"
  | "zmanim"
  | "siddur"
  | "settings"
  | "premium"
  | "journey"
  | "notifications"
  | "more";
type Modal =
  | "location"
  | "holidays"
  | "premium"
  | "parashah"
  | "dafyomi"
  | "zmaniminfo"
  | "torahnote"
  | "birthday"
  | "tahara"
  | "yartzeit"
  | "remembrance"
  | "community"
  | "census"
  | "more"
  | "admin"
  | "omer"
  | "prayers"
  | "sefaria"
  | "hebrewdate"
  | "luach"
  | "mussar"
  | "announcements"
  | "events"
  | "members"
  | "prayers-board"
  | "torah-tracker"
  | "profile"
  | "community-yahrzeit"
  | "notifications"
  | "whats-new"
  | "mikveh-calendar"
  | "location-map"
  | "feedback-center"
  | null;

type DayInfo = { day: number; month: number; year: number } | null;

/* ── Shared auth card wrapper — Enhanced ────────────────────────── */
function AuthCard({ children }: { children: React.ReactNode }) {
  const photoUrl = `${basePath}/saipikhup-photo.jpg`;
  return (
    <div className="auth-shell" style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px", overflowY: "auto" }}>
      <div className="mds-card auth-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, margin: "auto 0" }}>
        <div className="auth-brand-header" style={{ backgroundImage: `url(${photoUrl})` }}>
          <div aria-hidden className="auth-top-shimmer" />
          <div className="auth-brand-content">
            <img className="auth-brand-logo" src="/logo.png" alt="Bnei Menashe Calendar" />
            <div className="auth-wordmark">BNEI MENASHE</div>
            <div className="auth-brand-caption">SACRED CALENDAR</div>
            <div aria-hidden style={{ color: "var(--gold)", fontSize: 10, lineHeight: 1 }}>◆</div>
          </div>
        </div>
        <div aria-hidden className="auth-brand-divider" />
        <div className="auth-form-body">{children}</div>
        <div aria-hidden className="auth-bottom-accent" />
      </div>
    </div>
  );
}

function AuthSystemState({
  status,
  onRetry,
}: {
  status: "loading" | "unavailable";
  onRetry: () => Promise<void>;
}) {
  const { lang } = useLanguage();
  const copy =
    lang === "tk"
      ? {
          loadingTitle: "Sessiýa barlanýar",
          loadingBody: "Howpsuz ýagdaýyňyz ýüklenýär…",
          unavailableTitle: "Giriş hyzmaty elýeterli däl",
          unavailableBody: "Sessiýaňyzy häzir barlap bilmedik. Täzeden synanyşyň ýa-da biraz soňrak geliň.",
          retry: "Täzeden synanyş",
          back: "Senenama dolan",
        }
      : {
          loadingTitle: "Checking your session",
          loadingBody: "Loading your secure account status…",
          unavailableTitle: "Sign-in is temporarily unavailable",
          unavailableBody: "We couldn’t check your session right now. Try again or come back in a moment.",
          retry: "Try again",
          back: "Back to calendar",
        };

  return (
    <AuthCard>
      <div
        role={status === "unavailable" ? "alert" : "status"}
        aria-live="polite"
        style={{ padding: "34px 28px 30px", textAlign: "center" }}
      >
        <div
          aria-hidden
          style={{
            width: 44,
            height: 44,
            margin: "0 auto 18px",
            borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.35)",
            background: "rgba(212,175,55,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#D4AF37",
            fontSize: 21,
          }}
        >
          {status === "loading" ? "…" : "!"}
        </div>
        <h2 style={{ margin: "0 0 9px", color: "#D4AF37", fontSize: 22 }}>
          {status === "loading" ? copy.loadingTitle : copy.unavailableTitle}
        </h2>
        <p style={{ margin: "0 auto", maxWidth: 290, color: "#A89070", fontSize: 13, lineHeight: 1.55 }}>
          {status === "loading" ? copy.loadingBody : copy.unavailableBody}
        </p>
        {status === "unavailable" && (
          <button
            type="button"
            onClick={() => void onRetry()}
            className="btn-gold"
            style={{ width: "100%", marginTop: 24, padding: 13, fontWeight: 700 }}
          >
            {copy.retry}
          </button>
        )}
        <a
          href="/"
          style={{ display: "block", marginTop: 18, color: "#7f755f", fontSize: 12, textDecoration: "none" }}
        >
          {copy.back}
        </a>
      </div>
    </AuthCard>
  );
}

function SignInPage() {
  const { user } = useUser();
  if (user) return <Redirect to="/app" />;
  return (
    <AuthCard>
      <SignIn />
    </AuthCard>
  );
}

function SignUpPage() {
  const { user } = useUser();
  if (user) return <Redirect to="/app" />;
  return (
    <AuthCard>
      <SignUp />
    </AuthCard>
  );
}

function AppShell() {
  const { user, isLoaded: userLoaded } = useUser();
  const { membership } = useOrganization();
  const { signOut } = useAuthActions();
  const profileSyncedRef = useRef(false);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(
    null,
  );

  const [activePage, setActivePage] = useState<Page>(() =>
    shortcutPageFromPath(stripBase(window.location.pathname)),
  );
  const [modal, _setModal] = useState<Modal>(null);
  // Track the element that triggered a modal so we can return focus on close
  const lastFocusRef = useRef<Element | null>(null);
  const setModal = useCallback((m: Modal) => {
    if (m !== null) lastFocusRef.current = document.activeElement;
    _setModal(m);
  }, []);
  const [chatOpen, setChatOpen] = useState(false);
  const [dayModal, setDayModal] = useState<DayInfo>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [siddurRefreshKey, setSiddurRefreshKey] = useState(0);
  const [toast, setToast] = useState("");
  const [theme, setThemeState] = useState<"dark" | "light" | "sapphire">(() => {
    try {
      return (
        (localStorage.getItem("menashe-theme") as
          | "dark"
          | "light"
          | "sapphire") || "dark"
      );
    } catch {
      return "dark";
    }
  });
  const [location, setLocation] = useState<Location>(() => {
    try {
      const saved = localStorage.getItem("menashe-location");
      if (saved) return JSON.parse(saved);
    } catch {}
    return LOCATIONS[0];
  });
  const [shareToken] = useState(() =>
    new URLSearchParams(window.location.search).get("share"),
  );
  const [isPremium, setIsPremium] = useState(() => {
    try {
      return localStorage.getItem("menashe-is-premium") === "true";
    } catch {
      return false;
    }
  });
  const [premiumJustApproved, setPremiumJustApproved] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try {
      return localStorage.getItem("menashe-nav-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const toggleNavCollapsed = useCallback(() => {
    setNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("menashe-nav-collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Auto-show "What's New" when the app version bumps (skip in dev preview mode)
  useEffect(() => {
    if (DEV_PREVIEW) return;
    const seen = localStorage.getItem(VERSION_KEY);
    if (seen !== APP_VERSION) {
      setTimeout(() => setModal("whats-new"), 800);
    }
  }, []);
  const [candleEnabled, setCandleEnabled] = useState(() => {
    try {
      return localStorage.getItem("menashe-candle-enabled") !== "false";
    } catch {
      return true;
    }
  });

  // Load public profile (name/role/etc.) on sign-in
  useEffect(() => {
    if (!userLoaded || !user) return;
    fetchPublicProfile().then((p) => {
      if (p) setPublicProfile(p);
    });
  }, [userLoaded, user?.id]);

  // Load settings profile from server on first sign-in
  useEffect(() => {
    if (!userLoaded || !user) return;
    fetchUserProfile().then((profile) => {
      if (!profile) {
        profileSyncedRef.current = true;
        return;
      }
      if (profile.theme) {
        setThemeState(profile.theme);
        try {
          localStorage.setItem("menashe-theme", profile.theme);
        } catch {}
      }
      if (profile.location) {
        setLocation(profile.location);
        try {
          localStorage.setItem(
            "menashe-location",
            JSON.stringify(profile.location),
          );
        } catch {}
      }
      if (profile.isPremium) {
        const wasNotPremium =
          localStorage.getItem("menashe-is-premium") !== "true";
        setIsPremium(true);
        try {
          localStorage.setItem("menashe-is-premium", "true");
        } catch {}
        if (wasNotPremium) setPremiumJustApproved(true);
      }
      if (profile.candleEnabled !== undefined) {
        setCandleEnabled(profile.candleEnabled);
        try {
          localStorage.setItem(
            "menashe-candle-enabled",
            String(profile.candleEnabled),
          );
        } catch {}
      }
      profileSyncedRef.current = true;
    });
  }, [userLoaded, user?.id]);

  // Save profile to server whenever key preferences change
  useEffect(() => {
    if (!profileSyncedRef.current) return;
    saveUserProfile({ theme, location, isPremium, candleEnabled });
  }, [theme, location, isPremium, candleEnabled]);

  function onPremiumActivated() {
    setIsPremium(true);
    try {
      localStorage.setItem("menashe-is-premium", "true");
    } catch {}
    showToast("✨ Premium activated!");
  }

  function onToggleCandle() {
    const next = !candleEnabled;
    setCandleEnabled(next);
    try {
      localStorage.setItem("menashe-candle-enabled", String(next));
    } catch {}
  }

  const {
    permission: notifPermission,
    prefs: notifPrefs,
    leadTime,
    updatePref: updateNotifPref,
    updateLeadTime,
  } = useNotifications(location);
  const {
    isSubscribed: pushSubscribed,
    isSupported: pushSupported,
    isLoading: pushLoading,
    error: pushError,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    sendTest: sendTestPush,
  } = usePushSubscription(location, notifPrefs, leadTime, user?.id);
  const {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    sendNow,
  } = useAnnouncements();
  const {
    unreadCount: announcementCount,
    unreadAnnouncements,
    markAllRead: markAnnouncementsRead,
  } = useUnreadAnnouncements();

  const isLight = theme === "light";
  const isAdmin = membership?.role === "org:admin";

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const setTheme = useCallback((next: "dark" | "light" | "sapphire") => {
    setThemeState(next);
    try {
      localStorage.setItem("menashe-theme", next);
    } catch {}
    const label =
      next === "dark"
        ? "Royal Midnight"
        : next === "light"
          ? "Parchment Light"
          : "Deep Sapphire";
    setToast(`Theme: ${label}`);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // toggleTheme reads theme — use functional updater so deps stay []
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next =
        prev === "dark" ? "light" : prev === "light" ? "sapphire" : "dark";
      try {
        localStorage.setItem("menashe-theme", next);
      } catch {}
      const label =
        next === "dark"
          ? "Royal Midnight"
          : next === "light"
            ? "Parchment Light"
            : "Deep Sapphire";
      setToast(`Theme: ${label}`);
      setTimeout(() => setToast(""), 2500);
      return next;
    });
  }, []);

  const selectLocation = useCallback((loc: Location) => {
    setLocation(loc);
    try {
      localStorage.setItem("menashe-location", JSON.stringify(loc));
    } catch {}
    setModal(null);
    setToast(`Location set to ${loc.name}`);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const closeModal = useCallback(() => {
    _setModal(null);
    // Return keyboard focus to the element that opened the modal
    requestAnimationFrame(() => {
      if (lastFocusRef.current instanceof HTMLElement) {
        lastFocusRef.current.focus();
        lastFocusRef.current = null;
      }
    });
  }, []);

  // Stable callbacks — prevent page re-renders when unrelated AppShell state changes
  const onNavigate = useCallback((p: string) => setActivePage(p as Page), []);
  const showPremiumPage = useCallback(() => setActivePage("premium"), []);
  const openSiddur = useCallback(() => setActivePage("siddur"), []);
  const goHome = useCallback(() => setActivePage("home"), []);

  // Prefetch chunks for the pages most likely to be visited next, during idle time.
  // Because React.lazy() and a bare import() share the same ES module cache,
  // pre-loaded chunks render instantly with no Suspense spinner.
  useEffect(() => {
    prefetchAdjacentPages(activePage);
  }, [activePage]);

  const onDayClick = useCallback(
    (d: number, m: number, y: number) =>
      setDayModal({ day: d, month: m, year: y }),
    [],
  );
  const onReadBook = useCallback((book: Book) => setReadingBook(book), []);
  const onAdmin = useCallback(() => {
    if (isAdmin) setModal("admin");
  }, [isAdmin]);
  const onSignOut = useCallback(
    () => signOut({ redirectUrl: `${basePath}/` }),
    [signOut],
  );
  // Modal openers — setModal from useState is always stable, so deps are []
  const onLocationClick = useCallback(() => setModal("location"), []);
  const showMoreTools = useCallback(() => setModal("more"), []);
  const showHolidays = useCallback(() => setModal("holidays"), []);
  const showParashah = useCallback(() => setModal("parashah"), []);
  const showDafYomi = useCallback(() => setModal("dafyomi"), []);
  const showOmer = useCallback(() => setModal("omer"), []);
  const showCommunity = useCallback(() => setModal("community"), []);
  const showCensus = useCallback(() => setModal("census"), []);
  const showMembers = useCallback(() => setModal("members"), []);
  const showNotifications = useCallback(
    () => setActivePage("notifications"),
    [],
  );
  const showAnnouncements = useCallback(() => setModal("announcements"), []);
  const showEvents = useCallback(() => setModal("events"), []);
  const showCommunityYahrzeit = useCallback(
    () => setModal("community-yahrzeit"),
    [],
  );
  const showYartzeit = useCallback(() => setModal("yartzeit"), []);
  const showRemembrance = useCallback(() => setModal("remembrance"), []);
  const showMussar = useCallback(() => setModal("mussar"), []);
  const showSefariaSearch = useCallback(() => setModal("sefaria"), []);
  const showPrayerBoard = useCallback(() => setModal("prayers-board"), []);
  const showTorahTracker = useCallback(() => setModal("torah-tracker"), []);
  const showTahara = useCallback(() => setModal("tahara"), []);
  const showBirthday = useCallback(() => setModal("birthday"), []);
  const showProfile = useCallback(() => setModal("profile"), []);
  const showWhatsNew = useCallback(() => setModal("whats-new"), []);
  const showFeedbackCenter = useCallback(() => setModal("feedback-center"), []);
  const showLocationMap = useCallback(() => setModal("location-map"), []);
  const showPremiumModal = useCallback(() => setModal("premium"), []);
  const showZmanimInfo = useCallback(() => setModal("zmaniminfo"), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (readingBook) {
          setReadingBook(null);
          return;
        }
        setModal(null);
        setDayModal(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readingBook]);

  if (shareToken)
    return (
      <Suspense fallback={null}>
        <SharePage token={shareToken} />
      </Suspense>
    );

  // Derived value memoized so it doesn't cause spurious re-renders
  const notifActive = useMemo(
    () => Object.values(notifPrefs).some(Boolean),
    [notifPrefs],
  );

  function renderPage() {
    switch (activePage) {
      case "home":
        return (
          <Home
            location={location}
            theme={theme}
            isPremium={isPremium}
            candleEnabled={candleEnabled}
            onNavigate={onNavigate}
            onMoreTools={showMoreTools}
            onShowHolidays={showHolidays}
            onShowParashah={showParashah}
            onShowPremium={showPremiumPage}
            onShowDafYomi={showDafYomi}
            onShowOmer={showOmer}
            onLocationClick={onLocationClick}
            onToggleTheme={toggleTheme}
            onOpenSiddur={openSiddur}
            onShowCommunity={showCommunity}
            onShowCensus={showCensus}
            onShowMembers={showMembers}
            onNotifBell={showNotifications}
            notifActive={notifActive}
            announcementCount={announcementCount}
            onShowAnnouncements={showAnnouncements}
            onShowEvents={showEvents}
            onShowCommunityYahrzeit={showCommunityYahrzeit}
            onShowYartzeit={showYartzeit}
            onShowMussar={showMussar}
            onShowPrayerBoard={showPrayerBoard}
            onShowTorahTracker={showTorahTracker}
            unreadAnnouncements={unreadAnnouncements}
            profileName={publicProfile?.displayName}
            profilePhotoUrl={publicProfile?.profilePhotoUrl}
            profileAvatarEmoji={publicProfile?.avatarEmoji}
          />
        );
      case "calendar":
        return (
          <CalendarPage
            location={location}
            onNavigate={onNavigate}
            onDayClick={onDayClick}
            onLocationClick={onLocationClick}
          />
        );
      case "zmanim":
        return (
          <ZmanimPage
            location={location}
            onInfo={showZmanimInfo}
            onLocationClick={onLocationClick}
            isPremium={isPremium}
            onShowPremium={showPremiumPage}
          />
        );
      case "siddur":
        return (
          <SiddurPage
            onReadBook={onReadBook}
            onAdmin={onAdmin}
            refreshKey={siddurRefreshKey}
            isPremium={isPremium}
            onShowPremium={showPremiumPage}
            isAdmin={isAdmin}
          />
        );
      case "settings":
        return (
          <SettingsPage
            theme={theme}
            location={location}
            onToggleTheme={toggleTheme}
            onSetTheme={setTheme}
            onLocationClick={onLocationClick}
            onPremium={showPremiumPage}
            onTahara={showTahara}
            onYartzeit={showYartzeit}
            onBirthday={showBirthday}
            onCommunity={showCommunity}
            onCensus={showCensus}
            onProfile={showProfile}
            onWhatsNew={showWhatsNew}
            onFeedbackCenter={showFeedbackCenter}
            onSignOut={onSignOut}
            profileName={publicProfile?.displayName}
            profileRole={
              publicProfile?.role !== "Member" ? publicProfile?.role : undefined
            }
            notifPermission={notifPermission}
            notifPrefs={notifPrefs}
            leadTime={leadTime}
            onUpdateNotifPref={updateNotifPref}
            onUpdateLeadTime={updateLeadTime}
            pushSubscribed={pushSubscribed}
            pushSupported={pushSupported}
            pushLoading={pushLoading}
            pushError={pushError}
            onSubscribePush={subscribePush}
            onUnsubscribePush={unsubscribePush}
            onTestPush={sendTestPush}
          />
        );
      case "premium":
        return <PremiumPage onUpgrade={showPremiumModal} onBack={goHome} />;
      case "journey":
        return (
          <JourneyPage
            isPremium={isPremium}
            publicProfile={publicProfile}
            onNavigate={onNavigate}
            onShowProfile={showProfile}
            onShowPremium={showPremiumPage}
            onShowTorahTracker={showTorahTracker}
            onSignOut={onSignOut}
          />
        );
      case "notifications":
        return (
          <NotificationsPage
            notifPermission={notifPermission}
            notifPrefs={notifPrefs}
            leadTime={leadTime}
            onUpdateNotifPref={updateNotifPref}
            onUpdateLeadTime={updateLeadTime}
            pushSubscribed={pushSubscribed}
            pushSupported={pushSupported}
            pushLoading={pushLoading}
            pushError={pushError}
            onSubscribePush={subscribePush}
            onUnsubscribePush={unsubscribePush}
            onSendTestPush={sendTestPush}
            announcements={announcements}
            isPremium={isPremium}
            onNavigate={onNavigate}
            onShowTorahTracker={showTorahTracker}
            onShowPrayers={showPrayerBoard}
            onShowYartzeit={showYartzeit}
            onShowCommunity={showCommunity}
            onShowAnnouncements={showAnnouncements}
            onGoBack={goHome}
          />
        );
      case "more":
        return (
          <MorePage
            isPremium={isPremium}
            announcementCount={announcementCount}
            onShowPremium={showPremiumPage}
            onNotifications={showNotifications}
            onCommunity={showCommunity}
            onAnnouncements={showAnnouncements}
            onEvents={showEvents}
            onPrayerBoard={showPrayerBoard}
            onMembers={showMembers}
            onYartzeit={showRemembrance}
            onMemorialWall={showCommunityYahrzeit}
            onTahara={showTahara}
            onDafYomi={showDafYomi}
            onHebrewDate={() => setModal("hebrewdate")}
            onBirthday={showBirthday}
            onOmer={showOmer}
            onMussar={showMussar}
            onTorahTracker={showTorahTracker}
            onCensus={showCensus}
            onSefariaSearch={showSefariaSearch}
            onSettings={() => setActivePage("settings")}
            onWhatsNew={showWhatsNew}
            onLocationMap={showLocationMap}
          />
        );
    }
  }

  return (
    <LanguageProvider>
      {/* Skip navigation link — only visible on keyboard focus */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div
        className={`app-container${theme === "light" ? " light-theme" : theme === "sapphire" ? " sapphire-theme" : ""}`}
      >
        <div className={`app-shell${navCollapsed ? " nav-collapsed" : ""}`}>
          <Suspense fallback={null}>
            {readingBook && (
              <BookReaderModal
                book={readingBook}
                onClose={() => setReadingBook(null)}
              />
            )}

            {modal === "admin" && (
              <AdminModal
                onClose={closeModal}
                onRefresh={() => {
                  setSiddurRefreshKey((k) => k + 1);
                  closeModal();
                  showToast("Library updated");
                }}
              />
            )}

            {!readingBook && modal !== "admin" && (
              <>
                <Suspense fallback={<PageSkeleton />}>
                  <div className="screen fade-in" id="main-content" tabIndex={-1}>{renderPage()}</div>
                </Suspense>

                <BottomNav
                  active={activePage}
                  onNavigate={(p) => setActivePage(p as Page)}
                  onChat={() => setChatOpen(true)}
                  collapsed={navCollapsed}
                  onToggleCollapsed={toggleNavCollapsed}
                />

                {/* aria-live region so screen readers announce toasts */}
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="toast-live-region"
                >
                  {toast && <div className="toast">{toast}</div>}
                </div>

                {premiumJustApproved && (
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 9000,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.72)",
                      backdropFilter: "blur(6px)",
                      padding: "20px",
                    }}
                    onClick={() => setPremiumJustApproved(false)}
                  >
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="premium-approved-title"
                      style={{
                        maxWidth: 340,
                        width: "100%",
                        borderRadius: 22,
                        textAlign: "center",
                        background: "linear-gradient(145deg, #0f1e12, #1a2a10)",
                        border: "1.5px solid rgba(212,168,67,0.5)",
                        boxShadow:
                          "0 0 60px rgba(212,168,67,0.25), 0 20px 60px rgba(0,0,0,0.6)",
                        padding: "32px 24px 28px",
                        animation: "fadeIn 0.35s ease",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          fontSize: 52,
                          marginBottom: 14,
                          lineHeight: 1,
                        }}
                      >
                        👑
                      </div>
                      <div
                        id="premium-approved-title"
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          marginBottom: 8,
                          background:
                            "linear-gradient(135deg, #b8860b, #d4a843, #f0c96a)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Premium Approved!
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: "rgba(255,255,255,0.75)",
                          lineHeight: 1.65,
                          marginBottom: 22,
                        }}
                      >
                        Welcome to Premium. You now have full access to all
                        Zmanim, Torah study tracks, AI insights, and the
                        complete Siddur library.
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <button
                          onClick={() => {
                            setPremiumJustApproved(false);
                            setActivePage("home" as any);
                          }}
                          style={{
                            padding: "14px",
                            borderRadius: 13,
                            border: "none",
                            cursor: "pointer",
                            background:
                              "linear-gradient(135deg, #b8860b, #d4a843, #f0c96a)",
                            color: "#1a0f00",
                            fontSize: 15,
                            fontWeight: 900,
                            boxShadow: "0 4px 20px rgba(212,168,67,0.4)",
                          }}
                        >
                          ✦ Explore Premium Features
                        </button>
                        <button
                          onClick={() => setPremiumJustApproved(false)}
                          style={{
                            padding: "11px",
                            borderRadius: 13,
                            border: "1px solid rgba(212,168,67,0.25)",
                            background: "transparent",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {dayModal && (
                  <DayModal
                    {...dayModal}
                    location={location}
                    onClose={() => setDayModal(null)}
                  />
                )}

                {modal === "notifications" && (
                  <NotificationDrawer
                    onClose={closeModal}
                    notifPermission={notifPermission}
                    notifPrefs={notifPrefs}
                    leadTime={leadTime}
                    onUpdateNotifPref={updateNotifPref}
                    onUpdateLeadTime={updateLeadTime}
                    unreadAnnouncements={unreadAnnouncements}
                    onViewAllAnnouncements={() => {
                      closeModal();
                      setTimeout(() => setModal("announcements"), 50);
                    }}
                    pushSupported={pushSupported}
                    pushSubscribed={pushSubscribed}
                    pushLoading={pushLoading}
                    onSubscribePush={subscribePush}
                    onUnsubscribePush={unsubscribePush}
                    onSendTestPush={sendTestPush}
                  />
                )}

                {modal === "location" && (
                  <LocationModal
                    current={location}
                    onSelect={selectLocation}
                    onClose={closeModal}
                  />
                )}
                {modal === "holidays" && <HolidaysModal onClose={closeModal} />}
                {modal === "premium" && (
                  <PremiumModal
                    onClose={closeModal}
                    onActivated={onPremiumActivated}
                  />
                )}
                {modal === "parashah" && <ParashahModal onClose={closeModal} />}
                {modal === "dafyomi" && <DafYomiModal onClose={closeModal} />}
                {modal === "sefaria" && (
                  <SefariaSearchModal onClose={closeModal} />
                )}
                {modal === "hebrewdate" && (
                  <HebrewDateModal onClose={closeModal} />
                )}
                {modal === "luach" && <LuachModal onClose={closeModal} />}
                {modal === "mussar" && <MussarModal onClose={closeModal} />}
                {modal === "zmaniminfo" && (
                  <ZmanimInfoModal onClose={closeModal} />
                )}
                {modal === "torahnote" && (
                  <TorahNoteModal onClose={closeModal} />
                )}
                {modal === "birthday" && <BirthdayModal onClose={closeModal} />}
                {modal === "location-map" && (
                  <LocationMapModal location={location} onClose={closeModal} />
                )}
                {modal === "tahara" && (
                  <TaharaModal
                    onClose={closeModal}
                    onMikvehCalendar={() => setModal("mikveh-calendar")}
                  />
                )}
                {modal === "mikveh-calendar" && (
                  <MikvehCalendarModal onClose={closeModal} />
                )}
                {modal === "yartzeit" && (
                  <YartzeitModal
                    onClose={closeModal}
                    location={location}
                    onCommunityBoard={() => setModal("community-yahrzeit")}
                  />
                )}
                {modal === "remembrance" && (
                  <RemembranceCenterModal onClose={closeModal} />
                )}
                {modal === "community-yahrzeit" && (
                  <CommunityYahrzeitModal
                    onClose={closeModal}
                    userName={publicProfile?.displayName}
                  />
                )}
                {modal === "community" && (
                  <CommunityModal onClose={closeModal} isAdmin={isAdmin} />
                )}
                {modal === "census" && (
                  <CensusModal onClose={closeModal} isAdmin={isAdmin} />
                )}
                {modal === "omer" && <OmerModal onClose={closeModal} />}
                {modal === "events" && (
                  <EventsModal onClose={closeModal} isAdmin={isAdmin} />
                )}
                {modal === "members" && (
                  <MemberDirectoryModal
                    onClose={closeModal}
                    isAdmin={isAdmin}
                    userProfile={
                      publicProfile
                        ? {
                            name: publicProfile.displayName,
                            city: publicProfile.city,
                            country: publicProfile.country,
                            role: publicProfile.role,
                            bio: publicProfile.bio,
                          }
                        : null
                    }
                  />
                )}
                {modal === "prayers-board" && (
                  <PrayerBoardModal
                    onClose={closeModal}
                    userName={publicProfile?.displayName}
                    isAdmin={isAdmin}
                  />
                )}
                {modal === "whats-new" && (
                  <WhatsNewModal
                    onClose={() => {
                      localStorage.setItem(VERSION_KEY, APP_VERSION);
                      closeModal();
                    }}
                  />
                )}
                {modal === "torah-tracker" && (
                  <TorahTrackerModal onClose={closeModal} />
                )}
                {modal === "feedback-center" && (
                  <FeedbackCenterModal onClose={closeModal} isAdmin={isAdmin} />
                )}
                {modal === "profile" && (
                  <ProfileModal
                    onClose={closeModal}
                    onSaved={(p) => setPublicProfile(p)}
                  />
                )}
                {modal === "announcements" && (
                  <AnnouncementsModal
                    onClose={() => {
                      markAnnouncementsRead();
                      closeModal();
                    }}
                    announcements={announcements}
                    onAdd={addAnnouncement}
                    onUpdate={updateAnnouncement}
                    onDelete={deleteAnnouncement}
                    onSendNow={sendNow}
                    isAdmin={isAdmin}
                  />
                )}
                {modal === "prayers" && (
                  <PrayerTimesModal
                    onClose={closeModal}
                    location={location}
                    onSettings={() => {
                      setActivePage("settings");
                      setModal(null);
                    }}
                  />
                )}
                {modal === "more" && (
                  <MoreToolsModal
                    onClose={closeModal}
                    onTahara={() => setModal("tahara")}
                    onYartzeit={showRemembrance}
                    onCommunity={() => setModal("community")}
                    onCensus={() => setModal("census")}
                    onSettings={() => {
                      setActivePage("settings");
                      setModal(null);
                    }}
                    onDafYomi={() => setModal("dafyomi")}
                    onBirthday={() => setModal("birthday")}
                    onOmer={() => setModal("omer")}
                    onPrayers={() => setModal("prayers")}
                    onSefariaSearch={() => setModal("sefaria")}
                    onHebrewDate={() => setModal("hebrewdate")}
                    onLuach={() => setModal("luach")}
                    onMussar={() => setModal("mussar")}
                    onAnnouncements={() => setModal("announcements")}
                    onEvents={() => setModal("events")}
                    onMembers={() => setModal("members")}
                    onPrayerBoard={() => setModal("prayers-board")}
                    onTorahTracker={() => setModal("torah-tracker")}
                    isPremium={isPremium}
                    candleEnabled={candleEnabled}
                    onToggleCandle={onToggleCandle}
                    onShowPremium={() => {
                      closeModal();
                      setActivePage("premium");
                    }}
                  />
                )}
              </>
            )}
          </Suspense>
        </div>
      </div>
      <Suspense fallback={null}>
        <ShabbatBanner location={location} />
        <InstallPrompt />
        {chatOpen && <ChatModal onClose={() => setChatOpen(false)} />}
      </Suspense>
    </LanguageProvider>
  );
}

const DEV_PREVIEW =
  import.meta.env.DEV &&
  (import.meta.env.VITE_DEV_PREVIEW === "true" ||
    new URLSearchParams(window.location.search).get("preview") === "1");

function HomeRoute() {
  const { user } = useUser();
  const { status, retry } = useAuthState();
  if (DEV_PREVIEW) return <Redirect to="/app" />;
  if (!user && (status === "loading" || status === "unavailable")) {
    return <AuthSystemState status={status} onRetry={retry} />;
  }
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <LanguageProvider>
          <div className="app-container">
            <div className="app-shell">
              <Suspense fallback={null}>
                <Landing
                  onSignIn={() => {
                    window.location.href = `${basePath}/sign-in`;
                  }}
                />
              </Suspense>
            </div>
          </div>
        </LanguageProvider>
      </Show>
    </>
  );
}

function AppRoute() {
  const { user } = useUser();
  const { status, retry } = useAuthState();
  if (DEV_PREVIEW) return <AppShell />;
  if (!user && (status === "loading" || status === "unavailable")) {
    return <AuthSystemState status={status} onRetry={retry} />;
  }
  return (
    <>
      <Show when="signed-in">
        <AppShell />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

export default function App() {
  return (
    <SupabaseAuthProvider>
      <LanguageProvider>
        <Switch>
          <Route path="/" component={HomeRoute} />
          <Route path="/app" component={AppRoute} />
          <Route path="/calendar" component={AppRoute} />
          <Route path="/zmanim" component={AppRoute} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </LanguageProvider>
    </SupabaseAuthProvider>
  );
}
