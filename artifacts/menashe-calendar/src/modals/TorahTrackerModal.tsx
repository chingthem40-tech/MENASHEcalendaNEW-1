import { useState, useMemo, useEffect } from "react";
import {
  fetchTorahTrackerEntries,
  saveTorahTrackerEntry,
  deleteTorahTrackerEntry,
  fetchTorahTrackerGoal,
  saveTorahTrackerGoal,
} from "../lib/userApi";
import { HDate, HebrewCalendar, flags } from "@hebcal/core";

interface Props { onClose: () => void; }

export interface StudyEntry {
  id: string;
  date: string;
  subject: string;
  description: string;
  duration: number;
  notes: string;
}

const STORAGE_KEY = "menashe-torah-tracker";
const GOAL_KEY    = "menashe-torah-goal";

const SUBJECTS = ["Parasha", "Gemara", "Mishna", "Halacha", "Tanach", "Mussar", "Prayer", "Other"];

const SUBJECT_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  "Parasha":  { bg: "rgba(212,168,67,0.15)",  color: "#d4a843", emoji: "📜" },
  "Gemara":   { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa", emoji: "📖" },
  "Mishna":   { bg: "rgba(99,102,241,0.15)",  color: "#818cf8", emoji: "📚" },
  "Halacha":  { bg: "rgba(22,163,74,0.15)",   color: "#4ade80", emoji: "⚖" },
  "Tanach":   { bg: "rgba(251,191,36,0.13)",  color: "#fbbf24", emoji: "✡" },
  "Mussar":   { bg: "rgba(236,72,153,0.13)",  color: "#f472b6", emoji: "🌱" },
  "Prayer":   { bg: "rgba(74,222,128,0.12)",  color: "#4ade80", emoji: "🙏" },
  "Other":    { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", emoji: "📝" },
};

// ── Badges ────────────────────────────────────────────────────────────────────
interface Badge { id: string; emoji: string; label: string; sub: string; earned: (streak: number, sessions: number, totalMins: number) => boolean; }
const BADGES: Badge[] = [
  { id: "streak3",    emoji: "🌿", label: "First Fruits",   sub: "3-day streak",    earned: (s) => s >= 3 },
  { id: "streak7",    emoji: "⭐", label: "Sheva",          sub: "7-day streak",    earned: (s) => s >= 7 },
  { id: "streak30",   emoji: "🏆", label: "Chodesh",        sub: "30-day streak",   earned: (s) => s >= 30 },
  { id: "streak100",  emoji: "👑", label: "Ba'al Yisgaber", sub: "100-day streak",  earned: (s) => s >= 100 },
  { id: "sessions10", emoji: "🎯", label: "First Steps",    sub: "10 sessions",     earned: (_s, n) => n >= 10 },
  { id: "sessions50", emoji: "🥇", label: "Talmid",         sub: "50 sessions",     earned: (_s, n) => n >= 50 },
  { id: "hours10",    emoji: "📖", label: "10 Hours",       sub: "600 min total",   earned: (_s, _n, m) => m >= 600 },
  { id: "hours50",    emoji: "🌟", label: "50 Hours",       sub: "3,000 min total", earned: (_s, _n, m) => m >= 3000 },
  { id: "hours100",   emoji: "🎓", label: "Torah Scholar",  sub: "6,000 min total", earned: (_s, _n, m) => m >= 6000 },
];

// ── Goal presets ──────────────────────────────────────────────────────────────
const GOAL_PRESETS = [
  { label: "15m/day", mins: 105, sub: "~1.75h/week — Light daily study" },
  { label: "30m/day", mins: 210, sub: "~3.5h/week — Regular learner" },
  { label: "1h/day",  mins: 420, sub: "~7h/week — Dedicated student" },
  { label: "2h/day",  mins: 840, sub: "~14h/week — Full-time learner" },
];

// ── Parasha helper ────────────────────────────────────────────────────────────
function getThisWeekParasha(): string | null {
  try {
    const today = new Date();
    const end   = new Date(today); end.setDate(end.getDate() + 7);
    const events = HebrewCalendar.calendar({
      sedrot: true, noHolidays: true, il: true,
      start: today, end,
    });
    const ev = events.find(e => (e.getFlags() & flags.PARSHA_HASHAVUA) !== 0);
    if (!ev) return null;
    return ev.render("en").replace(/^Parashat\s+/, "").replace(/^Parashah\s+/, "");
  } catch { return null; }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }

function dateRange(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const yStr = (() => { const y = new Date(); y.setDate(y.getDate() - 1); return y.toISOString().slice(0, 10); })();
  if (dateStr === todayStr()) return "Today";
  if (dateStr === yStr) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function calcStreak(entries: StudyEntry[]): number {
  const days = new Set(entries.map(e => e.date));
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function sumMinutes(entries: StudyEntry[], days: number): number {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
  return entries.filter(e => new Date(e.date + "T12:00:00") >= cutoff).reduce((s, e) => s + e.duration, 0);
}

function weekStart(): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // Sunday
  return d;
}

function sumMinsThisWeek(entries: StudyEntry[]): number {
  const ws = weekStart();
  return entries.filter(e => new Date(e.date + "T12:00:00") >= ws).reduce((s, e) => s + e.duration, 0);
}

function loadEntries(): StudyEntry[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return SAMPLE_ENTRIES;
}
function saveEntries(list: StudyEntry[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {} }

function loadGoal(): number {
  try { const r = localStorage.getItem(GOAL_KEY); if (r) return parseInt(r, 10) || 0; } catch {} return 0;
}
function saveGoal(mins: number) { try { localStorage.setItem(GOAL_KEY, String(mins)); } catch {} }

const SAMPLE_ENTRIES: StudyEntry[] = [
  { id: "s1", date: todayStr(), subject: "Parasha", description: "Parashat Nasso — Numbers 4–7", duration: 30, notes: "Studied the Birkat Kohanim section." },
  { id: "s2", date: (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })(), subject: "Gemara", description: "Brachot 5a–5b", duration: 45, notes: "Discussion of yissurin and their spiritual meaning." },
  { id: "s3", date: (() => { const d = new Date(); d.setDate(d.getDate()-2); return d.toISOString().slice(0,10); })(), subject: "Mishna", description: "Pirkei Avot 2:1–5", duration: 20, notes: "" },
  { id: "s4", date: (() => { const d = new Date(); d.setDate(d.getDate()-3); return d.toISOString().slice(0,10); })(), subject: "Halacha", description: "Laws of Shabbat — Shmirat Shabbat", duration: 25, notes: "" },
  { id: "s5", date: (() => { const d = new Date(); d.setDate(d.getDate()-5); return d.toISOString().slice(0,10); })(), subject: "Tanach", description: "Tehillim 119", duration: 15, notes: "Recited with kavvanah." },
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

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120];

function emptyForm() { return { date: todayStr(), subject: "Parasha", description: "", duration: 30, notes: "" }; }

// ── SVG circular progress ─────────────────────────────────────────────────────
function CircleProgress({ pct, size = 80, stroke = 8, color = "#d4a843" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, pct) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

export default function TorahTrackerModal({ onClose }: Props) {
  const [entries, setEntries]           = useState<StudyEntry[]>(loadEntries);
  const [goal, setGoal]                 = useState<number>(loadGoal);
  const [view, setView]                 = useState<"dashboard" | "log" | "history" | "goal-setup">("dashboard");
  const [form, setForm]                 = useState(emptyForm());
  const [saved, setSaved]               = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState(false);
  const [customGoal, setCustomGoal]     = useState(false);
  const [customGoalVal, setCustomGoalVal] = useState(60);

  const thisWeekParasha = useMemo(() => getThisWeekParasha(), []);

  // Sync from server on open
  useEffect(() => {
    fetchTorahTrackerEntries().then((serverEntries) => {
      if (serverEntries.length > 0) {
        setEntries(serverEntries);
        saveEntries(serverEntries);
      }
    }).catch(() => {});
    fetchTorahTrackerGoal().then((serverGoal) => {
      if (serverGoal > 0) {
        setGoal(serverGoal);
        saveGoal(serverGoal);
      }
    }).catch(() => {});
  }, []);

  function persist(list: StudyEntry[]) { setEntries(list); saveEntries(list); }

  function submitLog() {
    if (!form.description.trim()) return;
    const newEntry: StudyEntry = { ...form, id: `se-${Date.now()}` };
    persist([newEntry, ...entries]);
    saveTorahTrackerEntry(newEntry).catch(() => {});
    setSaved(true);
  }

  function deleteEntry(id: string) {
    persist(entries.filter(e => e.id !== id));
    deleteTorahTrackerEntry(id).catch(() => {});
    setDeleteConfirm(null);
  }

  function applyGoal(mins: number) {
    setGoal(mins);
    saveGoal(mins);
    saveTorahTrackerGoal(mins).catch(() => {});
    setView("dashboard");
    setCustomGoal(false);
  }

  const streak        = useMemo(() => calcStreak(entries), [entries]);
  const weekMins      = useMemo(() => sumMinutes(entries, 7), [entries]);
  const monthMins     = useMemo(() => sumMinutes(entries, 30), [entries]);
  const thisWeekMins  = useMemo(() => sumMinsThisWeek(entries), [entries]);
  const totalMins     = useMemo(() => entries.reduce((s, e) => s + e.duration, 0), [entries]);
  const totalSessions = entries.length;

  const earnedBadges = useMemo(() => BADGES.filter(b => b.earned(streak, totalSessions, totalMins)), [streak, totalSessions, totalMins]);

  const last28 = useMemo(() => dateRange(28), []);
  const dayMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) map[e.date] = (map[e.date] || 0) + e.duration;
    return map;
  }, [entries]);

  const subjectBreakdown = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const map: Record<string, number> = {};
    for (const e of entries) if (new Date(e.date + "T12:00:00") >= cutoff) map[e.subject] = (map[e.subject] || 0) + e.duration;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const totalMonthMins = subjectBreakdown.reduce((s, [, m]) => s + m, 0);

  const grouped = useMemo(() => {
    const map: Record<string, StudyEntry[]> = {};
    for (const e of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [entries]);

  function heatColor(mins: number): string {
    if (!mins) return "rgba(255,255,255,0.04)";
    if (mins < 20) return "rgba(212,168,67,0.2)";
    if (mins < 45) return "rgba(212,168,67,0.45)";
    if (mins < 90) return "rgba(212,168,67,0.7)";
    return "rgba(212,168,67,0.95)";
  }

  // ── Goal setup view ───────────────────────────────────────────────────────
  if (view === "goal-setup") return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={() => setView("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>🎯 Set Weekly Goal</div>
          <div />
        </div>

        <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 12, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.18)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Setting a weekly Torah study goal helps you stay consistent and track your progress. It won't reset until you change it.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {GOAL_PRESETS.map(p => (
            <button key={p.label} onClick={() => applyGoal(p.mins)}
              style={{
                padding: "14px 16px", borderRadius: 14, textAlign: "left", cursor: "pointer",
                background: goal === p.mins ? "rgba(212,168,67,0.1)" : "var(--card)",
                border: goal === p.mins ? "1px solid rgba(212,168,67,0.5)" : "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: goal === p.mins ? "#d4a843" : "var(--text-primary)" }}>{p.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{p.sub}</div>
              </div>
              {goal === p.mins && <span style={{ color: "#d4a843", fontSize: 18 }}>✓</span>}
            </button>
          ))}

          {/* Custom */}
          <button onClick={() => setCustomGoal(g => !g)}
            style={{
              padding: "14px 16px", borderRadius: 14, textAlign: "left", cursor: "pointer",
              background: customGoal ? "rgba(212,168,67,0.08)" : "var(--card)",
              border: customGoal ? "1px solid rgba(212,168,67,0.4)" : "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: customGoal ? "#d4a843" : "var(--text-primary)" }}>✏ Custom</div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{customGoal ? "▲" : "▼"}</span>
          </button>
          {customGoal && (
            <div style={{ padding: "14px", borderRadius: 12, background: "var(--elevated)", border: "1px solid var(--border)" }}>
              <label style={labelStyle}>WEEKLY MINUTES</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" style={{ ...inputStyle, flex: 1 }} min={15} max={2400}
                  value={customGoalVal} onChange={e => setCustomGoalVal(Math.max(15, parseInt(e.target.value) || 15))}
                  placeholder="e.g. 300" />
                <button className="btn-gold" style={{ padding: "10px 16px", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap" }}
                  onClick={() => applyGoal(customGoalVal)}>Set</button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>= {fmtDuration(customGoalVal)} per week (~{fmtDuration(Math.round(customGoalVal / 7))} per day)</div>
            </div>
          )}
        </div>

        {goal > 0 && (
          <button onClick={() => applyGoal(0)} style={{ width: "100%", padding: "10px", borderRadius: 12, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
            Remove Goal
          </button>
        )}
      </div>
    </div>
  );

  // ── Log session ───────────────────────────────────────────────────────────
  if (view === "log") return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button onClick={() => { setView("dashboard"); setSaved(false); setForm(emptyForm()); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>📝 Log Study Session</div>
          <div />
        </div>

        {saved ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🌟</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Session Logged!</div>
            <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 18, color: "#d4a843", margin: "16px 0 6px" }}>כָּל הַמְּלַמֵּד תּוֹרָה</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 20 }}>"All who study Torah" — every session counts</div>
            {streak > 1 && (
              <div style={{ marginBottom: 12, padding: "10px 20px", borderRadius: 12, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)", display: "inline-block" }}>
                <span style={{ fontSize: 18 }}>🔥</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#d4a843", marginLeft: 6 }}>{streak}-day streak!</span>
              </div>
            )}
            {/* New badge unlocked? */}
            {(() => {
              const newBadge = BADGES.find(b => b.earned(streak, totalSessions, totalMins) && !BADGES.slice(0, BADGES.indexOf(b)).some(pb => pb.id === b.id));
              const justEarned = earnedBadges[earnedBadges.length - 1];
              if (justEarned) return (
                <div style={{ marginBottom: 20, padding: "12px 20px", borderRadius: 12, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.25)", display: "inline-block" }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{justEarned.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#d4a843" }}>Badge: {justEarned.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{justEarned.sub}</div>
                </div>
              );
              return null;
            })()}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <button className="btn-gold" style={{ padding: "12px 32px", fontSize: 14, fontWeight: 700 }}
                onClick={() => { setView("dashboard"); setSaved(false); setForm(emptyForm()); }}>View Dashboard</button>
              <button onClick={() => { setSaved(false); setForm(emptyForm()); }}
                style={{ padding: "10px", borderRadius: 12, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Log Another Session
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Subject */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>SUBJECT</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SUBJECTS.map(s => {
                  const ss = SUBJECT_STYLE[s];
                  const active = form.subject === s;
                  return (
                    <button key={s} onClick={() => setForm(f => ({ ...f, subject: s }))}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        background: active ? ss.bg : "var(--elevated)",
                        border: active ? `1px solid ${ss.color}` : "1px solid var(--border)",
                        color: active ? ss.color : "var(--text-muted)", transition: "all 0.15s",
                      }}>{ss.emoji} {s}</button>
                  );
                })}
              </div>
            </div>

            {/* What did you study */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>WHAT DID YOU STUDY? <span style={{ color: "#ef4444" }}>*</span></label>

              {/* Parasha auto-suggestion */}
              {form.subject === "Parasha" && thisWeekParasha && !form.description && (
                <button onClick={() => setForm(f => ({ ...f, description: `Parashat ${thisWeekParasha}` }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                    padding: "7px 12px", borderRadius: 10, cursor: "pointer",
                    background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.3)",
                    fontSize: 12, fontWeight: 700, color: "#d4a843",
                  }}>
                  <span>📜</span>
                  <span>This week: Parashat {thisWeekParasha}</span>
                  <span style={{ fontSize: 10, color: "rgba(212,168,67,0.7)" }}>↗ tap to fill</span>
                </button>
              )}

              <input style={inputStyle} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={`e.g. ${SUBJECT_STYLE[form.subject].emoji} ${form.subject === "Parasha" ? `Parashat ${thisWeekParasha || "Beha'alotcha"}` : form.subject === "Gemara" ? "Brachot 5a–6b" : form.subject === "Mishna" ? "Pirkei Avot 2:1" : "Your topic"}`} />
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>HOW LONG? (minutes)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {DURATION_PRESETS.map(d => (
                  <button key={d} onClick={() => { setForm(f => ({ ...f, duration: d })); setCustomDuration(false); }}
                    style={{
                      padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      background: form.duration === d && !customDuration ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                      border: form.duration === d && !customDuration ? "1px solid rgba(212,168,67,0.5)" : "1px solid var(--border)",
                      color: form.duration === d && !customDuration ? "#d4a843" : "var(--text-muted)",
                    }}>{d < 60 ? `${d}m` : `${d / 60}h`}</button>
                ))}
                <button onClick={() => setCustomDuration(true)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: customDuration ? "rgba(212,168,67,0.15)" : "var(--elevated)",
                    border: customDuration ? "1px solid rgba(212,168,67,0.5)" : "1px solid var(--border)",
                    color: customDuration ? "#d4a843" : "var(--text-muted)",
                  }}>✏ Custom</button>
              </div>
              {customDuration && (
                <input type="number" style={inputStyle} value={form.duration} min={1} max={480}
                  onChange={e => setForm(f => ({ ...f, duration: Math.min(480, Math.max(1, parseInt(e.target.value) || 1)) }))}
                  placeholder="Enter minutes" />
              )}
            </div>

            {/* Date */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>DATE</label>
              <input type="date" style={inputStyle} value={form.date} max={todayStr()}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>NOTES (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical", lineHeight: 1.5 }}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Key insights, questions, or takeaways…" />
            </div>

            <button className="btn-gold" style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 800, marginBottom: 10, opacity: !form.description.trim() ? 0.6 : 1 }}
              onClick={submitLog} disabled={!form.description.trim()}>
              ✓ Log Session ({fmtDuration(form.duration)})
            </button>
            <button onClick={() => setView("dashboard")} className="btn-close-full">Cancel</button>
          </>
        )}
      </div>
    </div>
  );

  // ── History view ──────────────────────────────────────────────────────────
  if (view === "history") return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={() => setView("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)" }}>← Dashboard</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>📋 Study History</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{totalSessions} sessions · {fmtDuration(totalMins)} total</div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)", fontSize: 13 }}>No sessions logged yet.</div>
        ) : (
          Object.entries(grouped).map(([date, dayEntries]) => (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>{fmtDate(date).toUpperCase()}</span>
                <span>{fmtDuration(dayEntries.reduce((s, e) => s + e.duration, 0))}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dayEntries.map(entry => {
                  const ss = SUBJECT_STYLE[entry.subject] || SUBJECT_STYLE["Other"];
                  return (
                    <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: ss.bg, border: `1px solid ${ss.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{ss.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: ss.color, background: ss.bg, borderRadius: 4, padding: "1px 5px" }}>{entry.subject}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>⏱ {fmtDuration(entry.duration)}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{entry.description}</div>
                        {entry.notes && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.4 }}>{entry.notes}</div>}
                      </div>
                      {deleteConfirm === entry.id ? (
                        <button onClick={() => deleteEntry(entry.id)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>DEL</button>
                      ) : (
                        <button onClick={() => setDeleteConfirm(entry.id)} style={{ padding: "4px 7px", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "none", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <button onClick={() => setView("dashboard")} className="btn-close-full">Back to Dashboard</button>
      </div>
    </div>
  );

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const goalPct = goal > 0 ? thisWeekMins / goal : 0;
  const goalOver = goalPct >= 1;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>📚 Torah Tracker</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Your daily learning journey</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Hebrew quote */}
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 14, background: "linear-gradient(135deg, #0f1e38, #1a1a2a)", border: "1px solid rgba(212,168,67,0.2)", textAlign: "center" }}>
          <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 18, color: "#d4a843", marginBottom: 3 }}>וְהָגִיתָ בּוֹ יוֹמָם וָלַיְלָה</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>"Meditate on it day and night" — Yehoshua 1:8</div>
        </div>

        {/* Weekly goal card */}
        {goal > 0 ? (
          <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 16, background: "var(--card)", border: goalOver ? "1px solid rgba(212,168,67,0.4)" : "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <CircleProgress pct={goalPct} size={72} stroke={7} color={goalOver ? "#d4a843" : "#818cf8"} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: goalOver ? "#d4a843" : "var(--text-primary)" }}>
                {Math.min(100, Math.round(goalPct * 100))}%
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: ".06em", marginBottom: 4 }}>THIS WEEK'S GOAL</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: goalOver ? "#d4a843" : "var(--text-primary)" }}>
                {goalOver ? "🎉 Goal reached!" : `${fmtDuration(thisWeekMins)} / ${fmtDuration(goal)}`}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {goalOver ? `${fmtDuration(thisWeekMins - goal)} ahead of target` : `${fmtDuration(goal - thisWeekMins)} remaining`}
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "var(--elevated)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, goalPct * 100)}%`, background: goalOver ? "#d4a843" : "#818cf8", borderRadius: 2, transition: "width 0.5s" }} />
              </div>
            </div>
            <button onClick={() => setView("goal-setup")} style={{ padding: "6px 10px", borderRadius: 8, background: "none", border: "1px solid var(--border)", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, flexShrink: 0 }}>Edit</button>
          </div>
        ) : (
          <button onClick={() => setView("goal-setup")}
            style={{ marginBottom: 14, width: "100%", padding: "12px 16px", borderRadius: 14, background: "rgba(99,102,241,0.06)", border: "1px dashed rgba(99,102,241,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎯</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#818cf8" }}>Set a weekly study goal</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Track your progress toward a personal target</div>
            </div>
            <span style={{ marginLeft: "auto", color: "#818cf8", fontSize: 18 }}>→</span>
          </button>
        )}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "🔥 Streak", value: streak > 0 ? `${streak}d` : "—", sub: "days", color: streak >= 7 ? "#d4a843" : streak >= 3 ? "#f97316" : "var(--text-primary)" },
            { label: "📅 This Week", value: weekMins > 0 ? fmtDuration(weekMins) : "—", sub: "studied", color: "var(--text-primary)" },
            { label: "🕰 All Time", value: totalMins > 0 ? fmtDuration(totalMins) : "—", sub: `${totalSessions} sessions`, color: "var(--text-primary)" },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "12px 8px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Achievement badges */}
        <div style={{ marginBottom: 14, padding: "14px", borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: ".08em" }}>ACHIEVEMENTS</div>
            <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 700 }}>{earnedBadges.length}/{BADGES.length} earned</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {BADGES.map(badge => {
              const isEarned = badge.earned(streak, totalSessions, totalMins);
              return (
                <div key={badge.id} title={`${badge.label} — ${badge.sub}`}
                  style={{ textAlign: "center", padding: "8px 4px", borderRadius: 12,
                    background: isEarned ? "rgba(212,168,67,0.08)" : "rgba(255,255,255,0.02)",
                    border: isEarned ? "1px solid rgba(212,168,67,0.25)" : "1px solid rgba(255,255,255,0.04)",
                    opacity: isEarned ? 1 : 0.35,
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 3, filter: isEarned ? "none" : "grayscale(1)" }}>{badge.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: isEarned ? "#d4a843" : "var(--text-muted)", lineHeight: 1.2 }}>{badge.label}</div>
                </div>
              );
            })}
          </div>
          {earnedBadges.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>Study consistently to unlock your first badge 🌿</div>
          )}
        </div>

        {/* 28-day heatmap */}
        <div style={{ marginBottom: 14, padding: "14px", borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 10 }}>LAST 28 DAYS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 4 }}>
            {last28.map(dateStr => {
              const mins = dayMap[dateStr] || 0;
              const isToday = dateStr === todayStr();
              return (
                <div key={dateStr} title={`${dateStr}: ${mins > 0 ? fmtDuration(mins) : "No study"}`}
                  style={{ aspectRatio: "1", borderRadius: 4, background: heatColor(mins), border: isToday ? "1px solid rgba(212,168,67,0.8)" : "none", cursor: "default" }} />
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Less</span>
            {["rgba(255,255,255,0.04)", "rgba(212,168,67,0.2)", "rgba(212,168,67,0.45)", "rgba(212,168,67,0.7)", "rgba(212,168,67,0.95)"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>More</span>
          </div>
        </div>

        {/* Subject breakdown */}
        {subjectBreakdown.length > 0 && (
          <div style={{ marginBottom: 14, padding: "14px", borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 12 }}>THIS MONTH — BY SUBJECT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subjectBreakdown.map(([subject, mins]) => {
                const ss = SUBJECT_STYLE[subject] || SUBJECT_STYLE["Other"];
                const pct = totalMonthMins > 0 ? Math.round((mins / totalMonthMins) * 100) : 0;
                return (
                  <div key={subject}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{ss.emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{subject}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDuration(mins)}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ss.color, minWidth: 30, textAlign: "right" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "var(--elevated)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: ss.color, borderRadius: 3, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {entries.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: ".08em" }}>RECENT SESSIONS</div>
              <button onClick={() => setView("history")} style={{ fontSize: 11, color: "#d4a843", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>View All →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.slice(0, 3).map(entry => {
                const ss = SUBJECT_STYLE[entry.subject] || SUBJECT_STYLE["Other"];
                return (
                  <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: ss.bg, border: `1px solid ${ss.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{ss.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.description}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{fmtDate(entry.date)} · ⏱ {fmtDuration(entry.duration)}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: ss.color, background: ss.bg, borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>{entry.subject}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button className="btn-gold" style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 800, marginBottom: 10 }}
          onClick={() => { setForm(emptyForm()); setSaved(false); setView("log"); }}>
          + Log Today's Learning
        </button>
        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
