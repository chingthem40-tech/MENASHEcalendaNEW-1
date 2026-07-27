import { useState, useEffect } from "react";
import { HDate } from "@hebcal/core";
import { loadMikvehEntries, type MikvehEntry } from "../lib/mikvehStorage";

const STORAGE_KEY = "mikveh_calendar_entries";
const BRAND = "#41bedd";
const BRAND_DARK = "#1f86a2";

interface Props { onClose: () => void; }

function daysUntil(dateStr: string) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

function getHebrewMonthYear() {
  try { const h = new HDate(new Date()); return `${h.getMonthName()} ${h.getFullYear()}`; }
  catch { return ""; }
}

/* ── Checklist data ─────────────────────────────── */
const CHECKLIST = [
  { group: "Basic Prep", items: [
    "Hefsek Taharah made at least one week ago",
    "Bedikah made on day 1 and day 7",
    "Remove all jewelry, elastics, clips and pins",
    "Remove false teeth and removable dental apparatus",
    "Remove false eyelashes and false nails",
    "Remove band-aids and skin lotions",
    "Remove all make-up",
  ]},
  { group: "Detailed Attention", items: [
    "Brush teeth – no particles of food remaining",
    "Wash the entire body thoroughly",
    "Ears, nose, navel, underarms, back",
    "Genital area – within all folds",
    "Between fingers and toes, soles of feet",
    "Wash hair with shampoo (no conditioner)",
    "Comb all hair while still wet",
  ]},
];

/* ── Full month calendar ───────────────────────── */
function MonthCalendar({ entries, viewDate, onPrev, onNext }: {
  entries: MikvehEntry[];
  viewDate: { month: number; year: number };
  onPrev: () => void; onNext: () => void;
}) {
  const { month, year } = viewDate;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const mikvehSet = new Set<number>();
  const hefsekSet = new Set<number>();
  const completedSet = new Set<number>();

  entries.forEach(e => {
    const m = new Date(e.mikvehDate);
    if (m.getMonth() === month && m.getFullYear() === year) {
      if (e.completed) completedSet.add(m.getDate()); else mikvehSet.add(m.getDate());
    }
    const h = new Date(e.hefsekDate);
    if (h.getMonth() === month && h.getFullYear() === year) hefsekSet.add(h.getDate());
  });

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  return (
    <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: "20px", boxShadow: "0 20px 60px rgba(15,23,42,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid rgba(148,163,184,0.18)", paddingBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{monthLabel}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Interactive monthly calendar</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPrev} style={{ borderRadius: 99, background: "#f1f5f9", border: "none", padding: "8px 16px", fontWeight: 700, fontSize: 14, color: "#334155", cursor: "pointer" }}>←</button>
          <button onClick={onNext} style={{ borderRadius: 99, background: "#f1f5f9", border: "none", padding: "8px 16px", fontWeight: 700, fontSize: 14, color: "#334155", cursor: "pointer" }}>→</button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, minWidth: 320 }}>
          <thead>
            <tr>
              {dow.map(d => (
                <th key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", padding: "4px 2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, wi) => (
              <tr key={wi}>
                {w.map((day, di) => {
                  const isMikveh = day !== null && mikvehSet.has(day);
                  const isHefsek = day !== null && hefsekSet.has(day);
                  const isDone = day !== null && completedSet.has(day);
                  const isToday = day !== null && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                  let bg = "transparent";
                  let color = "#334155";
                  let fontWeight = 400;
                  if (isMikveh) { bg = "linear-gradient(180deg,rgba(65,190,221,.22),rgba(65,190,221,.08))"; color = BRAND_DARK; fontWeight = 800; }
                  else if (isDone) { bg = "linear-gradient(180deg,rgba(74,222,128,.18),rgba(74,222,128,.06))"; color = "#15803d"; fontWeight = 800; }
                  else if (isHefsek) { bg = "linear-gradient(180deg,rgba(251,191,36,.22),rgba(251,191,36,.08))"; color = "#92400e"; fontWeight = 700; }
                  else if (isToday) { bg = "rgba(65,190,221,0.08)"; color = BRAND; fontWeight = 700; }
                  return (
                    <td key={di} style={{ padding: 2 }}>
                      {day !== null ? (
                        <div style={{
                          borderRadius: 10, padding: "8px 4px", textAlign: "center",
                          background: bg, border: isToday && !isMikveh && !isDone ? `1px solid ${BRAND}40` : "1px solid transparent",
                          position: "relative",
                        }}>
                          <span style={{ fontSize: 13, fontWeight, color, display: "block" }}>{day}</span>
                          {isMikveh && <span style={{ display: "block", fontSize: 9, color: BRAND, fontWeight: 800, marginTop: 1 }}>🌙</span>}
                          {isDone && <span style={{ display: "block", fontSize: 9, color: "#16a34a", fontWeight: 800, marginTop: 1 }}>✓</span>}
                          {isHefsek && !isMikveh && !isDone && <span style={{ display: "block", fontSize: 9, color: "#d97706", fontWeight: 800, marginTop: 1 }}>◆</span>}
                        </div>
                      ) : <div />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Entry list ────────────────────────────────── */
function EntryList({ entries, onToggle, onDelete }: {
  entries: MikvehEntry[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, boxShadow: "0 20px 60px rgba(15,23,42,0.08)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>No dates saved yet</div>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Use the Tahara Calculator to calculate and save your Mikveh dates. They'll appear here as a timeline.</div>
    </div>
  );

  const sorted = [...entries].sort((a, b) => a.mikvehDate.localeCompare(b.mikvehDate));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sorted.map(entry => {
        const days = daysUntil(entry.mikvehDate);
        const isPast = days < 0;
        const mikvehGreg = new Date(entry.mikvehDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const hefsekGreg = new Date(entry.hefsekDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return (
          <div key={entry.id} style={{
            background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)",
            border: `1px solid ${entry.completed ? "rgba(74,222,128,0.3)" : isPast ? "rgba(148,163,184,0.18)" : "rgba(65,190,221,0.25)"}`,
            borderRadius: 20, padding: "16px 18px",
            boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
            opacity: entry.completed ? 0.75 : 1,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: entry.completed ? "rgba(74,222,128,0.15)" : isPast ? "#f8fafc" : `rgba(65,190,221,0.12)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {entry.completed ? "✅" : isPast ? "🕯️" : "🌙"}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Mikveh Night</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{mikvehGreg}</div>
                </div>
              </div>
              <div style={{
                padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: entry.completed ? "rgba(74,222,128,0.12)" : isPast ? "#f1f5f9" : days === 0 ? `${BRAND}20` : `${BRAND}12`,
                color: entry.completed ? "#15803d" : isPast ? "#94a3b8" : days === 0 ? BRAND_DARK : BRAND_DARK,
                border: `1px solid ${entry.completed ? "rgba(74,222,128,0.25)" : isPast ? "rgba(148,163,184,0.18)" : `${BRAND}40`}`,
              }}>
                {entry.completed ? "✓ Done" : days === 0 ? "Tonight!" : isPast ? `${Math.abs(days)}d ago` : `in ${days}d`}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#d97706", letterSpacing: "0.06em", marginBottom: 2 }}>HEFSEK TAHARA</div>
                <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{hefsekGreg}</div>
              </div>
              <div style={{ background: `rgba(65,190,221,0.08)`, border: `1px solid ${BRAND}30`, borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: BRAND_DARK, letterSpacing: "0.06em", marginBottom: 2 }}>MIKVEH</div>
                <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{mikvehGreg}</div>
                {entry.hebrewMikvehDate && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{entry.hebrewMikvehDate}</div>}
              </div>
            </div>

            {entry.note && (
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontStyle: "italic", padding: "6px 10px", background: "#f8fafc", borderRadius: 8 }}>"{entry.note}"</div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onToggle(entry.id)} style={{
                flex: 1, padding: "9px", borderRadius: 12, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700,
                background: entry.completed ? "#f1f5f9" : "rgba(65,190,221,0.1)",
                color: entry.completed ? "#64748b" : BRAND_DARK,
              }}>
                {entry.completed ? "↩ Mark Pending" : "✓ Mark Done"}
              </button>
              <button onClick={() => onDelete(entry.id)} style={{
                padding: "9px 14px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)",
                cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: "rgba(239,68,68,0.05)", color: "#ef4444",
              }}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Checklist ─────────────────────────────────── */
function ChecklistSection() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const total = CHECKLIST.reduce((a, g) => a + g.items.length, 0);
  const done = checked.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function toggle(key: string) {
    setChecked(s => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header card */}
      <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND_DARK, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>Prep checklist</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>Mikveh Prep Checklist</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Track completion across the full preparation process.</div>
          </div>
          <button onClick={() => setChecked(new Set())} style={{ borderRadius: 99, background: "#0f172a", border: "none", padding: "10px 18px", fontWeight: 700, fontSize: 13, color: "#fff", cursor: "pointer" }}>
            Reset
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ background: "#f1f5f9", borderRadius: 99, height: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_DARK})`, borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6, textAlign: "right" }}>{done} / {total} complete — {pct}%</div>
      </div>

      {/* Groups */}
      {CHECKLIST.map(group => (
        <div key={group.group} style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.06)" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>{group.group}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {group.items.map(item => {
              const key = `${group.group}:${item}`;
              const isChecked = checked.has(key);
              return (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: isChecked ? `rgba(65,190,221,0.06)` : "#f8fafc", cursor: "pointer", border: `1px solid ${isChecked ? `${BRAND}30` : "rgba(148,163,184,0.15)"}`, transition: "all 0.15s" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: isChecked ? BRAND : "white",
                    border: `2px solid ${isChecked ? BRAND : "#cbd5e1"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {isChecked && <span style={{ color: "white", fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                  <input type="checkbox" checked={isChecked} onChange={() => toggle(key)} style={{ display: "none" }} />
                  <span style={{ fontSize: 13, color: isChecked ? "#64748b" : "#334155", textDecoration: isChecked ? "line-through" : "none", lineHeight: 1.4 }}>{item}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Notes ─────────────────────────────────────── */
function NotesSection({ entries, onUpdateNote }: { entries: MikvehEntry[]; onUpdateNote: (id: string, note: string) => void }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const entriesWithNotes = entries.filter(e => e.note);

  function saveGenericNote() {
    if (!text.trim()) return;
    setSaved(true);
    setTimeout(() => { setSaved(false); setText(""); }, 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>Add a Memo</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Notes are stored privately on this device.</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          placeholder="Write your memo here…"
          style={{ width: "100%", boxSizing: "border-box", borderRadius: 16, border: "1px solid #e2e8f0", padding: "12px 14px", fontSize: 14, color: "#0f172a", outline: "none", resize: "none", fontFamily: "inherit", background: "white" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={saveGenericNote} style={{ borderRadius: 99, background: saved ? "rgba(74,222,128,0.15)" : BRAND, border: "none", padding: "11px 22px", fontWeight: 700, fontSize: 14, color: saved ? "#15803d" : "white", cursor: "pointer" }}>
            {saved ? "✓ Saved!" : "Save Memo"}
          </button>
          <button onClick={() => setText("")} style={{ borderRadius: 99, background: "white", border: "1px solid #e2e8f0", padding: "11px 22px", fontWeight: 700, fontSize: 14, color: "#334155", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>

      {entriesWithNotes.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.06)" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Entry Notes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entriesWithNotes.map(e => (
              <div key={e.id} style={{ background: "#f8fafc", borderRadius: 14, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BRAND_DARK, marginBottom: 4 }}>
                  {new Date(e.mikvehDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div style={{ fontSize: 13, color: "#334155", fontStyle: "italic" }}>"{e.note}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Ask a Rabbi ────────────────────────────────── */
const RABBIS = [
  "Rabbi Eliyahu Birnbaum (Manipur)",
  "Rabbi Moshe Tolochinsky (Bnei Menashe Center)",
  "Rabbi Sholom Ber Chaikin (Cleveland)",
  "Rabbi Yossi Chaikin (South Africa)",
  "Rabbi Menachem M. Gluckowsky (Israel)",
  "Dayan Levi Raskin (London)",
];

function AskARabbiSection() {
  const [rabbi, setRabbi] = useState(RABBIS[0]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [question, setQuestion] = useState("");
  const [sent, setSent] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", borderRadius: 16,
    border: "1px solid #e2e8f0", padding: "12px 14px", fontSize: 14,
    color: "#0f172a", outline: "none", fontFamily: "inherit",
    background: "white", transition: "box-shadow 0.15s",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6,
  };

  function handleSend() {
    if (!question.trim()) return;
    setSent(true);
    setTimeout(() => { setSent(false); setQuestion(""); setEmail(""); setPhone(""); }, 3000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main form card */}
      <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.08)" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND_DARK, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Halachic guidance</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>Ask a Rabbi</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>Send your question privately. Your details are never stored on our servers.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Rabbi selector */}
          <div>
            <label style={labelStyle}>Send Question to</label>
            <select
              value={rabbi}
              onChange={e => setRabbi(e.target.value)}
              style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36 }}
            >
              {RABBIS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Email + Phone row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>My Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>My Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 ..." style={inputStyle} />
            </div>
          </div>

          {/* Question textarea */}
          <div>
            <label style={labelStyle}>My Question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={6}
              placeholder="Write your question here. Include any relevant dates or context…"
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>
        </div>

        {/* Privacy note box */}
        <div style={{ margin: "16px 0", padding: "14px 16px", borderRadius: 16, background: `rgba(65,190,221,0.07)`, border: `1px solid ${BRAND}30` }}>
          <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
            🕊️ <strong>Please note:</strong> The laws of Family Sanctity are sacred and complex. The rabbi is here for your benefit and to guide you with care and discretion.
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleSend}
            disabled={!question.trim()}
            style={{
              borderRadius: 99, border: "none", padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: question.trim() ? "pointer" : "not-allowed",
              background: sent ? "rgba(74,222,128,0.15)" : question.trim() ? BRAND : "#e2e8f0",
              color: sent ? "#15803d" : question.trim() ? "white" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            {sent ? "✓ Question prepared!" : "Send Question"}
          </button>
          <button
            onClick={() => { setQuestion(""); setEmail(""); setPhone(""); }}
            style={{ borderRadius: 99, background: "white", border: "1px solid #e2e8f0", padding: "12px 24px", fontWeight: 700, fontSize: 14, color: "#334155", cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Helpful note card */}
      <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.06)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Tips for a clear question</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "📅", tip: "Include the exact date and time of any relevant occurrence." },
            { icon: "📍", tip: "Mention your location if it affects timing (e.g. Shabbat end time)." },
            { icon: "📝", tip: "Describe the background briefly — what you observed, when, and any unusual circumstances." },
            { icon: "🔒", tip: "Your question is treated with complete privacy and discretion." },
          ].map(({ icon, tip }) => (
            <div key={tip} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>

        {/* Status badge */}
        <div style={{ marginTop: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Status</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{sent ? "Sent ✓" : "Draft only"}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Settings ──────────────────────────────────── */
function SettingsSection({ onClearAll }: { onClearAll: () => void }) {
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>Settings</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>General preferences and data management.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ borderRadius: 20, border: "1px solid #e2e8f0", background: "white", padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Privacy</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 14, background: `rgba(65,190,221,0.06)`, border: `1px solid ${BRAND}25` }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>Your Mikveh Calendar is stored privately on this device only. It is never uploaded, shared, or synced to any server.</div>
            </div>
          </div>

          <div style={{ borderRadius: 20, border: "1px solid #e2e8f0", background: "white", padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Reminders</div>
            {["Preparatory days", "Mikveh nights", "Hefsek Tahara day"].map(r => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "#f8fafc", marginBottom: 8, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked={r !== "Preparatory days"} style={{ accentColor: BRAND, width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: "#334155" }}>{r}</span>
              </label>
            ))}
          </div>

          <div style={{ borderRadius: 20, border: "1px solid #fee2e2", background: "rgba(254,242,242,0.5)", padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#991b1b", marginBottom: 8 }}>Data Management</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Permanently delete all saved Mikveh calendar entries from this device.</div>
            {confirmClear ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { onClearAll(); setConfirmClear(false); }} style={{ borderRadius: 99, background: "#ef4444", border: "none", padding: "10px 18px", fontWeight: 700, fontSize: 13, color: "white", cursor: "pointer" }}>Confirm Delete All</button>
                <button onClick={() => setConfirmClear(false)} style={{ borderRadius: 99, background: "white", border: "1px solid #e2e8f0", padding: "10px 18px", fontWeight: 700, fontSize: 13, color: "#334155", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} style={{ borderRadius: 99, background: "white", border: "1px solid #fca5a5", padding: "10px 18px", fontWeight: 700, fontSize: 13, color: "#ef4444", cursor: "pointer" }}>
                Clear All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN MODAL ────────────────────────────────── */
type Tab = "calendar" | "checklist" | "notes" | "settings";

export default function MikvehCalendarModal({ onClose }: Props) {
  const [entries, setEntries] = useState<MikvehEntry[]>([]);
  const [tab, setTab] = useState<Tab>("calendar");
  const [viewDate, setViewDate] = useState(() => {
    const n = new Date(); return { month: n.getMonth(), year: n.getFullYear() };
  });

  useEffect(() => { setEntries(loadMikvehEntries()); }, []);

  function toggleDone(id: string) {
    const u = entries.map(e => e.id === id ? { ...e, completed: !e.completed } : e);
    setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }
  function deleteEntry(id: string) {
    const u = entries.filter(e => e.id !== id);
    setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }
  function updateNote(id: string, note: string) {
    const u = entries.map(e => e.id === id ? { ...e, note } : e);
    setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }
  function clearAll() {
    setEntries([]); localStorage.removeItem(STORAGE_KEY);
  }

  const nextMikveh = entries.filter(e => !e.completed && daysUntil(e.mikvehDate) >= 0)
    .sort((a, b) => a.mikvehDate.localeCompare(b.mikvehDate))[0];

  const upcomingCount = entries.filter(e => !e.completed && daysUntil(e.mikvehDate) >= 0).length;
  const hebrewDate = getHebrewMonthYear();

  const TABS: { id: Tab; label: string }[] = [
    { id: "calendar", label: "Calendar" },
    { id: "checklist", label: "Checklist" },
    { id: "notes", label: "Notes" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "radial-gradient(circle at top left, rgba(65,190,221,.18), transparent 35%), radial-gradient(circle at top right, rgba(31,134,162,.12), transparent 30%), linear-gradient(180deg,#f7fdff 0%,#eefbfe 45%,#ffffff 100%)",
      display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.6)",
      }}>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(65,190,221,0.35)" }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M12 2c3.3 3.5 5 6.7 5 9.5A5 5 0 1 1 7 11.5C7 8.7 8.7 5.5 12 2Zm0 20c5 0 9-3.9 9-8.8 0-2.4-1-4.8-2.8-6.8-.5 3.7-2.7 6.7-6.2 8.8-3.5-2.1-5.7-5.1-6.2-8.8C4 8.4 3 10.8 3 13.2 3 18.1 7 22 12 22Z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.01em" }}>My Mikveh Calendar</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Private · On-device only</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: "#f1f5f9", border: "none", fontSize: 16, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              borderRadius: 99, padding: "8px 18px", border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", transition: "all 0.15s",
              background: tab === t.id ? "#0f172a" : "#f1f5f9",
              color: tab === t.id ? "white" : "#475569",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "16px" }}>

        {tab === "calendar" && (
          <>
            {/* Hero stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 24, padding: 20, boxShadow: "0 20px 60px rgba(15,23,42,0.1)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: BRAND_DARK, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Today's overview</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{hebrewDate || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 6, maxWidth: 280 }}>Track Mikveh dates, prep checklist, and notes in one private space.</div>
                  </div>
                  {nextMikveh && (
                    <div style={{ background: `rgba(65,190,221,0.1)`, border: `1px solid ${BRAND}30`, borderRadius: 20, padding: "14px 18px", textAlign: "center", minWidth: 130 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND_DARK, marginBottom: 4 }}>Next Mikveh Night</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>
                        {new Date(nextMikveh.mikvehDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        {daysUntil(nextMikveh.mikvehDate) === 0 ? "Tonight!" : `in ${daysUntil(nextMikveh.mikvehDate)} days`}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Saved flows", value: entries.length },
                    { label: "Upcoming", value: upcomingCount },
                    { label: "Completed", value: entries.filter(e => e.completed).length },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#f8fafc", borderRadius: 16, padding: "12px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar grid */}
            <div style={{ marginBottom: 16 }}>
              <MonthCalendar
                entries={entries}
                viewDate={viewDate}
                onPrev={() => setViewDate(v => { const d = new Date(v.year, v.month - 1); return { month: d.getMonth(), year: d.getFullYear() }; })}
                onNext={() => setViewDate(v => { const d = new Date(v.year, v.month + 1); return { month: d.getMonth(), year: d.getFullYear() }; })}
              />
            </div>

            {/* Legend */}
            <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "14px 18px", marginBottom: 16, boxShadow: "0 4px 20px rgba(15,23,42,0.06)", display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                { color: "linear-gradient(90deg,rgba(251,191,36,.4),rgba(251,191,36,.15))", label: "Hefsek Tahara" },
                { color: `linear-gradient(90deg,${BRAND}50,${BRAND}20)`, label: "Mikveh Night" },
                { color: "linear-gradient(90deg,rgba(74,222,128,.4),rgba(74,222,128,.15))", label: "Completed" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 14, borderRadius: 4, background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Entry timeline */}
            <EntryList entries={entries} onToggle={toggleDone} onDelete={deleteEntry} />
          </>
        )}

        {tab === "checklist" && <ChecklistSection />}
        {tab === "notes" && <NotesSection entries={entries} onUpdateNote={updateNote} />}
        {tab === "settings" && <SettingsSection onClearAll={clearAll} />}

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
