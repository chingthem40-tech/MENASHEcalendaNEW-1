import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
  useLayoutEffect,
} from "react";
import { useUser } from "../auth";
import { HebrewCalendar, flags } from "@hebcal/core";
import {
  fetchTorahTrackerEntries,
  fetchYahrzeitEntries,
  type StudyEntryApi,
  type YartzeitEntryApi,
} from "../lib/userApi";
import {
  fetchRemembranceEvents,
  type RemembranceEvent,
} from "../lib/remembranceApi";
import { getNextRemembranceOccurrence } from "../lib/remembrance";
import { useLanguage } from "../context/LanguageContext";
import type { NotificationPrefs, LeadTime } from "../hooks/useNotifications";
import { LEAD_TIME_OPTIONS } from "../hooks/useNotifications";
import type { Announcement } from "../hooks/useAnnouncements";

// ── CSS injection (keyframes, reduced-motion) ─────────────────────────────────
const NOTIF_STYLE_ID = "notif-page-styles";
function injectStyles() {
  if (document.getElementById(NOTIF_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = NOTIF_STYLE_ID;
  el.textContent = `
    @keyframes notif-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes notif-fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes notif-pulse-dot {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    .notif-shimmer-bg {
      background: linear-gradient(
        90deg,
        var(--elevated) 25%,
        rgba(255,255,255,0.04) 50%,
        var(--elevated) 75%
      );
      background-size: 200% 100%;
      animation: notif-shimmer 1.5s ease-in-out infinite;
    }
    .notif-card-enter {
      animation: notif-fade-up 0.22s ease both;
    }
    .notif-unread-dot {
      animation: notif-pulse-dot 2.2s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .notif-shimmer-bg  { animation: none !important; }
      .notif-card-enter  { animation: none !important; }
      .notif-unread-dot  { animation: none !important; }
    }
  `;
  document.head.appendChild(el);
}

// ── Quiet Hours (localStorage) ────────────────────────────────────────────────
const QH_KEY = "menashe-quiet-hours";
interface QuietHours {
  enabled: boolean;
  from: string; // HH:MM
  to: string;   // HH:MM
}
const DEFAULT_QH: QuietHours = { enabled: false, from: "22:00", to: "07:00" };
function loadQH(): QuietHours {
  try {
    const raw = localStorage.getItem(QH_KEY);
    if (raw) return { ...DEFAULT_QH, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_QH;
}
function saveQH(qh: QuietHours) {
  try { localStorage.setItem(QH_KEY, JSON.stringify(qh)); } catch {}
}

// ── Read state (localStorage) ─────────────────────────────────────────────────
const READ_KEY = "menashe-notif-read-ids";
function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}
function saveReadIds(ids: Set<string>) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids])); } catch {}
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId      = "all" | "torah" | "prayer" | "holiday" | "community" | "account";
type FilterMode = "all" | "unread" | "read";
type NotifCategory = Exclude<TabId, "all">;

interface NotifItem {
  id:           string;
  category:     NotifCategory;
  icon:         string;
  title:        string;
  description:  string;
  time:         Date;
  action?:      () => void;
  actionLabel?: string;
}

interface ActivityEntry {
  id:          string;
  icon:        string;
  title:       string;
  description: string;
  time:        Date;
}

// ── Time formatters ──────────────────────────────────────────────────────────
function fmtRelTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 0) {
    const d = Math.ceil(-diff / 86_400_000);
    if (d <= 0) return "today";
    if (d === 1) return "tomorrow";
    if (d < 7)  return `in ${d}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 2)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7)   return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFutureLabel(date: Date): string {
  const diff = date.getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7)  return `in ${days} days`;
  return `on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// ── Notification builders ─────────────────────────────────────────────────────
function buildTorahItems(entries: StudyEntryApi[], onOpen: () => void): NotifItem[] {
  return [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20)
    .map(e => ({
      id:          `study-${e.id}`,
      category:    "torah" as const,
      icon:        "📖",
      title:       `${e.subject} session completed`,
      description: `${e.duration} min${e.description ? ` · ${e.description}` : ""}`,
      time:        new Date(e.date + "T12:00:00"),
      action:      onOpen,
      actionLabel: "Log More",
    }));
}

function buildCommunityItems(announcements: Announcement[], onView: () => void): NotifItem[] {
  return announcements
    .filter(a => a.status === "sent")
    .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""))
    .slice(0, 20)
    .map(a => ({
      id:          `ann-${a.id}`,
      category:    "community" as const,
      icon:        a.emoji || "📢",
      title:       a.title,
      description: a.body,
      time:        a.sentAt ? new Date(a.sentAt) : new Date(0),
      action:      onView,
      actionLabel: "View",
    }));
}

function buildHolidayItems(): NotifItem[] {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end   = new Date(today); end.setDate(end.getDate() + 60);
    const events = HebrewCalendar.calendar({
      start: today, end, il: true, isHebrewYear: false,
      mask: flags.CHAG | flags.MODERN_HOLIDAY | flags.ROSH_CHODESH,
    });
    const seen = new Set<string>();
    return events
      .filter(ev => { const k = ev.render("en"); if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 15)
      .map(ev => {
        const greg = ev.getDate().greg();
        return {
          id:          `hol-${ev.render("en").replace(/\W+/g, "-").toLowerCase()}`,
          category:    "holiday" as const,
          icon:        "✡",
          title:       ev.render("en"),
          description: `Upcoming ${fmtFutureLabel(greg)}`,
          time:        greg,
        };
      });
  } catch { return []; }
}

function buildPrayerItems(prefs: NotificationPrefs): NotifItem[] {
  const now = new Date();
  const items: NotifItem[] = [];
  if (prefs.prayers)       items.push({ id: "prayer-daily",  category: "prayer", icon: "🌅", title: "Daily Prayer Reminders",  description: "Shacharit, Mincha & Maariv alerts are active",  time: now });
  if (prefs.shema)         items.push({ id: "prayer-shema",  category: "prayer", icon: "📜", title: "Latest Shema Reminder",   description: "You'll be notified before the Shema deadline",  time: now });
  if (prefs.shabbat)       items.push({ id: "prayer-candle", category: "prayer", icon: "🕯️", title: "Shabbat Candle Lighting", description: "Reminder 18 min before candle lighting",        time: now });
  if (prefs.havdalah)      items.push({ id: "prayer-havd",   category: "prayer", icon: "✨", title: "Havdalah Reminder",        description: "You'll be notified at nightfall",               time: now });
  if (prefs.shabbatDigest) items.push({ id: "prayer-digest", category: "prayer", icon: "📋", title: "Shabbat Digest",           description: "Weekly summary every Friday morning at 8 AM",   time: now });
  return items;
}

function buildRemembranceItems(
  events: RemembranceEvent[],
  onOpen: () => void,
): NotifItem[] {
  return events
    .map((event): NotifItem | null => {
      const occ = getNextRemembranceOccurrence(event);
      if (!occ.date) return null;
      const icon =
        event.eventType === "birthday"    ? "🎂" :
        event.eventType === "anniversary" ? "💍" : "🕯";
      const typeLabel =
        event.eventType === "birthday"    ? "Birthday" :
        event.eventType === "anniversary" ? "Anniversary" : "Yahrzeit";
      const daysPart =
        occ.isToday    ? "Today" :
        occ.isTomorrow ? "Tomorrow" :
        occ.daysAway !== null ? `In ${occ.daysAway} days` : "";
      const dateStr = occ.date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      const parts = [daysPart, dateStr, event.relationship].filter(Boolean);
      const notifSuffix = event.notificationEnabled ? " · 🔔" : "";
      return {
        id:          `rem-${event.id}`,
        category:    "account" as const,
        icon,
        title:       `${typeLabel}: ${event.name}`,
        description: parts.join(" · ") + notifSuffix,
        time:        occ.date,
        action:      onOpen,
        actionLabel: "Open",
      };
    })
    .filter((item): item is NotifItem => item !== null);
}

function buildAccountItems(
  user: { createdAt?: Date | number | string | null } | null,
  isPremium: boolean,
  yahrzeitEntries: YartzeitEntryApi[],
): NotifItem[] {
  const items: NotifItem[] = [];
  if (user?.createdAt) {
    items.push({
      id:          "acc-joined",
      category:    "account",
      icon:        "🙏",
      title:       "Welcome to Bnei Menashe Calendar",
      description: `Member since ${new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      time:        new Date(user.createdAt),
    });
  }
  if (isPremium) {
    items.push({
      id:          "acc-premium",
      category:    "account",
      icon:        "👑",
      title:       "Premium Activated",
      description: "Full access to all features unlocked",
      time:        new Date(),
    });
  }
  for (const y of yahrzeitEntries.slice(0, 5)) {
    items.push({
      id:          `acc-yahr-${y.id}`,
      category:    "account",
      icon:        "🕯",
      title:       `Yahrzeit: ${y.name}`,
      description: `Annual reminder set for ${y.name}`,
      time:        new Date(),
    });
  }
  return items;
}

function buildActivityFeed(
  studyEntries:   StudyEntryApi[],
  announcements:  Announcement[],
  yahrzeitEntries: YartzeitEntryApi[],
): ActivityEntry[] {
  const items: ActivityEntry[] = [];
  for (const e of studyEntries.slice(0, 10)) {
    items.push({
      id:          `act-study-${e.id}`,
      icon:        "📖",
      title:       `${e.subject} study session`,
      description: `${e.duration} min${e.description ? ` · ${e.description}` : ""}`,
      time:        new Date(e.date + "T12:00:00"),
    });
  }
  for (const a of announcements.filter(a => a.status === "sent").slice(0, 5)) {
    items.push({
      id:          `act-ann-${a.id}`,
      icon:        a.emoji || "📢",
      title:       a.title,
      description: a.body.slice(0, 80) + (a.body.length > 80 ? "…" : ""),
      time:        a.sentAt ? new Date(a.sentAt) : new Date(0),
    });
  }
  for (const y of yahrzeitEntries.slice(0, 3)) {
    items.push({
      id:          `act-yahr-${y.id}`,
      icon:        "🕯",
      title:       "Yahrzeit reminder set",
      description: `Remembering ${y.name}`,
      time:        new Date(),
    });
  }
  return items.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = memo(function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      aria-hidden
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex", gap: 12,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="notif-shimmer-bg"
        style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="notif-shimmer-bg"
          style={{ height: 12, borderRadius: 6, marginBottom: 8, width: "58%" }}
        />
        <div
          className="notif-shimmer-bg"
          style={{ height: 10, borderRadius: 6, width: "82%" }}
        />
      </div>
    </div>
  );
});

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = memo(function EmptyState({
  title, sub, ctaLabel, onCta,
}: { title: string; sub: string; ctaLabel: string; onCta: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="notif-card-enter"
      style={{
        padding: "48px 24px", textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      }}
    >
      {/* Illustration */}
      <div style={{
        width: 84, height: 84, borderRadius: "50%", position: "relative",
        background: "radial-gradient(ellipse at 40% 35%, rgba(212,168,67,0.18) 0%, rgba(212,168,67,0.04) 70%, transparent 100%)",
        border: "1.5px solid rgba(212,168,67,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* SVG bell */}
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2a7 7 0 0 0-7 7v3.5L3 15h18l-2-2.5V9a7 7 0 0 0-7-7z"
            fill="rgba(212,168,67,0.25)" stroke="#d4a843" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M10 19a2 2 0 0 0 4 0"
            stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round"
          />
          <circle cx="17" cy="6" r="3.5" fill="#d4a843" opacity="0.9" />
          <path d="M17 4.5v2M17 6.5h0" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {/* Sparkle dots */}
        <div style={{ position: "absolute", top: 6, right: 10, width: 4, height: 4, borderRadius: "50%", background: "#d4a843", opacity: 0.5 }} />
        <div style={{ position: "absolute", bottom: 10, left: 8, width: 3, height: 3, borderRadius: "50%", background: "#d4a843", opacity: 0.35 }} />
      </div>

      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 220 }}>
          {sub}
        </div>
      </div>

      <button
        type="button"
        onClick={onCta}
        style={{
          marginTop: 2, padding: "10px 24px", borderRadius: 24,
          background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.35)",
          color: "#d4a843", fontSize: 13, fontWeight: 700, cursor: "pointer",
          transition: "background 0.15s, transform 0.1s",
          outline: "none",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.18)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.1)"; }}
        onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.4)"; }}
        onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
      >
        {ctaLabel}
      </button>
    </div>
  );
});

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = memo(function ErrorState({
  title, sub, retryLabel, onRetry,
}: { title: string; sub: string; retryLabel: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="notif-card-enter"
      style={{ padding: "40px 24px", textAlign: "center" }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: "50%", margin: "0 auto 14px",
        background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
      }}>
        ⚠️
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.6 }}>
        {sub}
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: "10px 22px", borderRadius: 12,
          background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)",
          color: "#d4a843", fontSize: 13, fontWeight: 700, cursor: "pointer",
          transition: "background 0.15s",
        }}
        onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.4)"; }}
        onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
      >
        {retryLabel}
      </button>
    </div>
  );
});

// ── Notification card (with swipe-to-dismiss) ─────────────────────────────────
const NotifCard = memo(function NotifCard({
  item, isRead, onMarkRead, animDelay,
}: {
  item:        NotifItem;
  isRead:      boolean;
  onMarkRead:  (id: string) => void;
  animDelay?:  number;
}) {
  const touchStartX = useRef<number | null>(null);
  const cardRef     = useRef<HTMLDivElement>(null);
  const swiping     = useRef(false);

  const handleClick = useCallback(() => {
    if (!isRead && !swiping.current) onMarkRead(item.id);
  }, [isRead, item.id, onMarkRead]);

  const handleAction = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead(item.id);
    item.action?.();
  }, [item, onMarkRead]);

  // Swipe-to-archive (mobile)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || !cardRef.current) return;
    const dx = touchStartX.current - e.touches[0].clientX;
    if (dx > 10) {
      swiping.current = true;
      const clamp = Math.min(dx, 140);
      cardRef.current.style.transform = `translateX(-${clamp}px)`;
      cardRef.current.style.opacity   = String(Math.max(0.2, 1 - clamp / 140));
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!cardRef.current || touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 80) {
      // Archive
      cardRef.current.style.transition = "all 0.22s ease";
      cardRef.current.style.transform  = "translateX(-100%)";
      cardRef.current.style.opacity    = "0";
      cardRef.current.style.maxHeight  = "0";
      cardRef.current.style.padding    = "0";
      cardRef.current.style.overflow   = "hidden";
      setTimeout(() => onMarkRead(item.id), 220);
    } else {
      // Snap back
      cardRef.current.style.transition = "all 0.2s ease";
      cardRef.current.style.transform  = "translateX(0)";
      cardRef.current.style.opacity    = "1";
    }
    touchStartX.current = null;
  }, [item.id, onMarkRead]);

  return (
    <div
      ref={cardRef}
      role="article"
      aria-label={`${isRead ? "" : "Unread: "}${item.title}`}
      className="notif-card-enter"
      onClick={handleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      style={{
        display: "flex", gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        borderLeft: isRead ? "3px solid transparent" : "3px solid var(--gold)",
        background: isRead ? "transparent" : "rgba(212,168,67,0.04)",
        cursor: isRead ? "default" : "pointer",
        transition: "background 0.18s, border-color 0.18s",
        position: "relative",
        userSelect: "none",
        WebkitUserSelect: "none",
        outline: "none",
        animationDelay: animDelay ? `${animDelay}ms` : undefined,
      }}
      onFocus={e => { (e.currentTarget as HTMLElement).style.outline = "2px solid rgba(212,168,67,0.4)"; }}
      onBlur={e => { (e.currentTarget as HTMLElement).style.outline = "none"; }}
    >
      {/* Icon bubble */}
      <div
        aria-hidden
        style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: isRead ? "var(--elevated)" : "rgba(212,168,67,0.1)",
          border: `1px solid ${isRead ? "var(--border)" : "rgba(212,168,67,0.22)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, transition: "background 0.18s",
        }}
      >
        {item.icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
          <div style={{
            fontSize: 13,
            fontWeight: isRead ? 500 : 700,
            color: isRead ? "var(--text-secondary)" : "var(--text-primary)",
            lineHeight: 1.4,
          }}>
            {item.title}
          </div>
          <time
            dateTime={item.time.toISOString()}
            style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 1 }}
          >
            {fmtRelTime(item.time)}
          </time>
        </div>

        <div style={{
          fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          // @ts-ignore vendor prefix
          WebkitBoxOrient: "vertical",
          opacity: isRead ? 0.65 : 1,
        }}>
          {item.description}
        </div>

        {item.action && item.actionLabel && (
          <button
            type="button"
            onClick={handleAction}
            aria-label={item.actionLabel}
            style={{
              marginTop: 7, padding: "4px 12px", borderRadius: 6,
              background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.22)",
              color: "#d4a843", fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.08)"; }}
          >
            {item.actionLabel}
          </button>
        )}
      </div>

      {/* Unread pulse dot */}
      {!isRead && (
        <div
          aria-hidden
          className="notif-unread-dot"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--gold)",
            boxShadow: "0 0 7px rgba(212,168,67,0.6)",
          }}
        />
      )}
    </div>
  );
});

// ── Activity row with timeline ────────────────────────────────────────────────
const ActivityRow = memo(function ActivityRow({
  item, isLast, index,
}: { item: ActivityEntry; isLast: boolean; index: number }) {
  return (
    <div
      className="notif-card-enter"
      style={{
        display: "flex", gap: 0,
        padding: "0 16px",
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Timeline column */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        width: 36, flexShrink: 0, marginRight: 12,
      }}>
        {/* Icon dot */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "var(--elevated)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, marginTop: 12, zIndex: 1,
        }} aria-hidden>
          {item.icon}
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div style={{
            flex: 1, width: 1, minHeight: 12,
            background: "linear-gradient(to bottom, var(--border), transparent)",
            marginTop: 4,
          }} aria-hidden />
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1, minWidth: 0,
        padding: "12px 0",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
            {item.title}
          </div>
          <time
            dateTime={item.time.toISOString()}
            style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {fmtRelTime(item.time)}
          </time>
        </div>
        <div style={{
          fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.description}
        </div>
      </div>
    </div>
  );
});

// ── Toggle row ────────────────────────────────────────────────────────────────
const ToggleRow = memo(function ToggleRow({
  label, sub, checked, onChange, disabled, isLast,
}: {
  label: string; sub?: string; checked: boolean;
  onChange: () => void; disabled?: boolean; isLast?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "13px 16px",
      borderBottom: isLast ? "none" : "1px solid var(--border)",
      opacity: disabled ? 0.45 : 1,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={disabled ? undefined : onChange}
        style={{
          width: 44, height: 26, borderRadius: 13, border: "none",
          background: checked ? "var(--gold)" : "var(--border)",
          cursor: disabled ? "default" : "pointer",
          position: "relative", flexShrink: 0,
          transition: "background 0.2s",
          outline: "none",
        }}
        onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.4)"; }}
        onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          display: "block",
        }} />
      </button>
    </div>
  );
});

// ── Quick action button ───────────────────────────────────────────────────────
const QuickBtn = memo(function QuickBtn({
  icon, label, onClick,
}: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        flex: "1 1 calc(50% - 5px)", minWidth: 0,
        padding: "13px 8px",
        background: "var(--elevated)", border: "1px solid var(--border)",
        borderRadius: 14, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        transition: "border-color 0.15s, transform 0.1s",
        outline: "none",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,67,0.4)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
      onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      onTouchStart={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
      onTouchEnd={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.35)"; }}
      onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <span style={{ fontSize: 22 }} aria-hidden>{icon}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
        textAlign: "center", lineHeight: 1.3,
      }}>
        {label}
      </span>
    </button>
  );
});

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: "var(--gold)",
      letterSpacing: "0.10em", textTransform: "uppercase",
      marginBottom: 8, paddingLeft: 2,
    }}>
      {children}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({
  children, style,
}: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--elevated)",
      border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
const FilterBar = memo(function FilterBar({
  value, onChange, unreadLabel, readLabel, allLabel,
}: {
  value:       FilterMode;
  onChange:    (v: FilterMode) => void;
  allLabel:    string;
  unreadLabel: string;
  readLabel:   string;
}) {
  const opts: { id: FilterMode; label: string }[] = [
    { id: "all", label: allLabel },
    { id: "unread", label: unreadLabel },
    { id: "read", label: readLabel },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Filter notifications"
      style={{
        display: "flex", gap: 4,
        background: "var(--elevated)",
        border: "1px solid var(--border)",
        borderRadius: 10, padding: 3,
      }}
    >
      {opts.map(o => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          style={{
            flex: 1, padding: "5px 10px", borderRadius: 7, border: "none",
            background: value === o.id ? "rgba(212,168,67,0.15)" : "transparent",
            color: value === o.id ? "#d4a843" : "var(--text-muted)",
            fontSize: 11, fontWeight: value === o.id ? 700 : 500,
            cursor: "pointer", transition: "all 0.15s", outline: "none",
          }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.35)"; }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
});

// ── Quiet Hours section ───────────────────────────────────────────────────────
const QuietHoursSection = memo(function QuietHoursSection({
  labelTitle, labelDesc, labelFrom, labelTo,
}: {
  labelTitle: string;
  labelDesc:  string;
  labelFrom:  string;
  labelTo:    string;
}) {
  const [qh, setQH] = useState<QuietHours>(loadQH);

  const update = useCallback((patch: Partial<QuietHours>) => {
    setQH(prev => { const next = { ...prev, ...patch }; saveQH(next); return next; });
  }, []);

  return (
    <Card style={{ marginTop: 10 }}>
      <div style={{ padding: "13px 16px", borderBottom: qh.enabled ? "1px solid var(--border)" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {labelTitle}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              {labelDesc}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={qh.enabled}
            aria-label={labelTitle}
            onClick={() => update({ enabled: !qh.enabled })}
            style={{
              width: 44, height: 26, borderRadius: 13, border: "none",
              background: qh.enabled ? "var(--gold)" : "var(--border)",
              cursor: "pointer",
              position: "relative", flexShrink: 0,
              transition: "background 0.2s", outline: "none",
            }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.4)"; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            <span style={{
              position: "absolute", top: 3, left: qh.enabled ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%",
              background: "white",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              display: "block",
            }} />
          </button>
        </div>
      </div>

      {qh.enabled && (
        <div style={{ display: "flex", gap: 10, padding: "13px 16px" }}>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
              {labelFrom}
            </div>
            <input
              type="time"
              value={qh.from}
              onChange={e => update({ from: e.target.value })}
              aria-label={labelFrom}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 8,
                background: "var(--background)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 13,
                colorScheme: "dark",
              }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
              {labelTo}
            </div>
            <input
              type="time"
              value={qh.to}
              onChange={e => update({ to: e.target.value })}
              aria-label={labelTo}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 8,
                background: "var(--background)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 13,
                colorScheme: "dark",
              }}
            />
          </label>
        </div>
      )}
    </Card>
  );
});

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  notifPermission:     NotificationPermission;
  notifPrefs:          NotificationPrefs;
  leadTime:            LeadTime;
  onUpdateNotifPref:   (key: keyof NotificationPrefs, value: boolean) => Promise<boolean>;
  onUpdateLeadTime:    (mins: LeadTime) => void;
  pushSubscribed:      boolean;
  pushSupported:       boolean;
  pushLoading:         boolean;
  pushError:           string | null;
  onSubscribePush:     () => Promise<boolean>;
  onUnsubscribePush:   () => Promise<void>;
  onSendTestPush:      () => Promise<boolean>;
  announcements:       Announcement[];
  isPremium:           boolean;
  onNavigate:          (page: string) => void;
  onShowTorahTracker:  () => void;
  onShowPrayers:       () => void;
  onShowYartzeit:      () => void;
  onShowCommunity:     () => void;
  onShowAnnouncements: () => void;
  onGoBack?:           () => void;
}

// ── Main page component ───────────────────────────────────────────────────────
const NotificationsPage = memo(function NotificationsPage({
  notifPermission,
  notifPrefs,
  leadTime,
  onUpdateNotifPref,
  onUpdateLeadTime,
  pushSubscribed,
  pushSupported,
  pushLoading,
  pushError,
  onSubscribePush,
  onUnsubscribePush,
  onSendTestPush,
  announcements,
  isPremium,
  onNavigate: _onNavigate,
  onShowTorahTracker,
  onShowPrayers,
  onShowYartzeit,
  onShowCommunity,
  onShowAnnouncements,
  onGoBack,
}: Props) {
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();

  const [activeTab,   setActiveTab]   = useState<TabId>("all");
  const [filterMode,  setFilterMode]  = useState<FilterMode>("all");
  const [readIds,     setReadIds]     = useState<Set<string>>(loadReadIds);
  const [studyEntries, setStudyEntries] = useState<StudyEntryApi[]>([]);
  const [yahrzeitEntries, setYahrzeitEntries] = useState<YartzeitEntryApi[]>([]);
  const [remembranceEvents, setRemembranceEvents] = useState<RemembranceEvent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState(false);

  // Inject CSS once
  useLayoutEffect(() => { injectStyles(); }, []);

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    if (!isLoaded || !user) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    Promise.all([
      fetchTorahTrackerEntries().catch(() => [] as StudyEntryApi[]),
      fetchYahrzeitEntries().catch(() => [] as YartzeitEntryApi[]),
      fetchRemembranceEvents().catch(() => [] as RemembranceEvent[]),
    ]).then(([study, yahrzeit, remembrance]) => {
      setStudyEntries(study);
      setYahrzeitEntries(yahrzeit);
      setRemembranceEvents(remembrance);
      setLoading(false);
    }).catch(() => {
      setLoadError(true);
      setLoading(false);
    });
  }, [isLoaded, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh remembrance items when a CRUD action fires in RemembranceCenterModal
  useEffect(() => {
    const onUpdate = () => void loadData();
    window.addEventListener("menashe-remembrance-updated", onUpdate);
    return () => window.removeEventListener("menashe-remembrance-updated", onUpdate);
  }, [loadData]);

  // ── Build notifications ─────────────────────────────────────────────────────
  const allNotifs = useMemo<NotifItem[]>(() => {
    const torah        = buildTorahItems(studyEntries, onShowTorahTracker);
    const community    = buildCommunityItems(announcements, onShowAnnouncements);
    const holidays     = buildHolidayItems();
    const prayer       = buildPrayerItems(notifPrefs);
    const account      = buildAccountItems(user ?? null, isPremium, yahrzeitEntries);
    const remembrance  = buildRemembranceItems(remembranceEvents, onShowYartzeit);
    return [...torah, ...community, ...holidays, ...prayer, ...account, ...remembrance]
      .sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [
    studyEntries, announcements, notifPrefs, user, isPremium,
    yahrzeitEntries, remembranceEvents, onShowTorahTracker, onShowAnnouncements, onShowYartzeit,
  ]);

  const tabFiltered = useMemo<NotifItem[]>(() => {
    if (activeTab === "all") return allNotifs;
    return allNotifs.filter(n => n.category === activeTab);
  }, [allNotifs, activeTab]);

  const filteredNotifs = useMemo<NotifItem[]>(() => {
    if (filterMode === "unread") return tabFiltered.filter(n => !readIds.has(n.id));
    if (filterMode === "read")   return tabFiltered.filter(n =>  readIds.has(n.id));
    return tabFiltered;
  }, [tabFiltered, filterMode, readIds]);

  const unreadCount = useMemo(
    () => allNotifs.filter(n => !readIds.has(n.id)).length,
    [allNotifs, readIds],
  );

  const activityItems = useMemo(
    () => buildActivityFeed(studyEntries, announcements, yahrzeitEntries),
    [studyEntries, announcements, yahrzeitEntries],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const markRead = useCallback((id: string) => {
    setReadIds(prev => { const n = new Set([...prev, id]); saveReadIds(n); return n; });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const n = new Set([...prev, ...allNotifs.map(x => x.id)]);
      saveReadIds(n);
      return n;
    });
  }, [allNotifs]);

  const togglePref = useCallback(async (key: keyof NotificationPrefs) => {
    await onUpdateNotifPref(key, !notifPrefs[key]);
  }, [notifPrefs, onUpdateNotifPref]);

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const TABS = useMemo(() => [
    { id: "all"       as TabId, label: t.notifTabAll },
    { id: "torah"     as TabId, label: t.notifTabTorah },
    { id: "prayer"    as TabId, label: t.notifTabPrayer },
    { id: "holiday"   as TabId, label: t.notifTabHolidays },
    { id: "community" as TabId, label: t.notifTabCommunity },
    { id: "account"   as TabId, label: t.notifTabAccount },
  ], [t]);

  const permissionBlocked = notifPermission === "denied";

  // ── Unauthenticated state ───────────────────────────────────────────────────
  if (isLoaded && !user) {
    return (
      <div style={{
        minHeight: "60dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", gap: 14, textAlign: "center",
      }}>
        <div style={{ fontSize: 52 }}>🔔</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          {t.notifPageTitle}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {t.notifSignInMsg}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "16px 16px 100px", maxWidth: 600, margin: "0 auto" }}
      aria-label={t.notifPageTitle}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 22, gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {/* Back button */}
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              aria-label={t.notifBack}
              style={{
                width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
                background: "var(--elevated)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", fontSize: 16, flexShrink: 0,
                transition: "border-color 0.15s", outline: "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,67,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.4)"; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              ←
            </button>
          )}

          {/* Bell + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 19, flexShrink: 0,
            }} aria-hidden>
              🔔
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, margin: 0 }}>
                {t.notifPageTitle}
              </h1>
              {unreadCount > 0 && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {unreadCount} {t.notifUnread}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            aria-label={t.notifMarkAllRead}
            style={{
              padding: "7px 13px", borderRadius: 10, flexShrink: 0,
              background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)",
              color: "#d4a843", fontSize: 12, fontWeight: 700, cursor: "pointer",
              transition: "background 0.15s", outline: "none",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.16)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.08)"; }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.4)"; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            {t.notifMarkAllRead}
          </button>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <section aria-label={t.notifQuickActions} style={{ marginBottom: 24 }}>
        <SectionLabel>{t.notifQuickActions}</SectionLabel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <QuickBtn icon="📖" label={t.notifResumeStudy}   onClick={onShowTorahTracker} />
          <QuickBtn icon="🕐" label={t.notifPrayerTimes}   onClick={onShowPrayers} />
          <QuickBtn icon="🕯" label={t.notifOpenYahrzeit}  onClick={onShowYartzeit} />
          <QuickBtn icon="🤝" label={t.notifOpenCommunity} onClick={onShowCommunity} />
        </div>
      </section>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 10 }}>
        <div
          role="tablist"
          aria-label="Notification categories"
          style={{
            display: "flex", gap: 6, overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
            // @ts-ignore vendor prefix
            msOverflowStyle: "none",
          }}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const tabUnread = tab.id === "all"
              ? allNotifs.filter(n => !readIds.has(n.id)).length
              : allNotifs.filter(n => n.category === tab.id && !readIds.has(n.id)).length;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`notif-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 20,
                  background: isActive ? "rgba(212,168,67,0.13)" : "var(--elevated)",
                  border: `1px solid ${isActive ? "rgba(212,168,67,0.42)" : "var(--border)"}`,
                  color: isActive ? "#d4a843" : "var(--text-muted)",
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", transition: "all 0.15s", outline: "none",
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.35)"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {tab.label}
                {tabUnread > 0 && (
                  <span style={{
                    minWidth: 16, height: 16, borderRadius: 8, padding: "0 4px",
                    background: isActive ? "rgba(212,168,67,0.25)" : "rgba(212,168,67,0.15)",
                    color: "#d4a843", fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {tabUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div style={{ marginTop: 8 }}>
          <FilterBar
            value={filterMode}
            onChange={setFilterMode}
            allLabel={t.notifTabAll}
            unreadLabel={t.notifFilterUnread}
            readLabel={t.notifFilterRead}
          />
        </div>
      </div>

      {/* ── Notifications panel ──────────────────────────────────────────── */}
      <section
        id={`notif-panel-${activeTab}`}
        role="tabpanel"
        aria-label={`${activeTab} notifications`}
        style={{ marginBottom: 24 }}
      >
        <Card>
          {loading ? (
            <>
              <SkeletonCard delay={0} />
              <SkeletonCard delay={60} />
              <SkeletonCard delay={120} />
              <SkeletonCard delay={180} />
            </>
          ) : loadError ? (
            <ErrorState
              title={t.notifErrorTitle}
              sub={t.notifErrorSub}
              retryLabel={t.notifRetry}
              onRetry={loadData}
            />
          ) : filteredNotifs.length === 0 ? (
            <EmptyState
              title={t.notifAllCaughtUp}
              sub={t.notifAllCaughtUpSub}
              ctaLabel={t.notifEmptyCta}
              onCta={onShowTorahTracker}
            />
          ) : (
            filteredNotifs.map((item, idx) => (
              <NotifCard
                key={item.id}
                item={item}
                isRead={readIds.has(item.id)}
                onMarkRead={markRead}
                animDelay={idx * 30}
              />
            ))
          )}
        </Card>
      </section>

      {/* ── Activity Feed ────────────────────────────────────────────────── */}
      <section aria-label={t.notifActivityTitle} style={{ marginBottom: 24 }}>
        <SectionLabel>{t.notifActivityTitle}</SectionLabel>
        <Card>
          {loading ? (
            <>
              <SkeletonCard delay={0} />
              <SkeletonCard delay={60} />
              <SkeletonCard delay={120} />
            </>
          ) : activityItems.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 10 }}>
                {t.notifNoActivity}
              </div>
              <button
                type="button"
                onClick={onShowTorahTracker}
                style={{
                  fontSize: 12, fontWeight: 700, color: "#d4a843",
                  background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none",
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
              >
                {t.notifStartStudy}
              </button>
            </div>
          ) : (
            activityItems.map((item, idx) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={idx === activityItems.length - 1}
                index={idx}
              />
            ))
          )}
        </Card>
      </section>

      {/* ── Notification Settings ────────────────────────────────────────── */}
      <section aria-label={t.notifSettingsTitle} style={{ marginBottom: 24 }}>
        <SectionLabel>{t.notifSettingsTitle}</SectionLabel>

        {permissionBlocked && (
          <div
            role="alert"
            style={{
              padding: "12px 14px", borderRadius: 12, marginBottom: 10,
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)",
              display: "flex", alignItems: "flex-start", gap: 10,
            }}
          >
            <span style={{ fontSize: 17, flexShrink: 0 }} aria-hidden>🔕</span>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
              {t.notifPermissionDenied}
            </div>
          </div>
        )}

        <Card>
          <ToggleRow label={t.notifPrayerReminders}  sub={t.notifPrayerRemindersSub}  checked={notifPrefs.prayers}       onChange={() => togglePref("prayers")}       disabled={permissionBlocked} />
          <ToggleRow label={t.notifShabbatCandles}   sub={t.notifShabbatCandlesSub}   checked={notifPrefs.shabbat}        onChange={() => togglePref("shabbat")}       disabled={permissionBlocked} />
          <ToggleRow label={t.notifHavdalahReminder}                                  checked={notifPrefs.havdalah}       onChange={() => togglePref("havdalah")}      disabled={permissionBlocked} />
          <ToggleRow label={t.notifShemaReminder}    sub={t.notifShemaReminderSub}    checked={notifPrefs.shema}          onChange={() => togglePref("shema")}         disabled={permissionBlocked} />
          <ToggleRow label={t.notifTorahReminders}   sub={t.notifTorahRemindersSub}   checked={notifPrefs.parasha}        onChange={() => togglePref("parasha")}       disabled={permissionBlocked} />
          <ToggleRow label={t.notifHolidayReminders} sub={t.notifHolidayRemindersSub} checked={notifPrefs.holiday}        onChange={() => togglePref("holiday")}       disabled={permissionBlocked} />
          <ToggleRow label={t.notifYahrzeitReminders}                                 checked={notifPrefs.yahrzeit}       onChange={() => togglePref("yahrzeit")}      disabled={permissionBlocked} />
          <ToggleRow label={t.notifOmerCount}                                         checked={notifPrefs.omer}           onChange={() => togglePref("omer")}          disabled={permissionBlocked} />
          <ToggleRow label={t.notifShabbatDigest}    sub={t.notifShabbatDigestSub}    checked={notifPrefs.shabbatDigest} onChange={() => togglePref("shabbatDigest")} disabled={permissionBlocked} isLast />
        </Card>

        {/* Lead time chips */}
        <div style={{
          background: "var(--elevated)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "13px 16px", marginTop: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
            {t.notifLeadTime}
          </div>
          <div role="radiogroup" aria-label={t.notifLeadTime} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LEAD_TIME_OPTIONS.map(mins => (
              <button
                key={mins}
                type="button"
                role="radio"
                aria-checked={leadTime === mins}
                onClick={() => onUpdateLeadTime(mins)}
                style={{
                  padding: "5px 14px", borderRadius: 20,
                  background: leadTime === mins ? "rgba(212,168,67,0.14)" : "transparent",
                  border: `1px solid ${leadTime === mins ? "rgba(212,168,67,0.42)" : "var(--border)"}`,
                  color: leadTime === mins ? "#d4a843" : "var(--text-muted)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s", outline: "none",
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.35)"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <QuietHoursSection
          labelTitle={t.notifQuietHours}
          labelDesc={t.notifQuietHoursDesc}
          labelFrom={t.notifQuietFrom}
          labelTo={t.notifQuietTo}
        />

        {/* Push notifications */}
        {pushSupported && (
          <div style={{
            background: "var(--elevated)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "14px 16px", marginTop: 10,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
                  {t.notifPushNotifications}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {pushSubscribed ? t.notifPushActive : t.notifPushInactive}
                </div>
                {pushError && (
                  <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{pushError}</div>
                )}
              </div>
              <button
                type="button"
                onClick={pushSubscribed ? onUnsubscribePush : onSubscribePush}
                disabled={pushLoading}
                aria-label={pushSubscribed ? t.notifPushUnsubscribe : t.notifPushSubscribe}
                style={{
                  padding: "7px 13px", borderRadius: 10, flexShrink: 0,
                  background: pushSubscribed ? "rgba(239,68,68,0.08)" : "rgba(212,168,67,0.1)",
                  border: `1px solid ${pushSubscribed ? "rgba(239,68,68,0.28)" : "rgba(212,168,67,0.28)"}`,
                  color: pushSubscribed ? "#ef4444" : "#d4a843",
                  fontSize: 12, fontWeight: 700,
                  cursor: pushLoading ? "default" : "pointer",
                  opacity: pushLoading ? 0.6 : 1,
                  transition: "all 0.15s", outline: "none",
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.4)"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {pushLoading ? "…" : pushSubscribed ? t.notifPushUnsubscribe : t.notifPushSubscribe}
              </button>
            </div>
            {pushSubscribed && (
              <button
                type="button"
                onClick={onSendTestPush}
                aria-label={t.notifPushTest}
                style={{
                  marginTop: 10, padding: "6px 13px", borderRadius: 8,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  transition: "border-color 0.15s", outline: "none",
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px rgba(212,168,67,0.35)"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {t.notifPushTest}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
});

export default NotificationsPage;
