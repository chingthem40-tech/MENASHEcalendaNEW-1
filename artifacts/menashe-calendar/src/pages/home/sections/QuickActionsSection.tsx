import React from "react";
import QuickActionGrid from "../components/sections/QuickActionGrid";

interface QuickActionsSectionProps {
  hebrewYear: number;
  isPremium: boolean;
  onShowHolidays: () => void;
  onShowDafYomi: () => void;
  onShowPremium: () => void;
  onMoreTools: () => void;
}

/**
 * QuickActionsSection
 *
 * Groups the home screen's quick-access feature tiles.
 * Owns the layout container for the action grid; additional rows of
 * shortcuts can be added here without widening Home.tsx.
 */
export default function QuickActionsSection({
  hebrewYear,
  isPremium,
  onShowHolidays,
  onShowDafYomi,
  onShowPremium,
  onMoreTools,
}: QuickActionsSectionProps) {
  return (
    <QuickActionGrid
      hebrewYear={hebrewYear}
      isPremium={isPremium}
      onShowHolidays={onShowHolidays}
      onShowDafYomi={onShowDafYomi}
      onShowPremium={onShowPremium}
      onMoreTools={onMoreTools}
    />
  );
}
