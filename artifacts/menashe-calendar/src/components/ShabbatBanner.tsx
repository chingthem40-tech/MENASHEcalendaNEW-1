import { useState, useEffect, useCallback } from "react";
import { calculateZmanim, formatTime } from "../lib/zmanim";
import { useLanguage } from "../context/LanguageContext";
import type { Location } from "../lib/locations";

interface Props {
  location: Location;
}

type ShabbatPhase =
  | "approaching"   // Friday, within 60 min of candle lighting
  | "candles"       // Friday, within 30 min after candle lighting (transition)
  | "shabbat"       // Friday night or Saturday during Shabbat
  | "havdalah"      // Saturday after sunset but before tzais (transition)
  | null;

interface ShabbatState {
  phase: ShabbatPhase;
  candleLightingTime: string;
  havdalahTime: string;
  minutesToCandles: number;
}

const DISMISS_KEY = "menashe-shabbat-banner-dismissed-week";

function getWeekKey(now: Date): string {
  // Unique key per Shabbat (based on the Friday date)
  const d = new Date(now);
  // Roll back to Friday
  const day = d.getDay(); // 0=Sun … 5=Fri, 6=Sat
  const daysToFriday = day === 6 ? 1 : day === 5 ? 0 : -(day + 2); // rough
  d.setDate(d.getDate() - (day === 6 ? 1 : day === 5 ? 0 : 0));
  return `${d.getFullYear()}-W${Math.floor(d.getTime() / (7 * 24 * 3600 * 1000))}`;
}

function computeShabbatState(location: Location): ShabbatState | null {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 5=Fri, 6=Sat

  const todayZmanim = calculateZmanim(now, location.lat, location.lng);

  if (day === 5) {
    // Friday
    const candles = todayZmanim.candleLighting;
    if (!candles) return null;

    const msToCandles = candles.getTime() - now.getTime();
    const minutesToCandles = msToCandles / 60000;

    // Get Saturday's zmanim for Havdalah
    const saturday = new Date(now);
    saturday.setDate(saturday.getDate() + 1);
    const saturdayZmanim = calculateZmanim(saturday, location.lat, location.lng);
    const havdalah = saturdayZmanim.havdalah;

    const candleStr = formatTime(candles, location.tz);
    const havdalahStr = havdalah ? formatTime(havdalah, location.tz) : "--:--";

    if (minutesToCandles > 60) return null; // Too early
    if (minutesToCandles > 0) {
      return {
        phase: "approaching",
        candleLightingTime: candleStr,
        havdalahTime: havdalahStr,
        minutesToCandles: Math.ceil(minutesToCandles),
      };
    }
    // After candle lighting on Friday — Shabbat is in
    if (minutesToCandles > -30) {
      return { phase: "candles", candleLightingTime: candleStr, havdalahTime: havdalahStr, minutesToCandles: 0 };
    }
    return { phase: "shabbat", candleLightingTime: candleStr, havdalahTime: havdalahStr, minutesToCandles: 0 };
  }

  if (day === 6) {
    // Saturday
    const havdalah = todayZmanim.havdalah;
    const sunset = todayZmanim.sunset;
    if (!havdalah) return null;

    if (now.getTime() > havdalah.getTime()) return null; // Shabbat is over

    // Get Friday's zmanim for candle lighting display
    const friday = new Date(now);
    friday.setDate(friday.getDate() - 1);
    const fridayZmanim = calculateZmanim(friday, location.lat, location.lng);
    const candleStr = fridayZmanim.candleLighting ? formatTime(fridayZmanim.candleLighting, location.tz) : "--:--";
    const havdalahStr = formatTime(havdalah, location.tz);

    const phase: ShabbatPhase =
      sunset && now.getTime() >= sunset.getTime() ? "havdalah" : "shabbat";

    return { phase, candleLightingTime: candleStr, havdalahTime: havdalahStr, minutesToCandles: 0 };
  }

  return null;
}

export default function ShabbatBanner({ location }: Props) {
  const { t, lang } = useLanguage();
  const [state, setState] = useState<ShabbatState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const refresh = useCallback(() => {
    const s = computeShabbatState(location);
    setState(s);
    if (s && !dismissed) {
      setVisible(true);
    } else if (!s) {
      setVisible(false);
      setDismissed(false); // reset dismiss when Shabbat ends
    }
  }, [location, dismissed]);

  useEffect(() => {
    // Check if dismissed this Shabbat
    const storedWeek = localStorage.getItem(DISMISS_KEY);
    if (storedWeek === getWeekKey(new Date())) {
      setDismissed(true);
    }

    refresh();
    const id = setInterval(refresh, 60 * 1000); // re-check every minute
    return () => clearInterval(id);
  }, [refresh]);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, getWeekKey(new Date()));
    setDismissed(true);
    setVisible(false);
  }

  if (!visible || !state || dismissed) return null;

  const isApproaching = state.phase === "approaching";
  const isTransition = state.phase === "candles" || state.phase === "havdalah";
  const isSaturday = new Date().getDay() === 6;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        zIndex: 8000,
        animation: "shabbatSlideDown 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`
        @keyframes shabbatSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-100%); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes shabbatFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
      `}</style>

      {/* Glow backdrop */}
      <div style={{
        background: isApproaching
          ? "linear-gradient(180deg, rgba(15,24,41,0.98) 0%, rgba(10,18,32,0.96) 100%)"
          : "linear-gradient(180deg, rgba(20,14,4,0.98) 0%, rgba(14,10,2,0.96) 100%)",
        borderBottom: isApproaching
          ? "1.5px solid rgba(212,175,55,0.4)"
          : "1.5px solid rgba(212,175,55,0.7)",
        boxShadow: isApproaching
          ? "0 4px 24px rgba(0,0,0,0.6)"
          : "0 6px 40px rgba(212,175,55,0.2), 0 4px 24px rgba(0,0,0,0.6)",
        padding: "12px 16px 14px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle radial glow for Shabbat */}
        {!isApproaching && (
          <div aria-hidden style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
        )}

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Candle emoji */}
          <div style={{
            fontSize: 26, lineHeight: 1, flexShrink: 0,
            animation: !isApproaching ? "shabbatFlicker 3s ease-in-out infinite" : "none",
          }}>
            🕯️
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {isApproaching ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F5D982", marginBottom: 1 }}>
                  {t.shabbatApproaching}
                </div>
                <div style={{ fontSize: 12, color: "rgba(245,240,232,0.6)", lineHeight: 1.4 }}>
                  {t.shabbatCandleLighting}: <span style={{ color: "#F5D982", fontWeight: 600 }}>{state.candleLightingTime}</span>
                  {" · "}{state.minutesToCandles} {t.shabbatMinutes}
                </div>
              </>
            ) : (
              <>
                {/* Hebrew greeting */}
                <div style={{
                  fontFamily: "'Noto Serif Hebrew', serif",
                  fontSize: 17, fontWeight: 700, lineHeight: 1.1, marginBottom: 1,
                  background: "linear-gradient(135deg, #b8860b, #d4a843, #f0c96a)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  שַׁבָּת שָׁלוֹם
                </div>
                <div style={{ fontSize: 12, color: "rgba(245,240,232,0.55)", lineHeight: 1.4 }}>
                  <span style={{ color: "rgba(245,240,232,0.75)", fontWeight: 500 }}>
                    {lang === "tk" ? t.shabbatShalomTk : t.shabbatShalomEn}
                  </span>
                  {isSaturday && (
                    <span>
                      {" · "}{t.shabbatHavdalah}: <span style={{ color: "#F5D982", fontWeight: 600 }}>{state.havdalahTime}</span>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              background: "rgba(255,255,255,0.07)", border: "none",
              color: "rgba(245,240,232,0.4)", fontSize: 14, lineHeight: 1,
              borderRadius: 7, padding: "5px 8px", cursor: "pointer", flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
