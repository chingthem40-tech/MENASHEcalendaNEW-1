import { useState, useEffect, useMemo } from "react";

interface Props { onClose: () => void; }

export interface CommunityEvent {
  id: string;
  emoji: string;
  title: string;
  description: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM or ""
  location: string;
  category: string;
  pinned: boolean;
}

const STORAGE_KEY = "menashe-community-events";

const CATEGORIES = [
  "Shabbat", "Torah Class", "Community Gathering", "Aliyah", "Prayer", "Celebration", "Youth", "Women", "Lifecycle", "Other",
];

const EMOJI_OPTIONS = [
  "🕍","🕯","📖","🌟","✡","🙏","🎉","🫂","🌿","📅","🏛","🎓","🌾","🎊","🤝","🇮🇱","🕎","📜","🎵","🍷","🌸","🥂","🎯","💎","🔔","🏠","🌐","👨‍👩‍👧‍👦",
];

const CAT_COLORS: Record<string, string> = {
  "Shabbat":              "rgba(212,168,67,0.15)",
  "Torah Class":          "rgba(139,92,246,0.15)",
  "Community Gathering":  "rgba(255,99,31,0.15)",
  "Aliyah":               "rgba(22,163,74,0.15)",
  "Prayer":               "rgba(99,102,241,0.15)",
  "Celebration":          "rgba(236,72,153,0.15)",
  "Youth":                "rgba(59,130,246,0.15)",
  "Women":                "rgba(236,72,153,0.12)",
  "Lifecycle":            "rgba(212,168,67,0.12)",
  "Other":                "rgba(100,116,139,0.15)",
};

const CAT_DOT: Record<string, string> = {
  "Shabbat":              "#d4a843",
  "Torah Class":          "#a78bfa",
  "Community Gathering":  "#ff6320",
  "Aliyah":               "#4ade80",
  "Prayer":               "#818cf8",
  "Celebration":          "#f472b6",
  "Youth":                "#60a5fa",
  "Women":                "#f472b6",
  "Lifecycle":            "#d4a843",
  "Other":                "#64748b",
};

function loadEvents(): CommunityEvent[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return DEFAULT_EVENTS;
}
function saveEvents(ev: CommunityEvent[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ev)); } catch {}
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function fmtDate(dateStr: string, timeStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!timeStr) return dayLabel;
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${dayLabel} · ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ev = new Date(dateStr + "T12:00:00");
  return Math.round((ev.getTime() - today.getTime()) / 86_400_000);
}

function relativeBadge(dateStr: string): { label: string; color: string } {
  const d = daysUntil(dateStr);
  if (d < 0) return { label: "Past", color: "#64748b" };
  if (d === 0) return { label: "Today!", color: "#4ade80" };
  if (d === 1) return { label: "Tomorrow", color: "#d4a843" };
  if (d <= 7) return { label: `In ${d} days`, color: "#a78bfa" };
  if (d <= 30) return { label: `In ${d} days`, color: "var(--text-muted)" };
  return { label: `In ${d} days`, color: "var(--text-muted)" };
}

const today = todayStr();
const DEFAULT_EVENTS: CommunityEvent[] = [
  {
    id: "default-1", emoji: "🕯", title: "Shabbat Dinner — Community Hall",
    description: "Join us for a warm community Shabbat dinner. All are welcome. Bring your family and friends.",
    date: (() => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7 || 7); return d.toISOString().slice(0, 10); })(),
    time: "18:30", location: "Community Hall", category: "Shabbat", pinned: true,
  },
  {
    id: "default-2", emoji: "🎓", title: "Weekly Torah Class",
    description: "Join Rav for weekly parasha study and discussion, suitable for all levels.",
    date: (() => { const d = new Date(); d.setDate(d.getDate() + (3 - d.getDay() + 7) % 7 || 7); return d.toISOString().slice(0, 10); })(),
    time: "20:00", location: "Online / Zoom", category: "Torah Class", pinned: false,
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  letterSpacing: "0.06em", marginBottom: 5, display: "block",
};

function emptyForm(): Omit<CommunityEvent, "id"> {
  return { emoji: "🕍", title: "", description: "", date: today, time: "", location: "", category: "Shabbat", pinned: false };
}

export default function EventsModal({ onClose, isAdmin = false }: Props & { isAdmin?: boolean }) {
  const [events, setEvents] = useState<CommunityEvent[]>(loadEvents);
  const [view, setView] = useState<"feed" | "admin" | "form">("feed");
  const [form, setForm] = useState<Omit<CommunityEvent, "id">>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => { saveEvents(events); }, [events]);

  function openForm(ev?: CommunityEvent) {
    if (ev) {
      setForm({ emoji: ev.emoji, title: ev.title, description: ev.description, date: ev.date, time: ev.time, location: ev.location, category: ev.category, pinned: ev.pinned });
      setEditId(ev.id);
    } else { setForm(emptyForm()); setEditId(null); }
    setView("form");
  }

  function saveForm() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    if (editId) {
      setEvents(prev => prev.map(e => e.id === editId ? { ...form, id: editId } : e));
    } else {
      setEvents(prev => [...prev, { ...form, id: `evt-${Date.now()}` }]);
    }
    setSaving(false);
    setEditId(null);
    setView("admin");
  }

  function deleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
  }

  const { upcoming, past } = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const pinned = sorted.filter(e => e.pinned && daysUntil(e.date) >= 0);
    const notPinned = sorted.filter(e => !e.pinned && daysUntil(e.date) >= 0);
    return {
      upcoming: [...pinned, ...notPinned],
      past: sorted.filter(e => daysUntil(e.date) < 0).reverse(),
    };
  }, [events]);

  // Group upcoming events by month
  const grouped = useMemo(() => {
    const map: Record<string, CommunityEvent[]> = {};
    for (const ev of upcoming) {
      const d = new Date(ev.date + "T12:00:00");
      const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [upcoming]);


  // ── Form ───────────────────────────────────────────────────────────────────
  if (view === "form") return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button onClick={() => setView("admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{editId ? "✏️ Edit Event" : "➕ New Event"}</div>
          <button className="btn-gold" style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10, opacity: saving || !form.title.trim() ? 0.6 : 1 }}
            onClick={saveForm} disabled={saving || !form.title.trim()}>Save</button>
        </div>

        {/* Emoji */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>ICON</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                style={{ width: 36, height: 36, borderRadius: 8, fontSize: 17, cursor: "pointer",
                  background: form.emoji === e ? "rgba(212,168,67,0.2)" : "var(--elevated)",
                  border: form.emoji === e ? "2px solid #d4a843" : "1px solid var(--border)" }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>EVENT TITLE <span style={{ color: "#ef4444" }}>*</span></label>
          <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Community Shabbat Dinner" />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }}
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Details about this event…" />
        </div>

        {/* Date + Time row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>DATE <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="date" style={inputStyle} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>TIME (optional)</label>
            <input type="time" style={inputStyle} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>LOCATION</label>
          <input style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Community Hall, Zoom, etc." />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>CATEGORY</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                style={{
                  padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: form.category === cat ? CAT_COLORS[cat] || "rgba(212,168,67,0.15)" : "var(--elevated)",
                  border: form.category === cat ? `1px solid ${CAT_DOT[cat] || "#d4a843"}` : "1px solid var(--border)",
                  color: form.category === cat ? (CAT_DOT[cat] || "#d4a843") : "var(--text-muted)",
                  transition: "all 0.15s",
                }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Pin toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 14px", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
              style={{ accentColor: "#d4a843", width: 16, height: 16 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: form.pinned ? "#d4a843" : "var(--text-primary)" }}>📌 Pin to top of calendar</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Important events always appear first</div>
            </div>
          </label>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 10 }}>PREVIEW</div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: CAT_COLORS[form.category] || "rgba(212,168,67,0.1)", border: `1px solid ${CAT_DOT[form.category] || "#d4a843"}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{form.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 3 }}>{form.title || "Event Title"}</div>
              {form.date && <div style={{ fontSize: 11, color: "#d4a843", marginBottom: 2 }}>📅 {fmtDate(form.date, form.time)}</div>}
              {form.location && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>📍 {form.location}</div>}
            </div>
          </div>
        </div>

        <button onClick={() => setView("admin")} className="btn-close-full">Cancel</button>
      </div>
    </div>
  );

  // ── Admin list ─────────────────────────────────────────────────────────────
  if (view === "admin") return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => setView("feed")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Feed</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>🗓 Manage Events</div>
          <button className="btn-gold" style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10 }} onClick={() => openForm()}>+ Add</button>
        </div>

        <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#d4a843", fontWeight: 600 }}>⚡ Admin Mode — {events.length} event{events.length !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Changes save instantly to the community calendar</div>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 13 }}>No events yet.<br />Tap + Add to create the first event.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[...events].sort((a, b) => a.date.localeCompare(b.date)).map(ev => {
              const rb = relativeBadge(ev.date);
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: CAT_COLORS[ev.category] || "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ev.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: rb.color }}>{rb.label}</span>
                      {ev.pinned && <span style={{ fontSize: 10, color: "#d4a843" }}>📌</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>📅 {fmtDate(ev.date, ev.time)}{ev.location ? ` · 📍 ${ev.location}` : ""}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openForm(ev)} style={{ padding: "4px 7px", borderRadius: 6, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>EDIT</button>
                    {deleteConfirm === ev.id ? (
                      <button onClick={() => deleteEvent(ev.id)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 700 }}>CONFIRM</button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(ev.id)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 700 }}>DEL</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={() => setView("feed")} className="btn-close-full">Done</button>
      </div>
    </div>
  );

  // ── Public feed ─────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
              🗓 Community Events
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Upcoming events & gatherings</div>
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

        {/* Next upcoming event hero */}
        {upcoming.length > 0 && (
          <div style={{
            marginBottom: 16, borderRadius: 18, overflow: "hidden",
            background: "linear-gradient(135deg, #0f1e38 0%, #1a2a1a 100%)",
            border: "1px solid rgba(212,168,67,0.25)",
          }}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#d4a843", marginBottom: 8 }}>NEXT EVENT</div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: CAT_COLORS[upcoming[0].category] || "rgba(212,168,67,0.1)", border: `1px solid ${CAT_DOT[upcoming[0].category] || "#d4a843"}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  {upcoming[0].emoji}
                </div>
                <div style={{ flex: 1 }}>
                  {upcoming[0].pinned && <div style={{ fontSize: 10, color: "#d4a843", marginBottom: 3 }}>📌 Featured</div>}
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 5 }}>{upcoming[0].title}</div>
                  <div style={{ fontSize: 12, color: "#d4a843", marginBottom: 3 }}>📅 {fmtDate(upcoming[0].date, upcoming[0].time)}</div>
                  {upcoming[0].location && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>📍 {upcoming[0].location}</div>}
                  {upcoming[0].description && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>{upcoming[0].description}</div>
                  )}
                </div>
              </div>
              {(() => { const rb = relativeBadge(upcoming[0].date); return (
                <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,0.3)", border: `1px solid ${rb.color}44` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: rb.color, display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: rb.color }}>{rb.label}</span>
                </div>
              ); })()}
            </div>
          </div>
        )}

        {/* Month-grouped upcoming events */}
        {upcoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>No upcoming events</div>
            <div style={{ fontSize: 13 }}>Community events and gatherings<br />will appear here when scheduled.</div>
          </div>
        ) : (
          Object.entries(grouped).map(([month, evs]) => (
            <div key={month} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 8, paddingLeft: 2 }}>
                {month.toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {evs.map(ev => {
                  const rb = relativeBadge(ev.date);
                  const isFirst = ev.id === upcoming[0].id;
                  if (isFirst) return null; // already shown in hero
                  return (
                    <div key={ev.id} style={{
                      borderRadius: 16, overflow: "hidden",
                      border: ev.pinned ? "1px solid rgba(212,168,67,0.3)" : "1px solid var(--border)",
                      background: ev.pinned ? "linear-gradient(135deg, rgba(212,168,67,0.05), rgba(20,18,5,0.6))" : "var(--card)",
                    }}>
                      <div style={{ padding: "13px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: CAT_COLORS[ev.category] || "rgba(212,168,67,0.1)", border: `1px solid ${CAT_DOT[ev.category] || "#d4a843"}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{ev.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800, letterSpacing: ".06em",
                              color: CAT_DOT[ev.category] || "#d4a843",
                              background: CAT_COLORS[ev.category] || "rgba(212,168,67,0.12)",
                              borderRadius: 4, padding: "2px 6px",
                            }}>{ev.category.toUpperCase()}</span>
                            {ev.pinned && <span style={{ fontSize: 10, color: "#d4a843" }}>📌</span>}
                            <span style={{ fontSize: 10, color: rb.color, marginLeft: "auto", fontWeight: 700 }}>{rb.label}</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: "#d4a843", marginBottom: ev.location ? 2 : 0 }}>📅 {fmtDate(ev.date, ev.time)}</div>
                          {ev.location && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>📍 {ev.location}</div>}
                          {ev.description && (
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>{ev.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Past events collapsible */}
        {past.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowPast(p => !p)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 13, fontWeight: 700 }}
            >
              <span>🕐 Past Events ({past.length})</span>
              <span style={{ fontSize: 14, transition: "transform 0.2s", transform: showPast ? "rotate(90deg)" : "none" }}>›</span>
            </button>
            {showPast && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {past.map(ev => (
                  <div key={ev.id} style={{ padding: "10px 14px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)", opacity: 0.65, display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 18 }}>{ev.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>📅 {fmtDate(ev.date, ev.time)}{ev.location ? ` · 📍 ${ev.location}` : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer admin — only visible to administrator */}
        {isAdmin && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <button onClick={() => setView("admin")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", opacity: 0.5, padding: "6px 12px" }}>⚙ Admin</button>
          </div>
        )}

        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
