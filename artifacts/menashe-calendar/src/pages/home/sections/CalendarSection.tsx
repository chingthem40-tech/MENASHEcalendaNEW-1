import { useState } from "react";
import type { ReactNode } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import type { ServerAnnouncement } from "../../../lib/announcementsApi";
import { ANN_STRIP_DISMISSED_KEY } from "../data";

/* ── loadStripDismissed ────────────────────────────────────────────────── */

function loadStripDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(ANN_STRIP_DISMISSED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

/* ── AnnouncementStrip ─────────────────────────────────────────────────── */

function AnnouncementStrip({ announcements, onOpen }: { announcements: ServerAnnouncement[]; onOpen: () => void }) {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState<Set<string>>(loadStripDismissed);

  // Pinned first, then most recent — skip any already dismissed by ID
  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.sentAt ?? b.createdAt).getTime() - new Date(a.sentAt ?? a.createdAt).getTime();
  });
  const visible = sorted.find(a => !dismissed.has(a.id));
  if (!visible) return null;

  const unreadCount = announcements.filter(a => !dismissed.has(a.id)).length;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(prev => {
      const next = new Set([...prev, visible.id]);
      try { localStorage.setItem(ANN_STRIP_DISMISSED_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px 9px 12px", marginBottom: 14, borderRadius: 14,
        background: "linear-gradient(90deg, rgba(212,168,67,0.16) 0%, rgba(212,168,67,0.06) 100%)",
        border: "1px solid rgba(212,168,67,0.32)",
        cursor: "pointer",
        animation: "annStripIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both",
      }}
    >
      <style>{`
        @keyframes annStripIn {
          from { transform: translateY(-6px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes annDot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* Live dot */}
      <div style={{
        width: 7, height: 7, borderRadius: "50%", background: "#ef4444", flexShrink: 0,
        animation: "annDot 1.8s ease-in-out infinite",
      }} />

      {/* Emoji */}
      <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{visible.emoji}</span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".08em", color: "#d4a843", textTransform: "uppercase" }}>
            {unreadCount > 1 ? t.annStripNews.replace("{n}", String(unreadCount)) : t.annStripNew}
          </span>
          {visible.pinned && (
            <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(212,168,67,0.6)", letterSpacing: ".05em", textTransform: "uppercase" }}>
              · 📌
            </span>
          )}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 800, color: "var(--text-primary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {visible.title}
        </div>
        {visible.body && (
          <div style={{
            fontSize: 10.5, color: "var(--text-muted)", marginTop: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {visible.body}
          </div>
        )}
      </div>

      {/* Read label */}
      <span style={{
        fontSize: 9, fontWeight: 800, color: "rgba(212,168,67,0.65)", flexShrink: 0,
        textTransform: "uppercase", letterSpacing: ".07em",
      }}>
        {t.annStripRead}
      </span>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        title="Dismiss"
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, color: "rgba(212,168,67,0.35)", lineHeight: 1,
          padding: "3px 2px 3px 6px", flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(212,168,67,0.75)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(212,168,67,0.35)")}
      >✕</button>
    </div>
  );
}

/* ── CalendarSection ───────────────────────────────────────────────────── */

interface CalendarSectionProps {
  /** Announcements for the strip; strip renders null if empty/all dismissed */
  unreadAnnouncements: ServerAnnouncement[];
  onShowAnnouncements: () => void;
  /**
   * The Today Card block (CompassCard + surrounding calendar components).
   * Passed as children from Home.tsx until those local functions are promoted
   * to standalone components in a future sprint.
   */
  children: ReactNode;
}

/**
 * CalendarSection
 *
 * Owns the top calendar block of the home screen:
 * - Renders the AnnouncementStrip directly (moved here from Home.tsx)
 * - Renders the Today Card + Rosh Chodesh banner + holiday cards +
 *   yahrzeit card via children (complex local functions pending extraction)
 *
 * Business logic stays in useHomeCalendar / useHomeNotifications hooks.
 */
export default function CalendarSection({ unreadAnnouncements, onShowAnnouncements, children }: CalendarSectionProps) {
  return (
    <>
      <AnnouncementStrip announcements={unreadAnnouncements} onOpen={onShowAnnouncements} />
      {children}
    </>
  );
}
