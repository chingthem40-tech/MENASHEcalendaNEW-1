import { useState } from "react";
import { HDate } from "@hebcal/core";
import { calculateZmanim, formatTime } from "../lib/zmanim";
import { Location } from "../lib/locations";

interface Props {
  onClose: () => void;
  location: Location;
  onSettings: () => void;
}

interface PrayerWindow {
  key: string;
  nameEn: string;
  nameHe: string;
  transliteration: string;
  emoji: string;
  accentColor: string;
  accentBg: string;
  windowStart: Date | null;
  windowEnd: Date | null;
  idealStart: Date | null;
  idealEnd: Date | null;
  description: string;
  bneiMenasheNote: string;
}

type PrayerStatus = "missed" | "now" | "ideal" | "upcoming" | "later-today";

function getPrayerStatus(now: Date, start: Date | null, end: Date | null, idealStart: Date | null, idealEnd: Date | null): PrayerStatus {
  if (!start || !end) return "upcoming";
  if (now >= end) return "missed";
  if (now < start) return "upcoming";
  if (idealStart && idealEnd && now >= idealStart && now <= idealEnd) return "ideal";
  return "now";
}

function StatusBadge({ status }: { status: PrayerStatus }) {
  const cfg: Record<PrayerStatus, { label: string; color: string; bg: string }> = {
    missed:    { label: "Missed",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    now:       { label: "Open Now", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    ideal:     { label: "✦ Ideal Time", color: "#d4a843", bg: "rgba(212,168,67,0.15)" },
    upcoming:  { label: "Upcoming", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
    "later-today": { label: "Later Today", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  };
  const { label, color, bg } = cfg[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
      color, background: bg, padding: "3px 8px", borderRadius: 6,
      border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  );
}

function timeRange(a: Date | null, b: Date | null, tz: string): string {
  if (!a || !b) return "--:-- – --:--";
  return `${formatTime(a, tz)} – ${formatTime(b, tz)}`;
}

export default function PrayerTimesModal({ onClose, location, onSettings }: Props) {
  const today = new Date();
  const hdate = new HDate(today);
  const z = calculateZmanim(today, location.lat, location.lng);
  const tz = location.tz;
  const now = new Date();
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const prayers: PrayerWindow[] = [
    {
      key: "shacharit",
      nameEn: "Shacharit",
      nameHe: "שַׁחֲרִית",
      transliteration: "Morning Prayer",
      emoji: "🌅",
      accentColor: "#fb923c",
      accentBg: "rgba(251,146,60,0.08)",
      windowStart: z.alotHaShachar,
      windowEnd: z.latestShacharit,
      idealStart: z.sunrise,
      idealEnd: z.latestShema,
      description: "Shacharit spans from dawn until the end of the 4th halachic hour. The ideal window (sunrise to end of Shema) earns the fullest spiritual merit.",
      bneiMenasheNote: "The Bnei Menashe tradition weaves ancient Kuki-Chin melodies into morning prayers, greeting the sunrise with songs passed down through generations of longing for return to Zion.",
    },
    {
      key: "mincha",
      nameEn: "Mincha",
      nameHe: "מִנְחָה",
      transliteration: "Afternoon Prayer",
      emoji: "🌤",
      accentColor: "#d4a843",
      accentBg: "rgba(212,168,67,0.08)",
      windowStart: z.minchaGedolah,
      windowEnd: z.sunset,
      idealStart: z.minchaKetana,
      idealEnd: z.plagHamincha,
      description: "Mincha is accepted from Mincha Gedolah onwards. The ideal window (Mincha Ketana to Plag) reflects the moment of the afternoon Tamid offering in the Temple.",
      bneiMenasheNote: "Mincha holds special significance — Elijah's prayer at Mount Carmel was said at Mincha time. The Bnei Menashe pause work and face Jerusalem for this brief but powerful prayer.",
    },
    {
      key: "maariv",
      nameEn: "Maariv",
      nameHe: "מַעֲרִיב",
      transliteration: "Evening Prayer",
      emoji: "🌙",
      accentColor: "#818cf8",
      accentBg: "rgba(129,140,248,0.08)",
      windowStart: z.tzais,
      windowEnd: null,
      idealStart: z.tzais,
      idealEnd: null,
      description: "Maariv begins at nightfall (Tzait HaKochavim — when 3 stars appear) and may be recited until dawn, though ideally in the early evening.",
      bneiMenasheNote: "The evening prayer closes the day's circuit. Bnei Menashe communities in Manipur and Mizoram traditionally gather for Maariv together, reinforcing communal bonds under the same stars their ancestors saw in Israel.",
    },
  ];

  const isFriday = today.getDay() === 5;
  const isShabbat = today.getDay() === 6;

  function handleShare() {
    const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const hebrewDate = hdate.render("en");

    const lines = [
      `🕍 Prayer Times — ${dateStr}`,
      `📅 ${hebrewDate}`,
      `📍 ${location.name}`,
      ``,
      `🌅 Sunrise:   ${formatTime(z.sunrise, tz)}`,
      `☀️  Chatzot:  ${formatTime(z.chatzot, tz)}`,
      `🌇 Sunset:    ${formatTime(z.sunset, tz)}`,
      `🌙 Nightfall: ${formatTime(z.tzais, tz)}`,
      ``,
      `🌅 Shacharit`,
      `   Window: ${z.alotHaShachar && z.latestShacharit ? formatTime(z.alotHaShachar, tz) + " – " + formatTime(z.latestShacharit, tz) : "--"}`,
      `   ✦ Ideal: ${z.sunrise && z.latestShema ? formatTime(z.sunrise, tz) + " – " + formatTime(z.latestShema, tz) : "--"}`,
      ``,
      `🌤 Mincha`,
      `   Window: ${z.minchaGedolah && z.sunset ? formatTime(z.minchaGedolah, tz) + " – " + formatTime(z.sunset, tz) : "--"}`,
      `   ✦ Ideal: ${z.minchaKetana && z.plagHamincha ? formatTime(z.minchaKetana, tz) + " – " + formatTime(z.plagHamincha, tz) : "--"}`,
      ``,
      `🌙 Maariv`,
      `   From: ${z.tzais ? formatTime(z.tzais, tz) + " onwards" : "--"}`,
      ...(isFriday ? [``, `🕯 Erev Shabbat — Maariv begins Shabbat tonight`] : []),
      ...(isShabbat ? [``, `🕯 Shabbat ends at ${formatTime(z.tzais, tz)}`] : []),
      ``,
      `— Sacred Calendar of Bnei Menashe`,
    ];

    const text = lines.join("\n");

    if (navigator.share) {
      navigator.share({ title: `Prayer Times — ${location.name}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2500);
      }).catch(() => {});
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
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Prayer Times</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {hdate.render("en")} · {location.name}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {(isFriday || isShabbat) && (
          <div style={{
            marginBottom: 12, padding: "10px 14px", borderRadius: 10,
            background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🕯</span>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {isShabbat ? "Shabbat — Maariv ends Shabbat at " + formatTime(z.tzais, tz) : "Erev Shabbat — Maariv begins Shabbat tonight"}
            </div>
          </div>
        )}

        {/* Halachic hour info */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 14,
        }}>
          {[
            { label: "SUNRISE", val: formatTime(z.sunrise, tz), emoji: "🌅" },
            { label: "CHATZOT", val: formatTime(z.chatzot, tz), emoji: "☀️" },
            { label: "SUNSET", val: formatTime(z.sunset, tz), emoji: "🌇" },
            { label: "NIGHTFALL", val: formatTime(z.tzais, tz), emoji: "🌙" },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center",
              background: "var(--card)", border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 13, marginBottom: 2 }}>{item.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{item.val}</div>
              <div style={{ fontSize: 8, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.08em", marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Prayer cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          {prayers.map(p => {
            const status = getPrayerStatus(now, p.windowStart, p.windowEnd, p.idealStart, p.idealEnd);
            const isActive = status === "now" || status === "ideal";
            return (
              <div key={p.key} style={{
                borderRadius: 16, overflow: "hidden",
                border: `1px solid ${isActive ? p.accentColor + "40" : "var(--border)"}`,
                background: isActive ? p.accentBg : "var(--card)",
                boxShadow: isActive ? `0 0 20px ${p.accentColor}18` : "none",
                transition: "all 0.2s",
              }}>
                {/* Card header */}
                <div style={{
                  padding: "12px 14px 10px",
                  borderBottom: `1px solid ${isActive ? p.accentColor + "20" : "var(--border)"}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                    background: `${p.accentColor}18`, border: `1px solid ${p.accentColor}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>
                    {p.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>{p.nameEn}</span>
                      <span style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 16, color: p.accentColor }}>{p.nameHe}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.transliteration}</div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Time windows */}
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{
                      flex: 1, padding: "8px 10px", borderRadius: 9,
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 4 }}>WINDOW</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        {p.windowEnd
                          ? timeRange(p.windowStart, p.windowEnd, tz)
                          : (formatTime(p.windowStart, tz) + " onwards")}
                      </div>
                    </div>
                    {p.idealStart && (
                      <div style={{
                        flex: 1, padding: "8px 10px", borderRadius: 9,
                        background: `${p.accentColor}10`, border: `1px solid ${p.accentColor}25`,
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: p.accentColor, marginBottom: 4 }}>✦ IDEAL</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                          {p.idealEnd
                            ? timeRange(p.idealStart, p.idealEnd, tz)
                            : formatTime(p.idealStart, tz) + " onwards"}
                        </div>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 8px" }}>
                    {p.description}
                  </p>

                  <div style={{
                    padding: "8px 10px", borderRadius: 9,
                    background: `${p.accentColor}08`, border: `1px solid ${p.accentColor}18`,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: p.accentColor, marginBottom: 4 }}>✡ BNEI MENASHE TRADITION</div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                      {p.bneiMenasheNote}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Halachic hour display */}
        <div style={{
          padding: "12px 14px", borderRadius: 12, marginBottom: 14,
          background: "var(--card)", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 8 }}>
            HALACHIC HOUR (שָׁעָה זְמַנִּית)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-1px" }}>
              {Math.round(z.shaahZmanitGra)}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>minutes</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            One halachic hour today in {location.name} — all prayer deadlines are calculated from this unit
          </div>
        </div>

        {/* Reminder nudge */}
        <div
          onClick={() => { onSettings(); onClose(); }}
          style={{
            padding: "12px 14px", borderRadius: 12, marginBottom: 4,
            background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)",
            display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 20 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Enable Prayer Reminders</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Get notified at the start of each prayer window · Settings</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "14px 0", borderRadius: 12, marginTop: 12, marginBottom: 10,
            background: shareState === "copied"
              ? "linear-gradient(90deg, #166534, #16a34a)"
              : "linear-gradient(135deg, #1a3a6b, #2451a8)",
            border: shareState === "copied"
              ? "1px solid rgba(74,222,128,0.4)"
              : "1px solid rgba(59,130,246,0.35)",
            color: "white", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
            transition: "background 0.3s, border 0.3s",
          }}
        >
          {shareState === "copied" ? (
            <>
              <span>✅</span>
              <span>Copied to clipboard!</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>Share Today's Prayer Times</span>
            </>
          )}
        </button>

        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
