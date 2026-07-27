import { useState } from "react";
import { HDate } from "@hebcal/core";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  hdate: HDate;
}

const HEBREW_MONTH_NAMES: Record<string, string> = {
  Nisan: "נִיסָן", Iyar: "אִיָּר", Sivan: "סִיוָן", Tamuz: "תַּמּוּז",
  Av: "אָב", Elul: "אֱלוּל", Tishrei: "תִּשְׁרֵי", Cheshvan: "חֶשְׁוָן",
  Kislev: "כִּסְלֵו", Tevet: "טֵבֵת", Shevat: "שְׁבָט",
  Adar: "אֲדָר", "Adar I": "אֲדָר א׳", "Adar II": "אֲדָר ב׳",
};

function getMonthHebrew(monthName: string): string {
  return HEBREW_MONTH_NAMES[monthName] ?? monthName;
}

interface RoshChodeshState {
  isToday: boolean;
  monthName: string;
  hebrewMonth: string;
}

function computeState(hdate: HDate): RoshChodeshState | null {
  const day = hdate.getDate();
  const year = hdate.getFullYear();
  const month = hdate.getMonth();

  // Today is Rosh Chodesh (1st of the month)
  if (day === 1) {
    const name = HDate.getMonthName(month, year);
    return { isToday: true, monthName: name, hebrewMonth: getMonthHebrew(name) };
  }

  // Tomorrow is Rosh Chodesh (last day of this month → next month starts)
  // Check if tomorrow's HDate has day 1
  const tomorrow = hdate.next();
  if (tomorrow.getDate() === 1) {
    const nextMonth = tomorrow.getMonth();
    const nextYear = tomorrow.getFullYear();
    const name = HDate.getMonthName(nextMonth, nextYear);
    return { isToday: false, monthName: name, hebrewMonth: getMonthHebrew(name) };
  }

  return null;
}

const DISMISS_SESSION_KEY = "menashe-rc-dismissed";

export default function RoshChodeshBanner({ hdate }: Props) {
  const { t, lang } = useLanguage();
  const state = computeState(hdate);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_SESSION_KEY) === String(hdate.abs());
    } catch { return false; }
  });

  if (!state || dismissed) return null;

  function handleDismiss() {
    try { sessionStorage.setItem(DISMISS_SESSION_KEY, String(hdate.abs())); } catch {}
    setDismissed(true);
  }

  const title = state.isToday ? t.roshChodeshTodayTitle : t.roshChodeshTomorrowTitle;
  const sub = (state.isToday ? t.roshChodeshTodaySub : t.roshChodeshTomorrowSub)
    .replace("{month}", state.monthName);

  return (
    <div
      style={{
        marginBottom: 12,
        borderRadius: 16,
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f0e1e, #141028)",
        border: "1.5px solid rgba(129,140,248,0.35)",
        boxShadow: "0 4px 24px rgba(129,140,248,0.12)",
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.8) 30%, rgba(180,190,255,1) 50%, rgba(129,140,248,0.8) 70%, transparent)" }} />

      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Moon icon container */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(129,140,248,0.18), rgba(129,140,248,0.06))",
          border: "1px solid rgba(129,140,248,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>
          🌙
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              padding: "2px 8px", borderRadius: 20,
              background: "rgba(129,140,248,0.15)",
              color: "rgba(180,190,255,0.9)",
              border: "1px solid rgba(129,140,248,0.25)",
            }}>
              {t.roshChodeshLabel}
            </span>
          </div>

          <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(245,240,232,0.95)", marginBottom: 2 }}>
            {title}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "rgba(245,240,232,0.55)" }}>
              {sub}
            </span>
          </div>

          {/* Hebrew month name */}
          <div style={{
            marginTop: 6,
            fontFamily: "'Noto Serif Hebrew', serif",
            fontSize: 18, fontWeight: 700,
            color: "rgba(180,190,255,0.9)",
            letterSpacing: "0.02em",
          }}>
            {state.hebrewMonth}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)",
            color: "rgba(245,240,232,0.35)", fontSize: 14, lineHeight: 1,
            borderRadius: 8, padding: "6px 9px", cursor: "pointer", flexShrink: 0,
            alignSelf: "flex-start",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
