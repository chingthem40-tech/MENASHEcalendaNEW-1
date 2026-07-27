import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  isFriday: boolean;
  isShabbat: boolean;
  candleLighting: Date | null;
  havdalah: Date | null;
  watermarkSrc: string;
}

type ModeType = "approaching" | "active" | "shavua_tov" | null;

const APPROACH_WINDOW_MS = 45 * 60 * 1000;
const SHAVUA_TOV_WINDOW_MS = 10 * 60 * 1000;
const DISMISS_KEY = "menashe-shabbat-mode-dismissed-v1";

function computeMode(
  isFriday: boolean,
  isShabbat: boolean,
  candleLighting: Date | null,
  havdalah: Date | null,
  now: number,
): ModeType {
  if (isFriday && candleLighting) {
    const msBefore = candleLighting.getTime() - now;
    if (msBefore > 0 && msBefore <= APPROACH_WINDOW_MS) return "approaching";
    if (msBefore <= 0) return "active";
  }
  if (isShabbat && havdalah) {
    const msAfter = now - havdalah.getTime();
    if (msAfter >= 0 && msAfter < SHAVUA_TOV_WINDOW_MS) return "shavua_tov";
    if (now < havdalah.getTime()) return "active";
  }
  return null;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function CandleFlame({ delayMs }: { delayMs: number }) {
  const delay = `${delayMs}ms`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        animation: `shabbatFlicker 1.6s ${delay} ease-in-out infinite, shabbatFlameGlow 2.2s ${delay} ease-in-out infinite`,
        transformOrigin: "bottom center",
      }}>
        <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
          <path d="M12 2C12 2 4 11 4 20C4 26 7.5 31 12 33C16.5 31 20 26 20 20C20 11 12 2 12 2Z"
            fill="url(#shabbatFlameOuter)" />
          <path d="M12 14C12 14 8 18.5 8 22C8 25 9.8 28 12 29C14.2 28 16 25 16 22C16 18.5 12 14 12 14Z"
            fill="rgba(255,248,160,0.92)" />
          <defs>
            <radialGradient id="shabbatFlameOuter" cx="50%" cy="75%" r="55%">
              <stop offset="0%" stopColor="#fffbd0" />
              <stop offset="35%" stopColor="#ffb020" />
              <stop offset="100%" stopColor="#ff4400" stopOpacity="0.6" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div style={{ width: 2, height: 8, background: "#6b5a3a", marginTop: -3, borderRadius: 1 }} />
      <div style={{
        width: 18, height: 72,
        background: "linear-gradient(180deg, #f5edda 0%, #ece0c2 45%, #d5c8a8 100%)",
        borderRadius: "2px 2px 4px 4px",
        boxShadow: "inset -3px 0 8px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.35)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 4, width: 4, height: 10,
          background: "rgba(255,255,255,0.45)", borderRadius: "0 0 4px 4px",
        }} />
      </div>
      <div style={{
        width: 24, height: 5,
        background: "linear-gradient(180deg, #c9a227, #9a7510)",
        borderRadius: "0 0 4px 4px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
      }} />
    </div>
  );
}

export default function ShabbatMode({ isFriday, isShabbat, candleLighting, havdalah, watermarkSrc }: Props) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const mode = computeMode(isFriday, isShabbat, candleLighting, havdalah, now);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }, []);

  useEffect(() => {
    if (mode === "shavua_tov") {
      const id = setTimeout(dismiss, 9000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [mode, dismiss]);

  if (!mode || dismissed) return null;

  const isApproaching = mode === "approaching";
  const isActive = mode === "active";
  const isShavuaTov = mode === "shavua_tov";

  let countdownMs = 0;
  let countdownLabel = "";
  if (isApproaching && candleLighting) {
    countdownMs = candleLighting.getTime() - now;
    countdownLabel = t.shabbatModeCandleLightingIn;
  } else if (isActive && havdalah) {
    countdownMs = havdalah.getTime() - now;
    countdownLabel = t.shabbatModeHavdalahIn;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2100,
      background: "linear-gradient(180deg, #05040d 0%, #080614 55%, #040312 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes shabbatFlicker {
          0%, 100% { transform: scaleX(1) scaleY(1) translateX(0); }
          20%       { transform: scaleX(0.93) scaleY(1.07) translateX(1.5px); }
          40%       { transform: scaleX(1.07) scaleY(0.95) translateX(-1px); }
          60%       { transform: scaleX(0.97) scaleY(1.05) translateX(0.8px); }
          80%       { transform: scaleX(1.04) scaleY(0.97) translateX(-0.8px); }
        }
        @keyframes shabbatFlameGlow {
          0%, 100% { filter: drop-shadow(0 0 7px rgba(255,190,40,0.85)) drop-shadow(0 0 18px rgba(255,130,10,0.5)); }
          50%       { filter: drop-shadow(0 0 14px rgba(255,220,80,1))   drop-shadow(0 0 30px rgba(255,155,20,0.75)); }
        }
        @keyframes shabbatTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.9); }
          50%       { opacity: 1;    transform: scale(1.15); }
        }
        @keyframes shabbatFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes shabbatGoldPulse {
          0%, 100% { text-shadow: 0 0 18px rgba(201,162,39,0.35), 0 0 40px rgba(201,162,39,0.18); }
          50%       { text-shadow: 0 0 32px rgba(201,162,39,0.75), 0 0 65px rgba(201,162,39,0.38); }
        }
        @keyframes shabbatOrbitRing {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Torah scroll watermark — elevated opacity for Shabbat */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `url(${watermarkSrc})`,
        backgroundSize: "55%", backgroundPosition: "center", backgroundRepeat: "no-repeat",
        opacity: 0.1, filter: "grayscale(20%)",
      }} />

      {/* Twinkling stars */}
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 53 + 7) % 85}%`,
          width: i % 6 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
          height: i % 6 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
          borderRadius: "50%",
          background: i % 8 === 0 ? "#e8d4a0" : "white",
          animation: `shabbatTwinkle ${1.8 + (i % 5) * 0.5}s ${(i * 0.28) % 3}s ease-in-out infinite`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Bottom vignette */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 180, pointerEvents: "none",
        background: "linear-gradient(transparent, rgba(4,3,12,0.8))",
      }} />

      {/* Main content card */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 0, maxWidth: 340, width: "90%",
        animation: "shabbatFadeIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}>

        {/* ── Shavua Tov mode ── */}
        {isShavuaTov && (
          <>
            <div style={{ fontSize: 64, marginBottom: 14, lineHeight: 1 }}>✨</div>
            <div style={{
              fontFamily: "'Noto Serif Hebrew', 'David Libre', Georgia, serif",
              fontSize: 40, fontWeight: 800, color: "#c9a227",
              animation: "shabbatGoldPulse 2.5s ease-in-out infinite",
              letterSpacing: "0.04em", textAlign: "center", marginBottom: 10,
            }}>
              שָׁבוּעַ טוֹב
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.88)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Georgia, serif", marginBottom: 8 }}>
              Shavua Tov
            </div>
            <div style={{ fontSize: 13, color: "rgba(201,162,39,0.65)", fontStyle: "italic", textAlign: "center", maxWidth: 260 }}>
              {t.shabbatModeShavuaTov}
            </div>
          </>
        )}

        {/* ── Approaching / Active mode ── */}
        {!isShavuaTov && (
          <>
            {/* Candles — only during active Shabbat */}
            {isActive && (
              <div style={{ display: "flex", gap: 40, marginBottom: 32 }}>
                <CandleFlame delayMs={0} />
                <CandleFlame delayMs={450} />
              </div>
            )}

            {/* Approaching icon */}
            {isApproaching && (
              <div style={{ fontSize: 48, marginBottom: 20, lineHeight: 1 }}>🕯</div>
            )}

            {/* Hebrew title */}
            <div style={{
              fontFamily: "'Noto Serif Hebrew', 'David Libre', Georgia, serif",
              fontSize: isApproaching ? 40 : 54,
              fontWeight: 800, color: "#c9a227",
              animation: "shabbatGoldPulse 3s ease-in-out infinite",
              letterSpacing: "0.05em", textAlign: "center",
              lineHeight: 1.15, marginBottom: 8,
              direction: "rtl",
            }}>
              שַׁבָּת שָׁלוֹם
            </div>

            {/* English */}
            <div style={{
              fontSize: isApproaching ? 18 : 23,
              fontWeight: 600, color: "rgba(255,255,255,0.9)",
              letterSpacing: "0.14em", textAlign: "center",
              textTransform: "uppercase", fontFamily: "Georgia, serif",
              marginBottom: 5,
            }}>
              {t.shabbatShalomEn}
            </div>

            {/* TK */}
            <div style={{
              fontSize: 13, color: "rgba(201,162,39,0.68)",
              textAlign: "center", marginBottom: 24,
              fontStyle: "italic",
            }}>
              {t.shabbatShalomTk}
            </div>

            {/* Divider */}
            <div style={{
              width: 90, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)",
              marginBottom: 22,
            }} />

            {/* Mode label */}
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
              color: "rgba(201,162,39,0.6)", textTransform: "uppercase",
              marginBottom: 14,
            }}>
              {isApproaching ? t.shabbatApproaching : t.shabbatModeActive}
            </div>

            {/* Live countdown */}
            {countdownMs > 0 && (
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.38)",
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8,
                }}>
                  {countdownLabel}
                </div>
                <div style={{
                  fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 38, fontWeight: 700,
                  color: "white", letterSpacing: "0.08em",
                  textShadow: "0 0 24px rgba(201,162,39,0.32)",
                }}>
                  {formatCountdown(countdownMs)}
                </div>
              </div>
            )}

            {/* Dismiss */}
            <button
              onClick={dismiss}
              style={{
                background: "rgba(201,162,39,0.07)",
                border: "1px solid rgba(201,162,39,0.22)",
                borderRadius: 22, padding: "10px 24px",
                color: "rgba(201,162,39,0.7)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                letterSpacing: "0.06em",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,162,39,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(201,162,39,0.07)")}
            >
              {t.shabbatModeDismiss}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
