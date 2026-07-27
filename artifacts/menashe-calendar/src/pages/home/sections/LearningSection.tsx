import React from "react";
import ParashaCard from "../components/cards/ParashaCard";
import OmerCard from "../components/cards/OmerCard";
import DailyWisdomCard from "../components/cards/DailyWisdomCard";

interface Parasha {
  name: string;
  book: string;
  verses: string;
}

interface LearningSectionProps {
  /** Weekly Torah portion; when null the ParashaCard is hidden */
  parasha: Parasha | null;
  nextShabbat: Date;
  onShowParashah: () => void;

  /** Sefirat Ha-Omer day (1–49); when null the OmerCard is hidden */
  omerDay: number | null;
  onShowOmer: () => void;

  /** Hebrew absolute day number used to pick the daily Torah thought */
  hdateAbsDay: number;

  /** DailyBriefingCard — passed from Home.tsx where its local state lives */
  children?: React.ReactNode;
}

/**
 * LearningSection
 *
 * Groups all Torah-learning cards on the home screen:
 * weekly parasha, Sefirat Ha-Omer counter, and the daily wisdom card.
 * Controls conditional rendering and the vertical ordering of the block.
 */
export default function LearningSection({
  parasha,
  nextShabbat,
  onShowParashah,
  omerDay,
  onShowOmer,
  hdateAbsDay,
  children,
}: LearningSectionProps) {
  return (
    <>
      {parasha && (
        <ParashaCard
          parasha={parasha}
          nextShabbat={nextShabbat}
          onTap={onShowParashah}
        />
      )}

      {omerDay !== null && (
        <OmerCard omerDay={omerDay} onTap={onShowOmer} />
      )}

      <DailyWisdomCard hdateAbsDay={hdateAbsDay}>
        {children}
      </DailyWisdomCard>
    </>
  );
}
