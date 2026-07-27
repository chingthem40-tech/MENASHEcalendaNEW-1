import { useState, useEffect } from "react";
import { HDate } from "@hebcal/core";
import { hebrewDayNumeral } from "../lib/hebrewCalendar";
import { useLanguage } from "../context/LanguageContext";

const STORAGE_KEY = "menashe-my-birthday";

interface Props { onClose: () => void; }

function computeResult(dateStr: string): { hdate: HDate; nextGreg: Date; diffDays: number } | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + "T12:00:00");
    const hd = new HDate(d);
    const curHYear = new HDate().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let next = new HDate(hd.getDate(), hd.getMonth(), curHYear).greg();
    next.setHours(0, 0, 0, 0);
    if (next < today) {
      next = new HDate(hd.getDate(), hd.getMonth(), curHYear + 1).greg();
      next.setHours(0, 0, 0, 0);
    }
    const diffDays = Math.round((next.getTime() - today.getTime()) / 86400000);
    return { hdate: hd, nextGreg: next, diffDays };
  } catch {
    return null;
  }
}

export default function BirthdayModal({ onClose }: Props) {
  const { t } = useLanguage();

  const [birthDate, setBirthDate] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
  });
  const [saved, setSaved] = useState(() => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });
  const [result, setResult] = useState<ReturnType<typeof computeResult>>(() =>
    computeResult((() => { try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; } })())
  );

  useEffect(() => {
    if (birthDate) setResult(computeResult(birthDate));
  }, []);

  function handleDateChange(val: string) {
    setBirthDate(val);
    setSaved(false);
    setResult(null);
  }

  function handleCalculate() {
    setResult(computeResult(birthDate));
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, birthDate);
      window.dispatchEvent(new CustomEvent("menashe-birthday-updated"));
    } catch {}
    setSaved(true);
  }

  function handleClear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("menashe-birthday-updated"));
    } catch {}
    setSaved(false);
    setBirthDate("");
    setResult(null);
  }

  const urgentColor = !result ? "#d4a843"
    : result.diffDays === 0 ? "#ef4444"
    : result.diffDays <= 7 ? "#f0c050"
    : "#d4a843";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
              🎂 {t.birthdayTrackerTitle}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {t.birthdayTrackerSub}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Date input */}
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
            {t.birthdayTrackerGregorianLabel}
          </div>
          <input
            type="date"
            value={birthDate}
            onChange={e => handleDateChange(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              background: "var(--elevated)", border: "1px solid var(--border)",
              color: "var(--text-primary)", fontSize: 15, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            className="btn-gold"
            style={{ flex: 1, padding: "13px", fontSize: 15, fontWeight: 700 }}
            onClick={handleCalculate}
            disabled={!birthDate}
          >
            {t.birthdayTrackerCalculate}
          </button>
          {(saved || (result && birthDate)) && (
            <button
              onClick={handleClear}
              style={{
                padding: "13px 18px", borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.07)",
                color: "#ef4444", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              {t.birthdayTrackerClear}
            </button>
          )}
        </div>

        {/* Result cards */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>

            {/* Hebrew date card */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
                {t.birthdayTrackerHebrewLabel}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(212,168,67,0.18) 0%, rgba(212,168,67,0.06) 100%)",
                  border: "1px solid rgba(212,168,67,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26,
                }}>
                  🎂
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Noto Serif Hebrew', serif",
                    fontSize: 26, fontWeight: 700,
                    color: "#d4a843", direction: "rtl", lineHeight: 1.2,
                  }}>
                    {hebrewDayNumeral(result.hdate.getDate())}{" "}
                    {HDate.getMonthName(result.hdate.getMonth(), result.hdate.getFullYear())}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {new Date(birthDate + "T12:00:00").toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown card */}
            <div style={{
              padding: 16, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(212,168,67,0.10) 0%, rgba(212,168,67,0.04) 100%)",
              border: "1px solid rgba(212,168,67,0.25)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#d4a843", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
                {t.birthdayTrackerNextLabel}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 10 }}>
                {result.nextGreg.toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric",
                })}
              </div>
              {result.diffDays === 0 ? (
                <div style={{
                  fontSize: 16, fontWeight: 800, color: "#f0c050",
                  textAlign: "center", padding: "10px 0",
                  animation: "starShine 2s ease-in-out infinite",
                }}>
                  {t.birthdayTrackerToday}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{
                    fontSize: 44, fontWeight: 900, lineHeight: 1,
                    color: urgentColor,
                    textShadow: `0 0 20px ${urgentColor}44`,
                  }}>
                    {result.diffDays}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600 }}>
                    {t.birthdayTrackerCardDays}
                  </span>
                </div>
              )}
            </div>

            {/* Save / saved state */}
            {!saved ? (
              <button
                className="btn-gold"
                style={{ width: "100%", padding: "13px", fontSize: 15, fontWeight: 700 }}
                onClick={handleSave}
              >
                💾 {t.birthdayTrackerSave}
              </button>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)",
              }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
                  {t.birthdayTrackerSaved}
                </span>
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="btn-close-full" style={{ marginTop: 4 }}>
          {t.modalClose}
        </button>
      </div>
    </div>
  );
}
