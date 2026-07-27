import { useState, useEffect } from "react";
import { getCurrentParasha, getUpcomingParashiyot } from "../lib/parasha";
import { getParashaInsights, type ParashaInsights } from "../lib/parashaInsights";
import { getAliyot, ALIYAH_LABELS } from "../lib/aliyot";

const API_BASE = "/api";

interface Props { onClose: () => void; }

type View = "detail" | "schedule" | "progress";

const TORAH_BOOKS: Array<{ name: string; hebrew: string; color: string; parashiyot: string[] }> = [
  {
    name: "Bereishit", hebrew: "בְּרֵאשִׁית", color: "#1a3a1a",
    parashiyot: ["Bereshit","Noach","Lech-Lecha","Vayeira","Chayei Sara","Toldot","Vayetzei","Vayishlach","Vayeshev","Miketz","Vayigash","Vayechi"],
  },
  {
    name: "Shemot", hebrew: "שְׁמוֹת", color: "#3a1a00",
    parashiyot: ["Shemot","Vaeira","Bo","Beshalach","Yitro","Mishpatim","Terumah","Tetzaveh","Ki Tisa","Vayakhel","Pekudei"],
  },
  {
    name: "Vayikra", hebrew: "וַיִּקְרָא", color: "#2a1a3a",
    parashiyot: ["Vayikra","Tzav","Shemini","Tazria","Metzora","Achrei Mot","Kedoshim","Emor","Behar","Bechukotai"],
  },
  {
    name: "Bamidbar", hebrew: "בְּמִדְבַּר", color: "#1a2a3a",
    parashiyot: ["Bamidbar","Nasso","Beha'alotcha","Shelach","Korach","Chukat","Balak","Pinchas","Matot","Masei"],
  },
  {
    name: "Devarim", hebrew: "דְּבָרִים", color: "#3a2a00",
    parashiyot: ["Devarim","Vaetchanan","Eikev","Re'eh","Shoftim","Ki Teitzei","Ki Tavo","Nitzavim","Vayeilech","Ha'Azinu","Vezot Haberakhah"],
  },
];

const PARASHA_HEBREW: Record<string, string> = {
  "Bereshit":"בְּרֵאשִׁית","Noach":"נֹחַ","Lech-Lecha":"לֶךְ-לְךָ","Vayeira":"וַיֵּרָא","Chayei Sara":"חַיֵּי שָׂרָה",
  "Toldot":"תּוֹלְדֹת","Vayetzei":"וַיֵּצֵא","Vayishlach":"וַיִּשְׁלַח","Vayeshev":"וַיֵּשֶׁב","Miketz":"מִקֵּץ",
  "Vayigash":"וַיִּגַּשׁ","Vayechi":"וַיְחִי","Shemot":"שְׁמוֹת","Vaeira":"וָאֵרָא","Bo":"בֹּא",
  "Beshalach":"בְּשַׁלַּח","Yitro":"יִתְרוֹ","Mishpatim":"מִּשְׁפָּטִים","Terumah":"תְּרוּמָה","Tetzaveh":"תְּצַוֶּה",
  "Ki Tisa":"כִּי תִשָּׂא","Vayakhel":"וַיַּקְהֵל","Pekudei":"פְקוּדֵי","Vayikra":"וַיִּקְרָא","Tzav":"צַו",
  "Shemini":"שְּׁמִינִי","Tazria":"תַזְרִיעַ","Metzora":"מְּצֹרָע","Achrei Mot":"אַחֲרֵי מוֹת","Kedoshim":"קְדֹשִׁים",
  "Emor":"אֱמֹר","Behar":"בְּהַר","Bechukotai":"בְּחֻקֹּתַי","Bamidbar":"בְּמִדְבַּר","Nasso":"נָשֹׂא",
  "Beha'alotcha":"בְּהַעֲלֹתְךָ","Shelach":"שְׁלַח","Korach":"קֹרַח","Chukat":"חֻקַּת","Balak":"בָּלָק",
  "Pinchas":"פִּינְחָס","Matot":"מַּטּוֹת","Masei":"מַסְעֵי","Devarim":"דְּבָרִים","Vaetchanan":"וָאֶתְחַנַּן",
  "Eikev":"עֵקֶב","Re'eh":"רְאֵה","Shoftim":"שֹׁפְטִים","Ki Teitzei":"כִּי תֵצֵא","Ki Tavo":"כִּי תָבוֹא",
  "Nitzavim":"נִצָּבִים","Vayeilech":"וַיֵּלֶךְ","Ha'Azinu":"הַאֲזִינוּ","Vezot Haberakhah":"וְזֹאת הַבְּרָכָה",
};

const PROGRESS_KEY = "parasha-progress";

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function saveProgress(s: Set<string>) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...s])); } catch {}
}

const BOOK_COLORS: Record<string, { bg: string; label: string; hebrew: string }> = {
  "Bereishit": { bg: "linear-gradient(135deg,#1a3a1a,#0d2210)", label: "BEREISHIT", hebrew: "בְּרֵאשִׁית" },
  "Shemot":    { bg: "linear-gradient(135deg,#3a1a00,#1e0d00)", label: "SHEMOT",    hebrew: "שְׁמוֹת" },
  "Vayikra":  { bg: "linear-gradient(135deg,#2a1a3a,#150d1e)", label: "VAYIKRA",   hebrew: "וַיִּקְרָא" },
  "Bamidbar": { bg: "linear-gradient(135deg,#1a2a3a,#0d1520)", label: "BAMIDBAR",  hebrew: "בְּמִדְבַּר" },
  "Devarim":  { bg: "linear-gradient(135deg,#3a2a00,#1e1500)", label: "DEVARIM",   hebrew: "דְּבָרִים" },
};

const SECTION_ICONS: Record<string, string> = {
  overview:      "📋",
  keyTheme:      "🎯",
  didYouKnow:    "💡",
  bneiMenashe:   "✡",
  mainSources:   "📚",
  commentary:    "🏛",
  lesson:        "🌱",
  discussion:    "💬",
  hebrewQuote:   "🔯",
  sources:       "📖",
};

interface SectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: boolean;
  aiEnhanced?: boolean;
}

function Section({ icon, title, children, defaultOpen = true, accent, aiEnhanced }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderRadius: 14,
      background: "var(--card)",
      border: `1px solid ${accent ? "rgba(212,168,67,0.2)" : "var(--border)"}`,
      marginBottom: 10,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "14px 14px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: accent ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${accent ? "rgba(212,168,67,0.25)" : "rgba(255,255,255,0.08)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          {icon}
        </div>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
        {aiEnhanced && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: "#d4a843", letterSpacing: ".06em",
            background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)",
            borderRadius: 4, padding: "2px 5px", flexShrink: 0,
          }}>AI</span>
        )}
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: open ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(212,168,67,0.2)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s ease",
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={open ? "M2 8 L6 4 L10 8" : "M2 4 L6 8 L10 4"}
              stroke={open ? "#d4a843" : "#64748b"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ParashahModal({ onClose }: Props) {
  const today = new Date();
  const parasha = getCurrentParasha(today);
  const upcoming: Array<{ name: string; date: Date; hebrewName: string }> = getUpcomingParashiyot(today, 10);
  const [view, setView] = useState<View>("detail");
  const [studied, setStudied] = useState<Set<string>>(loadProgress);

  function toggleStudied(name: string) {
    setStudied(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      saveProgress(next);
      return next;
    });
  }

  const totalStudied = studied.size;
  const totalParashiyot = 54;

  const staticInsights = parasha
    ? getParashaInsights(parasha.name, parasha.book, parasha.summary)
    : null;

  const [aiInsights, setAiInsights] = useState<ParashaInsights | null>(null);

  // Silently try to fetch AI-enhanced insights in the background
  useEffect(() => {
    if (!parasha) return;
    fetch(`${API_BASE}/parsha-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parshaName: parasha.name,
        hebrewName: parasha.hebrewName,
        bookName: parasha.book,
        chaptersRange: parasha.verses,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setAiInsights({
          keyTheme:            data.keyTheme            || staticInsights?.keyTheme            || "",
          didYouKnow:          data.didYouKnow          || staticInsights?.didYouKnow          || "",
          bneiMenasheConnection: data.bneiManasheConnection || staticInsights?.bneiMenasheConnection || "",
          mainSources:         data.mainSources         || staticInsights?.mainSources         || "",
          classicalCommentary: data.classicalCommentary || staticInsights?.classicalCommentary || "",
          practicalLesson:     data.practicalLesson     || staticInsights?.practicalLesson     || "",
          discussionQuestion:  data.discussionQuestion  || staticInsights?.discussionQuestion  || "",
          hebrewQuote:         data.hebrewQuote         || staticInsights?.hebrewQuote         || { hebrew: "", translation: "", reference: "" },
          sourceReferences:    data.sourceReferences    || staticInsights?.sourceReferences    || "",
        });
      })
      .catch(() => { /* silently ignore — static data remains */ });
  }, [parasha?.name]);

  // Always display something: AI if available, static otherwise
  const insights: ParashaInsights | null = aiInsights ?? staticInsights;
  const isAi = aiInsights !== null;

  const bookInfo = parasha ? (BOOK_COLORS[parasha.book] ?? BOOK_COLORS["Bamidbar"]) : null;

  function copyStudyNotes() {
    if (!parasha || !insights) return;
    const text = [
      `📖 Parashat ${parasha.name} | ${parasha.hebrewName}`,
      `${parasha.book} ${parasha.verses}`,
      ``,
      `OVERVIEW`,
      parasha.summary,
      ``,
      `KEY THEME`,
      insights.keyTheme,
      ``,
      `CLASSICAL COMMENTARY`,
      insights.classicalCommentary,
      ``,
      `PRACTICAL LESSON`,
      insights.practicalLesson,
      ``,
      `DISCUSSION QUESTION`,
      insights.discussionQuestion,
      ``,
      `HEBREW QUOTE`,
      `${insights.hebrewQuote.hebrew}`,
      `${insights.hebrewQuote.translation} (${insights.hebrewQuote.reference})`,
      ``,
      `SOURCES: ${insights.sourceReferences}`,
    ].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function shareInsight() {
    if (!parasha || !insights) return;
    const text = `📖 Parashat ${parasha.name} Insight:\n\n${insights.practicalLesson}\n\n— Sacred Calendar of Bnei Menashe`;
    if (navigator.share) {
      navigator.share({ title: `Parashat ${parasha.name}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-card"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "92vh", overflowY: "auto", padding: 0, display: "flex", flexDirection: "column" }}
      >

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 0" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setView("detail")}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                background: view === "detail" ? "rgba(212,168,67,0.15)" : "transparent",
                color: view === "detail" ? "#d4a843" : "var(--text-muted)",
              }}
            >
              Study Notes
            </button>
            <button
              onClick={() => setView("schedule")}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                background: view === "schedule" ? "rgba(212,168,67,0.15)" : "transparent",
                color: view === "schedule" ? "#d4a843" : "var(--text-muted)",
              }}
            >
              Schedule
            </button>
            <button
              onClick={() => setView("progress")}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                background: view === "progress" ? "rgba(212,168,67,0.15)" : "transparent",
                color: view === "progress" ? "#d4a843" : "var(--text-muted)",
                position: "relative",
              }}
            >
              Progress
              {totalStudied > 0 && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  background: "#d4a843", color: "#0f1829",
                  borderRadius: 99, fontSize: 8, fontWeight: 800,
                  padding: "1px 4px", lineHeight: 1.4,
                }}>{totalStudied}</span>
              )}
            </button>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {view === "detail" && parasha && insights ? (
          <div style={{ padding: "0 12px 20px", flex: 1 }}>

            {/* ── Hero card ── */}
            <div style={{
              borderRadius: 16, overflow: "hidden", marginTop: 12, marginBottom: 16,
              background: bookInfo?.bg ?? "linear-gradient(135deg,#1a2a3a,#0d1520)",
              border: "1px solid rgba(212,168,67,0.15)",
            }}>
              <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.25)",
                  borderRadius: 8, padding: "3px 10px",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#d4a843", letterSpacing: ".1em" }}>
                    {bookInfo?.label}
                  </span>
                  <span style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 12, color: "#d4a843", direction: "rtl" }}>
                    {bookInfo?.hebrew}
                  </span>
                </div>
                {isAi && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "#d4a843", letterSpacing: ".06em",
                    background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)",
                    borderRadius: 4, padding: "2px 6px",
                  }}>✦ AI Enhanced</span>
                )}
              </div>

              <div style={{ padding: "8px 16px 0", fontFamily: "'Noto Serif Hebrew',serif", fontSize: 42, color: "#d4a843", direction: "rtl", lineHeight: 1.2, fontWeight: 700 }}>
                {parasha.hebrewName}
              </div>

              <div style={{ padding: "4px 16px 0" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>Parashat {parasha.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{parasha.book} {parasha.verses}</div>
              </div>

              <div style={{ padding: "14px 16px 16px", display: "flex", gap: 10 }}>
                <button
                  onClick={copyStudyNotes}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(212,168,67,0.3)",
                    background: "rgba(212,168,67,0.1)", color: "#d4a843", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", letterSpacing: ".01em",
                  }}
                >
                  📋 Copy Study Notes
                </button>
                <button
                  onClick={shareInsight}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.06)", color: "white", fontSize: 13, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ↑ Share Insight
                </button>
              </div>
            </div>

            {/* ── Sections ── */}
            <Section icon={SECTION_ICONS.overview} title="Overview">
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {parasha.summary}
              </p>
            </Section>

            {/* ── Aliyot breakdown ── */}
            {(() => {
              const aliyot = getAliyot(parasha.name);
              if (!aliyot) return null;
              return (
                <Section icon="🕍" title="Weekly Torah Reading — Aliyot" defaultOpen={false}>
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      fontSize: 11, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5,
                    }}>
                      {parasha.book} · {parasha.verses}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                      {ALIYAH_LABELS.map((label: { en: string; he: string; ordinal: string }, idx: number) => {
                        const verses = aliyot[idx];
                        if (!verses) return null;
                        const isMaftir = idx === 7;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 14px",
                              borderBottom: idx < 7 ? "1px solid var(--border)" : "none",
                              background: isMaftir
                                ? "rgba(212,168,67,0.05)"
                                : idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                            }}
                          >
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: isMaftir ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.06)",
                              border: `1px solid ${isMaftir ? "rgba(212,168,67,0.3)" : "var(--border)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexDirection: "column",
                            }}>
                              <span style={{
                                fontSize: isMaftir ? 8 : 10, fontWeight: 800,
                                color: isMaftir ? "#d4a843" : "var(--text-muted)",
                                letterSpacing: isMaftir ? ".04em" : 0,
                                lineHeight: 1,
                              }}>
                                {isMaftir ? "M" : `${idx + 1}`}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: isMaftir ? "#d4a843" : "var(--text-primary)", marginBottom: 1 }}>
                                {label.en}
                              </div>
                              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                {parasha.book} {verses}
                              </div>
                            </div>
                            <div style={{
                              fontFamily: "'Noto Serif Hebrew',serif",
                              fontSize: 13, color: isMaftir ? "#d4a843" : "var(--text-muted)",
                              direction: "rtl", flexShrink: 0,
                            }}>
                              {label.he}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>
                      Haftarah: {parasha.haftarah.book} {parasha.haftarah.verses}
                    </div>
                  </div>
                </Section>
              );
            })()}

            <Section icon="📜" title="Haftarah Reading" defaultOpen={false}>
              <div style={{ marginTop: 12 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                  padding: "8px 12px", borderRadius: 10,
                  background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".08em" }}>HAFTARAH</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#d4a843", marginTop: 2 }}>
                      {parasha.haftarah.book} {parasha.haftarah.verses}
                    </div>
                  </div>
                  <span style={{ fontSize: 20 }}>📖</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                  {parasha.haftarah.summary}
                </p>
              </div>
            </Section>

            <Section icon={SECTION_ICONS.keyTheme} title="Key Theme" aiEnhanced={isAi}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {insights.keyTheme}
              </p>
            </Section>

            <Section icon={SECTION_ICONS.didYouKnow} title="Did You Know?" defaultOpen={false} aiEnhanced={isAi}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {insights.didYouKnow}
              </p>
            </Section>

            <Section icon={SECTION_ICONS.bneiMenashe} title="Bnei Menashe Connection" defaultOpen={false} accent aiEnhanced={isAi}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {insights.bneiMenasheConnection}
              </p>
            </Section>

            <Section icon={SECTION_ICONS.mainSources} title="Main Torah Sources" defaultOpen={false} aiEnhanced={isAi}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {insights.mainSources}
              </p>
            </Section>

            <Section icon={SECTION_ICONS.commentary} title="Classical Commentary" aiEnhanced={isAi}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {insights.classicalCommentary}
              </p>
            </Section>

            <Section icon={SECTION_ICONS.lesson} title="Practical Lesson" aiEnhanced={isAi}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {insights.practicalLesson}
              </p>
            </Section>

            <Section icon={SECTION_ICONS.discussion} title="Discussion Question" defaultOpen={false} aiEnhanced={isAi}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginTop: 12 }}>
                {insights.discussionQuestion}
              </p>
            </Section>

            <Section icon={SECTION_ICONS.hebrewQuote} title="Hebrew Quote" accent aiEnhanced={isAi}>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <div style={{
                  fontFamily: "'Noto Serif Hebrew',serif",
                  fontSize: 18, color: "#d4a843", direction: "rtl", lineHeight: 1.7,
                  marginBottom: 10, padding: "0 8px",
                }}>
                  {insights.hebrewQuote.hebrew}
                </div>
                <div style={{
                  fontSize: 14, color: "#d4a843", fontWeight: 600, lineHeight: 1.6,
                  fontStyle: "italic", marginBottom: 6, padding: "0 8px",
                }}>
                  "{insights.hebrewQuote.translation}"
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  — {insights.hebrewQuote.reference}
                </div>
              </div>
            </Section>

            <Section icon={SECTION_ICONS.sources} title="Source References" defaultOpen={false} aiEnhanced={isAi}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, marginTop: 12 }}>
                {insights.sourceReferences}
              </p>
            </Section>

          </div>
        ) : view === "detail" && !parasha ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No parashah data available for this date.
          </div>
        ) : null}

        {view === "schedule" && (
          <div style={{ padding: "12px 12px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 12 }}>
              UPCOMING PARASHIYOT
            </div>
            <div style={{ borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", background: "var(--card)" }}>
              {upcoming.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 16px",
                    borderBottom: i < upcoming.length - 1 ? "1px solid var(--border)" : "none",
                    background: i === 0 ? "rgba(212,168,67,0.04)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {i === 0 && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4a843", flexShrink: 0 }} />
                    )}
                    {i > 0 && <div style={{ width: 6, height: 6 }} />}
                    {p.hebrewName && (
                      <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 13, color: "#d4a843", width: 44, textAlign: "right", flexShrink: 0 }}>
                        {p.hebrewName.split(" ")[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {p.name}
                      </div>
                      {i === 0 && (
                        <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 600, marginTop: 1 }}>This Shabbat</div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
                    {p.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
