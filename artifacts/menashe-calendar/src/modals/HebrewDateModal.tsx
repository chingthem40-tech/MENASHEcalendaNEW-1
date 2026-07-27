import { useState } from "react";
import { HDate, HebrewCalendar, flags, months } from "@hebcal/core";

interface Props { onClose: () => void; }

const HEBREW_MONTHS = [
  "Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul",
  "Tishrei", "Cheshvan", "Kislev", "Tevet", "Shevat", "Adar",
  "Adar I", "Adar II",
];

const HOLIDAY_FLAG_LABELS: Record<number, string> = {
  [flags.CHAG]:           "Major Holiday",
  [flags.ROSH_CHODESH]:   "Rosh Chodesh",
  [flags.MINOR_FAST]:     "Minor Fast",
  [flags.MAJOR_FAST]:     "Major Fast",
  [flags.PARSHA_HASHAVUA]: "Torah Portion",
  [flags.OMER_COUNT]:     "Sefirat HaOmer",
  [flags.YOM_TOV_ENDS]:   "Yom Tov Ends",
  [flags.CHANUKAH_CANDLES]: "Chanukah",
  [flags.SHABBAT_MEVARCHIM]: "Shabbat Mevarchim",
};

function flagLabel(flag: number): string {
  for (const [k, v] of Object.entries(HOLIDAY_FLAG_LABELS)) {
    if (flag & Number(k)) return v;
  }
  return "Special Day";
}

function flagColor(flag: number): { color: string; bg: string } {
  if (flag & flags.CHAG)             return { color: "#d4a843", bg: "rgba(212,168,67,0.12)" };
  if (flag & flags.MAJOR_FAST)       return { color: "#60a5fa", bg: "rgba(96,165,250,0.10)" };
  if (flag & flags.MINOR_FAST)       return { color: "#a78bfa", bg: "rgba(167,139,250,0.10)" };
  if (flag & flags.ROSH_CHODESH)     return { color: "#4ade80", bg: "rgba(74,222,128,0.10)" };
  if (flag & flags.PARSHA_HASHAVUA) return { color: "#fb923c", bg: "rgba(251,146,60,0.10)" };
  if (flag & flags.OMER_COUNT)       return { color: "#f472b6", bg: "rgba(244,114,182,0.10)" };
  if (flag & flags.CHANUKAH_CANDLES) return { color: "#facc15", bg: "rgba(250,204,21,0.10)" };
  return { color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)" };
}

function formatGregorianDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function hebrewMonthName(hd: HDate): string {
  const m = hd.getMonth();
  const isLeap = HDate.isLeapYear(hd.getFullYear());
  if (m === months.ADAR_I && !isLeap) return "Adar";
  return HEBREW_MONTHS[m - 1] ?? hd.getMonthName();
}

function hebrewDateDisplay(hd: HDate): string {
  return `${hd.getDate()} ${hebrewMonthName(hd)} ${hd.getFullYear()}`;
}

function getEvents(date: Date) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return HebrewCalendar.calendar({
    start,
    end,
    sedrot: true,
    omer: true,
    shabbatMevarchim: true,
    noModern: false,
    il: false,
  });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HebrewDateModal({ onClose }: Props) {
  const [inputDate, setInputDate] = useState(todayStr());
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const gregorianDate = new Date(inputDate + "T12:00:00");
  const validDate = !isNaN(gregorianDate.getTime());

  let hdate: HDate | null = null;
  let events: ReturnType<typeof getEvents> = [];
  try {
    if (validDate) {
      hdate = new HDate(gregorianDate);
      events = getEvents(gregorianDate);
    }
  } catch { /* ignore */ }

  const parasha = events.find(e => e.getFlags() & flags.PARSHA_HASHAVUA);
  const omerEvent = events.find(e => e.getFlags() & flags.OMER_COUNT);
  const otherEvents = events.filter(e =>
    !(e.getFlags() & flags.PARSHA_HASHAVUA) && !(e.getFlags() & flags.OMER_COUNT)
  );

  const weekday = gregorianDate.toLocaleDateString("en-US", { weekday: "long" });
  const hebrewWeekdays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const hebrewWeekday = hebrewWeekdays[gregorianDate.getDay()];
  const isShabbat = gregorianDate.getDay() === 6;

  function handleShare() {
    const lines = [
      `📅 Hebrew Date Conversion`,
      ``,
      `🗓 ${formatGregorianDate(gregorianDate)}`,
      hdate ? `✡ ${hebrewDateDisplay(hdate)} (${hdate.render("he")})` : null,
      ``,
      parasha ? `📖 Parasha: ${parasha.render("en")}` : null,
      omerEvent ? `🌸 ${omerEvent.render("en")}` : null,
      otherEvents.length ? `🕍 ${otherEvents.map(e => e.render("en")).join(", ")}` : null,
      ``,
      `— Sacred Calendar of Bnei Menashe`,
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      navigator.share({ title: "Hebrew Date", text: lines }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(lines).then(() => {
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
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Hebrew Date</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Convert any date to the Jewish calendar</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── Date picker ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>
            SELECT DATE
          </div>
          <input
            type="date"
            value={inputDate}
            onChange={e => setInputDate(e.target.value)}
            style={{
              width: "100%", padding: "13px 14px", borderRadius: 14, boxSizing: "border-box",
              background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.35)",
              color: "var(--text-primary)", fontSize: 16, fontWeight: 600, outline: "none",
            }}
          />
        </div>

        {/* ── Result card ── */}
        {hdate ? (
          <div style={{
            borderRadius: 18, overflow: "hidden", marginBottom: 14,
            background: "linear-gradient(135deg, #1a1000, #0d0d00)",
            border: "1px solid rgba(212,168,67,0.25)",
          }}>
            {/* Hebrew display bar */}
            <div style={{
              padding: "18px 18px 14px",
              borderBottom: "1px solid rgba(212,168,67,0.12)",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'Noto Serif Hebrew', serif",
                fontSize: 28, fontWeight: 900,
                color: "#d4a843", direction: "rtl", lineHeight: 1.3,
                marginBottom: 6,
              }}>
                {hdate.render("he")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
                {hebrewDateDisplay(hdate)}
              </div>
            </div>

            {/* Gregorian ↔ Hebrew details grid */}
            <div style={{ display: "flex", gap: 0 }}>
              {[
                { label: "WEEKDAY",      val: weekday,                       sub: hebrewWeekday },
                { label: "HEBREW MONTH", val: hebrewMonthName(hdate),        sub: `${hdate.getDate()} of the month` },
                { label: "HEBREW YEAR",  val: hdate.getFullYear().toString(), sub: hdate.isLeapYear() ? "Leap year" : "Regular year" },
              ].map((item, i) => (
                <div key={i} style={{
                  flex: 1, padding: "12px 10px", textAlign: "center",
                  borderRight: i < 2 ? "1px solid rgba(212,168,67,0.1)" : "none",
                }}>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.12em", color: "rgba(212,168,67,0.5)", marginBottom: 5 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
                    {item.val}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontFamily: item.sub === hebrewWeekday ? "'Noto Serif Hebrew',serif" : undefined, direction: item.sub === hebrewWeekday ? "rtl" : undefined }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0 14px", color: "var(--text-muted)", fontSize: 13 }}>
            Please select a valid date above.
          </div>
        )}

        {/* ── Shabbat banner ── */}
        {isShabbat && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            borderRadius: 12, marginBottom: 14,
            background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)",
          }}>
            <span style={{ fontSize: 22 }}>🕯</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#d4a843" }}>Shabbat</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>This is Shabbat — a day of rest and holiness</div>
            </div>
          </div>
        )}

        {/* ── Parasha ── */}
        {parasha && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 14px",
            borderRadius: 14, marginBottom: 10,
            background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)",
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📖</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", color: "rgba(251,146,60,0.7)", marginBottom: 3 }}>
                PARASHAT HASHAVUA
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                {parasha.render("en")}
              </div>
            </div>
          </div>
        )}

        {/* ── Omer ── */}
        {omerEvent && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 14px",
            borderRadius: 14, marginBottom: 10,
            background: "rgba(244,114,182,0.07)", border: "1px solid rgba(244,114,182,0.2)",
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: "rgba(244,114,182,0.15)", border: "1px solid rgba(244,114,182,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🌸</div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", color: "rgba(244,114,182,0.7)", marginBottom: 3 }}>
                SEFIRAT HAOMER
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {omerEvent.render("en")}
              </div>
            </div>
          </div>
        )}

        {/* ── Other events / holidays ── */}
        {otherEvents.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 8 }}>
              {otherEvents.length === 1 ? "OBSERVANCE" : "OBSERVANCES"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {otherEvents.map((ev, i) => {
                const { color, bg } = flagColor(ev.getFlags());
                const typeLabel = flagLabel(ev.getFlags());
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderRadius: 14, background: bg, border: `1px solid ${color}30`,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                      background: `${color}18`, border: `1px solid ${color}35`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>✡</div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", color, marginBottom: 3, textTransform: "uppercase" }}>
                        {typeLabel}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        {ev.render("en")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No events note */}
        {events.length === 0 && (
          <div style={{
            textAlign: "center", padding: "20px 0 14px",
            color: "var(--text-muted)", fontSize: 13,
          }}>
            No special observances on this date.
          </div>
        )}

        {/* ── Quick-jump buttons ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Today", fn: () => setInputDate(todayStr()) },
            { label: "← Prev", fn: () => {
              const d = new Date(inputDate + "T12:00:00");
              d.setDate(d.getDate() - 1);
              setInputDate(d.toISOString().slice(0, 10));
            }},
            { label: "Next →", fn: () => {
              const d = new Date(inputDate + "T12:00:00");
              d.setDate(d.getDate() + 1);
              setInputDate(d.toISOString().slice(0, 10));
            }},
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.fn}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 11, fontSize: 13, fontWeight: 700,
                background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)",
                color: "var(--text-secondary)", cursor: "pointer",
              }}
            >{btn.label}</button>
          ))}
        </div>

        {/* Share button */}
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
              : "1px solid rgba(212,168,67,0.35)",
            color: shareState === "copied" ? "white" : "#1a0900",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            transition: "background 0.3s, color 0.3s",
          }}
        >
          {shareState === "copied" ? (
            <><span>✅</span><span>Copied to clipboard!</span></>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>Share This Date</span>
            </>
          )}
        </button>

        <button onClick={onClose} className="btn-close-full">Close</button>
      </div>
    </div>
  );
}
