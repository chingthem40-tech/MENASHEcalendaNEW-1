import React from "react";
import CompassCard from "../../../../components/CompassCard";
import torahScrollWatermark from "@assets/afc3e4a8-094b-4933-9d08-f8fb899140c9_1782276994801.webp";
import { useLanguage } from "../../../../context/LanguageContext";

interface OmerCardProps {
  omerDay: number;
  onTap: () => void;
}

const OMER_CIRCUMFERENCE = 2 * Math.PI * 21;

export default function OmerCard({ omerDay, onTap }: OmerCardProps) {
  const { t } = useLanguage();

  return (
    <CompassCard
      gradient="linear-gradient(160deg, #0d0c1a 0%, #08070f 55%, #0f0e1c 100%)"
      accentColor="#c9a227"
      shimmerColor="#e8c84a"
      category="SEFIRAT HA-OMER"
      icon={
        <div style={{ position: "relative", display: "inline-block", width: 48, height: 48 }}>
          <svg width="48" height="48" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(201,162,39,0.15)" strokeWidth="5" />
            <circle
              cx="26" cy="26" r="21"
              fill="none" stroke="#c9a227" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={OMER_CIRCUMFERENCE}
              strokeDashoffset={OMER_CIRCUMFERENCE - (omerDay / 49) * OMER_CIRCUMFERENCE}
              transform="rotate(-90 26 26)"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#c9a227" }}>{omerDay}</span>
          </div>
        </div>
      }
      title={t.omerSefiratTitle}
      subtitle={`${t.omerDayCount.replace("{day}", String(omerDay))} · ${(49 - omerDay === 1 ? t.omerDayLeft : t.omerDaysLeft).replace("{days}", String(49 - omerDay))}`}
      onTap={onTap}
      minHeight={170}
      watermarkSrc={torahScrollWatermark}
    />
  );
}
