import { useState } from "react";
import { HebrewCalendar, flags } from "@hebcal/core";
import { getHolidayInsight, getHolidayEmoji, getHolidayHebrewName } from "../lib/holidayInsights";
import { useLanguage } from "../context/LanguageContext";

interface Props { onClose: () => void; }

interface HolidayEvent {
  name: string;
  date: Date;
  emoji: string;
  hebrewName: string;
  category: string;
}

function useCategoryLabel() {
  const { t } = useLanguage();
  return {
    major:           { label: t.holidaysCategoryYomTov,     color: "#d4a843", bg: "rgba(212,168,67,0.12)" },
    fast:            { label: t.holidaysCategoryFast,        color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
    minor:           { label: t.holidaysCategoryMinor,       color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
    rosh_chodesh:    { label: t.holidaysCategoryRoshChodesh, color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
    modern:          { label: t.holidaysCategoryModern,      color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    shabbat_special: { label: t.holidaysCategoryShabbat,    color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  };
}

function getCategoryFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("rosh chodesh")) return "rosh_chodesh";
  if (n.includes("shabbat")) return "shabbat_special";
  if (n.includes("fast") || n.includes("tzom") || n.includes("tisha") || n.includes("asara") || n.includes("tammuz") || n.includes("gedaliah") || n.includes("esther") || n.includes("behaalot")) return "fast";
  if (n.includes("shoah") || n.includes("zikaron") || n.includes("atzmaut") || n.includes("yerushalayim")) return "modern";
  const insight = getHolidayInsight(name);
  return insight?.category ?? "minor";
}

function MussarInsightPanel({ name, hebrewName }: { name: string; hebrewName: string }) {
  const { t } = useLanguage();
  const insight = getHolidayInsight(name);
  const [section, setSection] = useState<string | null>(null);

  if (!insight) {
    return (
      <div style={{ padding: "14px 0 4px" }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
          {t.holidaysInsightsSoon}
        </p>
      </div>
    );
  }

  const sections = [
    { key: "overview",              icon: "📋", label: "Overview",                    text: insight.overview,              accent: false },
    { key: "observances",           icon: "🕍", label: "Observances & Practices",     text: insight.observances,           accent: false },
    { key: "mussarLesson",          icon: "⚖️", label: t.holidaysMussarLesson,        text: insight.mussarLesson,          accent: true  },
    { key: "spiritualTheme",        icon: "🌟", label: t.holidaysSpiritualTheme,      text: insight.spiritualTheme,        accent: false },
    { key: "bneiManasheConnection", icon: "✡", label: "Bnei Menashe Connection",     text: insight.bneiManasheConnection, accent: true  },
  ];

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Hebrew quote */}
      <div style={{
        marginBottom: 10, padding: "10px 14px", borderRadius: 12,
        background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.18)",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
        <div>
          <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 16, color: "var(--gold)", direction: "rtl", lineHeight: 1.5, marginBottom: 4 }}>
            {insight.hebrewQuote.text}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
            "{insight.hebrewQuote.translation}"
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>— {insight.hebrewQuote.source}</div>
        </div>
      </div>

      {sections.map(s => (
        <div key={s.key} style={{
          borderRadius: 10, marginBottom: 6, overflow: "hidden",
          background: "var(--card)",
          border: `1px solid ${s.accent ? "rgba(212,168,67,0.22)" : "var(--border)"}`,
        }}>
          <button
            onClick={() => setSection(prev => prev === s.key ? null : s.key)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: s.accent ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${s.accent ? "rgba(212,168,67,0.22)" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>
              {s.icon}
            </div>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: s.accent ? "var(--gold)" : "var(--text-primary)" }}>
              {s.label}
            </span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path
                d={section === s.key ? "M2 8 L6 4 L10 8" : "M2 4 L6 8 L10 4"}
                stroke={section === s.key ? "#d4a843" : "#64748b"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
          {section === s.key && (
            <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, marginTop: 12, marginBottom: 0 }}>
                {s.text}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

type FilterTab = "all" | "major" | "fast" | "minor" | "modern";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",    label: "All" },
  { key: "major",  label: "Yom Tov" },
  { key: "fast",   label: "Fasts" },
  { key: "minor",  label: "Minor" },
  { key: "modern", label: "Modern" },
];

export default function HolidaysModal({ onClose }: Props) {
  const { t } = useLanguage();
  const CATEGORY_LABEL = useCategoryLabel();
  const today = new Date();
  const end = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  const allEvents: HolidayEvent[] = HebrewCalendar.calendar({
    start: today,
    end,
    il: true,
    isHebrewYear: false,
    mask:
      flags.CHAG |
      flags.ROSH_CHODESH |
      flags.MODERN_HOLIDAY |
      flags.MINOR_FAST |
      flags.MAJOR_FAST |
      flags.MINOR_HOLIDAY |
      flags.SPECIAL_SHABBAT,
  }).map(ev => {
    const name = ev.render("en");
    return {
      name,
      date: ev.getDate().greg(),
      emoji: getHolidayEmoji(name),
      hebrewName: getHolidayHebrewName(name),
      category: getCategoryFromName(name),
    };
  });

  const events = filter === "all"
    ? allEvents
    : allEvents.filter(ev => {
        if (filter === "major") return ev.category === "major" || ev.category === "shabbat_special";
        if (filter === "fast") return ev.category === "fast";
        if (filter === "minor") return ev.category === "minor" || ev.category === "rosh_chodesh";
        if (filter === "modern") return ev.category === "modern";
        return true;
      });

  function toggle(i: number) {
    setExpanded(prev => prev === i ? null : i);
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-card"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "92vh", display: "flex", flexDirection: "column" }}
      >

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{t.holidaysTitle}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {today.getFullYear()}–{today.getFullYear() + 1} · {allEvents.length} observances · tap for Mussar insights
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexShrink: 0, overflowX: "auto", paddingBottom: 2 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setExpanded(null); }}
              style={{
                flexShrink: 0, padding: "5px 14px", borderRadius: 99,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: filter === tab.key ? "var(--gold)" : "var(--elevated)",
                color: filter === tab.key ? "#1a0f00" : "var(--text-muted)",
                border: `1px solid ${filter === tab.key ? "var(--gold)" : "var(--border)"}`,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Holiday list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div className="card" style={{ overflow: "hidden", marginBottom: 12 }}>
            {events.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No observances found</div>
            )}
            {events.map((ev, i) => {
              const cat = CATEGORY_LABEL[ev.category as keyof typeof CATEGORY_LABEL] ?? CATEGORY_LABEL["minor"];
              const isOpen = expanded === i;
              return (
                <div key={i}>
                  <div
                    onClick={() => toggle(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", cursor: "pointer",
                      borderBottom: i < events.length - 1 && !isOpen ? "1px solid var(--border)" : "none",
                      background: isOpen ? "rgba(212,168,67,0.04)" : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Emoji */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: cat.bg, border: `1px solid ${cat.color}22`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>
                      {ev.emoji}
                    </div>

                    {/* Name + date */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ev.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {ev.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {ev.hebrewName && (
                          <span style={{ fontFamily: "'Noto Serif Hebrew',serif", color: "var(--gold)", fontSize: 12 }}>
                            {ev.hebrewName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category badge + chevron */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
                        background: cat.bg, color: cat.color, letterSpacing: "0.06em",
                        border: `1px solid ${cat.color}33`,
                      }}>
                        {cat.label.toUpperCase()}
                      </span>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: isOpen ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isOpen ? "rgba(212,168,67,0.2)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                          <path
                            d={isOpen ? "M2 8 L6 4 L10 8" : "M2 4 L6 8 L10 4"}
                            stroke={isOpen ? "#d4a843" : "#64748b"}
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{
                      padding: "0 16px 16px",
                      borderBottom: i < events.length - 1 ? "1px solid var(--border)" : "none",
                      background: "rgba(212,168,67,0.02)",
                    }}>
                      <MussarInsightPanel name={ev.name} hebrewName={ev.hebrewName} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={onClose} className="btn-close-full" style={{ marginBottom: 4 }}>Close</button>
        </div>
      </div>
    </div>
  );
}
