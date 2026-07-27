import { useState, useMemo } from "react";
import type { Announcement, AnnouncementStatus } from "../hooks/useAnnouncements";
import { isNotifSupported } from "../hooks/useNotifications";

interface Props {
  onClose: () => void;
  announcements: Announcement[];
  onAdd: (data: Omit<Announcement, "id" | "sentAt">) => void;
  onUpdate: (id: string, patch: Partial<Announcement>) => void;
  onDelete: (id: string) => void;
  onSendNow: (ann: Announcement) => void;
  isAdmin?: boolean;
}

const EMOJI_OPTIONS = ["📢","📣","🔔","✡","🕍","🌟","📜","🙏","🎯","🫂","⚡","💬","📌","🗓","🌐","🎉","🕎","🌿","💎","🏛","📚","🔗","🕯","✨","🇮🇱","📖","🌾"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  letterSpacing: "0.06em", marginBottom: 5, display: "block",
};

function emptyForm(now: string) {
  return {
    emoji: "📢",
    title: "",
    body: "",
    scheduledAt: null as string | null,
    scheduleMode: "now" as "now" | "later",
    scheduleDateLocal: now,
    status: "sent" as AnnouncementStatus,
    pinned: false,
  };
}

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = Date.now();
  const diff = d.getTime() - now;
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;
  if (absDiff < 60_000) return "just now";
  const mins = Math.floor(absDiff / 60_000);
  if (mins < 60) return isPast ? `${mins}m ago` : `in ${mins}m`;
  const hrs = Math.floor(absDiff / 3_600_000);
  if (hrs < 24) return isPast ? `${hrs}h ago` : `in ${hrs}h`;
  const days = Math.floor(absDiff / 86_400_000);
  if (days < 7) return isPast ? `${days}d ago` : `in ${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusBadge(status: AnnouncementStatus) {
  const map: Record<AnnouncementStatus, { label: string; color: string; bg: string }> = {
    sent:      { label: "SENT",      color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    scheduled: { label: "SCHEDULED", color: "#d4a843", bg: "rgba(212,168,67,0.12)" },
    draft:     { label: "DRAFT",     color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  };
  const s = map[status];
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, letterSpacing: ".08em",
      color: s.color, background: s.bg, borderRadius: 4,
      padding: "2px 6px", flexShrink: 0,
    }}>{s.label}</span>
  );
}

export default function AnnouncementsModal({ onClose, announcements, onAdd, onUpdate, onDelete, onSendNow, isAdmin = false }: Props) {
  const [view, setView] = useState<"feed" | "admin" | "form">("feed");

  const nowStr = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [form, setForm] = useState(() => emptyForm(nowStr()));
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(
    isNotifSupported() && Notification.permission === "denied"
  );

  const sorted = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const ta = new Date(a.sentAt ?? a.scheduledAt ?? 0).getTime();
      const tb = new Date(b.sentAt ?? b.scheduledAt ?? 0).getTime();
      return tb - ta;
    });
  }, [announcements]);

  function openForm(ann?: Announcement) {
    if (ann) {
      setForm({
        emoji: ann.emoji, title: ann.title, body: ann.body,
        scheduledAt: ann.scheduledAt,
        scheduleMode: ann.scheduledAt ? "later" : "now",
        scheduleDateLocal: ann.scheduledAt ? ann.scheduledAt.slice(0, 16) : nowStr(),
        status: ann.status, pinned: ann.pinned,
      });
      setEditId(ann.id);
    } else {
      setForm(emptyForm(nowStr()));
      setEditId(null);
    }
    setView("form");
  }

  async function handleSave(intent: "draft" | "send") {
    if (!form.title.trim()) return;
    setSaving(true);

    let status: AnnouncementStatus;
    let scheduledAt: string | null = null;

    if (intent === "draft") {
      status = "draft";
    } else if (form.scheduleMode === "later") {
      // Scheduled for a future time
      scheduledAt = new Date(form.scheduleDateLocal).toISOString();
      status = "scheduled";
    } else {
      // Send immediately → mark as sent (hook fires notification)
      status = "sent";
    }

    const data: Omit<Announcement, "id" | "sentAt"> = {
      emoji: form.emoji, title: form.title, body: form.body,
      scheduledAt, status, pinned: form.pinned,
    };

    if (editId) {
      onUpdate(editId, { ...data, sentAt: status === "sent" ? new Date().toISOString() : undefined });
      if (status === "sent") {
        const ann = announcements.find(a => a.id === editId);
        if (ann) onSendNow({ ...ann, ...data });
      }
    } else {
      const ann = onAdd(data);
      if (status === "sent" && ann) onSendNow(ann as Announcement);
    }

    setSaving(false);
    setEditId(null);
    setView("admin");
  }


  // ── Compose / Edit form ─────────────────────────────────────────────────────
  if (view === "form") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
          <div className="modal-handle" />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <button onClick={() => setView("admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Back</button>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
              {editId ? "✏️ Edit" : "📢 New Announcement"}
            </div>
            <div />
          </div>

          {/* Emoji picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>ICON</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ width: 36, height: 36, borderRadius: 8, fontSize: 17, cursor: "pointer",
                    background: form.emoji === e ? "rgba(212,168,67,0.2)" : "var(--elevated)",
                    border: form.emoji === e ? "2px solid #d4a843" : "1px solid var(--border)", transition: "all 0.15s" }}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>TITLE <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={inputStyle} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Community Shabbat this week" />
          </div>

          {/* Body */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>MESSAGE</label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.55 }}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Full announcement text visible to all members…"
            />
          </div>

          {/* Schedule / Send mode */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>DELIVERY</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {(["now", "later"] as const).map(mode => (
                <button key={mode} onClick={() => setForm(f => ({ ...f, scheduleMode: mode }))}
                  style={{
                    padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    background: form.scheduleMode === mode ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                    border: form.scheduleMode === mode ? "2px solid #d4a843" : "1px solid var(--border)",
                    color: form.scheduleMode === mode ? "#d4a843" : "var(--text-muted)",
                  }}
                >
                  {mode === "now" ? "⚡ Send Now" : "🗓 Schedule"}
                </button>
              ))}
            </div>
            {form.scheduleMode === "later" && (
              <div>
                <label style={labelStyle}>SEND DATE & TIME</label>
                <input
                  type="datetime-local"
                  style={{ ...inputStyle }}
                  value={form.scheduleDateLocal}
                  onChange={e => setForm(f => ({ ...f, scheduleDateLocal: e.target.value }))}
                  min={nowStr()}
                />
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 14px", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <input type="checkbox" checked={form.pinned}
                onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                style={{ accentColor: "#d4a843", width: 16, height: 16 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.pinned ? "#d4a843" : "var(--text-primary)" }}>📌 Pin to top of feed</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Pinned announcements always appear first</div>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div style={{ marginBottom: 20, padding: 14, borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 10 }}>PREVIEW</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {form.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{form.title || "Announcement Title"}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{form.body || "Your message will appear here."}</div>
              </div>
            </div>
          </div>

          {notifBlocked && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
              ⚠️ Browser notifications are blocked. Enable them in your browser settings so announcements fire on time.
            </div>
          )}

          {/* Action buttons */}
          <button
            className="btn-gold"
            style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 800, marginBottom: 10, opacity: saving || !form.title.trim() ? 0.6 : 1 }}
            onClick={() => handleSave("send")}
            disabled={saving || !form.title.trim()}
          >
            {form.scheduleMode === "now" ? "⚡ Send Now" : "🗓 Schedule Announcement"}
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving || !form.title.trim()}
            style={{ width: "100%", padding: 12, fontSize: 13, fontWeight: 700, marginBottom: 10,
              background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 12,
              color: "var(--text-muted)", cursor: "pointer", opacity: !form.title.trim() ? 0.5 : 1 }}
          >
            💾 Save as Draft
          </button>
          <button onClick={() => setView("admin")} className="btn-close-full">Cancel</button>
        </div>
      </div>
    );
  }

  // ── Admin list ──────────────────────────────────────────────────────────────
  if (view === "admin") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
          <div className="modal-handle" />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button onClick={() => setView("feed")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Feed</button>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>📣 Manage Announcements</div>
            <button className="btn-gold" style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10 }} onClick={() => openForm()}>+ New</button>
          </div>

          <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#d4a843", fontWeight: 600 }}>⚡ Admin Mode — {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Changes are saved and broadcast immediately</div>
          </div>

          {announcements.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 13 }}>No announcements yet.<br />Tap + New to compose the first one.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[...announcements].sort((a, b) => {
                const ta = new Date(a.sentAt ?? a.scheduledAt ?? 0).getTime();
                const tb = new Date(b.sentAt ?? b.scheduledAt ?? 0).getTime();
                return tb - ta;
              }).map(ann => (
                <div key={ann.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {ann.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                      {statusBadge(ann.status)}
                      {ann.pinned && <span style={{ fontSize: 9, color: "#d4a843" }}>📌</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ann.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                      {ann.status === "sent" && ann.sentAt && `Sent ${formatRelative(ann.sentAt)}`}
                      {ann.status === "scheduled" && ann.scheduledAt && `Sends ${formatRelative(ann.scheduledAt)}`}
                      {ann.status === "draft" && "Draft — not sent"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    {ann.status === "draft" && (
                      <button onClick={() => onSendNow(ann)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#d4a843" }}>SEND</button>
                    )}
                    <button onClick={() => openForm(ann)} style={{ padding: "4px 7px", borderRadius: 6, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>EDIT</button>
                    {deleteConfirm === ann.id ? (
                      <button onClick={() => { onDelete(ann.id); setDeleteConfirm(null); }} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 700 }}>CONFIRM</button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(ann.id)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 700 }}>DEL</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setView("feed")} className="btn-close-full">Done</button>
        </div>
      </div>
    );
  }

  // ── Public feed ─────────────────────────────────────────────────────────────
  const pinned = sorted.filter(a => a.pinned && a.status === "sent");
  const regular = sorted.filter(a => !a.pinned && a.status === "sent");
  const upcoming = sorted.filter(a => a.status === "scheduled");
  const allVisible = [...pinned, ...regular];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div
              style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}
            >
              📢 Announcements
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Community notices & updates</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && view === "feed" && (
              <button
                onClick={() => setView("admin")}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}
              >
                <span style={{ fontSize: 12 }}>⚙️</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Admin</span>
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Upcoming scheduled banner */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🗓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#d4a843" }}>{upcoming.length} Upcoming Announcement{upcoming.length > 1 ? "s" : ""}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Next: {upcoming[0].title} — {formatRelative(upcoming[0].scheduledAt)}
              </div>
            </div>
          </div>
        )}

        {/* Feed */}
        {allVisible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>No announcements yet</div>
            <div style={{ fontSize: 13 }}>Community notices and updates<br />from the admin will appear here.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {allVisible.map(ann => (
              <div key={ann.id} style={{
                borderRadius: 16, overflow: "hidden",
                border: ann.pinned ? "1px solid rgba(212,168,67,0.35)" : "1px solid var(--border)",
                background: ann.pinned
                  ? "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(30,24,10,0.6))"
                  : "var(--card)",
              }}>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                      background: ann.pinned ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.05)",
                      border: ann.pinned ? "1px solid rgba(212,168,67,0.25)" : "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                    }}>
                      {ann.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {ann.pinned && <span style={{ fontSize: 11, color: "#d4a843" }}>📌 Pinned</span>}
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                          {formatRelative(ann.sentAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.3 }}>
                        {ann.title}
                      </div>
                      {ann.body && (
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                          {ann.body}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer admin — only visible to administrator */}
        {isAdmin && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <button onClick={() => setView("admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: 0.5, padding: "6px 12px" }}>
              ⚙ Admin
            </button>
          </div>
        )}

        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
