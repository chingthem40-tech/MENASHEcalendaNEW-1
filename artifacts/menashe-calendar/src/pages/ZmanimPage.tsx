import { useState, useEffect, useCallback, useRef, memo } from "react";
import { calculateZmanim, formatTime } from "../lib/zmanim";
import { getHebrewDate, getHebrewMonthName, hebrewDayNumeral } from "../lib/hebrewCalendar";
import { Location } from "../lib/locations";
import { isNotifSupported, sendNotification, getLeadTime } from "../hooks/useNotifications";

interface ZmanimPageProps {
  location: Location;
  onInfo: () => void;
  onLocationClick: () => void;
  isPremium?: boolean;
  onShowPremium?: () => void;
}

interface NextZman {
  name: string;
  time: Date;
}

function getNextZman(zmanim: ReturnType<typeof calculateZmanim>, now: Date): NextZman | null {
  const candidates: { name: string; time: Date | null }[] = [
    { name: "Alot HaShachar", time: zmanim.alotHaShachar },
    { name: "Netz HaChama", time: zmanim.sunrise },
    { name: "Latest Shema", time: zmanim.latestShema },
    { name: "Latest Shacharit", time: zmanim.latestShacharit },
    { name: "Chatzot", time: zmanim.chatzot },
    { name: "Mincha Gedolah", time: zmanim.minchaGedolah },
    { name: "Mincha Ketana", time: zmanim.minchaKetana },
    { name: "Plag HaMincha", time: zmanim.plagHamincha },
    { name: "Candle Lighting", time: zmanim.candleLighting },
    { name: "Shkia (Sunset)", time: zmanim.sunset },
    { name: "Tzais HaKochavim", time: zmanim.tzais },
  ];
  const upcoming = candidates
    .filter((c) => c.time && c.time > now)
    .sort((a, b) => a.time!.getTime() - b.time!.getTime());
  if (upcoming.length === 0) return null;
  return { name: upcoming[0].name, time: upcoming[0].time! };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function RemindButton({ zmanName, time, tz }: { zmanName: string; time: Date | null; tz: string }) {
  const [state, setState] = useState<"idle" | "set" | "denied" | "past">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRemind = useCallback(async () => {
    if (!time) return;
    const now = Date.now();
    const lead = getLeadTime();
    const fireAt = time.getTime() - lead * 60 * 1000;

    if (fireAt <= now) {
      setState("past");
      setTimeout(() => setState("idle"), 2000);
      return;
    }

    if (!isNotifSupported()) {
      setState("denied");
      setTimeout(() => setState("idle"), 2000);
      return;
    }

    let perm = Notification.permission;
    if (perm === "denied") {
      setState("denied");
      setTimeout(() => setState("idle"), 2500);
      return;
    }
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
    }
    if (perm !== "granted") {
      setState("denied");
      setTimeout(() => setState("idle"), 2500);
      return;
    }

    const ms = fireAt - Date.now();
    const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      sendNotification(
        `⏰ ${zmanName} in ${lead} min`,
        `${zmanName} is at ${timeStr}. Time to prepare!`,
        `remind-${zmanName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`
      );
    }, ms);
    setState("set");
  }, [time, zmanName, tz]);

  if (!time || time < new Date()) return null;

  const color =
    state === "set" ? "#d4a843" :
    state === "denied" ? "#ef4444" :
    state === "past" ? "var(--text-muted)" :
    "var(--text-muted)";

  const label =
    state === "set" ? "🔔" :
    state === "denied" ? "🔕" :
    state === "past" ? "—" :
    "🔔";

  return (
    <button
      onClick={handleRemind}
      title={state === "set" ? "Reminder set!" : `Remind me before ${zmanName}`}
      style={{
        background: state === "set" ? "rgba(212,168,67,0.12)" : "transparent",
        border: `1px solid ${state === "set" ? "rgba(212,168,67,0.3)" : "var(--border)"}`,
        borderRadius: 8,
        padding: "4px 10px",
        cursor: "pointer",
        fontSize: 14,
        color,
        transition: "all 0.2s",
        minWidth: 36,
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

const ZmanimPage = memo(function ZmanimPage({ location, onInfo, onLocationClick, isPremium = false, onShowPremium }: ZmanimPageProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = now;
  const tz = location.tz;
  const zmanim = calculateZmanim(today, location.lat, location.lng, location.candleLightingMinutes);
  const hdate = getHebrewDate(today);

  const dayLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const isFriday = today.getDay() === 5;
  const isShabbat = today.getDay() === 6;

  const fmt = (d: Date | null) => formatTime(d, tz);

  const shaahMin = Math.floor(zmanim.shaahZmanitGra);
  const shaahSec = Math.round((zmanim.shaahZmanitGra % 1) * 60);

  const nextZman = getNextZman(zmanim, now);
  const msUntilNext = nextZman ? nextZman.time.getTime() - now.getTime() : null;

  const isAutoLocation = !["Jerusalem","Tel Aviv","Haifa","Be'er Sheva","Bnei Brak","Tzfat","Churachandpur","Imphal","Aizawl","Lunglei","New York","Los Angeles","Toronto","London","Paris","Melbourne"].includes(location.name);

  const leadMins = getLeadTime();

  const prayerRows = [
    { name: "Latest Shema",      sub: "Gra — 3 shaot after Netz HaChama",         time: zmanim.latestShema,    urgent: true },
    { name: "Latest Shacharit",  sub: "Gra — 4 shaot after Netz HaChama",         time: zmanim.latestShacharit, urgent: false },
    { name: "Mincha Gedolah",    sub: "Earliest Mincha (½ shaah after Chatzot)",   time: zmanim.minchaGedolah,  urgent: false },
    { name: "Mincha Ketana",     sub: "Preferred Mincha time",                     time: zmanim.minchaKetana,   urgent: false },
    { name: "Plag HaMincha",     sub: "Earliest Ma'ariv / Shabbat acceptance",     time: zmanim.plagHamincha,   urgent: false },
  ];

  return (
    <div style={{ padding: "0 0 4px" }}>
      {/* Header */}
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
          style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 99, padding: "5px 12px", cursor: "pointer" }}
        >
          <span style={{ fontSize: 12 }}>{isAutoLocation ? "🎯" : "📍"}</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{location.name}</span>
        </button>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Zmanim</h1>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{location.name} · {dayLabel}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={onShowPremium}
              style={{ background: "none", border: "none", padding: 0, cursor: onShowPremium ? "pointer" : "default" }}
            >
              <span className="premium-badge">{isPremium ? "👑 PREMIUM" : "⭐ PREMIUM"}</span>
            </button>
            <button
              onClick={onInfo}
              style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
            >ℹ</button>
          </div>
        </div>

        {/* Next Zman Live Countdown */}
        {nextZman && msUntilNext !== null && (
          <div
            className="card"
            style={{
              padding: "14px 16px",
              marginBottom: 12,
              background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))",
              border: "1px solid rgba(212,168,67,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "#d4a843", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>NEXT ZMAN</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{nextZman.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{fmt(nextZman.time)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>IN</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#d4a843", fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em" }}>
                {formatCountdown(msUntilNext)}
              </div>
            </div>
          </div>
        )}

        {!nextZman && (
          <div className="card" style={{ padding: "12px 16px", marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>All Zmanim for today have passed.</div>
          </div>
        )}

        {/* Remind hint */}
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, paddingLeft: 2 }}>
          🔔 Tap the bell on any upcoming time to set a {leadMins}-min reminder
        </div>

        {/* Alot · Sunrise · Sunset in one row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div className="card" style={{ padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>ALOT</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>{fmt(zmanim.alotHaShachar)}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Hashachar</div>
          </div>
          <div className="card" style={{ padding: "12px 10px", textAlign: "center", border: "1px solid rgba(212,168,67,0.25)" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>SUNRISE</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#d4a843", marginBottom: 2 }}>{fmt(zmanim.sunrise)}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Netz HaChama</div>
          </div>
          <div className="card" style={{ padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>SUNSET</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>{fmt(zmanim.sunset)}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Shkia</div>
          </div>
        </div>

        {/* Chatzot */}
        <div className="card" style={{ padding: 14, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Chatzot</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Halachic noon — midpoint of the solar day</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RemindButton zmanName="Chatzot" time={zmanim.chatzot} tz={tz} />
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{fmt(zmanim.chatzot)}</div>
          </div>
        </div>

        {/* Shabbat times */}
        {(isFriday || isShabbat) && (
          <div className="card" style={{ padding: 16, marginBottom: 12, background: "linear-gradient(135deg, #1a2540, #0f1e38)", border: "1px solid rgba(212,168,67,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🕯</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Candle Lighting</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{location.candleLightingMinutes} min before sunset</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                <RemindButton zmanName="Candle Lighting" time={zmanim.candleLighting} tz={tz} />
                <div style={{ fontSize: 24, fontWeight: 800, color: "#d4a843" }}>{fmt(zmanim.candleLighting)}</div>
              </div>
            </div>
            <div className="divider" style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Havdalah / Tzais</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>3 stars — 42 min after sunset</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RemindButton zmanName="Havdalah" time={zmanim.havdalah} tz={tz} />
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{fmt(zmanim.havdalah)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tzais (non-Shabbat) */}
        {!isFriday && !isShabbat && (
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Tzais HaKochavim</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Nightfall — 42 min after sunset (3 stars)</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RemindButton zmanName="Tzais HaKochavim" time={zmanim.tzais} tz={tz} />
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{fmt(zmanim.tzais)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Prayer times */}
        <div style={{ marginBottom: 12 }}>
          <div className="section-header">PRAYERS (Gra / Vilna Gaon)</div>
          <div className="card" style={{ overflow: "hidden" }}>
            {prayerRows.map((item, i) => (
              <div key={i} className="zmanim-row" style={item.urgent && item.time && item.time > now ? { background: "rgba(212,168,67,0.04)" } : {}}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: item.urgent ? "#d4a843" : "var(--text-primary)" }}>{item.name}</div>
                  {item.sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.sub}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <RemindButton zmanName={item.name} time={item.time} tz={tz} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.urgent && item.time && item.time > now ? "#d4a843" : "var(--text-primary)", minWidth: 52, textAlign: "right" }}>
                    {fmt(item.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shaah Zmanit */}
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Shaah Zmanit</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Halachic hour — Gra (Netz to Shkia ÷ 12)</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>
              {shaahMin}m {shaahSec}s
            </div>
          </div>
        </div>

        {/* Method note */}
        <div style={{ padding: "10px 14px", background: "rgba(212,168,67,0.06)", borderRadius: 10, border: "1px solid rgba(212,168,67,0.15)", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: "#d4a843" }}>Method: </span>
            Calculations follow the <strong>Gra (Vilna Gaon)</strong> — halachic day from Netz HaChama to Shkia.
            Alot HaShachar = 72 min before Netz. Tzais = 42 min after Shkia.
            Candle lighting: {location.candleLightingMinutes} min before Shkia ({location.name} custom).
            {isAutoLocation && (
              <span style={{ display: "block", marginTop: 4 }}>
                <span style={{ color: "#d4a843", fontWeight: 700 }}>🎯 Auto-detected location</span> — coordinates from your device ({location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°).
              </span>
            )}
          </div>
        </div>

        {/* ── Premium Feature Card: Week Ahead Zmanim ── */}
        {isPremium ? (
          <div
            className="card"
            style={{
              marginBottom: 12,
              overflow: "hidden",
              border: "1px solid rgba(212,168,67,0.3)",
              background: "linear-gradient(135deg, rgba(212,168,67,0.07), rgba(212,168,67,0.02))",
            }}
          >
            <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#d4a843", letterSpacing: "0.06em" }}>WEEK AHEAD — SUNRISE & SUNSET</div>
            </div>
            <div>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() + i);
                const z = calculateZmanim(d, location.lat, location.lng, location.candleLightingMinutes);
                const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
                const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const isSat = d.getDay() === 6;
                const isFri = d.getDay() === 5;
                return (
                  <div
                    key={i}
                    className="zmanim-row"
                    style={{
                      background: i === 0 ? "rgba(212,168,67,0.06)" : undefined,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: i === 0 ? 700 : 500, color: isSat ? "#ef4444" : "var(--text-primary)" }}>
                        {dayName}
                        {isFri && <span style={{ fontSize: 10, color: "#d4a843", marginLeft: 6 }}>🕯 Candle Lighting</span>}
                        {isSat && <span style={{ fontSize: 10, color: "#ef4444", marginLeft: 6 }}>Shabbat</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{dateStr}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, marginBottom: 1 }}>SUNRISE</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#d4a843" }}>{formatTime(z.sunrise, tz)}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, marginBottom: 1 }}>SUNSET</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{formatTime(z.sunset, tz)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="card card-interactive"
            onClick={onShowPremium}
            style={{
              marginBottom: 12,
              padding: "18px 16px",
              border: "1px solid rgba(212,168,67,0.25)",
              background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(212,168,67,0.02))",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>📅</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#d4a843", marginBottom: 3 }}>Week Ahead Zmanim</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                See sunrise, sunset & candle lighting for the next 7 days — Premium feature.
              </div>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #b8860b, #d4a843)",
              color: "#1a0900", fontWeight: 700, fontSize: 12,
              padding: "8px 14px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0,
            }}>
              👑 Upgrade
            </div>
          </div>
        )}

        {/* Hebrew date footer */}
        <div style={{ textAlign: "center", padding: "8px 0 8px", opacity: 0.5 }}>
          <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 18, color: "var(--gold)" }}>
            {hebrewDayNumeral(hdate.getDate())} {getHebrewMonthName(hdate)} {hdate.getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ZmanimPage;
