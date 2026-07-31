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
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
  useUser,
  useOrganization,
} from "@clerk/react";
import {
  fetchUserProfile,
  saveUserProfile,
  fetchPublicProfile,
  type PublicProfile,
} from "./lib/userApi";
import { dark } from "@clerk/themes";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { LanguageProvider } from "./context/LanguageContext";
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
import FeedbackButton from "./components/FeedbackButton";
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
// Plain constants — import from the tiny side-effect-free module, not the full modal
import { APP_VERSION, VERSION_KEY } from "./modals/whatsNewVersion";
import { prefetchAdjacentPages } from "./lib/prefetch";

import { LOCATIONS, Location } from "./lib/locations";
import type { Book } from "./pages/SiddurPage";

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  const root = document.getElementById("root")!;
  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#0F1829;font-family:Inter,sans-serif;padding:24px">
      <div style="max-width:420px;width:100%;border:1px solid rgba(212,175,55,0.3);border-radius:16px;padding:32px;text-align:center;background:#0a1020">
        <div style="font-size:40px;margin-bottom:16px">⚙️</div>
        <h2 style="color:#D4AF37;font-size:18px;font-weight:700;margin:0 0 10px">Authentication Not Provisioned</h2>
        <p style="color:#A89070;font-size:14px;line-height:1.6;margin:0 0 20px">
          The Clerk authentication service hasn't been set up yet.<br/>
          Please ask the Replit agent:<br/>
          <strong style="color:#F5F0E8">"provision Clerk"</strong>
        </p>
        <p style="color:#A89070;font-size:12px;margin:0;opacity:0.6">Missing: VITE_CLERK_PUBLISHABLE_KEY</p>
      </div>
    </div>`;
  throw new Error("Clerk not provisioned — set VITE_CLERK_PUBLISHABLE_KEY.");
}

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "#D4AF37",
    colorForeground: "#F5F0E8",
    colorMutedForeground: "#A89070",
    colorDanger: "#ef4444",
    colorBackground: "#0F1829",
    colorInput: "#1a2440",
    colorInputForeground: "#F5F0E8",
    colorNeutral: "#2a3a5c",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[#0F1829] border border-[#D4AF37]/20 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl shadow-black/40",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#D4AF37] font-bold",
    headerSubtitle: "text-[#A89070]",
    socialButtonsBlockButtonText: "text-[#F5F0E8]",
    formFieldLabel: "text-[#A89070]",
    footerActionLink: "text-[#D4AF37] hover:text-[#F5F0E8]",
    footerActionText: "text-[#A89070]",
    dividerText: "text-[#A89070]",
    identityPreviewEditButton: "text-[#D4AF37]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-[#F5F0E8]",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-10",
    socialButtonsBlockButton:
      "border-[#2a3a5c] bg-[#1a2440] text-[#F5F0E8] hover:bg-[#243050]",
    formButtonPrimary:
      "bg-[#D4AF37] text-[#0F1829] font-bold hover:bg-[#c9a430]",
    formFieldInput: "bg-[#1a2440] border-[#2a3a5c] text-[#F5F0E8]",
    footerAction: "bg-[#0a1020]",
    dividerLine: "bg-[#2a3a5c]",
    alert: "bg-[#1a2440] border-[#D4AF37]/30",
    otpCodeFieldInput: "bg-[#1a2440] border-[#2a3a5c] text-[#F5F0E8]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

const darkCardAppearance = {
  cssLayerName: "clerk",
  options: { logoPlacement: "none" as const },
  variables: {
    colorPrimary: "#D4AF37",
    colorForeground: "#F0EDE4",
    colorMutedForeground: "#9a9080",
    colorDanger: "#ef4444",
    colorBackground: "#111118",
    colorInput: "#18181f",
    colorInputForeground: "#F0EDE4",
    colorNeutral: "#2a2a36",
    fontFamily: "'Inter', -apple-system, sans-serif",
    borderRadius: "0.65rem",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full !shadow-none !rounded-none !bg-[#111118]",
    card: "!shadow-none !border-0 !bg-[#111118] !rounded-none !px-2",
    footer: "!shadow-none !border-0 !bg-[#0e0e16] !rounded-none",
    headerTitle: "!text-[#F5D982] !font-bold !text-[22px] !tracking-[-0.02em]",
    headerSubtitle: "!text-[#807060] !text-[13px]",
    socialButtonsBlockButton:
      "!border !border-[#d8d8d8] !bg-white !text-[#3c4043] hover:!bg-[#f5f5f5] !shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] !font-medium !transition-all",
    socialButtonsBlockButtonText: "!text-[#3c4043] !font-medium",
    formFieldLabel:
      "!text-[#807060] !font-semibold !text-[11px] !tracking-[0.08em] !uppercase",
    formFieldInput:
      "!bg-[#18181f] !border-[#2a2a36] !text-[#F0EDE4] !rounded-[0.65rem] !text-[15px] focus:!border-[#D4AF37]/60 focus:!shadow-[0_0_0_3px_rgba(212,175,55,0.12)] !transition-all !h-[46px]",
    formButtonPrimary: [
      "!bg-[linear-gradient(180deg,#F0C840_0%,#C49A20_100%)]",
      "!text-[#0a0800]",
      "!font-bold",
      "!text-[15px]",
      "!tracking-[0.02em]",
      "!h-[48px]",
      "!shadow-[0_5px_0_rgba(100,70,5,0.85),0_8px_24px_rgba(212,175,55,0.25)]",
      "hover:!shadow-[0_2px_0_rgba(100,70,5,0.85),0_4px_12px_rgba(212,175,55,0.2)]",
      "hover:!translate-y-[3px]",
      "active:!shadow-[0_0px_0_rgba(100,70,5,0.85)]",
      "active:!translate-y-[5px]",
      "!transition-all !duration-100",
      "!rounded-[0.65rem]",
    ].join(" "),
    footerActionLink: "!text-[#D4AF37] hover:!text-[#f0c94a] !font-semibold",
    footerActionText: "!text-[#706050]",
    dividerText: "!text-[#706050] !text-[12px]",
    dividerLine: "!bg-[#2a2a36]",
    alert: "!bg-[#18181f] !border !border-[#D4AF37]/25",
    alertText: "!text-[#F0EDE4]",
    identityPreviewEditButton: "!text-[#D4AF37]",
    formFieldSuccessText: "!text-emerald-400",
    otpCodeFieldInput:
      "!bg-[#18181f] !border-[#2a2a36] !text-[#F0EDE4] !h-[52px]",
    footerAction: "!bg-[#0e0e16] !border-t !border-[#1e1e28]",
    main: "!gap-5 !bg-[#111118]",
    formFieldRow: "!gap-3",
    formResendCodeLink: "!text-[#D4AF37]",
  },
};

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
  | null;

type DayInfo = { day: number; month: number; year: number } | null;

/* ── Shared auth card wrapper — Enhanced ────────────────────────── */
function AuthCard({ children }: { children: React.ReactNode }) {
  const photoUrl = `${basePath}/saipikhup-photo.jpg`;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
        /* Deep dark backdrop — fully opaque, no see-through */
        background:
          "radial-gradient(ellipse 90% 80% at 50% 40%, #0d1528 0%, #060810 65%)",
      }}
    >
      {/* Ambient gold center glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 40% at 50% 48%, rgba(212,175,55,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── CARD ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 420,
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid rgba(212,175,55,0.45)",
          boxShadow: [
            "0 0 0 1px rgba(212,175,55,0.08)",
            "0 4px 8px rgba(0,0,0,0.5)",
            "0 16px 40px rgba(0,0,0,0.8)",
            "0 48px 96px rgba(0,0,0,0.9)",
            "0 0 60px rgba(212,175,55,0.06)",
          ].join(", "),
        }}
      >
        {/* ── EMBROIDERY HEADER ── */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: "280%",
            backgroundPosition: "center 82%",
            height: 230,
          }}
        >
          {/* Top gold shimmer bar */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background:
                "linear-gradient(90deg, transparent 5%, #D4AF37 35%, #FFE878 50%, #D4AF37 65%, transparent 95%)",
              zIndex: 5,
            }}
          />
          {/* Dark overlay — top + bottom vignette, preserve middle textile */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(4,6,14,0.82) 0%, rgba(4,6,14,0.1) 30%, rgba(4,6,14,0.1) 65%, rgba(4,6,14,0.88) 100%)",
              zIndex: 1,
            }}
          />
          {/* Side vignettes */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(4,6,14,0.55) 0%, transparent 18%, transparent 82%, rgba(4,6,14,0.55) 100%)",
              zIndex: 2,
            }}
          />

          {/* Logo + branding */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              paddingTop: 8,
            }}
          >
            {/* Logo badge */}
            <img
              src="/logo.png"
              alt="Bnei Menashe Calendar"
              style={{
                width: 86,
                height: 86,
                borderRadius: "22px",
                objectFit: "cover",
                boxShadow: [
                  "0 4px 24px rgba(0,0,0,0.95)",
                  "0 12px 40px rgba(0,0,0,0.8)",
                  "0 0 32px rgba(212,175,55,0.3)",
                ].join(", "),
                border: "2px solid rgba(212,175,55,0.7)",
                marginBottom: 16,
              }}
            />

            {/* BNEI MENASHE wordmark */}
            <div
              style={{
                color: "#D4AF37",
                fontWeight: 800,
                fontSize: 26,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontFamily: "Georgia, 'Times New Roman', serif",
                textShadow:
                  "0 2px 20px rgba(0,0,0,1), 0 0 40px rgba(212,175,55,0.35), 0 1px 0 rgba(0,0,0,1)",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              BNEI MENASHE
            </div>

            {/* · SACRED CALENDAR · with ornament lines */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: 1,
                  width: 32,
                  background:
                    "linear-gradient(to right, transparent, rgba(212,175,55,0.7))",
                }}
              />
              <span
                style={{
                  color: "rgba(212,175,55,0.85)",
                  fontSize: 10,
                  letterSpacing: "0.28em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  textShadow: "0 1px 8px rgba(0,0,0,1)",
                  whiteSpace: "nowrap",
                }}
              >
                · SACRED CALENDAR ·
              </span>
              <div
                style={{
                  height: 1,
                  width: 32,
                  background:
                    "linear-gradient(to left, transparent, rgba(212,175,55,0.7))",
                }}
              />
            </div>

            {/* Diamond separator ◆ */}
            <div
              style={{
                color: "rgba(212,175,55,0.75)",
                fontSize: 10,
                textShadow: "0 0 12px rgba(212,175,55,0.5)",
                lineHeight: 1,
              }}
            >
              ◆
            </div>
          </div>
        </div>

        {/* Gold separator line */}
        <div
          aria-hidden
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, rgba(212,175,55,0.0) 0%, rgba(212,175,55,0.9) 30%, rgba(255,235,120,1) 50%, rgba(212,175,55,0.9) 70%, rgba(212,175,55,0.0) 100%)",
          }}
        />

        {/* ── FORM BODY ── */}
        <div
          style={{
            background: "linear-gradient(180deg, #0d0d16 0%, #0b0b14 100%)",
          }}
        >
          {children}
        </div>

        {/* Bottom gold accent */}
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, rgba(212,175,55,0.0) 0%, rgba(212,175,55,0.3) 40%, rgba(212,175,55,0.5) 50%, rgba(212,175,55,0.3) 60%, rgba(212,175,55,0.0) 100%)",
          }}
        />
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthCard>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={darkCardAppearance}
      />
    </AuthCard>
  );
}

function SignUpPage() {
  return (
    <AuthCard>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={darkCardAppearance}
      />
    </AuthCard>
  );
}

function AppShell() {
  const { user, isLoaded: userLoaded } = useUser();
  const { membership } = useOrganization();
  const { signOut } = useClerk();
  const profileSyncedRef = useRef(false);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(
    null,
  );

  const [activePage, setActivePage] = useState<Page>("home");
  const [modal, setModal] = useState<Modal>(null);
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

  const closeModal = useCallback(() => setModal(null), []);

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
                  <div className="screen fade-in">{renderPage()}</div>
                </Suspense>

                <BottomNav
                  active={activePage}
                  onNavigate={(p) => setActivePage(p as Page)}
                  onChat={() => setChatOpen(true)}
                  collapsed={navCollapsed}
                  onToggleCollapsed={toggleNavCollapsed}
                />

                {toast && <div className="toast">{toast}</div>}

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
      <FeedbackButton />
    </LanguageProvider>
  );
}

const DEV_PREVIEW =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("preview") === "1";

function HomeRoute() {
  if (DEV_PREVIEW) return <Redirect to="/app" />;
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
  if (DEV_PREVIEW) return <AppShell />;
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
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl={`${basePath}/`}
      {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access the sacred calendar",
          },
        },
        signUp: {
          start: {
            title: "Join Bnei Menashe",
            subtitle: "Create your account to get started",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/app" component={AppRoute} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </ClerkProvider>
  );
}
