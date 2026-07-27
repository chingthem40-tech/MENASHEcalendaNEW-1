import { useState, useEffect } from "react";
import { HDate } from "@hebcal/core";
import { useLanguage } from "../context/LanguageContext";

interface Props { onClose: () => void; }

const SEFARIA_BASE = "https://www.sefaria.org";

const TRACTATES = [
  { name: "Berakhot", pages: 64 },
  { name: "Shabbat", pages: 157 },
  { name: "Eruvin", pages: 105 },
  { name: "Pesachim", pages: 121 },
  { name: "Yoma", pages: 88 },
  { name: "Sukkah", pages: 56 },
  { name: "Beitzah", pages: 40 },
  { name: "Rosh Hashana", pages: 35 },
  { name: "Ta'anit", pages: 31 },
  { name: "Megillah", pages: 32 },
  { name: "Moed Katan", pages: 29 },
  { name: "Chagigah", pages: 27 },
  { name: "Yevamot", pages: 122 },
  { name: "Ketubot", pages: 112 },
  { name: "Nedarim", pages: 91 },
  { name: "Nazir", pages: 66 },
  { name: "Sotah", pages: 49 },
  { name: "Gittin", pages: 90 },
  { name: "Kiddushin", pages: 82 },
  { name: "Bava Kamma", pages: 119 },
  { name: "Bava Metzia", pages: 119 },
  { name: "Bava Batra", pages: 176 },
  { name: "Sanhedrin", pages: 113 },
  { name: "Makkot", pages: 24 },
  { name: "Shevuot", pages: 49 },
  { name: "Avodah Zarah", pages: 76 },
  { name: "Horayot", pages: 14 },
  { name: "Zevachim", pages: 120 },
  { name: "Menachot", pages: 110 },
  { name: "Chullin", pages: 142 },
  { name: "Bekhorot", pages: 61 },
  { name: "Arakhin", pages: 34 },
  { name: "Temurah", pages: 34 },
  { name: "Keritot", pages: 28 },
  { name: "Meilah", pages: 22 },
  { name: "Niddah", pages: 73 },
];
const TOTAL_PAGES = TRACTATES.reduce((a, t) => a + t.pages, 0);
const CYCLE_START = new Date(2020, 0, 5);

function getLocalDaf(): { tractate: string; daf: number; cycle: number } {
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - CYCLE_START.getTime()) / 86400000);
  const dayInCycle = daysSinceStart % TOTAL_PAGES;
  const cycle = Math.floor(daysSinceStart / TOTAL_PAGES) + 14;
  let remaining = dayInCycle;
  for (const t of TRACTATES) {
    if (remaining < t.pages) return { tractate: t.name, daf: remaining + 2, cycle };
    remaining -= t.pages;
  }
  return { tractate: TRACTATES[0].name, daf: 2, cycle };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function flattenText(val: unknown): string[] {
  if (!val) return [];
  if (typeof val === "string") return val ? [stripHtml(val)] : [];
  if (Array.isArray(val)) return (val as unknown[]).flatMap(v => flattenText(v)).filter(Boolean);
  return [];
}

export default function DafYomiModal({ onClose }: Props) {
  const { t } = useLanguage();
  const hdate = new HDate();
  const local = getLocalDaf();

  // Progress calculations
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - CYCLE_START.getTime()) / 86400000);
  const dayInCycle = daysSinceStart % TOTAL_PAGES;
  const pagesRemaining = TOTAL_PAGES - dayInCycle;
  const pct = Math.round((dayInCycle / TOTAL_PAGES) * 1000) / 10; // one decimal place
  const cycleEndDate = new Date(CYCLE_START.getTime() + (Math.floor(daysSinceStart / TOTAL_PAGES) + 1) * TOTAL_PAGES * 86400000);
  const cycleEndStr = cycleEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Current tractate progress
  let tractateProgress = 0;
  let tractateTotal = 1;
  let tractatePageInside = 0;
  {
    let rem = dayInCycle;
    for (const t of TRACTATES) {
      if (rem < t.pages) {
        tractatePageInside = rem + 1;
        tractateTotal = t.pages;
        tractateProgress = Math.round((rem / t.pages) * 100);
        break;
      }
      rem -= t.pages;
    }
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [officialRef, setOfficialRef] = useState<string | null>(null);
  const [tractate, setTractate] = useState(local.tractate);
  const [dafNum, setDafNum] = useState(local.daf);
  const [heDisplay, setHeDisplay] = useState("");
  const [excerpts, setExcerpts] = useState<Array<{ en: string; he: string }>>([]);
  const [cycle] = useState(local.cycle);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  function handleShare() {
    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const hebrewLine = heDisplay ? `${heDisplay}\n` : "";
    const excerptLines = excerpts
      .slice(0, 2)
      .map(p => `${p.he ? p.he + "\n" : ""}${p.en}`)
      .join("\n\n");

    const text = [
      `📚 Daf Yomi — ${tractate} ${dafNum}`,
      hebrewLine.trim() ? hebrewLine.trim() : null,
      `${dateStr} · Cycle ${cycle}`,
      ``,
      excerptLines || null,
      ``,
      `— Sacred Calendar of Bnei Menashe`,
      sefariaUrl,
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      navigator.share({ title: `Daf Yomi — ${tractate} ${dafNum}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2500);
      }).catch(() => {});
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchDaf() {
      try {
        // 1. Get today's official Daf Yomi from Sefaria calendar
        const calRes = await fetch(`${SEFARIA_BASE}/api/calendars`);
        const calData = await calRes.json();
        const dafItem = (calData.calendar_items as Array<{
          title: { en: string };
          displayValue: { en: string; he: string };
          ref: string;
          url: string;
        }>)?.find(i => i.title?.en?.includes("Daf Yomi"));

        if (!dafItem) throw new Error("Daf Yomi not found");

        const [tractateStr, dafStr] = dafItem.displayValue.en.split(" ");
        const dafNumber = parseInt(dafStr, 10);

        if (!cancelled) {
          setTractate(tractateStr);
          setDafNum(isNaN(dafNumber) ? local.daf : dafNumber);
          setHeDisplay(dafItem.displayValue.he);
          setOfficialRef(dafItem.url);
        }

        // 2. Fetch the actual Talmud text
        const textRes = await fetch(`${SEFARIA_BASE}/api/texts/${encodeURIComponent(dafItem.ref)}?context=0&pad=0`);
        const textData = await textRes.json();

        const enLines = flattenText(textData.text).slice(0, 4);
        const heLines = flattenText(textData.he).slice(0, 4);

        if (!cancelled) {
          const pairs = enLines.slice(0, 3).map((en, i) => ({
            en,
            he: heLines[i] ?? "",
          }));
          setExcerpts(pairs);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDaf();
    return () => { cancelled = true; };
  }, []);

  const sefariaUrl = officialRef
    ? `${SEFARIA_BASE}/${officialRef}`
    : `${SEFARIA_BASE}/search#q=${encodeURIComponent(tractate)}%20${dafNum}`;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{t.dafYomiTitle}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {t.dafYomiSub} · Cycle {cycle}
              {!loading && !error && (
                <span style={{ marginLeft: 6, color: "#4ade80", fontSize: 10, fontWeight: 700 }}>● LIVE</span>
              )}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Today's Daf hero card */}
        <div style={{
          padding: 20, borderRadius: 16, marginBottom: 14, textAlign: "center",
          background: "linear-gradient(135deg, #0f1e38, #1a2a4a)",
          border: "1px solid rgba(212,168,67,0.3)",
        }}>
          <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 14, color: "#d4a843", marginBottom: 6 }}>
            {hdate.renderGematriya()}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>
            TODAY'S LEARNING
          </div>

          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, padding: "16px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
              {t.dafYomiLoading}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{tractate}</div>
              <div style={{ fontSize: 24, color: "#d4a843", fontWeight: 700, marginBottom: heDisplay ? 10 : 0 }}>Daf {dafNum}</div>
              {heDisplay && (
                <div style={{
                  fontFamily: "'Noto Serif Hebrew', serif",
                  fontSize: 20, color: "#f0c050", direction: "rtl", lineHeight: 1.2,
                }}>
                  {heDisplay}
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div className="card" style={{ flex: 1, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>CYCLE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{cycle}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>REMAINING</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#d4a843" }}>{pagesRemaining.toLocaleString()}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>COMPLETE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80" }}>{pct}%</div>
          </div>
        </div>

        {/* ── Cycle Progress Bar ── */}
        <div style={{
          marginBottom: 14, padding: "16px 16px 14px",
          borderRadius: 16,
          background: "linear-gradient(135deg, #0f1e10, #0a160a)",
          border: "1px solid rgba(74,222,128,0.2)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(74,222,128,0.7)" }}>
              CYCLE {cycle} PROGRESS
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              {dayInCycle.toLocaleString()} / {TOTAL_PAGES.toLocaleString()} dapim
            </div>
          </div>

          {/* Main progress bar */}
          <div style={{ height: 10, borderRadius: 99, background: "rgba(255,255,255,0.07)", marginBottom: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${pct}%`,
              background: "linear-gradient(90deg, #166534, #4ade80, #86efac)",
              boxShadow: "0 0 8px rgba(74,222,128,0.4)",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>

          {/* Percentage label */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(74,222,128,0.8)", fontWeight: 700 }}>{pct}% done</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              🏁 {cycleEndStr}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(74,222,128,0.1)", marginBottom: 14 }} />

          {/* Current tractate sub-bar */}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(212,168,67,0.65)", marginBottom: 8 }}>
            CURRENT TRACTATE — {tractate.toUpperCase()}
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", marginBottom: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${tractateProgress}%`,
              background: "linear-gradient(90deg, #6b4800, #d4a843, #f0c050)",
              boxShadow: "0 0 6px rgba(212,168,67,0.35)",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, color: "rgba(212,168,67,0.75)", fontWeight: 700 }}>
              Daf {tractatePageInside + 1} of {tractateTotal}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              {tractateTotal - tractatePageInside} left in tractate
            </div>
          </div>
        </div>

        {/* Talmud text excerpts */}
        {!loading && excerpts.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>
              TODAY'S TEXT — {tractate.toUpperCase()} {dafNum}
            </div>
            {excerpts.map((p, i) => (
              <div key={i} style={{
                marginBottom: 10, padding: "12px 14px", borderRadius: 12,
                background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.14)",
              }}>
                {p.he && (
                  <div style={{
                    fontFamily: "'Noto Serif Hebrew', serif",
                    fontSize: 14, color: "#f0c050", direction: "rtl",
                    lineHeight: 1.7, marginBottom: 8,
                  }}>
                    {p.he}
                  </div>
                )}
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
                  {p.en}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error fallback note */}
        {error && (
          <div style={{ padding: 14, background: "rgba(212,168,67,0.08)", borderRadius: 12, border: "1px solid rgba(212,168,67,0.2)", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              📚 Using local Daf Yomi calculation. Connect to the internet for live text from Sefaria.
            </div>
          </div>
        )}

        {/* Read on Sefaria button */}
        {!loading && (
          <a
            href={sefariaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 0", borderRadius: 12, marginBottom: 10,
              background: "linear-gradient(90deg, #1a3a6b, #2451a8)",
              border: "1px solid rgba(59,130,246,0.4)",
              color: "white", fontSize: 14, fontWeight: 700,
              textDecoration: "none", cursor: "pointer",
            }}
          >
            <span>📖</span>
            <span>{t.dafYomiReadSefaria}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        )}

        {/* Share button */}
        {!loading && (
          <button
            onClick={handleShare}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 0", borderRadius: 12, marginBottom: 10,
              background: shareState === "copied"
                ? "linear-gradient(90deg, #166534, #16a34a)"
                : "linear-gradient(90deg, #6b4800, #b8860b, #d4a843)",
              border: shareState === "copied"
                ? "1px solid rgba(74,222,128,0.4)"
                : "1px solid rgba(212,168,67,0.4)",
              color: shareState === "copied" ? "white" : "#1a0900",
              fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.3s, border 0.3s, color 0.3s",
            }}
          >
            {shareState === "copied" ? (
              <>
                <span>✅</span>
                <span>{t.dafYomiCopied}</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                <span>{t.dafYomiShare}</span>
              </>
            )}
          </button>
        )}

        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
