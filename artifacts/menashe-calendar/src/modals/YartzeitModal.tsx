import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { HDate } from "@hebcal/core";
import { hebrewDayNumeral } from "../lib/hebrewCalendar";
import { calculateZmanim } from "../lib/zmanim";
import { Location } from "../lib/locations";
import {
  YartzeitEntry,
  getYahrzeitEntries,
  saveYahrzeitEntries,
  getNextYahrzeit,
} from "../lib/yahrzeit";
import {
  fetchYahrzeitEntries,
  saveYahrzeitEntry,
  deleteYahrzeitEntry,
} from "../lib/userApi";

interface CalculationResult {
  hebrewDay: number;
  hebrewMonth: number;
  hebrewMonthName: string;
  hebrewYear: number;
  wasAfterSunset: boolean;
  sunsetStr: string;
  nextDate: Date | null;
  daysAway: number;
}

interface Props {
  onClose: () => void;
  location: Location;
  onCommunityBoard?: () => void;
}

export default function YartzeitModal({ onClose, location, onCommunityBoard }: Props) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<YartzeitEntry[]>(() => getYahrzeitEntries());
  const [showForm, setShowForm] = useState(false);

  // Sync from server on open (server is source of truth)
  useEffect(() => {
    fetchYahrzeitEntries().then((serverEntries) => {
      if (serverEntries.length > 0) {
        setEntries(serverEntries);
        saveYahrzeitEntries(serverEntries);
      }
    }).catch(() => {});
  }, []);

  const [name, setName] = useState("");
  const [passDateStr, setPassDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  function resetForm() {
    setName("");
    setPassDateStr("");
    setTimeStr("");
    setTimeUnknown(false);
    setResult(null);
    setJustSaved(false);
  }

  function calculate() {
    if (!passDateStr) return;

    const dateOfPassing = new Date(passDateStr + "T12:00:00");
    const zmanim = calculateZmanim(dateOfPassing, location.lat, location.lng);
    const sunset = zmanim.sunset;

    let wasAfterSunset = false;
    let yahrzeitDate = new Date(dateOfPassing);

    if (!timeUnknown && timeStr && sunset) {
      const [h, m] = timeStr.split(":").map(Number);
      const deathTime = new Date(dateOfPassing);
      deathTime.setHours(h, m, 0, 0);
      if (deathTime > sunset) {
        wasAfterSunset = true;
        yahrzeitDate = new Date(dateOfPassing);
        yahrzeitDate.setDate(yahrzeitDate.getDate() + 1);
      }
    }

    const hd = new HDate(yahrzeitDate);
    const hebrewDay = hd.getDate();
    const hebrewMonth = hd.getMonth();
    const hebrewYear = hd.getFullYear();
    const hebrewMonthName = HDate.getMonthName(hebrewMonth, hebrewYear);

    const sunsetStr = sunset
      ? sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: location.tz })
      : "--:--";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentHYear = new HDate(today).getFullYear();
    let nextDate: Date | null = null;
    let daysAway = 0;
    for (let offset = 0; offset <= 2; offset++) {
      try {
        const yhDate = new HDate(hebrewDay, hebrewMonth, currentHYear + offset);
        const greg = yhDate.greg();
        greg.setHours(0, 0, 0, 0);
        if (greg >= today) {
          nextDate = greg;
          daysAway = Math.round((greg.getTime() - today.getTime()) / 86400000);
          break;
        }
      } catch {}
    }

    setResult({ hebrewDay, hebrewMonth, hebrewMonthName, hebrewYear, wasAfterSunset, sunsetStr, nextDate, daysAway });
    setJustSaved(false);
  }

  function saveEntry() {
    if (!result || !name.trim()) return;
    const displayDate = new Date(passDateStr + "T12:00:00").toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    const entry: YartzeitEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      hebrewDay: result.hebrewDay,
      hebrewMonth: result.hebrewMonth,
      displayDate,
      wasAfterSunset: result.wasAfterSunset,
    };
    const next = [...entries, entry];
    setEntries(next);
    saveYahrzeitEntries(next);
    saveYahrzeitEntry(entry).catch(() => {});
    window.dispatchEvent(new CustomEvent("menashe-yahrzeit-updated"));
    setJustSaved(true);
    setTimeout(() => {
      setShowForm(false);
      resetForm();
    }, 1200);
  }

  function deleteEntry(id: string) {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    saveYahrzeitEntries(next);
    deleteYahrzeitEntry(id).catch(() => {});
    window.dispatchEvent(new CustomEvent("menashe-yahrzeit-updated"));
    setDeleteConfirm(null);
  }

  const canCalculate = !!passDateStr && (timeUnknown || !!timeStr);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>🕯 {t.yartzeitTitle}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {t.yartzeitSub}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {onCommunityBoard && (
          <button
            onClick={onCommunityBoard}
            style={{
              width: "100%", marginBottom: 16, padding: "11px 14px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))",
              border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              color: "#D4AF37", fontSize: 13, fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 18 }}>🕯</span>
            <span style={{ flex: 1, textAlign: "left" }}>Community Memorial Board — light candles together</span>
            <span style={{ opacity: 0.6, fontSize: 12 }}>→</span>
          </button>
        )}

        {/* Saved entries */}
        {entries.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 8 }}>{t.yartzeitSavedReminders}</div>
            {entries.map(entry => {
              const next = getNextYahrzeit(entry.hebrewDay, entry.hebrewMonth);
              const isDeleting = deleteConfirm === entry.id;
              return (
                <div key={entry.id} style={{
                  marginBottom: 8, borderRadius: 12,
                  background: next?.isToday ? "linear-gradient(135deg, #2a1500, #1a0f00)" : "var(--elevated)",
                  border: next?.isToday ? "1.5px solid rgba(212,168,67,0.6)" : "1px solid var(--border)",
                  padding: "11px 13px",
                }}>
                  {next?.isToday && (
                    <div style={{
                      display: "inline-flex", gap: 4, alignItems: "center",
                      background: "rgba(212,168,67,0.15)", borderRadius: 99,
                      padding: "2px 8px", marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: "#d4a843", letterSpacing: "0.1em" }}>✦ TODAY'S YAHRZEIT</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{entry.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 13, color: "#d4a843" }}>
                          {next ? `${hebrewDayNumeral(entry.hebrewDay)} ${next.monthName}` : `${entry.hebrewDay} / ${entry.hebrewMonth}`}
                        </span>
                        {next && !next.isToday && (
                          <>
                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {next.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {next && !next.isToday && (
                      <div style={{
                        flexShrink: 0, textAlign: "center",
                        background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.18)",
                        borderRadius: 9, padding: "5px 9px", minWidth: 42,
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: "#d4a843", lineHeight: 1 }}>{next.daysAway}</div>
                        <div style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", marginTop: 1 }}>
                          {next.daysAway === 1 ? "DAY" : "DAYS"}
                        </div>
                      </div>
                    )}
                    {next?.isToday && <span style={{ fontSize: 26, flexShrink: 0 }}>🕯</span>}
                  </div>

                  {next?.isToday && (
                    <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 9, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
                      <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 700, marginBottom: 2 }}>Today's observances:</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        🕯 Light a memorial candle · 🙏 Recite Kaddish · 📖 Study Torah in their memory
                      </div>
                    </div>
                  )}

                  {!isDeleting ? (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <button onClick={() => setDeleteConfirm(entry.id)} style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)",
                        borderRadius: 7, padding: "4px 9px",
                        fontSize: 10, color: "#ef4444", fontWeight: 700, cursor: "pointer",
                      }}>🗑 Remove</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 7, marginTop: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", flex: 1 }}>Remove {entry.name}?</span>
                      <button onClick={() => setDeleteConfirm(null)} style={{ padding: "4px 10px", borderRadius: 7, background: "var(--elevated)", border: "1px solid var(--border)", fontSize: 10, color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => deleteEntry(entry.id)} style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 10, color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>Remove</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Calculator */}
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            width: "100%", padding: "12px 16px", marginBottom: 14,
            background: "rgba(212,168,67,0.07)", border: "1.5px dashed rgba(212,168,67,0.3)",
            borderRadius: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>+</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#d4a843" }}>Calculate a New Yahrzeit</span>
          </button>
        )}

        {showForm && (
          <div style={{ borderRadius: 14, overflow: "hidden", background: "var(--elevated)", border: "1px solid rgba(212,168,67,0.25)", marginBottom: 14 }}>
            <div style={{ padding: "13px 14px 0", fontSize: 12, fontWeight: 800, color: "#d4a843", letterSpacing: "0.08em" }}>✦ YAHRZEIT CALCULATOR</div>

            <div style={{ padding: "10px 14px" }}>
              {/* Name */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.06em" }}>{t.yartzeitNameLabel.toUpperCase()}</div>
              <input
                type="text"
                placeholder="e.g. Miriam Cohen"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 9, marginBottom: 11,
                  background: "var(--card)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />

              {/* Date */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.06em" }}>{t.yartzeitDateLabel.toUpperCase()}</div>
              <input
                type="date"
                value={passDateStr}
                onChange={e => { setPassDateStr(e.target.value); setResult(null); }}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 9, marginBottom: 11,
                  background: "var(--card)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />

              {/* Time */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, letterSpacing: "0.06em" }}>
                {t.yartzeitTimeLabel.toUpperCase()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
                <input
                  type="time"
                  value={timeStr}
                  onChange={e => { setTimeStr(e.target.value); setResult(null); }}
                  disabled={timeUnknown}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 9,
                    background: timeUnknown ? "var(--border)" : "var(--card)",
                    border: "1px solid var(--border)",
                    color: timeUnknown ? "var(--text-muted)" : "var(--text-primary)",
                    fontSize: 14, outline: "none", opacity: timeUnknown ? 0.5 : 1,
                  }}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={timeUnknown}
                    onChange={e => { setTimeUnknown(e.target.checked); setResult(null); }}
                    style={{ width: 16, height: 16, accentColor: "#d4a843", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{t.yartzeitTimeUnknown}</span>
                </label>
              </div>

              {/* Halacha note */}
              <div style={{
                padding: "9px 11px", borderRadius: 9, marginBottom: 12,
                background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.18)",
              }}>
                <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 700, marginBottom: 3 }}>📜 {t.yartzeitHalachicNote}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  If the person passed away <strong style={{ color: "var(--text-primary)" }}>after sunset</strong>, the Yahrzeit falls on the <strong style={{ color: "var(--text-primary)" }}>following Hebrew day</strong>, since the Jewish day begins at nightfall.
                </div>
              </div>

              {/* Calculate */}
              <button
                onClick={calculate}
                disabled={!canCalculate}
                className="btn-gold"
                style={{
                  width: "100%", padding: "12px", borderRadius: 9,
                  fontSize: 14, fontWeight: 800,
                  opacity: canCalculate ? 1 : 0.4, marginBottom: result ? 12 : 0,
                }}
              >
                {t.yartzeitCalculate}
              </button>

              {/* Result */}
              {result && (
                <div>
                  {/* Sunset determination */}
                  <div style={{
                    padding: "10px 12px", borderRadius: 10, marginBottom: 10,
                    background: result.wasAfterSunset
                      ? "rgba(212,168,67,0.1)"
                      : "rgba(20,184,166,0.08)",
                    border: `1px solid ${result.wasAfterSunset ? "rgba(212,168,67,0.3)" : "rgba(20,184,166,0.25)"}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: result.wasAfterSunset ? "#d4a843" : "#14b8a6" }}>
                      {result.wasAfterSunset ? "⚠️ After Sunset — Adjusted by One Hebrew Day" : "✓ Before Sunset — No Adjustment Needed"}
                    </div>
                    {!timeUnknown && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        Sunset in {location.name} was at <strong style={{ color: "var(--text-primary)" }}>{result.sunsetStr}</strong>.
                        {result.wasAfterSunset
                          ? " Since the passing was after sunset, the Yahrzeit moves to the next Hebrew day."
                          : " Since the passing was before sunset, the Yahrzeit is on the same Hebrew day."}
                      </div>
                    )}
                    {timeUnknown && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Time unknown — using the daytime date. You may recalculate once the time is known.</div>
                    )}
                  </div>

                  {/* Hebrew date result */}
                  <div style={{
                    padding: "14px", borderRadius: 12, marginBottom: 10,
                    background: "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))",
                    border: "1.5px solid rgba(212,168,67,0.4)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#d4a843", letterSpacing: "0.1em", marginBottom: 8 }}>YAHRZEIT HEBREW DATE</div>
                    <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 26, color: "#d4a843", direction: "rtl", lineHeight: 1.2, marginBottom: 6 }}>
                      {hebrewDayNumeral(result.hebrewDay)} {result.hebrewMonthName}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{result.hebrewYear} AM</div>
                  </div>

                  {/* Next occurrence */}
                  {result.nextDate && (
                    <div style={{
                      padding: "11px 13px", borderRadius: 10, marginBottom: 12,
                      background: "var(--card)", border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 4 }}>NEXT YAHRZEIT</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                          {result.nextDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <div style={{
                        textAlign: "center",
                        background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
                        borderRadius: 9, padding: "6px 10px", flexShrink: 0, minWidth: 44,
                      }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "#d4a843", lineHeight: 1 }}>
                          {result.daysAway === 0 ? "🕯" : result.daysAway}
                        </div>
                        {result.daysAway > 0 && <div style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em" }}>{result.daysAway === 1 ? "DAY" : "DAYS"}</div>}
                      </div>
                    </div>
                  )}

                  {/* Save */}
                  {justSaved ? (
                    <div style={{
                      padding: "12px", borderRadius: 10, textAlign: "center",
                      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                      fontSize: 13, fontWeight: 700, color: "#22c55e",
                    }}>{t.yartzeitSaved}</div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setShowForm(false); resetForm(); }} style={{
                        flex: 1, padding: "10px 0", borderRadius: 9,
                        background: "var(--card)", border: "1px solid var(--border)",
                        color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}>Cancel</button>
                      <button onClick={saveEntry} disabled={!name.trim()} className="btn-gold" style={{
                        flex: 2, padding: "10px 0", borderRadius: 9,
                        fontSize: 13, fontWeight: 800,
                        opacity: name.trim() ? 1 : 0.4,
                      }}>🔔 {t.yartzeitSaveReminder}</button>
                    </div>
                  )}
                </div>
              )}

              {!result && (
                <button onClick={() => { setShowForm(false); resetForm(); }} style={{
                  width: "100%", marginTop: 8, padding: "9px", borderRadius: 9,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--text-muted)", fontSize: 12, cursor: "pointer",
                }}>Cancel</button>
              )}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-close-full">{t.yartzeitClose}</button>
      </div>
    </div>
  );
}
