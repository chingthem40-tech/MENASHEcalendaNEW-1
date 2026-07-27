import { useState, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Translations, en as enBase, tk as tkBase } from "../lib/translations";

type Group = { label: string; keys: (keyof Translations)[] };

const GROUPS: Group[] = [
  {
    label: "landing",
    keys: [
      "landingBadge","landingHero","landingSubtitle","landingSignIn","landingFree",
      "landingScroll","landingFeaturesEyebrow","landingFeaturesHeading",
      "featureZmanimTitle","featureZmanimDesc","featureTorahTitle","featureTorahDesc",
      "featureCommunityTitle","featureCommunityDesc","statsParashot","statsHolidays",
      "statsCommunities","ctaHeading","ctaSubtitle",
    ],
  },
  {
    label: "nav",
    keys: ["navHome","navCalendar","navZmanim","navSiddur","navSettings"],
  },
  {
    label: "settings",
    keys: [
      "settingsTitle","settingsLocation","settingsCity","settingsCityHint","settingsTimezone",
      "settingsAppearance","settingsDarkMode","settingsDarkOn","settingsDarkOff",
      "settingsShowHebrew","settingsLanguage","settingsLanguageHint",
      "settingsEditTranslations","settingsEditTranslationsHint",
      "settingsNotifications","settingsCandleLighting","settingsHavdalah",
      "settingsShema","settingsPrayers","settingsHolidays","settingsParasha",
      "settingsOmer","settingsShabbatDigest","settingsYahrtzeit",
      "settingsLeadTime","settingsLeadTimeHint",
      "settingsEnablePush","settingsEnablingPush","settingsTestPush","settingsTestSent",
      "settingsDisablePush","settingsPushActive",
      "settingsTools","settingsTahara","settingsTaharaSub","settingsYartzeitCalc",
      "settingsYartzeitSub","settingsBirthday","settingsBirthdaySub",
      "settingsCommunity","settingsCommunitySub","settingsCensus","settingsCensusSub",
      "settingsUpgrade","settingsUpgradeSub","settingsAccount","settingsSignOut",
      "settingsVersion","settingsNotifBlocked","settingsNotifBlockedSub","settingsNotifActive",
    ],
  },
  {
    label: "home",
    keys: [
      "homeToday","homeHebrewDate","homeGregorian","homeHebrewYear",
      "homeZmanim","homeViewAll","homeSunrise","homeSunset",
      "homeCandleLighting","homeHavdalahTonight","homeShabbatShalom",
      "homeShabbatInProgress","homeHavdalahAt","homeShavuaTov",
      "homeDailyTorah","homeReadMore","homeShowLess","homeShare",
      "homeTodayHoliday","homeChagSameach","homeCommunityTitle","homeCommunityDesc",
      "homeCensusTitle","homeCensusDesc","homeUpcomingHolidays","homeNoHolidays",
      "homeParashah","homeDafYomi","homeMoreTools","homeOmer",
    ],
  },
];

const ALL_KEYS = new Set(GROUPS.flatMap(g => g.keys));

const GROUP_LABELS: Record<string, string> = {
  landing: "Landing Page",
  nav:     "Navigation",
  settings:"Settings",
  home:    "Home Page",
};

interface Props { onClose: () => void }

export default function TranslationEditorModal({ onClose }: Props) {
  const { t, tkOverrides, saveTkOverrides, resetTkOverrides } = useLanguage();

  const [edits, setEdits] = useState<Partial<Translations>>(() => {
    const merged: Partial<Translations> = {};
    (Object.keys(tkBase) as (keyof Translations)[]).forEach(k => {
      merged[k] = (tkOverrides[k] ?? tkBase[k]) as any;
    });
    return merged;
  });

  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    return GROUPS.map(g => ({
      ...g,
      keys: g.keys.filter(k => {
        if (activeGroup && g.label !== activeGroup) return false;
        if (!q) return true;
        const enVal = (enBase[k] as string)?.toLowerCase() ?? "";
        const tkVal = (edits[k] as string | undefined)?.toLowerCase() ?? "";
        return enVal.includes(q) || tkVal.includes(q) || k.toLowerCase().includes(q);
      }),
    })).filter(g => g.keys.length > 0);
  }, [search, activeGroup, edits]);

  function handleChange(key: keyof Translations, value: string) {
    setEdits(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveTkOverrides(edits as Partial<Translations>);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  function handleReset() {
    if (!window.confirm(t.txEditorResetConfirm)) return;
    resetTkOverrides();
    const reset: Partial<Translations> = {};
    (Object.keys(tkBase) as (keyof Translations)[]).forEach(k => { reset[k] = tkBase[k] as any; });
    setEdits(reset);
    setSaved(false);
  }

  /* ── Paste from Clipboard ── */
  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setImportMsg({ type: "err", text: "Clipboard is empty." });
        setTimeout(() => setImportMsg(null), 4000);
        return;
      }
      const raw = JSON.parse(text);
      if (typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid format");
      const incoming: Partial<Translations> = {};
      let imported = 0;
      let skipped = 0;
      Object.entries(raw).forEach(([key, val]) => {
        if (ALL_KEYS.has(key as keyof Translations) && typeof val === "string") {
          (incoming as any)[key] = val;
          imported++;
        } else { skipped++; }
      });
      if (imported === 0) throw new Error("No valid translation keys found");
      setEdits(prev => ({ ...prev, ...incoming }));
      setSaved(false);
      setImportMsg({
        type: "ok",
        text: `✓ Pasted ${imported} label${imported !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} unknown keys skipped)` : ""}. Hit Save to apply.`,
      });
      setTimeout(() => setImportMsg(null), 6000);
    } catch (err: any) {
      setImportMsg({
        type: "err",
        text: err.name === "SyntaxError"
          ? "Clipboard doesn't contain valid JSON."
          : err.message === "Invalid format" || err.message === "No valid translation keys found"
          ? `Paste failed: ${err.message}`
          : "Clipboard access denied — please use the ↑ Import button instead.",
      });
      setTimeout(() => setImportMsg(null), 5000);
    }
  }

  /* ── Copy to Clipboard ── */
  function handleCopy() {
    const payload: Record<string, string> = {};
    (Object.keys(edits) as (keyof Translations)[]).forEach(k => {
      payload[k] = (edits[k] as string) ?? "";
    });
    const json = JSON.stringify(payload, null, 2);
    navigator.clipboard?.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      setImportMsg({ type: "err", text: "Clipboard not available in this browser." });
      setTimeout(() => setImportMsg(null), 4000);
    });
  }

  /* ── Export ── */
  function handleExport() {
    const payload: Record<string, string> = {};
    (Object.keys(edits) as (keyof Translations)[]).forEach(k => {
      payload[k] = (edits[k] as string) ?? "";
    });
    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menashe-tk-translations.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ── Import ── */
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        if (typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid format");
        const incoming: Partial<Translations> = {};
        let imported = 0;
        let skipped = 0;
        Object.entries(raw).forEach(([key, val]) => {
          if (ALL_KEYS.has(key as keyof Translations) && typeof val === "string") {
            (incoming as any)[key] = val;
            imported++;
          } else {
            skipped++;
          }
        });
        if (imported === 0) throw new Error("No valid keys found in file");
        setEdits(prev => ({ ...prev, ...incoming }));
        setSaved(false);
        setImportMsg({
          type: "ok",
          text: `✓ Imported ${imported} label${imported !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} unknown keys skipped)` : ""}. Hit Save to apply.`,
        });
        setTimeout(() => setImportMsg(null), 6000);
      } catch (err: any) {
        setImportMsg({ type: "err", text: `Import failed: ${err.message}` });
        setTimeout(() => setImportMsg(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const totalKeys = GROUPS.reduce((sum, g) => sum + g.keys.length, 0);
  const overrideCount = Object.keys(tkOverrides).length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "var(--bg)", display: "flex", flexDirection: "column",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 14px", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 22, padding: "2px 6px", lineHeight: 1, flexShrink: 0 }}
        >←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{t.txEditorTitle}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {totalKeys} labels{overrideCount > 0 ? ` · ${overrideCount} customised` : ""}
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 16px", borderRadius: 10, flexShrink: 0,
            background: saved ? "rgba(34,197,94,0.15)" : "rgba(212,168,67,0.15)",
            border: `1px solid ${saved ? "rgba(34,197,94,0.4)" : "rgba(212,168,67,0.4)"}`,
            color: saved ? "#22c55e" : "#d4a843", fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {saved ? t.txEditorSaved : t.txEditorSave}
        </button>
      </div>

      {/* ── Note bar ── */}
      <div style={{
        padding: "7px 14px", background: "rgba(212,168,67,0.05)",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.txEditorNote}</div>
      </div>

      {/* ── Import status bar ── */}
      {importMsg && (
        <div style={{
          padding: "9px 14px", flexShrink: 0,
          background: importMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          borderBottom: "1px solid var(--border)",
          color: importMsg.type === "ok" ? "#22c55e" : "#ef4444",
          fontSize: 12, fontWeight: 600,
        }}>
          {importMsg.text}
        </div>
      )}

      {/* ── Toolbar: search + group filter + export/import ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7, padding: "9px 14px",
        borderBottom: "1px solid var(--border)", flexShrink: 0, flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 140, position: "relative" }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder={t.txEditorSearch}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "7px 9px 7px 30px", borderRadius: 8,
              background: "var(--elevated)", border: "1px solid var(--border)",
              color: "var(--text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Group pills */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[null, ...GROUPS.map(g => g.label)].map(g => (
            <button
              key={g ?? "all"}
              onClick={() => setActiveGroup(g)}
              style={{
                padding: "5px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                border: "1px solid",
                borderColor: activeGroup === g ? "#d4a843" : "var(--border)",
                background: activeGroup === g ? "rgba(212,168,67,0.12)" : "var(--elevated)",
                color: activeGroup === g ? "#d4a843" : "var(--text-muted)",
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {g === null ? "All" : GROUP_LABELS[g]}
            </button>
          ))}
        </div>

        {/* Export / Import / Copy buttons */}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button
            onClick={handleCopy}
            title="Copy all current TK labels as JSON to clipboard"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
              color: copied ? "#22c55e" : "var(--text-secondary)",
              cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "⧉ Copy"}
          </button>
          <button
            onClick={handleExport}
            title="Export all current TK labels as a JSON file"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.3)",
              color: "#63b3ed", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            ↓ Export
          </button>
          <button
            onClick={handlePaste}
            title="Paste TK labels JSON from clipboard"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
              color: "#fbbf24", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            ⧉ Paste
          </button>
          <button
            onClick={handleImportClick}
            title="Import TK labels from a JSON file"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)",
              color: "#a78bfa", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            ↑ Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* ── Table header ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        padding: "5px 14px", background: "var(--elevated)",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)" }}>🇬🇧 {t.txEditorEnglish}</div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#d4a843" }}>✏️ {t.txEditorThadou}</div>
      </div>

      {/* ── Rows ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 84 }}>
        {filteredGroups.map(group => (
          <div key={group.label}>
            <div style={{
              padding: "8px 14px 5px", fontSize: 10, fontWeight: 800,
              letterSpacing: "0.12em", color: "#d4a843",
              background: "rgba(212,168,67,0.04)", borderBottom: "1px solid var(--border)",
              position: "sticky", top: 0, zIndex: 2,
            }}>
              {GROUP_LABELS[group.label] ?? group.label}
            </div>
            {group.keys.map(k => {
              const enVal = enBase[k] as string;
              const tkVal = (edits[k] as string | undefined) ?? tkBase[k] as string;
              const isOverridden = tkOverrides[k] !== undefined;
              return (
                <div
                  key={k}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    borderBottom: "1px solid var(--border)",
                    background: isOverridden ? "rgba(212,168,67,0.025)" : "transparent",
                  }}
                >
                  {/* English (read-only) */}
                  <div style={{ padding: "9px 12px 9px 14px", borderRight: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>
                      {k}
                      {isOverridden && <span style={{ marginLeft: 5, color: "#d4a843" }}>●</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{enVal}</div>
                  </div>
                  {/* TK (editable) */}
                  <div style={{ padding: "7px 11px", display: "flex", alignItems: "stretch" }}>
                    <textarea
                      value={tkVal}
                      onChange={e => handleChange(k, e.target.value)}
                      rows={Math.max(1, Math.min(4, Math.ceil(tkVal.length / 28)))}
                      style={{
                        flex: 1, resize: "none", fontSize: 13, lineHeight: 1.4,
                        background: "var(--elevated)", color: "var(--text-primary)",
                        border: "1px solid",
                        borderColor: isOverridden ? "rgba(212,168,67,0.4)" : "var(--border)",
                        borderRadius: 7, padding: "5px 8px", outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No labels match "{search}"
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 14px", background: "var(--bg)",
        borderTop: "1px solid var(--border)",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        {/* Copy / Export / Import (mirrored at bottom for quick access) */}
        <button
          onClick={handleCopy}
          style={{
            padding: "11px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
            color: copied ? "#22c55e" : "var(--text-secondary)",
            cursor: "pointer", transition: "all 0.2s",
          }}
        >{copied ? "✓ Copied!" : "⧉ Copy"}</button>
        <button
          onClick={handleExport}
          style={{
            padding: "11px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.3)",
            color: "#63b3ed", cursor: "pointer",
          }}
        >↓ Export</button>
        <button
          onClick={handlePaste}
          style={{
            padding: "11px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
            color: "#fbbf24", cursor: "pointer",
          }}
        >⧉ Paste</button>
        <button
          onClick={handleImportClick}
          style={{
            padding: "11px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)",
            color: "#a78bfa", cursor: "pointer",
          }}
        >↑ Import</button>

        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: saved ? "rgba(34,197,94,0.15)" : "rgba(212,168,67,0.15)",
            border: `1px solid ${saved ? "rgba(34,197,94,0.4)" : "rgba(212,168,67,0.4)"}`,
            color: saved ? "#22c55e" : "#d4a843", fontWeight: 700, fontSize: 15, cursor: "pointer",
          }}
        >
          {saved ? t.txEditorSaved : t.txEditorSave}
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          style={{
            padding: "11px 14px", borderRadius: 12,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)",
            color: "#ef4444", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          {t.txEditorReset}
        </button>
      </div>
    </div>
  );
}
