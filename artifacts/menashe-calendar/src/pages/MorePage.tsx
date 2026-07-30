import { useState } from "react";
import { GOLD } from "../lib/theme";
import { useLanguage } from "../context/LanguageContext";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface MorePageProps {
  isPremium: boolean;
  announcementCount?: number;
  onShowPremium: () => void;
  onNotifications: () => void;
  onCommunity: () => void;
  onAnnouncements: () => void;
  onEvents: () => void;
  onPrayerBoard: () => void;
  onMembers: () => void;
  onYartzeit: () => void;
  onMemorialWall: () => void;
  onTahara: () => void;
  onDafYomi: () => void;
  onHebrewDate: () => void;
  onBirthday: () => void;
  onOmer: () => void;
  onMussar: () => void;
  onTorahTracker: () => void;
  onCensus: () => void;
  onSefariaSearch: () => void;
  onSettings: () => void;
  onWhatsNew: () => void;
  /* optional new actions */
  onRateUs?: () => void;
  onInviteFriends?: () => void;
  onNews?: () => void;
  onTzadikim?: () => void;
  onChabadHouses?: () => void;
  onLocationMap?: () => void;
}

/* ── PRO Badge ───────────────────────────────────────────────────────────── */
function ProBadge() {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.08em",
        background: `linear-gradient(90deg, #6b4800, ${GOLD})`,
        color: "#1a0900",
        borderRadius: 5,
        padding: "2px 7px",
        flexShrink: 0,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}
    >
      PRO
    </span>
  );
}

/* ── Family Badge ────────────────────────────────────────────────────────── */
function FamilyBadge() {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.06em",
        background: "rgba(212,168,67,0.18)",
        color: GOLD,
        border: `1px solid rgba(212,168,67,0.4)`,
        borderRadius: 5,
        padding: "2px 7px",
        flexShrink: 0,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}
    >
      Family
    </span>
  );
}

/* ── Chevron icon ────────────────────────────────────────────────────────── */
function Chevron() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ opacity: 0.32, flexShrink: 0 }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ── List Item Row ───────────────────────────────────────────────────────── */
interface ItemProps {
  emoji: string;
  label: string;
  badge?: React.ReactNode;
  badge2?: React.ReactNode;
  dot?: number; // unread count badge
  onClick: () => void;
}

function Item({ emoji, label, badge, badge2, dot, onClick }: ItemProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 14px 13px 14px",
        background: pressed
          ? "var(--card-pressed, rgba(212,168,67,0.06))"
          : "var(--card-bg, rgba(255,255,255,0.035))",
        border: "1px solid var(--item-border, rgba(212,168,67,0.13))",
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        marginBottom: 9,
        transition: "background 0.12s, transform 0.1s",
        transform: pressed ? "scale(0.988)" : "scale(1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          flexShrink: 0,
          background: "rgba(212,168,67,0.1)",
          border: "1.5px solid rgba(212,168,67,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          position: "relative",
        }}
      >
        {emoji}
        {/* Unread dot */}
        {dot != null && dot > 0 && (
          <div
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "#e74c3c",
              color: "#fff",
              borderRadius: 10,
              fontSize: 9,
              fontWeight: 800,
              padding: "1px 5px",
              lineHeight: "14px",
              border: "1.5px solid var(--bg-primary, #060b18)",
            }}
          >
            {dot}
          </div>
        )}
      </div>

      {/* Label + badges */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 7,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </span>
        {badge}
        {badge2}
      </div>

      <Chevron />
    </button>
  );
}

/* ── Section divider ─────────────────────────────────────────────────────── */
function Divider({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        padding: "18px 4px 8px",
        opacity: 0.55,
      }}
    >
      {label}
    </div>
  );
}

/* ── MorePage ────────────────────────────────────────────────────────────── */
export default function MorePage({
  isPremium,
  announcementCount = 0,
  onShowPremium,
  onNotifications,
  onCommunity,
  onAnnouncements,
  onEvents,
  onPrayerBoard,
  onMembers,
  onYartzeit,
  onMemorialWall,
  onTahara,
  onDafYomi,
  onHebrewDate,
  onBirthday,
  onOmer,
  onMussar,
  onTorahTracker,
  onCensus,
  onSefariaSearch,
  onSettings,
  onWhatsNew,
  onRateUs,
  onInviteFriends,
  onNews,
  onTzadikim,
  onChabadHouses,
  onLocationMap,
}: MorePageProps) {
  const { t } = useLanguage();

  function handleRateUs() {
    if (onRateUs) {
      onRateUs();
      return;
    }
    // default: open app store / feedback
    window.open(
      "mailto:feedback@bneimenashe.com?subject=App Feedback",
      "_blank",
    );
  }

  function handleInviteFriends() {
    if (onInviteFriends) {
      onInviteFriends();
      return;
    }
    // default: use Web Share API or fallback
    if (navigator.share) {
      navigator
        .share({
          title: "Bnei Menashe Calendar",
          text: "I use this sacred Jewish calendar app — check it out!",
          url: window.location.origin,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.origin).catch(() => {});
    }
  }

  return (
    <div
      className="screen-enter"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-primary)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(212,168,67,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 14px",
        }}
      >
        {/* Rate Us */}
        <button
          type="button"
          onClick={handleRateUs}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: GOLD,
            background: "rgba(212,168,67,0.1)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: 8,
            padding: "5px 11px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Rate us ⭐
        </button>

        {/* Title */}
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.3px",
          }}
        >
          More
        </span>

        {/* Invite Friends */}
        <button
          type="button"
          onClick={handleInviteFriends}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: GOLD,
            background: "rgba(212,168,67,0.1)",
            border: "1px solid rgba(212,168,67,0.25)",
            borderRadius: 8,
            padding: "5px 11px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Invite Friends
        </button>
      </div>

      {/* ── Scrollable List ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 120px" }}>
        {/* Premium upsell banner — only shown to free users */}
        {!isPremium && (
          <button
            type="button"
            onClick={onShowPremium}
            style={{
              width: "100%",
              marginBottom: 14,
              padding: "13px 16px",
              background:
                "linear-gradient(135deg, rgba(212,168,67,0.13), rgba(212,168,67,0.05))",
              border: "1px solid rgba(212,168,67,0.38)",
              borderRadius: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 13,
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                flexShrink: 0,
                background: "linear-gradient(135deg,#6b4800,#d4a843)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              👑
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: GOLD,
                  marginBottom: 2,
                }}
              >
                Unlock Premium Features
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                }}
              >
                Daf Yomi, Tahara, Hebrew Date, Census & more
              </div>
            </div>
            <Chevron />
          </button>
        )}

        {/* ── Communications ──────────────────────────────────────────────── */}
        <Item
          emoji="💬"
          label="Messages (Push Notifications)"
          dot={announcementCount}
          onClick={onNotifications}
        />
        <Item emoji="👥" label="Community" onClick={onCommunity} />
        <Item emoji="📰" label="News" onClick={onNews ?? onAnnouncements} />

        {/* ── Sacred Tools ────────────────────────────────────────────────── */}
        <Divider label="Sacred Tools" />

        <Item
          emoji="🎂"
          label="Hebrew Birthday"
          badge={!isPremium ? <ProBadge /> : undefined}
          onClick={onBirthday}
        />
        <Item
          emoji="🔔"
          label="Hebrew Date Reminders"
          badge={!isPremium ? <ProBadge /> : undefined}
          onClick={onHebrewDate}
        />
        <Item
          emoji="🕯"
          label={t.remembranceTitle}
          badge2={<FamilyBadge />}
          onClick={onYartzeit}
        />
        <Item emoji="🕍" label="Memorial Wall" onClick={onMemorialWall} />
        <Item
          emoji="🕎"
          label="Tzadikim Anniversary — Hilulah"
          onClick={onTzadikim ?? onMemorialWall}
        />
        <Item
          emoji="💧"
          label="Tahara Purification"
          badge={!isPremium ? <ProBadge /> : undefined}
          onClick={onTahara}
        />
        <Item
          emoji="🗺️"
          label="Location Map"
          onClick={onLocationMap ?? onCommunity}
        />
        <Item
          emoji="✡"
          label="BNEI MENASHE WORLDWIDE"
          onClick={onChabadHouses ?? onCommunity}
        />

        {/* ── Study ───────────────────────────────────────────────────────── */}
        <Divider label="Study" />

        <Item
          emoji="📚"
          label="Daf Yomi"
          badge={!isPremium ? <ProBadge /> : undefined}
          onClick={onDafYomi}
        />
        <Item emoji="🌾" label="Sefirat HaOmer" onClick={onOmer} />
        <Item emoji="📿" label="Mussar — 48 Ways" onClick={onMussar} />
        <Item
          emoji="🔍"
          label="Torah Search (Sefaria)"
          onClick={onSefariaSearch}
        />
        <Item emoji="📖" label="Torah Tracker" onClick={onTorahTracker} />

        {/* ── Community Features ──────────────────────────────────────────── */}
        <Divider label="Community" />

        <Item emoji="🙏" label="Prayer Board" onClick={onPrayerBoard} />
        <Item emoji="📅" label="Community Events" onClick={onEvents} />
        <Item emoji="👤" label="Member Directory" onClick={onMembers} />
        <Item
          emoji="📢"
          label="Announcements"
          dot={announcementCount}
          onClick={onAnnouncements}
        />
        <Item
          emoji="📊"
          label="Community Census"
          badge={!isPremium ? <ProBadge /> : undefined}
          onClick={onCensus}
        />

        {/* ── App ─────────────────────────────────────────────────────────── */}
        <Divider label="App" />

        <Item emoji="✨" label="What's New" onClick={onWhatsNew} />
        <Item emoji="⚙️" label="Settings" onClick={onSettings} />

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.05em",
            opacity: 0.5,
          }}
        >
          Bnei Menashe Calendar · Sacred Jewish Tools
        </div>
      </div>
    </div>
  );
}
