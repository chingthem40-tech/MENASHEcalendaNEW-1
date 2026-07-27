import { useState } from "react";
import { NotificationPrefs, LeadTime, LEAD_TIME_OPTIONS } from "../hooks/useNotifications";
import type { ServerAnnouncement } from "../lib/announcementsApi";

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NotificationDrawerProps {
  onClose: () => void;
  notifPermission: NotificationPermission;
  notifPrefs: NotificationPrefs;
  leadTime: LeadTime;
  onUpdateNotifPref: (key: keyof NotificationPrefs, value: boolean) => Promise<boolean>;
  onUpdateLeadTime: (mins: LeadTime) => void;
  unreadAnnouncements: ServerAnnouncement[];
  onViewAllAnnouncements: () => void;
  pushSupported?: boolean;
  pushSubscribed?: boolean;
  pushLoading?: boolean;
  onSubscribePush?: () => Promise<boolean>;
  onUnsubscribePush?: () => Promise<void>;
  onSendTestPush?: () => Promise<boolean>;
}

export default function NotificationDrawer({
  onClose,
  notifPermission,
  notifPrefs,
  leadTime,
  onUpdateNotifPref,
  onUpdateLeadTime,
  unreadAnnouncements,
  onViewAllAnnouncements,
  pushSupported = false,
  pushSubscribed = false,
  pushLoading = false,
  onSubscribePush,
  onUnsubscribePush,
  onSendTestPush,
}: NotificationDrawerProps) {
  const [pendingKey, setPendingKey] = useState<keyof NotificationPrefs | null>(null);
  const [pushPending, setPushPending] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const notifBlocked = notifPermission === "denied";
  const notifUnsupported = typeof Notification === "undefined";
  const anyActive = Object.values(notifPrefs).some(Boolean);
  const preview = unreadAnnouncements.slice(0, 3);

  async function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    if (notifBlocked || notifUnsupported) return;
    setPendingKey(key);
    await onUpdateNotifPref(key, value);
    setPendingKey(null);
  }

  function subtitle(key: keyof NotificationPrefs, text: string): string {
    if (notifUnsupported) return "Not supported in this browser";
    if (notifBlocked) return "Blocked — enable in browser settings";
    if (notifPrefs[key] && notifPermission === "granted") return `${text} · Active`;
    return text;
  }

  function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
    return (
      <div
        onClick={disabled ? undefined : onToggle}
        style={{
          width: 44, height: 26, borderRadius: 13, flexShrink: 0,
          background: disabled ? "var(--elevated)" : on ? "var(--gold)" : "var(--elevated)",
          position: "relative", cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.2s", border: "1px solid var(--border)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18,
          borderRadius: "50%",
          background: disabled ? "var(--text-muted)" : on ? "#1a0f00" : "var(--text-muted)",
          transition: "left 0.2s",
        }} />
      </div>
    );
  }

  function Row({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px" }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>}
        </div>
        {right}
      </div>
    );
  }

  const ROWS: { key: keyof NotificationPrefs; label: string; sub: string }[] = [
    { key: "shabbat",       label: "🕯 Candle Lighting",    sub: `18 min before Shabbat` },
    { key: "havdalah",      label: "✨ Havdalah",           sub: "When Shabbat ends" },
    { key: "shema",         label: "📖 Latest Shema",       sub: `${leadTime} min warning — daily deadline` },
    { key: "prayers",       label: "🙏 Prayer Times",       sub: `Shacharit, Mincha & Maariv — ${leadTime} min warning` },
    { key: "holiday",       label: "✡ Holidays",            sub: "Day before each holiday" },
    { key: "parasha",       label: "📜 Weekly Parasha",     sub: "Friday morning · this Shabbat's Torah portion" },
    { key: "omer",          label: "🌾 Omer Count",         sub: "At nightfall during the 49 days" },
    { key: "shabbatDigest", label: "📋 Shabbat Digest",     sub: "Friday 8 AM · Parasha, candle lighting & week's holidays" },
    { key: "yahrzeit",      label: "🕯 Yahrtzeit",          sub: "7 AM on each Yahrtzeit day" },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 8000,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        }}
      />

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 8001,
        background: "var(--surface)",
        borderRadius: "22px 22px 0 0",
        border: "1px solid var(--border)",
        borderBottom: "none",
        maxHeight: "82dvh",
        display: "flex",
        flexDirection: "column",
        animation: "drawerSlideUp 0.28s cubic-bezier(0.34,1.2,0.64,1) both",
      }}>
        <style>{`
          @keyframes drawerSlideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes annPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
            50%       { box-shadow: 0 0 0 4px rgba(239,68,68,0.12); }
          }
        `}</style>

        {/* Handle + header */}
        <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 14px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: (anyActive || preview.length > 0) ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                border: `1px solid ${(anyActive || preview.length > 0) ? "rgba(212,168,67,0.4)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke={(anyActive || preview.length > 0) ? "#d4a843" : "var(--text-muted)"} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Notifications</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {preview.length > 0
                    ? `${preview.length} unread announcement${preview.length > 1 ? "s" : ""}`
                    : anyActive ? "Reminders are active" : "All reminders off"}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "var(--elevated)", border: "1px solid var(--border)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", fontSize: 14,
              }}
            >✕</button>
          </div>

          {notifBlocked && (
            <div style={{
              marginBottom: 10, padding: "9px 13px", borderRadius: 10,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 15 }}>🔕</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>Notifications blocked</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Enable in your browser settings to receive reminders</div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, paddingBottom: 32 }}>

          {/* ── What's New ── */}
          {preview.length > 0 && (
            <div style={{ padding: "4px 16px 12px" }}>
              {/* Section label */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#ef4444",
                    animation: "annPulse 2s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                    WHAT'S NEW
                  </span>
                </div>
                <button
                  onClick={onViewAllAnnouncements}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
                    fontSize: 11, fontWeight: 700, color: "#d4a843",
                    display: "flex", alignItems: "center", gap: 3,
                  }}
                >
                  View all
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d4a843" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              {/* Announcement cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {preview.map((ann) => {
                  const isExpanded = expandedId === ann.id;
                  return (
                    <div
                      key={ann.id}
                      onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                      style={{
                        borderRadius: 14, overflow: "hidden", cursor: "pointer",
                        background: "var(--elevated)",
                        border: "1px solid var(--border)",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px" }}>
                        {/* Emoji badge */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: "rgba(212,168,67,0.1)",
                          border: "1px solid rgba(212,168,67,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18,
                        }}>
                          {ann.emoji}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Unread dot + title row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: "#ef4444", flexShrink: 0,
                            }} />
                            <span style={{
                              fontSize: 13, fontWeight: 700,
                              color: "var(--text-primary)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {ann.title}
                            </span>
                          </div>

                          {/* Body — clipped unless expanded */}
                          <div style={{
                            fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: isExpanded ? undefined : 2,
                            WebkitBoxOrient: "vertical" as const,
                            whiteSpace: isExpanded ? "pre-wrap" : undefined,
                          }}>
                            {ann.body}
                          </div>
                        </div>

                        {/* Time + chevron */}
                        <div style={{
                          display: "flex", flexDirection: "column", alignItems: "flex-end",
                          gap: 4, flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            {formatRelative(ann.sentAt)}
                          </span>
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                          >
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {unreadAnnouncements.length > 3 && (
                  <button
                    onClick={onViewAllAnnouncements}
                    style={{
                      width: "100%", padding: "9px", borderRadius: 12,
                      background: "rgba(212,168,67,0.07)",
                      border: "1px dashed rgba(212,168,67,0.3)",
                      cursor: "pointer",
                      fontSize: 12, fontWeight: 700, color: "#d4a843",
                    }}
                  >
                    +{unreadAnnouncements.length - 3} more announcements →
                  </button>
                )}
              </div>

              {/* Divider before reminders section */}
              <div style={{ height: 1, background: "var(--border)", margin: "14px 0 2px" }} />
            </div>
          )}

          {/* Lead time picker */}
          <div style={{ padding: preview.length > 0 ? "0 16px 10px" : "4px 16px 10px" }}>
            <div style={{
              borderRadius: 14, border: "1px solid var(--border)",
              background: "var(--elevated)", padding: "12px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Reminder lead time</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Minutes warning before each event</div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {LEAD_TIME_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      onClick={() => onUpdateLeadTime(mins)}
                      style={{
                        width: 36, height: 30, borderRadius: 8, border: "1px solid",
                        borderColor: leadTime === mins ? "#d4a843" : "var(--border)",
                        background: leadTime === mins ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                        color: leadTime === mins ? "#d4a843" : "var(--text-muted)",
                        fontSize: 11, fontWeight: leadTime === mins ? 700 : 500,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Push notification subscribe row */}
          {pushSupported && (
            <div style={{ margin: "0 16px 16px" }}>
              <div style={{ padding: "0 0 8px" }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                  COMMUNITY PUSH
                </span>
              </div>
              <div style={{
                borderRadius: 14, border: pushSubscribed ? "1px solid rgba(212,168,67,0.35)" : "1px solid var(--border)",
                background: pushSubscribed ? "rgba(212,168,67,0.06)" : "var(--elevated)",
                overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px" }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: pushSubscribed ? "#d4a843" : "var(--text-primary)" }}>
                      📢 Community Announcements
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                      {pushSubscribed ? "Push notifications enabled — you'll be notified of new announcements" : "Get OS push notifications when admins broadcast"}
                    </div>
                  </div>
                  <button
                    disabled={pushLoading || pushPending}
                    onClick={async () => {
                      setPushPending(true);
                      if (pushSubscribed) { await onUnsubscribePush?.(); }
                      else { await onSubscribePush?.(); }
                      setPushPending(false);
                    }}
                    style={{
                      padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: "1px solid",
                      borderColor: pushSubscribed ? "rgba(239,68,68,0.35)" : "rgba(212,168,67,0.45)",
                      background: pushSubscribed ? "rgba(239,68,68,0.08)" : "rgba(212,168,67,0.12)",
                      color: pushSubscribed ? "#ef4444" : "#d4a843",
                      opacity: (pushLoading || pushPending) ? 0.6 : 1,
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {(pushLoading || pushPending) ? "…" : pushSubscribed ? "Disable" : "Enable"}
                  </button>
                </div>
                {pushSubscribed && onSendTestPush && (
                  <div style={{ borderTop: "1px solid rgba(212,168,67,0.15)", padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Test that push is working</span>
                    <button
                      onClick={async () => {
                        const ok = await onSendTestPush();
                        if (ok) { setTestSent(true); setTimeout(() => setTestSent(false), 3000); }
                      }}
                      style={{
                        padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        background: testSent ? "rgba(74,222,128,0.15)" : "var(--elevated)",
                        border: `1px solid ${testSent ? "rgba(74,222,128,0.35)" : "var(--border)"}`,
                        color: testSent ? "#4ade80" : "var(--text-muted)",
                        transition: "all 0.2s",
                      }}
                    >
                      {testSent ? "✓ Sent!" : "Send Test"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reminders section label */}
          <div style={{ padding: "0 16px 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
              REMINDERS
            </span>
          </div>

          {/* Toggle rows */}
          <div style={{ margin: "0 16px", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
            {ROWS.map(({ key, label, sub }, i) => (
              <div key={key}>
                {i > 0 && <div style={{ height: 1, background: "var(--border)" }} />}
                <Row
                  label={label}
                  sub={subtitle(key, sub)}
                  right={
                    <Toggle
                      on={notifPrefs[key]}
                      onToggle={() => handleToggle(key, !notifPrefs[key])}
                      disabled={notifBlocked || notifUnsupported || pendingKey === key}
                    />
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
