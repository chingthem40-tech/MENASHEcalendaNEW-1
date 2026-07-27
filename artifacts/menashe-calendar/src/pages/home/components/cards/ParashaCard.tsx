import React from "react";
import CompassCard from "../../../../components/CompassCard";
import torahScrollWatermark from "@assets/afc3e4a8-094b-4933-9d08-f8fb899140c9_1782276994801.webp";

interface Parasha {
  name: string;
  book: string;
  verses: string;
}

interface ParashaCardProps {
  parasha: Parasha;
  nextShabbat: Date;
  onTap: () => void;
}

export default function ParashaCard({ parasha, nextShabbat, onTap }: ParashaCardProps) {
  return (
    <CompassCard
      gradient="linear-gradient(160deg, #0d0c1a 0%, #08070f 55%, #0f0e1c 100%)"
      accentColor="#c9a227"
      shimmerColor="#e8c84a"
      category="THIS WEEK'S PARASHA"
      icon={
        <span style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 42, color: "#c9a227", lineHeight: 1, display: "block", filter: "drop-shadow(0 0 14px rgba(201,162,39,0.55))" }}>
          פ
        </span>
      }
      title={`Parashat ${parasha.name}`}
      subtitle={`${parasha.book} · ${parasha.verses}`}
      badge={
        <span style={{
          fontSize: 10, fontWeight: 800, color: "#c9a227", letterSpacing: "0.08em",
          background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.32)",
          padding: "3px 9px", borderRadius: 20,
        }}>
          SHABBAT {nextShabbat.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
        </span>
      }
      onTap={onTap}
      minHeight={180}
      watermarkSrc={torahScrollWatermark}
    />
  );
}
