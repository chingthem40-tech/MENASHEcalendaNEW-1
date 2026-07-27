import React from "react";

interface ShabbatBannerProps {
  show: boolean;
  locationName: string;
  onDismiss: () => void;
}

export default function ShabbatBanner({ show, locationName, onDismiss }: ShabbatBannerProps) {
  if (!show) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      padding: "0 12px 12px",
      animation: "shabbatBannerIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <div style={{
        borderRadius: "0 0 20px 20px",
        background: "linear-gradient(135deg, #0d0a00 0%, #1a1000 40%, #100d00 100%)",
        border: "1px solid rgba(212,168,67,0.5)",
        borderTop: "none",
        boxShadow: "0 8px 40px rgba(212,168,67,0.25), 0 2px 0 rgba(212,168,67,0.4) inset",
        padding: "18px 20px 16px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        {/* Candles */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <div style={{
                width: 6, height: 14, borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
                background: "linear-gradient(180deg, #fff9c4, #fbbf24)",
                animation: `candleFlicker ${1.2 + i * 0.3}s ease-in-out infinite`,
                transformOrigin: "bottom center",
                boxShadow: "0 0 8px 4px rgba(251,191,36,0.45)",
              }} />
              <div style={{ width: 8, height: 28, borderRadius: "2px 2px 4px 4px", background: "linear-gradient(180deg, #e8d5a0, #c8a855)" }} />
            </div>
          ))}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(212,168,67,0.65)", marginBottom: 3 }}>
            🕯 CANDLE LIGHTING · {locationName.toUpperCase()}
          </div>
          <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 22, color: "#f0c050", direction: "rtl", lineHeight: 1.1, marginBottom: 4 }}>
            שַׁבָּת שָׁלוֹם
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
            Shabbat Shalom! Time to light candles.
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
            background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "rgba(212,168,67,0.8)",
          }}
        >✕</button>
      </div>
    </div>
  );
}
