import { HDate, HebrewCalendar, flags } from "@hebcal/core";

interface Props { onClose: () => void; }

const SEFIROT = [
  { en: "Chesed",   he: "חֶסֶד",      meaning: "Lovingkindness", color: "#60a5fa" },
  { en: "Gevurah",  he: "גְּבוּרָה",   meaning: "Strength",       color: "#f87171" },
  { en: "Tiferet",  he: "תִּפְאֶרֶת", meaning: "Beauty",         color: "#d4a843" },
  { en: "Netzach",  he: "נֶצַח",       meaning: "Eternity",       color: "#4ade80" },
  { en: "Hod",      he: "הוֹד",         meaning: "Splendor",       color: "#c084fc" },
  { en: "Yesod",    he: "יְסוֹד",      meaning: "Foundation",     color: "#fb923c" },
  { en: "Malchut",  he: "מַלְכוּת",    meaning: "Sovereignty",    color: "#e879f9" },
];

const OMER_WEEKS = [
  "First week: Chesed — Lovingkindness. Open your heart to give freely, reflecting Divine love in every interaction.",
  "Second week: Gevurah — Strength. Cultivate discipline, boundaries, and holy awe. True strength serves others.",
  "Third week: Tiferet — Beauty. Seek harmony between love and discipline. Beauty is truth in balance.",
  "Fourth week: Netzach — Eternity. Persist with passion and faith. Victory belongs to those who endure.",
  "Fifth week: Hod — Splendor. Practice gratitude and humility. Notice the Divine in ordinary moments.",
  "Sixth week: Yesod — Foundation. Build lasting bonds and connection. Channel your energy toward holy purpose.",
  "Seventh week: Malchut — Sovereignty. Crown your journey with dignity. Receive the Torah with a complete soul.",
];

const DAY_NAMES_EN = ["", "one", "two", "three", "four", "five", "six", "seven",
  "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
  "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
  "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five",
  "twenty-six", "twenty-seven", "twenty-eight", "twenty-nine", "thirty",
  "thirty-one", "thirty-two", "thirty-three", "thirty-four", "thirty-five",
  "thirty-six", "thirty-seven", "thirty-eight", "thirty-nine", "forty",
  "forty-one", "forty-two", "forty-three", "forty-four", "forty-five",
  "forty-six", "forty-seven", "forty-eight", "forty-nine"];

const WEEK_NAMES_EN = ["", "one", "two", "three", "four", "five", "six", "seven"];

const HEBREW_DAYS = [
  "", "יוֹם אֶחָד", "שְׁנֵי יָמִים", "שְׁלֹשָׁה יָמִים", "אַרְבָּעָה יָמִים",
  "חֲמִישָּׁה יָמִים", "שִׁשָּׁה יָמִים", "שִׁבְעָה יָמִים",
  "שְׁמוֹנָה יָמִים", "תִּשְׁעָה יָמִים", "עֲשָׂרָה יָמִים",
  "אַחַד עָשָׂר יוֹם", "שְׁנֵים עָשָׂר יוֹם", "שְׁלֹשָׁה עָשָׂר יוֹם",
  "אַרְבָּעָה עָשָׂר יוֹם",
];

const HEBREW_EXTRA_DAYS = ["", "יוֹם אֶחָד", "שְׁנֵי יָמִים", "שְׁלֹשָׁה יָמִים",
  "אַרְבָּעָה יָמִים", "חֲמִישָּׁה יָמִים", "שִׁשָּׁה יָמִים"];

const HEBREW_WEEKS = ["", "שָׁבוּעַ אֶחָד", "שְׁנֵי שָׁבוּעוֹת", "שְׁלֹשָׁה שָׁבוּעוֹת",
  "אַרְבָּעָה שָׁבוּעוֹת", "חֲמִישָּׁה שָׁבוּעוֹת", "שִׁשָּׁה שָׁבוּעוֹת",
  "שִׁבְעָה שָׁבוּעוֹת"];

export function buildHebrewText(day: number): string {
  const prefix = "הַיּוֹם ";
  const suffix = " לָעֹמֶר";
  const weeks = Math.floor(day / 7);
  const rem = day % 7;

  if (weeks === 0) {
    return prefix + HEBREW_DAYS[day] + suffix;
  }
  if (rem === 0) {
    return prefix + HEBREW_DAYS[day] + " שֶׁהֵם " + HEBREW_WEEKS[weeks] + suffix;
  }
  return prefix + HEBREW_DAYS[day] + " שֶׁהֵם " + HEBREW_WEEKS[weeks] + " וְ" + HEBREW_EXTRA_DAYS[rem] + suffix;
}

export function getOmerDay(date: Date = new Date()): number | null {
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    il: true,
    isHebrewYear: false,
    mask: flags.OMER_COUNT,
  });
  if (events.length === 0) return null;
  const ev = events[0] as any;
  return typeof ev.getOmer === "function" ? ev.getOmer() : null;
}

function getUpcomingOmerStart(): { date: Date; daysUntil: number } | null {
  const today = new Date();
  for (let i = 1; i <= 366; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const omer = getOmerDay(d);
    if (omer === 1) {
      return { date: d, daysUntil: i };
    }
  }
  return null;
}

export default function OmerModal({ onClose }: Props) {
  const today = new Date();
  const hdate = new HDate(today);
  const omerDay = getOmerDay(today);
  const inOmer = omerDay !== null;

  const weekNum = inOmer ? Math.ceil(omerDay! / 7) : 0;
  const dayInWeek = inOmer ? ((omerDay! - 1) % 7) + 1 : 0;
  const weekSefirah = inOmer ? SEFIROT[weekNum - 1] : null;
  const daySefirah = inOmer ? SEFIROT[dayInWeek - 1] : null;
  const dimension = inOmer && daySefirah && weekSefirah
    ? `${daySefirah.en} shebe${weekSefirah.en}`
    : null;

  const hebrewText = inOmer ? buildHebrewText(omerDay!) : null;
  const progress = inOmer ? (omerDay! / 49) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (progress / 100) * circumference;

  const upcoming = !inOmer ? getUpcomingOmerStart() : null;
  const daysLeft = inOmer ? 49 - omerDay! : 0;

  function share() {
    if (!inOmer || !hebrewText) return;
    const text = [
      `✡ Sefirat HaOmer — Day ${omerDay} of 49`,
      ``,
      hebrewText,
      ``,
      `${daySefirah?.en} within ${weekSefirah?.en}`,
      `${daySefirah?.meaning} within ${weekSefirah?.meaning}`,
      ``,
      `— Sacred Calendar of Bnei Menashe`,
    ].join("\n");
    if (navigator.share) {
      navigator.share({ title: `Omer Day ${omerDay}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-card"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Sefirat HaOmer</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {hdate.render("en")}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {inOmer ? (
          <>
            {/* Progress ring */}
            <div style={{
              padding: "20px 16px", borderRadius: 18, marginBottom: 14,
              background: "linear-gradient(135deg, #0f1e38, #1a1a2e)",
              border: "1px solid rgba(212,168,67,0.25)",
              display: "flex", alignItems: "center", gap: 20,
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width="124" height="124" viewBox="0 0 124 124">
                  <circle cx="62" cy="62" r="54"
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <circle cx="62" cy="62" r="54"
                    fill="none" stroke="#d4a843" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 62 62)"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "white", lineHeight: 1 }}>{omerDay}</div>
                  <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 700, letterSpacing: "0.06em" }}>OF 49</div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#d4a843", letterSpacing: "0.12em", marginBottom: 4 }}>DAY {omerDay}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>
                  Week {weekNum} · Day {dayInWeek}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                  {daysLeft === 0 ? "Today is the last day!" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`}
                </div>
                <div style={{
                  height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${progress}%`, borderRadius: 3,
                    background: "linear-gradient(90deg, #d4a843, #f5c842)",
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                  {Math.round(progress)}% complete
                </div>
              </div>
            </div>

            {/* Hebrew text */}
            <div style={{
              padding: "16px", borderRadius: 14, marginBottom: 12,
              background: "var(--card)", border: "1px solid rgba(212,168,67,0.18)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 12 }}>
                COUNTING — סְפִירַת הָעֹמֶר
              </div>
              <div style={{
                fontFamily: "'Noto Serif Hebrew', serif", fontSize: 18,
                color: "#d4a843", lineHeight: 1.9, direction: "rtl",
                marginBottom: 12,
              }}>
                {hebrewText}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                "Today is day {DAY_NAMES_EN[omerDay!]} of the Omer
                {weekNum > 0 && ` — ${WEEK_NAMES_EN[weekNum]} week${weekNum > 1 ? "s" : ""}${dayInWeek > 0 ? ` and ${DAY_NAMES_EN[dayInWeek]} day${dayInWeek > 1 ? "s" : ""}` : ""}`}"
              </div>
            </div>

            {/* Kabbalistic dimension */}
            <div style={{
              padding: 14, borderRadius: 14, marginBottom: 12,
              background: "var(--card)", border: `1px solid ${daySefirah?.color ?? "#d4a843"}28`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 12 }}>
                KABBALISTIC DIMENSION
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
                {dimension}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10, textAlign: "center",
                  background: `${daySefirah?.color}18`, border: `1px solid ${daySefirah?.color}30`,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: daySefirah?.color, marginBottom: 4 }}>TODAY'S QUALITY</div>
                  <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 18, color: daySefirah?.color, marginBottom: 2 }}>{daySefirah?.he}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{daySefirah?.en}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{daySefirah?.meaning}</div>
                </div>
                <div style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10, textAlign: "center",
                  background: `${weekSefirah?.color}18`, border: `1px solid ${weekSefirah?.color}30`,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: weekSefirah?.color, marginBottom: 4 }}>THIS WEEK'S THEME</div>
                  <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 18, color: weekSefirah?.color, marginBottom: 2 }}>{weekSefirah?.he}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{weekSefirah?.en}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{weekSefirah?.meaning}</div>
                </div>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {OMER_WEEKS[weekNum - 1]}
                </div>
              </div>
            </div>

            {/* 7-week map */}
            <div style={{ padding: 14, borderRadius: 14, marginBottom: 12, background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 12 }}>THE 7 WEEKS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SEFIROT.map((s, i) => {
                  const wk = i + 1;
                  const startDay = (wk - 1) * 7 + 1;
                  const endDay = wk * 7;
                  const isCurrent = wk === weekNum;
                  const isPast = wk < weekNum;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                      borderRadius: 8,
                      background: isCurrent ? `${s.color}12` : "transparent",
                      border: `1px solid ${isCurrent ? s.color + "30" : "transparent"}`,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: isPast ? "#334155" : isCurrent ? s.color : "rgba(255,255,255,0.1)",
                      }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {s.en}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
                          Days {startDay}–{endDay}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 13, color: isCurrent ? s.color : "#334155" }}>{s.he}</div>
                      {isPast && <span style={{ fontSize: 10, color: "#4ade80" }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <button
                onClick={share}
                style={{
                  flex: 1, padding: "12px 0",
                  background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
                  borderRadius: 12, color: "#d4a843", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                ↑ Share Today's Count
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: "12px 0",
                  background: "var(--elevated)", border: "1px solid var(--border)",
                  borderRadius: 12, color: "var(--text-secondary)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          /* Not in the Omer period */
          <div>
            <div style={{
              padding: 24, borderRadius: 18, marginBottom: 14, textAlign: "center",
              background: "linear-gradient(135deg, #0f1e38, #1a1a2e)",
              border: "1px solid rgba(212,168,67,0.2)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌾</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 6 }}>
                Not in the Omer Period
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                Sefirat HaOmer is counted during the 49 days between Pesach and Shavuot.
              </div>
              {upcoming && (
                <div style={{
                  marginTop: 16, padding: "12px 16px", borderRadius: 12,
                  background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#d4a843", letterSpacing: "0.08em", marginBottom: 4 }}>NEXT OMER BEGINS</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>
                    {upcoming.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                    in {upcoming.daysUntil} day{upcoming.daysUntil !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* The 7 weeks preview */}
            <div style={{ padding: 14, borderRadius: 14, marginBottom: 12, background: "var(--card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 12 }}>THE 7 SEFIROT WEEKS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SEFIROT.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 8, background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                    <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 16, color: s.color, width: 40, textAlign: "right", flexShrink: 0 }}>{s.he}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{s.en}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Week {i + 1} · {s.meaning}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={onClose} className="btn-close-full">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
