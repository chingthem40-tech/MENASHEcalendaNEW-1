import { useState, useMemo, memo } from "react";
import { HebrewCalendar, flags } from "@hebcal/core";
import { getMonthCalendar, hebrewDayNumeral, getHebrewMonthsBetween, type CalendarDay } from "../lib/hebrewCalendar";
import { Location } from "../lib/locations";
import { calculateZmanim, formatTime } from "../lib/zmanim";
import { getUpcomingParashiyot } from "../lib/parasha";
import { getOmerDay } from "../modals/OmerModal";
import { getYahrzeitEntries, getYahrzeitDatesForMonth } from "../lib/yahrzeit";

interface CalendarPageProps {
  location: Location;
  onNavigate: (page: string) => void;
  onDayClick: (day: number, month: number, year: number) => void;
  onLocationClick: () => void;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAY_HEADERS: { en: string; he: string }[] = [
  { en: "Sun", he: "ראשון" },
  { en: "Mon", he: "שני" },
  { en: "Tue", he: "שלישי" },
  { en: "Wed", he: "רביעי" },
  { en: "Thu", he: "חמישי" },
  { en: "Fri", he: "שישי" },
  { en: "Sat", he: "שבת" },
];

const CalendarPage = memo(function CalendarPage({ location, onNavigate, onDayClick, onLocationClick }: CalendarPageProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const days: CalendarDay[] = getMonthCalendar(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const hebrewMonths = getHebrewMonthsBetween(new Date(year, month, 1), new Date(year, month + 1, 0));

  // Month-level summary: shabbatot, holidays, parashiyot
  const monthStats = useMemo(() => {
    const shabbatot = days.filter(d => d.isShabbat).length;
    const holidays = days.filter(d =>
      d.events.some(e => !e.toLowerCase().includes("rosh chodesh") && !e.toLowerCase().includes("parashat"))
    ).length;
    // Parashiyot that fall inside this month
    const firstOfMonth = new Date(year, month, 1);
    const upcoming = getUpcomingParashiyot(firstOfMonth, 6);
    const monthParashiyot = upcoming.filter((p: { name: string; date: Date; hebrewName: string }) => {
      const shabbat = new Date(p.date);
      return shabbat.getFullYear() === year && shabbat.getMonth() === month;
    });
    return { shabbatot, holidays, parashiyot: monthParashiyot };
  }, [year, month, days]);

  // Pre-compute candle-lighting times for every Friday in the month
  const candleLightingMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const day of days) {
      if (day.date.getDay() === 5) {
        const z = calculateZmanim(day.date, location.lat, location.lng);
        if (z.candleLighting) map[day.gregorianDay] = formatTime(z.candleLighting, location.tz);
      }
    }
    return map;
  }, [year, month, location]);

  const fastMap = useMemo(() => {
    const set = new Set<number>();
    try {
      const events = HebrewCalendar.calendar({
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0),
        il: true, isHebrewYear: false,
        mask: flags.MINOR_FAST | flags.MAJOR_FAST,
      });
      for (const ev of events) {
        const d = ev.getDate().greg();
        if (d.getMonth() === month && d.getFullYear() === year) set.add(d.getDate());
      }
    } catch {}
    return set;
  }, [year, month]);

  const omerMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const d of days) {
      const o = getOmerDay(d.date);
      if (o !== null) map[d.gregorianDay] = o;
    }
    return map;
  }, [days]);

  const yahrzeitMap = useMemo(() => {
    const entries = getYahrzeitEntries();
    return getYahrzeitDatesForMonth(year, month, entries);
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  function handleDayClick(gregorianDay: number) {
    if (selectedDay === gregorianDay) {
      onDayClick(gregorianDay, month, year);
    } else {
      setSelectedDay(gregorianDay);
    }
  }

  const selectedDayData = selectedDay !== null ? days.find(d => d.gregorianDay === selectedDay) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── App Header ── */}
      <div className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Benei Menashe Calendar" style={{ height: 38, width: 38, objectFit: "contain", borderRadius: 8 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>Benei Menashe</div>
            <div style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.15em", fontWeight: 700 }}>CALENDAR</div>
          </div>
        </div>
        <button
          onClick={onLocationClick}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "var(--elevated)", border: "1px solid var(--border)",
            borderRadius: 99, padding: "5px 12px", cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 11 }}>📍</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{location.name}</span>
        </button>
      </div>

      {/* ── Calendar Card ── */}
      <div style={{ padding: "8px 8px 0", flex: 1, overflowY: "auto" }}>
        <div style={{
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 10,
          boxShadow: "0 6px 32px rgba(0,0,0,0.55)",
          border: "1px solid #1a2744",
        }}>

          {/* ── Gold Month Banner ── */}
          <div style={{
            background: "linear-gradient(135deg, #c9920a 0%, #d4a843 50%, #b8860b 100%)",
            padding: "13px 16px 11px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button
              onClick={prevMonth}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.25)",
                cursor: "pointer", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, lineHeight: 1, fontWeight: 300,
              }}
            >‹</button>

            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{
                fontSize: 17, fontWeight: 900, color: "#fff",
                letterSpacing: "0.06em", lineHeight: 1,
                textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}>
                {MONTHS[month].toUpperCase()} {year}
              </div>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.88)", marginTop: 4,
                letterSpacing: "0.12em", fontWeight: 700,
                fontFamily: "'Noto Serif Hebrew', serif",
              }}>
                — {hebrewMonths} —
              </div>
            </div>

            <button
              onClick={nextMonth}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.25)",
                cursor: "pointer", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, lineHeight: 1, fontWeight: 300,
              }}
            >›</button>
          </div>

          {/* ── Day Headers ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#162040" }}>
            {DAY_HEADERS.map((h, idx) => {
              const isSat = idx === 6;
              return (
                <div
                  key={h.en}
                  style={{
                    textAlign: "center",
                    padding: "8px 2px 6px",
                    background: isSat ? "#7f1d1d" : "transparent",
                    borderBottom: "1px solid #1e2d4a",
                  }}
                >
                  <div style={{
                    fontSize: 12, fontWeight: 800,
                    color: isSat ? "#fecaca" : "#e2e8f0",
                    letterSpacing: "0.05em",
                  }}>
                    {h.en}
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: isSat ? "#fca5a5" : "#4a5568",
                    fontFamily: "'Noto Serif Hebrew', serif",
                    marginTop: 2, lineHeight: 1,
                  }}>
                    {h.he}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Calendar Grid (light background) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f8fafc" }}>
            {/* Empty leading cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const isSatCol = i === 6;
              return (
                <div
                  key={`empty-${i}`}
                  style={{
                    minHeight: 66,
                    borderRight: i < 6 ? "1px solid #e2e8f0" : "none",
                    borderBottom: "1px solid #e2e8f0",
                    background: isSatCol ? "#fee2e2" : "transparent",
                  }}
                />
              );
            })}

            {/* Day cells */}
            {days.map((day, i) => {
              const colIndex = (firstDayOfWeek + i) % 7;
              const isSatCol = colIndex === 6;
              const isFriCol = colIndex === 5;
              const isLastInRow = colIndex === 6;
              const isSelected = selectedDay === day.gregorianDay;
              const isFast = fastMap.has(day.gregorianDay);
              const dayYahrtzeits = yahrzeitMap[day.gregorianDay] ?? [];

              const nonRoshEvents = day.events.filter(e => !e.toLowerCase().includes("rosh chodesh"));
              const rawEvent = nonRoshEvents[0];
              const eventLabel = rawEvent
                ? rawEvent.replace(/^Parashat\s+/, "").split(" ").slice(0, 2).join(" ")
                : null;

              // Cell background
              let cellBg = isSatCol ? "#fef2f2" : "transparent";
              if (day.isToday)     cellBg = "#d4a843";
              else if (isSelected) cellBg = "#fef9ec";
              else if (isFast)     cellBg = "#f1f5f9";

              const isOnGold = day.isToday;
              const dayNumColor = isOnGold ? "#fff" : isSatCol ? "#991b1b" : "#1e293b";
              const hebrewColor  = isOnGold ? "rgba(255,255,255,0.8)" : isSatCol ? "#b91c1c" : "#6b7280";
              const monthColor   = isOnGold ? "rgba(255,255,255,0.7)" : isSatCol ? "#ef4444" : "#94a3b8";

              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(day.gregorianDay)}
                  style={{
                    minHeight: 66,
                    padding: "5px 5px 4px",
                    borderRight: !isLastInRow ? "1px solid #e2e8f0" : "none",
                    borderBottom: "1px solid #e2e8f0",
                    background: cellBg,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    position: "relative",
                    outline: isSelected && !day.isToday ? "2px solid #d4a843" : "none",
                    outlineOffset: "-2px",
                    transition: "background 0.12s",
                  }}
                >
                  {/* Candle icon for Fridays */}
                  {isFriCol && (
                    <div style={{
                      position: "absolute", top: 3, right: 3,
                      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1,
                    }}>
                      <span style={{ fontSize: 10, lineHeight: 1 }}>🕯️</span>
                      {candleLightingMap[day.gregorianDay] && (
                        <span style={{
                          fontSize: 7, lineHeight: 1.2,
                          color: "#b8860b", fontWeight: 700, whiteSpace: "nowrap",
                        }}>
                          {candleLightingMap[day.gregorianDay]}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Omer badge */}
                  {omerMap[day.gregorianDay] !== undefined && !isFriCol && (
                    <div style={{
                      position: "absolute", top: 3, right: 3,
                      fontSize: 7, fontWeight: 900, lineHeight: 1,
                      color: isOnGold ? "rgba(255,255,255,0.7)" : "#b8860b",
                    }}>
                      {omerMap[day.gregorianDay]}°
                    </div>
                  )}

                  {/* Day number */}
                  <div style={{
                    fontSize: 18, fontWeight: day.isToday ? 900 : 700,
                    color: dayNumColor,
                    lineHeight: 1,
                    marginTop: 2,
                  }}>
                    {day.gregorianDay}
                  </div>

                  {/* Hebrew date: numeral + month name */}
                  <div style={{
                    fontSize: 9, fontWeight: 500,
                    color: hebrewColor,
                    lineHeight: 1.2, marginTop: 2,
                    fontFamily: "'Noto Serif Hebrew', serif",
                  }}>
                    {hebrewDayNumeral(day.hebrewDay)}
                  </div>
                  <div style={{
                    fontSize: 8, color: monthColor,
                    lineHeight: 1, marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}>
                    {day.hebrewMonth}
                  </div>

                  {/* Rosh Chodesh */}
                  {day.roshChodesh && (
                    <div style={{
                      fontSize: 7.5, color: "#dc2626", fontWeight: 900,
                      letterSpacing: "0.04em", lineHeight: 1,
                      marginTop: "auto",
                    }}>
                      B.CH. {day.hebrewMonth?.toUpperCase()}
                    </div>
                  )}

                  {/* Holiday / Parasha label */}
                  {eventLabel && !day.roshChodesh && !isFast && (
                    <div style={{
                      fontSize: 7.5,
                      color: isOnGold ? "rgba(255,255,255,0.9)" : "#dc2626",
                      fontWeight: 800, lineHeight: 1,
                      marginTop: "auto",
                      maxWidth: "100%", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {eventLabel}
                    </div>
                  )}

                  {/* Fast label */}
                  {isFast && (
                    <div style={{
                      fontSize: 7.5, color: "#64748b",
                      fontWeight: 800, lineHeight: 1,
                      marginTop: "auto",
                    }}>
                      FAST
                    </div>
                  )}

                  {/* Yahrzeit dot */}
                  {dayYahrtzeits.length > 0 && (
                    <div style={{
                      position: "absolute", bottom: 3, left: 3,
                      display: "flex", alignItems: "center", gap: 1,
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#7c3aed",
                        boxShadow: "0 0 3px rgba(124,58,237,0.6)",
                      }} />
                      {dayYahrtzeits.length > 1 && (
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "#7c3aed", opacity: 0.6,
                        }} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Footer: Legend + Today ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 14px",
            background: "#162040",
            borderTop: "1px solid #1e2d4a",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {[
                { color: "#d4a843", label: "Today" },
                { color: "#fef2f2", label: "Shabbat", border: "1px solid #fca5a5" },
                { color: "#f1f5f9", label: "Fast", border: "1px solid #cbd5e1" },
              ].map(({ color, label, border }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 3,
                    background: color, border: border ?? "none", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{label}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#7c3aed",
                  boxShadow: "0 0 3px rgba(124,58,237,0.5)",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>Yahrzeit</span>
              </div>
            </div>
            <button
              onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelectedDay(null); }}
              style={{
                padding: "5px 13px", borderRadius: 99,
                background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.4)",
                cursor: "pointer", color: "#d4a843",
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
              }}
            >TODAY</button>
          </div>
        </div>

        {/* ── Selected Day Detail Card ── */}
        {selectedDayData && (
          <div
            className="card fade-in"
            style={{ padding: "14px 16px", marginBottom: 8 }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                  {selectedDayData.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#d4a843",
                  fontFamily: "'Noto Serif Hebrew', serif",
                }}>
                  {hebrewDayNumeral(selectedDayData.hebrewDay)}{" "}{selectedDayData.hebrewMonth}{" "}{selectedDayData.hebrewYear}
                </div>
                {(yahrzeitMap[selectedDayData.gregorianDay] ?? []).map(e => (
                  <div key={e.id} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    marginTop: 4, padding: "2px 8px", borderRadius: 99,
                    background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                  }}>
                    <span style={{ fontSize: 11 }}>🕯</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>
                      Yahrzeit · {e.name}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onDayClick(selectedDayData.gregorianDay, month, year)}
                style={{
                  padding: "7px 14px",
                  background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.28)",
                  borderRadius: 10, color: "#d4a843",
                  fontSize: 12, cursor: "pointer", fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Details →
              </button>
            </div>

            {/* Candle lighting */}
            {candleLightingMap[selectedDayData.gregorianDay] && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.22)",
                borderRadius: 12, padding: "10px 14px", marginTop: 10,
              }}>
                <span style={{ fontSize: 22 }}>🕯️</span>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.09em" }}>
                    CANDLE LIGHTING
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#d4a843", lineHeight: 1.1, marginTop: 1 }}>
                    {candleLightingMap[selectedDayData.gregorianDay]}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {location.candleLightingMinutes} min before sunset · {location.name}
                  </div>
                </div>
              </div>
            )}

            {/* Events */}
            {selectedDayData.events.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {selectedDayData.events.map((ev, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 10,
                    background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.14)",
                  }}>
                    <span style={{ fontSize: 14, color: "#d4a843" }}>✦</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{ev}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default CalendarPage;
