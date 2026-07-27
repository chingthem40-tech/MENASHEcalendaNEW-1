import React from "react";
import SiddurCard from "../components/cards/SiddurCard";

interface PrayerSectionProps {
  onOpenSiddur: () => void;
}

/**
 * PrayerSection
 *
 * Groups prayer-related cards on the home screen.
 * Currently contains the Siddur Library card; additional prayer resources
 * (Tehillim, daily tefillot shortcuts, etc.) can be added here in future
 * sprints without touching Home.tsx.
 */
export default function PrayerSection({ onOpenSiddur }: PrayerSectionProps) {
  return (
    <>
      <SiddurCard onTap={onOpenSiddur} />
    </>
  );
}
