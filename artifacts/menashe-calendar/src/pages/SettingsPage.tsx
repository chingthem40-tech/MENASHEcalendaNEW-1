import { useState, useCallback, useEffect, memo } from "react";
import { useUser, useOrganization } from "../auth";
import { HDate } from "@hebcal/core";
import { Location } from "../lib/locations";
import { NotificationPrefs, LeadTime, LEAD_TIME_OPTIONS } from "../hooks/useNotifications";
import { useLanguage } from "../context/LanguageContext";
import { hebrewDayNumeral } from "../lib/hebrewCalendar";
import { getYahrzeitEntries, getNextYahrzeit, YartzeitEntry } from "../lib/yahrzeit";
import TranslationEditorModal from "../modals/TranslationEditorModal";
import { getAuthToken } from "../lib/authToken";

const BIRTHDAY_KEY = "menashe-my-birthday";

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });
  return res;
}

function AdminAlertSetup() {
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(212,168,67,0.05)", border: "1px solid rgba(212,168,67,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>🔔</span>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#d4a843", letterSpacing: "0.06em" }}>ADMIN PUSH ALERTS</div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.6 }}>
        Admin access is managed by the Menashe application. Authorized administrators are assigned server-side and do not need a separate provider dashboard.
      </div>
    </div>
  );
}

function getBirthdayCountdown(dateStr: string): { hebrewDay: number; hebrewMonth: number; hebrewYear: number; nextGreg: Date; diffDays: number } | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + "T12:00:00");
    const hd = new HDate(d);
    const curHYear = new HDate().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next = new HDate(hd.getDate(), hd.getMonth(), curHYear).greg();
    next.setHours(0, 0, 0, 0);
    if (next < today) {
      next = new HDate(hd.getDate(), hd.getMonth(), curHYear + 1).greg();
      next.setHours(0, 0, 0, 0);
    }
    return {
      hebrewDay: hd.getDate(),
      hebrewMonth: hd.getMonth(),
      hebrewYear: hd.getFullYear(),
      nextGreg: next,
      diffDays: Math.round((next.getTime() - today.getTime()) / 86400000),
    };
  } catch { return null; }
}

interface SettingsPageProps {
  theme: string;
  location: Location;
  onToggleTheme: () => void;
  onSetTheme: (theme: "dark" | "light" | "sapphire") => void;
  onLocationClick: () => void;
  onPremium: () => void;
  onTahara: () => void;
  onYartzeit: () => void;
  onBirthday: () => void;
  onCommunity: () => void;
  onCensus: () => void;
  onProfile: () => void;
  onSignOut: () => void;
  onWhatsNew: () => void;
  onFeedbackCenter: () => void;
  profileName?: string;
  profileRole?: string;
  notifPermission: NotificationPermission;
  notifPrefs: NotificationPrefs;
  leadTime: LeadTime;
  onUpdateNotifPref: (key: keyof NotificationPrefs, value: boolean) => Promise<boolean>;
  onUpdateLeadTime: (mins: LeadTime) => void;
  pushSubscribed: boolean;
  pushSupported: boolean;
  pushLoading: boolean;
  pushError: string | null;
  onSubscribePush: () => Promise<boolean>;
  onUnsubscribePush: () => void;
  onTestPush: () => Promise<boolean>;
}

function VersionFooter({ userId, versionLabel }: { userId: string; versionLabel: string }) {
  const [taps, setTaps] = useState(0);
  const [showId, setShowId] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleTap() {
    const next = taps + 1;
    setTaps(next);
    if (next >= 5) { setShowId(true); setTaps(0); }
  }

  function copyId() {
    if (!userId) return;
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ textAlign: "center", padding: "8px 16px 20px" }}>
      <div style={{ opacity: 0.4, cursor: "pointer" }} onClick={handleTap}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{versionLabel} · v1.2</div>
        <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 14, color: "var(--gold)", marginTop: 4 }}>ברוך הבא</div>
      </div>
      {showId && userId && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.5, marginBottom: 4, letterSpacing: "0.06em" }}>YOUR USER ID</div>
          <div
            onClick={copyId}
            style={{
              fontSize: 11, color: "var(--text-muted)", background: "var(--elevated)",
              border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px",
              fontFamily: "monospace", wordBreak: "break-all", cursor: "pointer",
            }}
          >
            {userId}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.45, marginTop: 4 }}>
            {copied ? "✓ Copied!" : "tap to copy"}
          </div>
        </div>
      )}
    </div>
  );
}

const SettingsPage = memo(function SettingsPage({
  theme, location,
  onToggleTheme, onSetTheme, onLocationClick, onPremium, onTahara, onYartzeit, onBirthday, onCommunity, onCensus,
  onProfile, onSignOut, onWhatsNew, onFeedbackCenter, profileName, profileRole,
  notifPermission, notifPrefs, leadTime, onUpdateNotifPref, onUpdateLeadTime,
  pushSubscribed, pushSupported, pushLoading, pushError, onSubscribePush, onUnsubscribePush, onTestPush,
}: SettingsPageProps) {
  const { user } = useUser();
  const { membership } = useOrganization();
  const isAdminUser = membership?.role === "org:admin";
  const { lang, setLang, t } = useLanguage();
  const [showHebrew, setShowHebrew] = useState(true);
  const [pendingKey, setPendingKey] = useState<keyof NotificationPrefs | null>(null);
  const [showTxEditor, setShowTxEditor] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Admin panel state ──────────────────────────────────────────────────────
  const [adminMode, setAdminMode] = useState<"none" | "panel">("none");
  const [adminTab, setAdminTab] = useState<"requests" | "users">("requests");
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActionId, setAdminActionId] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [savedBirthday, setSavedBirthday] = useState(() => {
    try { return localStorage.getItem(BIRTHDAY_KEY) ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    function refresh() {
      try { setSavedBirthday(localStorage.getItem(BIRTHDAY_KEY) ?? ""); } catch {}
    }
    window.addEventListener("menashe-birthday-updated", refresh);
    return () => window.removeEventListener("menashe-birthday-updated", refresh);
  }, []);

  const bdCountdown = getBirthdayCountdown(savedBirthday);

  const [yahrzeitEntries, setYahrzeitEntries] = useState<YartzeitEntry[]>(() => getYahrzeitEntries());

  useEffect(() => {
    function refreshYahrzeit() { setYahrzeitEntries(getYahrzeitEntries()); }
    window.addEventListener("menashe-yahrzeit-updated", refreshYahrzeit);
    return () => window.removeEventListener("menashe-yahrzeit-updated", refreshYahrzeit);
  }, []);

  const upcomingYahrzeits = yahrzeitEntries
    .map(e => ({ entry: e, next: getNextYahrzeit(e.hebrewDay, e.hebrewMonth) }))
    .filter(({ next }) => next !== null)
    .sort((a, b) => (a.next!.daysAway) - (b.next!.daysAway))
    .slice(0, 3);

  const icsUrl = `${window.location.origin}/api/calendar/ics?` + new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
    tz: location.tz,
    locationName: location.name,
    country: location.country,
    months: "12",
  }).toString();

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = icsUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [icsUrl]);
  const isLight = theme === "light";
  const notifBlocked = notifPermission === "denied";
  const notifUnsupported = typeof Notification === "undefined";

  function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
    return (
      <div
        role="switch"
        aria-checked={on}
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onToggle}
        onKeyDown={disabled ? undefined : (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(); } }}
        className="settings-toggle-track"
        style={{
          background: disabled ? "var(--elevated)" : on ? "var(--gold)" : "var(--elevated)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div
          className="settings-toggle-thumb"
          style={{
            left: on ? 21 : 3,
            background: disabled ? "var(--text-muted)" : on ? "#1a0f00" : "var(--text-muted)",
          }}
        />
      </div>
    );
  }

  function Row({ label, sub, right, onClick }: { label: string; sub?: string; right: React.ReactNode; onClick?: () => void }) {
    return (
      <div
        onClick={onClick}
        className={onClick ? "settings-row settings-row-clickable" : "settings-row"}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", cursor: onClick ? "pointer" : "default",
          transition: "background 0.15s",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </div>
        {right}
      </div>
    );
  }

  async function handleNotifToggle(key: keyof NotificationPrefs, value: boolean) {
    if (notifBlocked || notifUnsupported) return;
    setPendingKey(key);
    await onUpdateNotifPref(key, value);
    setPendingKey(null);
  }

  function notifSubtitle(key: keyof NotificationPrefs, defaultText: string): string {
    if (notifUnsupported) return "Not supported in this browser";
    if (notifBlocked) return "Blocked — enable in browser settings";
    if (notifPrefs[key] && notifPermission === "granted") return `${defaultText} · Active`;
    return defaultText;
  }

  const anyActive = notifPrefs.shabbat || notifPrefs.havdalah || notifPrefs.holiday || notifPrefs.omer || notifPrefs.prayers || notifPrefs.parasha || notifPrefs.shema;

  // ── Admin panel functions ──────────────────────────────────────────────────
  async function fetchAdminData() {
    setAdminLoading(true);
    try {
      const [reqRes, usrRes] = await Promise.all([
        adminFetch("/admin/premium-requests"),
        adminFetch("/admin/users"),
      ]);
      if (reqRes.ok) setAdminRequests(await reqRes.json());
      if (usrRes.ok) setAdminUsers(await usrRes.json());
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    setAdminActionId(userId);
    await adminFetch(`/admin/premium-requests/${userId}/approve`, { method: "PUT" });
    setAdminRequests(r => r.filter(x => x.userId !== userId));
    setSelectedRequests(s => { const n = new Set(s); n.delete(userId); return n; });
    setAdminActionId(null);
  }

  async function handleDeny(userId: string) {
    setAdminActionId(userId);
    await adminFetch(`/admin/premium-requests/${userId}/deny`, { method: "PUT" });
    setAdminRequests(r => r.filter(x => x.userId !== userId));
    setSelectedRequests(s => { const n = new Set(s); n.delete(userId); return n; });
    setAdminActionId(null);
  }

  async function handleBulkApprove() {
    const ids = Array.from(selectedRequests);
    if (ids.length === 0) return;
    setBulkProcessing(true);
    await Promise.all(ids.map(userId =>
      adminFetch(`/admin/premium-requests/${userId}/approve`, { method: "PUT" }).catch(() => {})
    ));
    setAdminRequests(r => r.filter(x => !selectedRequests.has(x.userId)));
    setSelectedRequests(new Set());
    setBulkProcessing(false);
  }

  async function handleBulkDeny() {
    const ids = Array.from(selectedRequests);
    if (ids.length === 0) return;
    setBulkProcessing(true);
    await Promise.all(ids.map(userId =>
      adminFetch(`/admin/premium-requests/${userId}/deny`, { method: "PUT" }).catch(() => {})
    ));
    setAdminRequests(r => r.filter(x => !selectedRequests.has(x.userId)));
    setSelectedRequests(new Set());
    setBulkProcessing(false);
  }

  function toggleSelectRequest(userId: string) {
    setSelectedRequests(s => {
      const n = new Set(s);
      if (n.has(userId)) n.delete(userId); else n.add(userId);
      return n;
    });
  }

  function toggleSelectAll() {
    if (selectedRequests.size === adminRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(adminRequests.map((r: any) => r.userId)));
    }
  }

  async function handleTogglePremium(userId: string, current: boolean) {
    setAdminActionId(userId);
    await adminFetch(`/admin/users/${userId}/premium`, {
      method: "PUT",
      body: JSON.stringify({ isPremium: !current }),
    });
    setAdminUsers(u => u.map(x => x.userId === userId ? { ...x, isPremium: !current } : x));
    setAdminActionId(null);
  }

  // ── Admin Panel (full-page view when authenticated) ───────────────────────
  if (adminMode === "panel" && isAdminUser) {
    return (
      <div style={{ padding: "0 0 80px" }}>
        <div className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setAdminMode("none")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", fontSize: 18, padding: "4px 8px 4px 0" }}
            >←</button>
            <div className="app-icon">⚙</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Admin Panel</div>
          </div>
          <button
            onClick={fetchAdminData}
            style={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "var(--text-muted)" }}
          >{adminLoading ? "Loading…" : "↻ Refresh"}</button>
        </div>

        <div style={{ padding: "16px 16px 0" }}>
          {/* Admin Alert Setup */}
          <AdminAlertSetup />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["requests", "users"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setAdminTab(tab)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: adminTab === tab ? "linear-gradient(135deg, #b8860b, #d4a843)" : "var(--elevated)",
                  color: adminTab === tab ? "#1a0f00" : "var(--text-secondary)",
                  border: adminTab === tab ? "none" : "1px solid var(--border)",
                }}
              >
                {tab === "requests" ? `📋 Requests ${adminRequests.length > 0 ? `(${adminRequests.length})` : ""}` : "👥 Users"}
              </button>
            ))}
          </div>

          {adminLoading && (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading…</div>
          )}

          {/* Pending Access Requests */}
          {!adminLoading && adminTab === "requests" && (
            <div>
              <div className="section-header">PENDING PREMIUM REQUESTS</div>
              {adminRequests.length === 0 ? (
                <div className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>No pending requests</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>All access requests have been reviewed.</div>
                </div>
              ) : (
                <>
                  {/* Select all bar */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", marginBottom: 8, borderRadius: 10,
                    background: "rgba(212,168,67,0.05)", border: "1px solid rgba(212,168,67,0.15)",
                  }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                      <div
                        onClick={toggleSelectAll}
                        style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          background: selectedRequests.size === adminRequests.length ? "linear-gradient(135deg, #b8860b, #d4a843)" : "var(--elevated)",
                          border: `2px solid ${selectedRequests.size > 0 ? "#d4a843" : "var(--border)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {selectedRequests.size === adminRequests.length && (
                          <span style={{ fontSize: 11, color: "#1a0f00", fontWeight: 900, lineHeight: 1 }}>✓</span>
                        )}
                        {selectedRequests.size > 0 && selectedRequests.size < adminRequests.length && (
                          <span style={{ fontSize: 14, color: "#d4a843", fontWeight: 900, lineHeight: 1, marginTop: -1 }}>−</span>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                        {selectedRequests.size === 0
                          ? "Select all"
                          : selectedRequests.size === adminRequests.length
                          ? `All ${adminRequests.length} selected`
                          : `${selectedRequests.size} of ${adminRequests.length} selected`}
                      </span>
                    </label>
                    {selectedRequests.size > 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {selectedRequests.size} selected
                      </span>
                    )}
                  </div>

                  {/* Request cards */}
                  {adminRequests.map((req: any) => {
                    const isSelected = selectedRequests.has(req.userId);
                    const isActioning = adminActionId === req.userId;
                    return (
                      <div
                        key={req.userId}
                        className="card"
                        style={{
                          padding: "14px 16px", marginBottom: 10,
                          border: isSelected ? "1.5px solid rgba(212,168,67,0.5)" : undefined,
                          background: isSelected ? "rgba(212,168,67,0.04)" : undefined,
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                          {/* Checkbox */}
                          <div
                            onClick={() => toggleSelectRequest(req.userId)}
                            style={{
                              width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 3,
                              background: isSelected ? "linear-gradient(135deg, #b8860b, #d4a843)" : "var(--elevated)",
                              border: `2px solid ${isSelected ? "#d4a843" : "var(--border)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                          >
                            {isSelected && <span style={{ fontSize: 12, color: "#1a0f00", fontWeight: 900, lineHeight: 1 }}>✓</span>}
                          </div>
                          <div style={{ fontSize: 26, lineHeight: 1 }}>{req.avatarEmoji ?? "👤"}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{req.displayName ?? "Unknown"}</div>
                            {req.congregation && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{req.congregation}{req.city ? ` · ${req.city}` : ""}</div>}
                            {req.note && <div style={{ fontSize: 12, color: req.note.toLowerCase().includes("paid") ? "#d4a843" : "var(--text-secondary)", marginTop: 4, fontStyle: "italic" }}>"{req.note}"</div>}
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                              {new Date(req.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => handleDeny(req.userId)}
                            disabled={isActioning || bulkProcessing}
                            style={{
                              flex: 1, padding: "9px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13,
                              background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444",
                              opacity: isActioning || bulkProcessing ? 0.4 : 1,
                            }}
                          >✗ Deny</button>
                          <button
                            onClick={() => handleApprove(req.userId)}
                            disabled={isActioning || bulkProcessing}
                            style={{
                              flex: 2, padding: "9px", borderRadius: 9, cursor: "pointer", fontWeight: 800, fontSize: 13,
                              background: "linear-gradient(135deg, #b8860b, #d4a843)", color: "#1a0f00", border: "none",
                              opacity: isActioning || bulkProcessing ? 0.4 : 1,
                            }}
                          >{isActioning ? "Processing…" : "✓ Approve"}</button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Bulk action bar — sticky at bottom when items selected */}
                  {selectedRequests.size > 0 && (
                    <div style={{
                      position: "sticky", bottom: 16, zIndex: 10,
                      background: "var(--card)", border: "1.5px solid rgba(212,168,67,0.4)",
                      borderRadius: 14, padding: "12px 14px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#d4a843" }}>
                        {selectedRequests.size} selected
                      </div>
                      <button
                        onClick={handleBulkDeny}
                        disabled={bulkProcessing}
                        style={{
                          padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
                          background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444",
                          opacity: bulkProcessing ? 0.5 : 1,
                        }}
                      >✗ Deny All</button>
                      <button
                        onClick={handleBulkApprove}
                        disabled={bulkProcessing}
                        style={{
                          padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13,
                          background: "linear-gradient(135deg, #b8860b, #d4a843)", color: "#1a0f00", border: "none",
                          opacity: bulkProcessing ? 0.5 : 1,
                        }}
                      >{bulkProcessing ? "Processing…" : `✓ Approve ${selectedRequests.size}`}</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* All Users */}
          {!adminLoading && adminTab === "users" && (
            <div>
              <div className="section-header">ALL USERS ({adminUsers.length})</div>
              {adminUsers.length === 0 ? (
                <div className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No users found.</div>
                </div>
              ) : adminUsers.map((user: any) => (
                <div key={user.userId} className="card" style={{ padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 24, lineHeight: 1 }}>{user.avatarEmoji ?? "👤"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.displayName ?? "Unnamed User"}
                    </div>
                    {user.congregation && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.congregation}{user.city ? ` · ${user.city}` : ""}</div>}
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                      {user.role ?? "Member"} {user.isPremium ? "· 👑 Premium" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePremium(user.userId, user.isPremium)}
                    disabled={adminActionId === user.userId}
                    style={{
                      padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
                      background: user.isPremium ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                      color: user.isPremium ? "#d4a843" : "var(--text-muted)",
                      border: `1px solid ${user.isPremium ? "rgba(212,168,67,0.4)" : "var(--border)"}`,
                      opacity: adminActionId === user.userId ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >{adminActionId === user.userId ? "…" : user.isPremium ? "👑 Premium" : "Free"}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen-enter" style={{ padding: "0 0 4px" }}>

      <div className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Benei Menashe Calendar" style={{ height: 38, width: 38, objectFit: "contain", borderRadius: 8 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>Benei Menashe</div>
            <div style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.15em", fontWeight: 700 }}>CALENDAR</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20 }}>{t.settingsTitle}</h1>

        {/* My Profile */}
        <div className="section-header">MY PROFILE</div>
        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          <div
            onClick={onProfile}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "linear-gradient(135deg, #1a3050, #2a1a40)",
              border: "1.5px solid rgba(212,168,67,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: "var(--gold)", flexShrink: 0,
            }}>
              {profileName
                ? profileName.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")
                : "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {profileName || "Set up your profile"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                {profileRole || "Tap to add your name & community role"}
              </div>
            </div>
            <span style={{ color: "var(--text-muted)" }}>›</span>
          </div>
        </div>

        {/* Location */}
        <div className="section-header">{t.settingsLocation}</div>
        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          <Row
            label={t.settingsCity}
            sub={t.settingsCityHint}
            right={<div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{location.name}</span><span style={{ color: "var(--text-muted)" }}>›</span></div>}
            onClick={onLocationClick}
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row label={t.settingsTimezone} right={<span style={{ fontSize: 13, color: "var(--text-muted)" }}>{location.tz}</span>} />
        </div>

        {/* Appearance */}
        <div className="section-header">{t.settingsAppearance}</div>
        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          {/* Theme Picker */}
          <div style={{ padding: "14px 16px 10px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Theme</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {/* Royal Midnight */}
              <button
                onClick={() => onSetTheme("dark")}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "center" }}
              >
                <div style={{
                  borderRadius: 14, overflow: "hidden", border: `2px solid ${theme === "dark" ? "#d4a843" : "transparent"}`,
                  boxShadow: theme === "dark" ? "0 0 0 1px rgba(212,168,67,0.4), 0 4px 16px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.3)",
                  transition: "all 0.2s",
                }}>
                  {/* Mini preview */}
                  <div style={{ background: "#080e1a", padding: "8px 8px 6px", height: 72, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ height: 8, borderRadius: 4, background: "linear-gradient(90deg, #d4a843, #b8860b)", width: "60%" }} />
                    <div style={{ height: 5, borderRadius: 3, background: "#1a2540", width: "90%" }} />
                    <div style={{ height: 5, borderRadius: 3, background: "#1a2540", width: "75%" }} />
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 14, borderRadius: 4, background: "#111827" }} />)}
                    </div>
                  </div>
                  <div style={{ background: "#0d1627", padding: "5px 4px", display: "flex", justifyContent: "space-around" }}>
                    {["🏠","📅","⏰","📖","⚙️"].map((ic, i) => (
                      <span key={i} style={{ fontSize: 9 }}>{ic}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, fontWeight: theme === "dark" ? 700 : 500, color: theme === "dark" ? "var(--gold)" : "var(--text-muted)" }}>
                  {theme === "dark" && "✓ "}Midnight
                </div>
              </button>

              {/* Parchment Light */}
              <button
                onClick={() => onSetTheme("light")}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "center" }}
              >
                <div style={{
                  borderRadius: 14, overflow: "hidden", border: `2px solid ${theme === "light" ? "#8B6914" : "transparent"}`,
                  boxShadow: theme === "light" ? "0 0 0 1px rgba(139,105,20,0.4), 0 4px 16px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "all 0.2s",
                }}>
                  <div style={{ background: "#F5EFE0", padding: "8px 8px 6px", height: 72, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ height: 8, borderRadius: 4, background: "linear-gradient(90deg, #8B6914, #6B4F10)", width: "60%" }} />
                    <div style={{ height: 5, borderRadius: 3, background: "#EDE4D3", width: "90%", border: "1px solid #D4C9B0" }} />
                    <div style={{ height: 5, borderRadius: 3, background: "#EDE4D3", width: "75%", border: "1px solid #D4C9B0" }} />
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 14, borderRadius: 4, background: "#EDE4D3", border: "1px solid #D4C9B0" }} />)}
                    </div>
                  </div>
                  <div style={{ background: "#EDE4D3", padding: "5px 4px", borderTop: "1px solid #D4C9B0", display: "flex", justifyContent: "space-around" }}>
                    {["🏠","📅","⏰","📖","⚙️"].map((ic, i) => (
                      <span key={i} style={{ fontSize: 9 }}>{ic}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, fontWeight: theme === "light" ? 700 : 500, color: theme === "light" ? "#8B6914" : "var(--text-muted)" }}>
                  {theme === "light" && "✓ "}Parchment
                </div>
              </button>

              {/* Deep Sapphire */}
              <button
                onClick={() => onSetTheme("sapphire")}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "center" }}
              >
                <div style={{
                  borderRadius: 14, overflow: "hidden", border: `2px solid ${theme === "sapphire" ? "#6382FF" : "transparent"}`,
                  boxShadow: theme === "sapphire" ? "0 0 0 1px rgba(99,130,255,0.4), 0 4px 16px rgba(99,130,255,0.15)" : "0 2px 8px rgba(0,0,0,0.3)",
                  transition: "all 0.2s",
                }}>
                  <div style={{ background: "#060e1e", padding: "8px 8px 6px", height: 72, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ height: 8, borderRadius: 4, background: "linear-gradient(90deg, #6382FF, #4060E0)", width: "60%" }} />
                    <div style={{ height: 5, borderRadius: 3, background: "#0c1830", width: "90%", border: "1px solid #1a2e58" }} />
                    <div style={{ height: 5, borderRadius: 3, background: "#0c1830", width: "75%", border: "1px solid #1a2e58" }} />
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 14, borderRadius: 4, background: "#0c1830", border: "1px solid #1a2e58" }} />)}
                    </div>
                  </div>
                  <div style={{ background: "#060e1e", padding: "5px 4px", borderTop: "1px solid #1a2e58", display: "flex", justifyContent: "space-around" }}>
                    {["🏠","📅","⏰","📖","⚙️"].map((ic, i) => (
                      <span key={i} style={{ fontSize: 9 }}>{ic}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: 10, fontWeight: theme === "sapphire" ? 700 : 500, color: theme === "sapphire" ? "#6382FF" : "var(--text-muted)" }}>
                  {theme === "sapphire" && "✓ "}Sapphire
                </div>
              </button>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsShowHebrew}
            right={<Toggle on={showHebrew} onToggle={() => setShowHebrew(v => !v)} />}
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsLanguage}
            sub={t.settingsLanguageHint}
            right={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>EN</span>
                <Toggle on={lang === "tk"} onToggle={() => setLang(lang === "tk" ? "en" : "tk")} />
                <span style={{ fontSize: 11, color: lang === "tk" ? "var(--gold)" : "var(--text-muted)", fontWeight: 600 }}>TK</span>
              </div>
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <button
            onClick={() => setShowTxEditor(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              background: "none", border: "none", cursor: "pointer", padding: "13px 16px",
              textAlign: "left",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t.settingsEditTranslations}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{t.settingsEditTranslationsHint}</div>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {showTxEditor && <TranslationEditorModal onClose={() => setShowTxEditor(false)} />}

        {/* Notifications */}
        <div className="section-header">{t.settingsNotifications}</div>

        {notifBlocked && (
          <div style={{
            marginBottom: 10, padding: "10px 14px", borderRadius: 10,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🔕</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>{t.settingsNotifBlocked}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.settingsNotifBlockedSub}</div>
            </div>
          </div>
        )}

        {notifPermission === "granted" && anyActive && (
          <div style={{
            marginBottom: 10, padding: "10px 14px", borderRadius: 10,
            background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🔔</span>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {[
                (notifPrefs.shabbat || notifPrefs.havdalah) && `Shabbat reminders scheduled for ${location.name}`,
                notifPrefs.shema && `Latest Shema alerts — ${leadTime} min warning daily`,
                notifPrefs.holiday && "Holiday alerts active — morning before each holiday",
                notifPrefs.parasha && "Weekly Parasha — every Friday morning",
                notifPrefs.omer && "Omer reminders at nightfall during the 49 days",
                notifPrefs.prayers && `Prayer reminders (${leadTime} min warning) for ${location.name}`,
              ].filter(Boolean).join(" · ")}
            </div>
          </div>
        )}

        {/* Lead time picker */}
        <div className="card" style={{ marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{t.settingsLeadTime}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.settingsLeadTimeHint}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {LEAD_TIME_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => onUpdateLeadTime(mins)}
                  style={{
                    width: 38, height: 32, borderRadius: 8, border: "1px solid",
                    borderColor: leadTime === mins ? "#d4a843" : "var(--border)",
                    background: leadTime === mins ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                    color: leadTime === mins ? "#d4a843" : "var(--text-muted)",
                    fontSize: 12, fontWeight: leadTime === mins ? 700 : 500,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          <Row
            label={t.settingsCandleLighting}
            sub={notifSubtitle("shabbat", `${18} min before Shabbat`)}
            right={
              <Toggle
                on={notifPrefs.shabbat}
                onToggle={() => handleNotifToggle("shabbat", !notifPrefs.shabbat)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "shabbat"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsHavdalah}
            sub={notifSubtitle("havdalah", "When Shabbat ends")}
            right={
              <Toggle
                on={notifPrefs.havdalah}
                onToggle={() => handleNotifToggle("havdalah", !notifPrefs.havdalah)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "havdalah"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsShema}
            sub={notifSubtitle("shema", `${leadTime} min warning — daily deadline`)}
            right={
              <Toggle
                on={notifPrefs.shema}
                onToggle={() => handleNotifToggle("shema", !notifPrefs.shema)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "shema"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsPrayers}
            sub={notifSubtitle("prayers", `Shacharit, Mincha & Maariv — ${leadTime} min warning`)}
            right={
              <Toggle
                on={notifPrefs.prayers}
                onToggle={() => handleNotifToggle("prayers", !notifPrefs.prayers)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "prayers"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsHolidays}
            sub={notifSubtitle("holiday", "Day before holidays")}
            right={
              <Toggle
                on={notifPrefs.holiday}
                onToggle={() => handleNotifToggle("holiday", !notifPrefs.holiday)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "holiday"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsParasha}
            sub={notifSubtitle("parasha", "Friday morning · this Shabbat's Torah portion")}
            right={
              <Toggle
                on={notifPrefs.parasha}
                onToggle={() => handleNotifToggle("parasha", !notifPrefs.parasha)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "parasha"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsOmer}
            sub={notifSubtitle("omer", "At nightfall during the 49 days")}
            right={
              <Toggle
                on={notifPrefs.omer}
                onToggle={() => handleNotifToggle("omer", !notifPrefs.omer)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "omer"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsShabbatDigest}
            sub={notifSubtitle("shabbatDigest", "Friday 8 AM · Parasha, candle lighting & week's holidays")}
            right={
              <Toggle
                on={notifPrefs.shabbatDigest}
                onToggle={() => handleNotifToggle("shabbatDigest", !notifPrefs.shabbatDigest)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "shabbatDigest"}
              />
            }
          />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row
            label={t.settingsYahrtzeit}
            sub={notifSubtitle("yahrzeit", "7 AM on each Yahrtzeit day")}
            right={
              <Toggle
                on={notifPrefs.yahrzeit}
                onToggle={() => handleNotifToggle("yahrzeit", !notifPrefs.yahrzeit)}
                disabled={notifBlocked || notifUnsupported || pendingKey === "yahrzeit"}
              />
            }
          />
        </div>

        {/* Background Push Notifications */}
        <div className="section-header">{t.settingsBgPush}</div>
        <div className="card" style={{ marginBottom: 16, padding: "16px" }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
            {pushSupported ? t.settingsBgPushDesc : t.settingsBgPushDescUnsupported}
          </div>
          {pushError && (
            <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#ef4444" }}>
              {pushError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!pushSubscribed ? (
              <button
                onClick={onSubscribePush}
                disabled={!pushSupported || pushLoading}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(212,168,67,0.4)",
                  background: "rgba(212,168,67,0.12)", color: "#d4a843", fontWeight: 700, fontSize: 14,
                  cursor: pushSupported && !pushLoading ? "pointer" : "not-allowed",
                  opacity: pushSupported && !pushLoading ? 1 : 0.5, transition: "all 0.15s",
                }}
              >
                {pushLoading ? t.settingsEnablingPush : t.settingsEnablePush}
              </button>
            ) : (
              <>
                <button
                  onClick={async () => { const ok = await onTestPush(); if (ok) { setTestSent(true); setTimeout(() => setTestSent(false), 3000); } }}
                  disabled={pushLoading}
                  style={{
                    flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(212,168,67,0.4)",
                    background: "rgba(212,168,67,0.12)", color: "#d4a843", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {testSent ? t.settingsTestSent : t.settingsTestPush}
                </button>
                <button
                  onClick={onUnsubscribePush}
                  disabled={pushLoading}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 600, fontSize: 13,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {pushLoading ? "…" : t.settingsDisablePush}
                </button>
              </>
            )}
          </div>
          {pushSubscribed && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.settingsPushActive} {location.name}</span>
            </div>
          )}
        </div>

        {/* ── Calendar Sync ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 10, marginTop: 4,
        }}>
          {/* Gold accent bar */}
          <div style={{ width: 3, height: 16, borderRadius: 2, background: "var(--gold, #d4a843)", flexShrink: 0 }} />
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Calendar Sync
          </div>
          {/* "Live" pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 20, padding: "2px 8px", marginLeft: "auto",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: "#22c55e", letterSpacing: "0.06em" }}>AUTO-SYNC</span>
          </div>
        </div>

        <div style={{
          marginBottom: 16, borderRadius: 16,
          background: "var(--card-bg, var(--elevated, rgba(255,255,255,0.04)))",
          border: "1px solid rgba(212,168,67,0.18)",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}>
          {/* Card header strip */}
          <div style={{
            background: "linear-gradient(135deg, rgba(66,133,244,0.12) 0%, rgba(212,168,67,0.08) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Calendar icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 13, flexShrink: 0,
              background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.22)",
            }}>
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="40" height="36" rx="4" fill="white" stroke="#dadce0" strokeWidth="2"/>
                <rect x="4" y="8" width="40" height="13" rx="4" fill="#4285F4"/>
                <rect x="4" y="17" width="40" height="4" fill="#4285F4"/>
                <text x="24" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4285F4" fontFamily="Arial">
                  {new Date().getDate()}
                </text>
                <rect x="14" y="4" width="4" height="9" rx="2" fill="#4285F4"/>
                <rect x="30" y="4" width="4" height="9" rx="2" fill="#4285F4"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                Bnei Menashe Sacred Calendar
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.45 }}>
                Shabbat · Holidays · Parasha · Zmanim
              </div>
            </div>
            {/* Sync indicator */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#22c55e", letterSpacing: "0.05em" }}>LIVE</span>
            </div>
          </div>

          <div style={{ padding: "14px 16px 16px" }}>
            {/* Feed URL box */}
            <div style={{
              background: "rgba(0,0,0,0.18)", borderRadius: 10, padding: "9px 12px",
              border: "1px solid rgba(255,255,255,0.07)", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.09em", marginBottom: 2 }}>CALENDAR FEED URL</div>
                <div style={{
                  fontSize: 10.5, color: "var(--text-secondary)",
                  fontFamily: "monospace", lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {icsUrl}
                </div>
              </div>
            </div>

            {/* ── Primary: Google Calendar ─────────────────────────────── */}
            <button
              onClick={() => window.open(
                `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(icsUrl)}`,
                "_blank"
              )}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                background: "linear-gradient(135deg, #4285F4 0%, #1a73e8 100%)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                marginBottom: 8,
                boxShadow: "0 4px 16px rgba(66,133,244,0.35)",
                transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* Google G logo */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#fff" d="M44.5 20H24v8.5h11.8C34.1 33.5 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l6-6C34.4 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.5-7.7 19.5-20 0-1.3-.1-2.7-.5-4z"/>
                <path fill="#fff" d="M6.3 14.7l7 5.1C15 16.4 19.1 13 24 13c3.1 0 5.8 1.1 8 2.9l6-6C34.4 6.5 29.4 4 24 4c-7.6 0-14.1 4.4-17.7 10.7z" opacity=".85"/>
              </svg>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "white", lineHeight: 1.2 }}>
                  Sync with Google Calendar
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.2 }}>
                  Subscribe · auto-updates when events change
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>

            {/* ── Secondary row: Apple + Outlook + Copy ──────────────── */}
            <div style={{ display: "flex", gap: 8 }}>
              {/* Apple Calendar */}
              <button
                onClick={() => window.open(icsUrl.replace(/^https?:\/\//, "webcal://"), "_blank")}
                style={{
                  flex: 1, padding: "10px 10px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                title="Add to Apple Calendar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-secondary)">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Apple Calendar</span>
              </button>

              {/* Outlook */}
              <button
                onClick={() => window.open(`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(icsUrl)}&name=${encodeURIComponent("Bnei Menashe Calendar")}`, "_blank")}
                style={{
                  flex: 1, padding: "10px 10px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                title="Add to Outlook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" fill="#0078D4"/>
                  <path d="M2 8h20" stroke="white" strokeWidth="1.2" opacity=".4"/>
                  <rect x="4" y="10" width="7" height="7" rx="1.5" fill="white" opacity=".9"/>
                  <circle cx="17" cy="14" r="3" fill="white" opacity=".9"/>
                  <circle cx="17" cy="14" r="1.5" fill="#0078D4"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Outlook</span>
              </button>

              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.1)"}`,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 0.18s",
                  flexShrink: 0,
                }}
                title="Copy feed URL"
              >
                {copied ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
                <span style={{ fontSize: 11, fontWeight: 700, color: copied ? "#22c55e" : "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>

            {/* Info footer */}
            <div style={{
              marginTop: 12, padding: "9px 12px",
              background: "rgba(66,133,244,0.07)", borderRadius: 9,
              border: "1px solid rgba(66,133,244,0.14)",
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>
                Events update automatically whenever Shabbat times or holidays change.
                Personalised for <strong style={{ color: "var(--text-secondary)" }}>{location.name}</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Community */}
        <div className="section-header">COMMUNITY</div>
        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          <Row label={t.settingsCommunity} sub={t.settingsCommunitySub} right={<span style={{ color: "var(--text-muted)" }}>›</span>} onClick={onCommunity} />
          <div style={{ height: 1, background: "var(--border)" }} />
          <Row label={t.settingsCensus} sub={t.settingsCensusSub} right={<span style={{ color: "var(--text-muted)" }}>›</span>} onClick={onCensus} />
        </div>

        {/* Premium */}
        <div
          onClick={onPremium}
          style={{ padding: 16, borderRadius: 14, marginBottom: 16, background: "linear-gradient(135deg, #1a2540, #0f1e38)", border: "1px solid rgba(212,168,67,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
        >
          <span style={{ fontSize: 28 }}>⭐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{t.settingsUpgrade}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.settingsUpgradeSub}</div>
          </div>
          <span style={{ color: "#d4a843", fontSize: 18 }}>›</span>
        </div>

        {/* Help & Support */}
        <div className="section-header">HELP &amp; SUPPORT</div>
        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          <div
            style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            onClick={onFeedbackCenter}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>💬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Feedback Center</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Report bugs, suggest features, share appreciation</div>
            </div>
            <span style={{ color: "#d4a843", fontSize: 18 }}>›</span>
          </div>
          <div
            style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            onClick={onFeedbackCenter}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>❓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Ask for Help</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Get support from our team</div>
            </div>
            <span style={{ color: "#d4a843", fontSize: 18 }}>›</span>
          </div>
          <div
            style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            onClick={onFeedbackCenter}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>⭐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Rate the App</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Tell us how we're doing</div>
            </div>
            <span style={{ color: "#d4a843", fontSize: 18 }}>›</span>
          </div>
        </div>

        {/* Account */}
        <div className="section-header">{t.settingsAccount}</div>
        <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
          {/* Release Notes row */}
          <div
            style={{
              padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
            onClick={onWhatsNew}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>✨</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{t.settingsWhatsNew}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{t.settingsWhatsNewSub}</div>
            </div>
            <span style={{ color: "#d4a843", fontSize: 18 }}>›</span>
          </div>

          <div style={{ padding: "14px 16px" }} onClick={onSignOut}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>{t.settingsSignOut}</div>
          </div>
        </div>

        {/* Admin button — only visible to verified admins */}
        {isAdminUser && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <button
              onClick={() => setAdminMode("panel")}
              style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 99,
                padding: "7px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
              }}
            >
              <span>🔐</span>
              <span>Admin</span>
            </button>
          </div>
        )}

        {/* Version — tap 5× to reveal User ID for admin setup */}
        <VersionFooter userId={user?.id ?? ""} versionLabel={t.settingsVersion} />
      </div>
    </div>
  );
});

export default SettingsPage;
