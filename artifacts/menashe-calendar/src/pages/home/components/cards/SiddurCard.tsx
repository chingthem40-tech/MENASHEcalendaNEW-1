import React from "react";
import CompassCard from "../../../../components/CompassCard";
import torahScrollWatermark from "@assets/afc3e4a8-094b-4933-9d08-f8fb899140c9_1782276994801.webp";

const SIDDUR_CATEGORIES = ["Siddur", "Tehillim", "Torah", "Kuki Books"] as const;

interface SiddurCardProps {
  onTap: () => void;
}

export default function SiddurCard({ onTap }: SiddurCardProps) {
  return (
    <CompassCard
      gradient="linear-gradient(160deg, #0d0c1a 0%, #08070f 55%, #0f0e1c 100%)"
      accentColor="#c9a227"
      shimmerColor="#e8c84a"
      category="SIDDUR LIBRARY"
      icon={<span style={{ fontSize: 42, filter: "drop-shadow(0 0 8px rgba(201,162,39,0.4))" }}>📚</span>}
      title="Sacred Texts & Prayers"
      subtitle="Siddurim, Tehillim, Torah & Kuki Books"
      previewContent={
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          {SIDDUR_CATEGORIES.map(cat => (
            <div key={cat} style={{
              flex: 1, textAlign: "center",
              background: "rgba(201,162,39,0.07)",
              border: "1px solid rgba(201,162,39,0.2)",
              borderRadius: 8, padding: "5px 2px",
              fontSize: 9, fontWeight: 700, color: "rgba(201,162,39,0.75)",
              letterSpacing: "0.05em",
            }}>{cat}</div>
          ))}
        </div>
      }
      onTap={onTap}
      minHeight={200}
      watermarkSrc={torahScrollWatermark}
    />
  );
}
