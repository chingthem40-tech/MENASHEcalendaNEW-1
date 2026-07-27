import React from "react";
import CompassCard from "../../../../components/CompassCard";
import dailyWisdomBg from "@assets/ChatGPT_Image_Jun_24,_2026,_12_01_34_PM_1782300946792.webp";
import { TORAH_THOUGHTS } from "../../data";

interface DailyWisdomCardProps {
  hdateAbsDay: number;
  children?: React.ReactNode;
}

export default function DailyWisdomCard({ hdateAbsDay, children }: DailyWisdomCardProps) {
  const dayIdx = Math.abs(hdateAbsDay) % TORAH_THOUGHTS.length;
  const thought = TORAH_THOUGHTS[dayIdx];

  return (
    <CompassCard
      gradient="linear-gradient(160deg, #0d0c1a 0%, #08070f 55%, #0f0e1c 100%)"
      accentColor="#c9a227"
      shimmerColor="#e8c84a"
      category="DAILY WISDOM"
      icon={<span style={{ fontSize: 38, filter: "drop-shadow(0 0 8px rgba(201,162,39,0.4))" }}>✡</span>}
      title={`"${thought.quote.length > 60 ? thought.quote.slice(0, 60) + "…" : thought.quote}"`}
      subtitle={thought.source}
      expandedTitle="Daily Wisdom"
      expandedSubtitle="Sacred teachings for today"
      watermarkSrc={dailyWisdomBg}
    >
      {children && (
        <div style={{ padding: "20px 20px 0" }}>
          {children}
        </div>
      )}
    </CompassCard>
  );
}
