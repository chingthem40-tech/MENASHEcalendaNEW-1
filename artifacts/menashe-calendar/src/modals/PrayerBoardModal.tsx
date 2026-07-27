import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

interface Props { onClose: () => void; userName?: string; isAdmin?: boolean; }

export interface PrayerRequest {
  id: string;
  userId: string | null;
  name: string;
  isAnonymous: boolean;
  text: string;
  category: string;
  adminResponse: string;
  status: "pending" | "approved" | "removed";
  pinned: boolean;
  submittedAt: string;
  amens: number;
}

const AMENS_KEY = "menashe-prayer-amens-cast";
const CATEGORIES = ["Healing", "Blessing", "Aliyah", "Family", "Livelihood", "Community", "Gratitude", "Protection", "Other"];

const CAT_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  "Healing":    { bg: "rgba(74,222,128,0.12)",  color: "#4ade80", emoji: "💚" },
  "Blessing":   { bg: "rgba(212,168,67,0.13)",  color: "#d4a843", emoji: "✨" },
  "Aliyah":     { bg: "rgba(22,163,74,0.12)",   color: "#4ade80", emoji: "🇮🇱" },
  "Family":     { bg: "rgba(236,72,153,0.12)",  color: "#f472b6", emoji: "👨‍👩‍👧‍👦" },
  "Livelihood": { bg: "rgba(99,102,241,0.13)",  color: "#818cf8", emoji: "🌾" },
  "Community":  { bg: "rgba(255,99,31,0.13)",   color: "#ff8a5c", emoji: "🫂" },
  "Gratitude":  { bg: "rgba(251,191,36,0.13)",  color: "#fbbf24", emoji: "🙏" },
  "Protection": { bg: "rgba(139,92,246,0.13)",  color: "#a78bfa", emoji: "🛡" },
  "Other":      { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", emoji: "✡" },
};

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(ms / 3_600_000);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(ms / 86_400_000);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function loadCastAmens(): Set<string> {
  try { const r = localStorage.getItem(AMENS_KEY); if (r) return new Set(JSON.parse(r)); } catch {}
  return new Set();
}
function saveCastAmens(s: Set<string>) {
  try { localStorage.setItem(AMENS_KEY, JSON.stringify([...s])); } catch {}
}
function emptyForm(userName = "") {
  return { name: userName, isAnonymous: false, text: "", category: "Blessing" };
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  letterSpacing: "0.06em", marginBottom: 5, display: "block",
};

export default function PrayerBoardModal({ onClose, userName = "", isAdmin = false }: Props) {
  const { t } = useLanguage();

  const [requests, setRequests]       = useState<PrayerRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [castAmens, setCastAmens]     = useState<Set<string>>(loadCastAmens);
  const [view, setView]               = useState<"board" | "submit" | "admin">("board");
  const [form, setForm]               = useState(() => emptyForm(userName));
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [adminFilter, setAdminFilter] = useState<"all" | "pending" | "approved" | "removed">("all");
  const [responseId, setResponseId]   = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCat, setFilterCat]     = useState("All");
  const [amenLoading, setAmenLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prayer-requests");
      if (res.ok) setRequests(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function submitRequest() {
    if (!form.text.trim()) { setSubmitError("Please write your prayer request."); return; }
    setSubmitError("");
    setSubmitting(true);
    const id = `pr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const displayName = form.isAnonymous ? "Anonymous" : (form.name.trim() || "Anonymous");
    try {
      const res = await fetch("/api/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: displayName, isAnonymous: form.isAnonymous, text: form.text.trim(), category: form.category }),
      });
      if (!res.ok) { setSubmitError("Failed to submit. Please try again."); return; }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function castAmen(id: string) {
    if (castAmens.has(id) || amenLoading === id) return;
    setAmenLoading(id);
    try {
      const res = await fetch(`/api/prayer-requests/${id}/amen`, { method: "POST" });
      if (res.ok) {
        const { amens } = await res.json();
        setRequests(prev => prev.map(r => r.id === id ? { ...r, amens } : r));
        const next = new Set(castAmens); next.add(id);
        setCastAmens(next); saveCastAmens(next);
      }
    } catch {}
    setAmenLoading(null);
  }

  async function patchRequest(id: string, patch: { status?: "pending" | "approved" | "removed"; pinned?: boolean; adminResponse?: string }) {
    try {
      const res = await fetch(`/api/prayer-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated: PrayerRequest = await res.json();
        setRequests(prev => prev.map(r => r.id === id ? updated : r));
      }
    } catch {}
  }

  function approve(id: string) { patchRequest(id, { status: "approved" }); }
  function removeReq(id: string) { patchRequest(id, { status: "removed" }); setDeleteConfirm(null); }
  function togglePin(id: string) {
    const req = requests.find(r => r.id === id);
    if (req) patchRequest(id, { pinned: !req.pinned });
  }
  async function saveResponse(id: string) {
    await patchRequest(id, { adminResponse: responseText });
    setResponseId(null); setResponseText("");
  }

  const pending   = requests.filter(r => r.status === "pending");
  const adminList = adminFilter === "all" ? requests : requests.filter(r => r.status === adminFilter);

  const approved = useMemo(() => {
    let list = requests.filter(r => r.status === "approved");
    if (filterCat !== "All") list = list.filter(r => r.category === filterCat);
    const pinned = list.filter(r => r.pinned);
    const rest   = list.filter(r => !r.pinned).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return [...pinned, ...rest];
  }, [requests, filterCat]);

  // ── Submit view ────────────────────────────────────────────────────────────
  if (view === "submit") return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button onClick={() => { setView("board"); setSubmitted(false); setForm(emptyForm(userName)); setSubmitError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>🙏 {t.prayerBoardSubmitTitle}</div>
          <div />
        </div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🕍</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Prayer Submitted</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 6 }}>
              Your prayer request is <strong style={{ color: "#d4a843" }}>pending review</strong>.<br />
              The admin will approve it for the community board.
            </div>
            <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 18, color: "#d4a843", margin: "20px 0" }}>יְהִי רָצוֹן</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>May it be G-d's will</div>
            <button className="btn-gold" style={{ padding: "12px 32px", fontSize: 14, fontWeight: 700 }}
              onClick={() => { setView("board"); setSubmitted(false); setForm(emptyForm(userName)); fetchRequests(); }}>
              Back to Prayer Board
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t.prayerBoardCategory}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CATEGORIES.map(cat => {
                  const cs = CAT_STYLE[cat];
                  const active = form.category === cat;
                  return (
                    <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        background: active ? cs.bg : "var(--elevated)",
                        border: active ? `1px solid ${cs.color}` : "1px solid var(--border)",
                        color: active ? cs.color : "var(--text-muted)", transition: "all 0.15s",
                      }}>{cs.emoji} {cat}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>YOUR PRAYER REQUEST <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.6 }}
                value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Share your prayer request with the Bnei Menashe community…" maxLength={1000} />
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{form.text.length}/1000</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 14px", background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                  style={{ accentColor: "#d4a843", width: 16, height: 16 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.isAnonymous ? "#d4a843" : "var(--text-primary)" }}>🔒 Submit Anonymously</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Your name will not appear on the community board</div>
                </div>
              </label>
            </div>

            {!form.isAnonymous && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>YOUR NAME (optional)</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Leave blank to appear as 'Anonymous'" />
              </div>
            )}

            {submitError && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>⚠️ {submitError}</div>}

            <button className="btn-gold" style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 800, marginBottom: 10, opacity: (!form.text.trim() || submitting) ? 0.6 : 1 }}
              onClick={submitRequest} disabled={!form.text.trim() || submitting}>
              {submitting ? "Submitting…" : "🙏 Submit Prayer Request"}
            </button>
            <button onClick={() => setView("board")} className="btn-close-full">Cancel</button>
          </>
        )}
      </div>
    </div>
  );

  // ── Admin panel ────────────────────────────────────────────────────────────
  if (view === "admin") return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => setView("board")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Board</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>🙏 Moderate Prayers</div>
          <div />
        </div>

        <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#d4a843", fontWeight: 600 }}>⚡ Admin — {requests.length} total · {pending.length} pending review</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Approve, respond, pin, or remove community prayer requests</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginBottom: 14 }}>
          {(["all", "pending", "approved", "removed"] as const).map(f => {
            const counts: Record<string, number> = { all: requests.length, pending: pending.length, approved: requests.filter(r => r.status === "approved").length, removed: requests.filter(r => r.status === "removed").length };
            return (
              <button key={f} onClick={() => setAdminFilter(f)}
                style={{
                  padding: "8px 0", borderRadius: 10, fontSize: 10, fontWeight: 800, cursor: "pointer",
                  background: adminFilter === f ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                  border: adminFilter === f ? "1px solid rgba(212,168,67,0.4)" : "1px solid var(--border)",
                  color: adminFilter === f ? "#d4a843" : "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: ".04em",
                }}>
                {f === "pending" ? `⏳ ${counts[f]}` : f === "approved" ? `✅ ${counts[f]}` : f === "removed" ? `🗑 ${counts[f]}` : `All ${counts[f]}`}
              </button>
            );
          })}
        </div>

        {adminList.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>No items in this filter.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {[...adminList].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(req => {
              const cs = CAT_STYLE[req.category] ?? CAT_STYLE["Other"];
              const statusColors: Record<string, string> = { pending: "#d4a843", approved: "#4ade80", removed: "#94a3b8" };
              return (
                <div key={req.id} style={{ borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: cs.bg, border: `1px solid ${cs.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cs.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: statusColors[req.status] ?? "#94a3b8", letterSpacing: ".08em" }}>{req.status.toUpperCase()}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: cs.color, background: cs.bg, borderRadius: 4, padding: "1px 5px" }}>{req.category}</span>
                          {req.pinned && <span style={{ fontSize: 9, color: "#d4a843" }}>📌 PINNED</span>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                          {req.isAnonymous ? "🔒 Anonymous" : req.name} · {fmtRelative(req.submittedAt)}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{req.text}</div>
                        {req.adminResponse && (
                          <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                            <span style={{ color: "#d4a843", fontWeight: 700 }}>Pastoral response: </span>{req.adminResponse}
                          </div>
                        )}
                        {responseId === req.id && (
                          <div style={{ marginTop: 8 }}>
                            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.5, fontSize: 12 }}
                              value={responseText} onChange={e => setResponseText(e.target.value)}
                              placeholder="Write a pastoral blessing or response…" autoFocus />
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <button onClick={() => saveResponse(req.id)} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#d4a843" }}>Save Response</button>
                              <button onClick={() => { setResponseId(null); setResponseText(""); }} style={{ padding: "7px 10px", borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, padding: "8px 12px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                    {req.status !== "approved" && (
                      <button onClick={() => approve(req.id)} style={{ flex: 1, padding: "6px", borderRadius: 8, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", cursor: "pointer", fontSize: 10, fontWeight: 800, color: "#4ade80" }}>✓ Approve</button>
                    )}
                    <button onClick={() => togglePin(req.id)} style={{ flex: 1, padding: "6px", borderRadius: 8, background: req.pinned ? "rgba(212,168,67,0.15)" : "var(--elevated)", border: req.pinned ? "1px solid rgba(212,168,67,0.35)" : "1px solid var(--border)", cursor: "pointer", fontSize: 10, fontWeight: 800, color: req.pinned ? "#d4a843" : "var(--text-muted)" }}>
                      {req.pinned ? "📌 Unpin" : "📌 Pin"}
                    </button>
                    <button onClick={() => { setResponseId(req.id); setResponseText(req.adminResponse); }} style={{ flex: 1, padding: "6px", borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", cursor: "pointer", fontSize: 10, fontWeight: 800, color: "#818cf8" }}>✍ Respond</button>
                    {deleteConfirm === req.id ? (
                      <button onClick={() => removeReq(req.id)} style={{ flex: 1, padding: "6px", borderRadius: 8, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 10, fontWeight: 800, color: "#ef4444" }}>CONFIRM</button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(req.id)} style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 700 }}>🗑</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={() => setView("board")} className="btn-close-full">Done</button>
      </div>
    </div>
  );

  // ── Public board ───────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>🙏 {t.prayerBoardTitle}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Community prayers &amp; blessings</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && (
              <button onClick={() => setView("admin")}
                style={{ padding: "7px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: "pointer", background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)", color: "#d4a843" }}>
                {pending.length > 0 ? `⚡ ${pending.length} pending` : "⚡ Admin"}
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 16, background: "linear-gradient(135deg, #0f1e38, #1a1a2a)", border: "1px solid rgba(212,168,67,0.2)", textAlign: "center" }}>
          <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 20, color: "#d4a843", marginBottom: 4 }}>שְׁמַע יְהוָה קוֹלִי אֶקְרָא</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>"Hear, O Lord, my voice when I call" — Tehillim 27:7</div>
        </div>

        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 8, marginBottom: 14, scrollbarWidth: "none" }}>
          {["All", ...CATEGORIES].map(cat => {
            const cs = CAT_STYLE[cat];
            const active = filterCat === cat;
            return (
              <button key={cat} onClick={() => setFilterCat(cat)}
                style={{
                  padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
                  background: active ? (cs?.bg ?? "rgba(212,168,67,0.12)") : "var(--elevated)",
                  border: active ? `1px solid ${cs?.color ?? "#d4a843"}` : "1px solid var(--border)",
                  color: active ? (cs?.color ?? "#d4a843") : "var(--text-muted)",
                }}>
                {cs ? `${cs.emoji} ` : ""}{cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🙏</div>
            Loading community prayers…
          </div>
        ) : approved.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🕍</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              {filterCat !== "All" ? `No ${filterCat} prayers yet` : "No prayers yet"}
            </div>
            <div style={{ fontSize: 13 }}>Be the first to share a prayer request<br />with the Bnei Menashe community.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {approved.map(req => {
              const cs = CAT_STYLE[req.category] ?? CAT_STYLE["Other"];
              const hasAmen = castAmens.has(req.id);
              return (
                <div key={req.id} style={{ borderRadius: 16, background: "var(--card)", border: req.pinned ? "1px solid rgba(212,168,67,0.3)" : "1px solid var(--border)", overflow: "hidden" }}>
                  {req.pinned && (
                    <div style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.06))", padding: "5px 14px", borderBottom: "1px solid rgba(212,168,67,0.15)", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 10 }}>📌</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#d4a843", letterSpacing: ".06em" }}>PINNED BY ADMIN</span>
                    </div>
                  )}
                  <div style={{ padding: "14px 14px 10px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: cs.bg, border: `1px solid ${cs.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{cs.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: cs.color, background: cs.bg, borderRadius: 4, padding: "1px 6px" }}>{req.category}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{req.isAnonymous ? "🔒 Anonymous" : req.name}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>· {fmtRelative(req.submittedAt)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{req.text}</div>
                        {req.adminResponse && (
                          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.18)" }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "#d4a843", letterSpacing: ".06em", marginBottom: 3 }}>✡ PASTORAL BLESSING</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{req.adminResponse}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => castAmen(req.id)} disabled={hasAmen || amenLoading === req.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: hasAmen ? "default" : "pointer",
                        background: hasAmen ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                        border: hasAmen ? "1px solid rgba(212,168,67,0.4)" : "1px solid var(--border)",
                        color: hasAmen ? "#d4a843" : "var(--text-muted)",
                        transition: "all 0.2s", opacity: amenLoading === req.id ? 0.6 : 1,
                      }}>
                      <span>{hasAmen ? "🙏" : "🤲"}</span>
                      <span>{t.prayerBoardAmen}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: hasAmen ? "#d4a843" : "var(--text-secondary)" }}>{req.amens}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button className="btn-gold" style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 800, marginBottom: 8 }}
          onClick={() => { setView("submit"); setSubmitted(false); }}>
          🙏 Share a Prayer Request
        </button>
        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
