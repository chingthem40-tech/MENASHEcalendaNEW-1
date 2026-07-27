import { useState, useRef, useEffect } from "react";
import { HDate, HebrewCalendar, flags, months } from "@hebcal/core";

interface Props { onClose: () => void; }

const HEBREW_MONTHS_EN = [
  "", "Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul",
  "Tishrei", "Cheshvan", "Kislev", "Tevet", "Shevat",
  "Adar", "Adar I", "Adar II",
];

function hebrewMonthName(m: number, isLeap: boolean): string {
  if (m === months.ADAR_I && !isLeap) return "Adar";
  return HEBREW_MONTHS_EN[m] ?? "Unknown";
}

interface LuachEvent {
  date: Date;
  hdate: HDate;
  title: string;
  flag: number;
}

interface MonthGroup {
  gregMonth: string;   // "June 2026"
  hebrewMonth: string; // "Sivan 5786"
  events: LuachEvent[];
}

function flagMeta(flag: number): { emoji: string; color: string; bg: string; badge: string } {
  if (flag & flags.CHAG)              return { emoji: "✡", color: "#d4a843", bg: "rgba(212,168,67,0.10)", badge: "Holiday" };
  if (flag & flags.MAJOR_FAST)        return { emoji: "💧", color: "#60a5fa", bg: "rgba(96,165,250,0.09)", badge: "Fast" };
  if (flag & flags.MINOR_FAST)        return { emoji: "💧", color: "#a78bfa", bg: "rgba(167,139,250,0.09)", badge: "Fast" };
  if (flag & flags.ROSH_CHODESH)      return { emoji: "🌙", color: "#4ade80", bg: "rgba(74,222,128,0.09)", badge: "Rosh Chodesh" };
  if (flag & flags.CHANUKAH_CANDLES)  return { emoji: "🕎", color: "#facc15", bg: "rgba(250,204,21,0.09)", badge: "Chanukah" };
  if (flag & flags.PARSHA_HASHAVUA)  return { emoji: "📖", color: "#fb923c", bg: "rgba(251,146,60,0.09)", badge: "Parasha" };
  if (flag & flags.SHABBAT_MEVARCHIM) return { emoji: "🌙", color: "#818cf8", bg: "rgba(129,140,248,0.09)", badge: "Mevarchim" };
  if (flag & flags.OMER_COUNT)        return { emoji: "🌾", color: "#f472b6", bg: "rgba(244,114,182,0.09)", badge: "Omer" };
  return { emoji: "📅", color: "var(--text-muted)", bg: "rgba(255,255,255,0.04)", badge: "" };
}

function buildLuach(hebrewYear: number): MonthGroup[] {
  const hStart = new HDate(1, months.TISHREI, hebrewYear);
  const hEnd   = new HDate(29, months.ELUL,   hebrewYear);
  const gStart = hStart.greg();
  const gEnd   = hEnd.greg();

  const rawEvents = HebrewCalendar.calendar({
    start: gStart,
    end:   gEnd,
    sedrot: true,
    omer: false,          // omit daily omer for brevity
    shabbatMevarchim: true,
    noModern: false,
    il: false,
  });

  // Group by Gregorian month-year
  const map = new Map<string, MonthGroup>();

  for (const ev of rawEvents) {
    const d = ev.getDate().greg();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const gregLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const hd = ev.getDate();
    const heLabel = `${hebrewMonthName(hd.getMonth(), hd.isLeapYear())} ${hebrewYear}`;

    if (!map.has(key)) map.set(key, { gregMonth: gregLabel, hebrewMonth: heLabel, events: [] });
    map.get(key)!.events.push({
      date: d,
      hdate: hd,
      title: ev.render("en"),
      flag: ev.getFlags(),
    });
  }

  return Array.from(map.values());
}

function currentHebrewYear(): number {
  return new HDate(new Date()).getFullYear();
}

export default function LuachModal({ onClose }: Props) {
  const [year, setYear] = useState(currentHebrewYear());
  const groups = buildLuach(year);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const todayRef = useRef<HTMLDivElement | null>(null);

  // Scroll to today's month on open
  useEffect(() => {
    setTimeout(() => todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
  }, [year]);

  const weekdayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Shabbat"];

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-card"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "94vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}
      >
        {/* ── Fixed header ── */}
        <div style={{ padding: "16px 16px 0", flexShrink: 0 }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Luach</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Full year Jewish calendar</div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Year switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button
              onClick={() => setYear(y => y - 1)}
              style={{
                width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(212,168,67,0.25)",
                background: "rgba(212,168,67,0.08)", color: "var(--text-primary)",
                fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >‹</button>

            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#d4a843", letterSpacing: "-0.5px" }}>
                {year} AM
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                {new HDate(1, months.TISHREI, year).greg().getFullYear()}
                {" – "}
                {new HDate(29, months.ELUL, year).greg().getFullYear()}
              </div>
            </div>

            <button
              onClick={() => setYear(y => y + 1)}
              style={{
                width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(212,168,67,0.25)",
                background: "rgba(212,168,67,0.08)", color: "var(--text-primary)",
                fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >›</button>

            {year !== currentHebrewYear() && (
              <button
                onClick={() => setYear(currentHebrewYear())}
                style={{
                  padding: "6px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                  background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.25)",
                  color: "#d4a843", cursor: "pointer",
                }}
              >Today</button>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {[
              { emoji: "✡", label: "Holiday",    color: "#d4a843" },
              { emoji: "📖", label: "Parasha",    color: "#fb923c" },
              { emoji: "🌙", label: "Rosh Chodesh", color: "#4ade80" },
              { emoji: "💧", label: "Fast Day",   color: "#60a5fa" },
              { emoji: "🕎", label: "Chanukah",   color: "#facc15" },
            ].map(l => (
              <div key={l.label} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 9px", borderRadius: 99,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontSize: 11 }}>{l.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: l.color }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable event list ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
          {groups.map(group => {
            const isCurrentMonth = group.gregMonth === today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            return (
              <div
                key={group.gregMonth}
                ref={isCurrentMonth ? todayRef : undefined}
                style={{ marginBottom: 20 }}
              >
                {/* Month header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: 12, marginBottom: 8,
                  background: isCurrentMonth
                    ? "linear-gradient(90deg, rgba(212,168,67,0.18), rgba(212,168,67,0.06))"
                    : "rgba(255,255,255,0.04)",
                  border: isCurrentMonth
                    ? "1px solid rgba(212,168,67,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: isCurrentMonth ? "#d4a843" : "var(--text-primary)" }}>
                      {group.gregMonth}
                      {isCurrentMonth && (
                        <span style={{
                          marginLeft: 8, fontSize: 9, fontWeight: 900, letterSpacing: "0.1em",
                          color: "#d4a843", background: "rgba(212,168,67,0.15)",
                          border: "1px solid rgba(212,168,67,0.3)", borderRadius: 4, padding: "2px 6px",
                        }}>NOW</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginTop: 1 }}>
                      {group.hebrewMonth}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                    {group.events.length} events
                  </div>
                </div>

                {/* Events for this month */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.events.map((ev, i) => {
                    const { emoji, color, bg, badge } = flagMeta(ev.flag);
                    const isToday = ev.date.toDateString() === today.toDateString();
                    const dow = ev.date.getDay();
                    const isShabbat = dow === 6;
                    const dayLabel = isShabbat ? "Shabbat" : weekdayAbbr[dow];
                    const dateNum = ev.date.getDate();

                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 12,
                        background: isToday ? "rgba(212,168,67,0.1)" : bg,
                        border: isToday
                          ? "1px solid rgba(212,168,67,0.4)"
                          : `1px solid ${color}22`,
                        boxShadow: isToday ? "0 0 14px rgba(212,168,67,0.12)" : "none",
                      }}>
                        {/* Date pill */}
                        <div style={{
                          flexShrink: 0, textAlign: "center",
                          width: 42, padding: "4px 0",
                          borderRadius: 9,
                          background: isToday ? "rgba(212,168,67,0.2)" : "rgba(255,255,255,0.05)",
                          border: isToday ? "1px solid rgba(212,168,67,0.4)" : "1px solid rgba(255,255,255,0.08)",
                        }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: isToday ? "#d4a843" : "var(--text-primary)", lineHeight: 1.1 }}>
                            {dateNum}
                          </div>
                          <div style={{ fontSize: 8, fontWeight: 800, color: isShabbat ? "#d4a843" : "var(--text-muted)", letterSpacing: "0.05em" }}>
                            {dayLabel}
                          </div>
                        </div>

                        {/* Emoji icon */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: `${color}15`, border: `1px solid ${color}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16,
                        }}>
                          {emoji}
                        </div>

                        {/* Title + badge */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {ev.title}
                            {isToday && (
                              <span style={{
                                marginLeft: 6, fontSize: 8, fontWeight: 900, letterSpacing: "0.08em",
                                color: "#d4a843", verticalAlign: "middle",
                                background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)",
                                borderRadius: 4, padding: "1px 5px",
                              }}>TODAY</span>
                            )}
                          </div>
                          {badge && (
                            <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 2 }}>
                              {badge}
                            </div>
                          )}
                        </div>

                        {/* Hebrew date */}
                        <div style={{
                          flexShrink: 0, textAlign: "right",
                          fontFamily: "'Noto Serif Hebrew', serif",
                          fontSize: 13, color: "rgba(212,168,67,0.6)",
                        }}>
                          {ev.hdate.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
