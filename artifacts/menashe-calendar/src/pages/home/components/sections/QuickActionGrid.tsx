import React from "react";
import { useLanguage } from "../../../../context/LanguageContext";

interface QuickActionGridProps {
  hebrewYear: number;
  isPremium: boolean;
  onShowHolidays: () => void;
  onShowDafYomi: () => void;
  onShowPremium: () => void;
  onMoreTools: () => void;
}

export default function QuickActionGrid({
  hebrewYear,
  isPremium,
  onShowHolidays,
  onShowDafYomi,
  onShowPremium,
  onMoreTools,
}: QuickActionGridProps) {
  const { t } = useLanguage();

  return (
    <div className="quick-action-grid" style={{ marginBottom: 12 }}>
      {/* Holidays */}
      <div className="quick-action" onClick={onShowHolidays}>
        <div className="quick-action-icon" style={{ background: "rgba(59,130,246,0.13)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 12 }}>📅</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", lineHeight: 1.3 }}>Holidays {hebrewYear}</div>
      </div>

      {/* Daf Yomi */}
      <div className="quick-action" onClick={isPremium ? onShowDafYomi : onShowPremium} style={{ position: "relative" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            className="quick-action-icon"
            style={{
              background: isPremium ? "rgba(20,184,166,0.13)" : "rgba(212,168,67,0.1)",
              border: `1px solid ${isPremium ? "rgba(20,184,166,0.18)" : "rgba(212,168,67,0.25)"}`,
              borderRadius: 12,
            }}
          >📖</div>
          {!isPremium && (
            <div style={{
              position: "absolute", top: -4, right: -4,
              width: 16, height: 16, borderRadius: "50%",
              background: "linear-gradient(135deg, #b8860b, #d4a843)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1a0900" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: isPremium ? "var(--text-secondary)" : "#d4a843", lineHeight: 1.3 }}>
          Daf Yomi{!isPremium && " 👑"}
        </div>
      </div>

      {/* More Tools */}
      <div className="quick-action" onClick={onMoreTools}>
        <div className="quick-action-icon" style={{ background: "rgba(168,85,247,0.13)", border: "1px solid rgba(168,85,247,0.18)", borderRadius: 12 }}>🔧</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", lineHeight: 1.3 }}>{t.homeMoreTools}</div>
      </div>
    </div>
  );
}
