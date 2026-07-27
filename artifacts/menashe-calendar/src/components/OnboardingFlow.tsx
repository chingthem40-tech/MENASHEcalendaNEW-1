import { useState, useCallback } from "react";
import { LOCATIONS, Location } from "../lib/locations";
import translations from "../lib/translations";
import type { Lang } from "../lib/translations";

const ONBOARDING_KEY = "menashe-onboarding-v1";

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "done";
  } catch {
    return false;
  }
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "done");
  } catch {}
}

interface Props {
  onFinished: () => void;
}

type Step = 1 | 2 | 3;
type GeoState = "idle" | "loading" | "done" | "error";
type NotifState = "idle" | "granted" | "denied";

export default function OnboardingFlow({ onFinished }: Props) {
  /* ── live language so the UI translates as the user picks ── */
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("menashe-language") as Lang) || "en";
    } catch {
      return "en";
    }
  });
  const t = translations[lang];

  const [step, setStep] = useState<Step>(1);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [visible, setVisible] = useState(true);

  /* Location state */
  const [selectedLoc, setSelectedLoc] = useState<Location | null>(() => {
    try {
      const saved = localStorage.getItem("menashe-location");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoError, setGeoError] = useState("");
  const [locSearch, setLocSearch] = useState("");

  /* Notification state */
  const [notifState, setNotifState] = useState<NotifState>("idle");

  /* ─────────── helpers ─────────── */
  function saveLang(l: Lang) {
    setLangState(l);
    try { localStorage.setItem("menashe-language", l); } catch {}
  }

  function saveLoc(loc: Location) {
    setSelectedLoc(loc);
    try { localStorage.setItem("menashe-location", JSON.stringify(loc)); } catch {}
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let name = "My Location";
        let country = "Custom";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            name = addr.city || addr.town || addr.village || addr.county || addr.state || "My Location";
            country = addr.country || "Custom";
          }
        } catch {}
        const loc: Location = { name, country, lat, lng, tz, candleLightingMinutes: 18 };
        saveLoc(loc);
        setGeoState("done");
      },
      (err) => {
        setGeoState("error");
        setGeoError(
          err.code === 1
            ? "Location access denied. Select a city below."
            : "Could not detect location. Select a city below."
        );
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotifState("denied");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifState(perm === "granted" ? "granted" : "denied");
  }

  const advance = useCallback(() => {
    setAnimDir("forward");
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
    } else {
      finish();
    }
  }, [step]);

  const finish = useCallback(() => {
    markOnboardingSeen();
    setVisible(false);
    setTimeout(onFinished, 400);
  }, [onFinished]);

  const filteredLocs = LOCATIONS.filter(
    (l) =>
      l.name.toLowerCase().includes(locSearch.toLowerCase()) ||
      l.country.toLowerCase().includes(locSearch.toLowerCase())
  );

  /* ─────────── styles ─────────── */
  const gold = "#D4AF37";
  const goldDim = "rgba(212,175,55,0.18)";
  const bg = "#080e1a";
  const card = "#111827";
  const border = "rgba(212,175,55,0.22)";
  const text = "#F5F0E8";
  const muted = "#8a9ab5";

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "14px 0",
    borderRadius: 12,
    border: "none",
    background: `linear-gradient(180deg, #F0C840 0%, #C49A20 100%)`,
    color: "#0a0800",
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: "0.02em",
    cursor: "pointer",
    boxShadow: "0 4px 0 rgba(100,70,5,0.8), 0 6px 20px rgba(212,175,55,0.2)",
    transition: "transform 0.1s, box-shadow 0.1s",
  };

  const btnGhost: React.CSSProperties = {
    background: "transparent",
    border: `1px solid ${border}`,
    color: muted,
    padding: "12px 0",
    width: "100%",
    borderRadius: 12,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 500,
  };

  /* ─────────── step content ─────────── */
  const stepContent = () => {
    if (step === 1) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(["en", "tk"] as Lang[]).map((l) => {
            const active = lang === l;
            return (
              <button
                key={l}
                onClick={() => saveLang(l)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderRadius: 14,
                  border: `2px solid ${active ? gold : border}`,
                  background: active ? goldDim : card,
                  cursor: "pointer",
                  transition: "all 0.18s",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 32 }}>{l === "en" ? "🇮🇱" : "🇮🇳"}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: active ? gold : text }}>
                    {l === "en" ? "English" : "Thadou Kuki"}
                  </div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                    {l === "en" ? "Standard English interface" : "Thadou Kuki interface — mipil thu"}
                  </div>
                </div>
                {active && (
                  <div style={{ marginLeft: "auto", color: gold, fontSize: 20, fontWeight: 900 }}>✓</div>
                )}
              </button>
            );
          })}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Auto-detect */}
          <button
            onClick={detectLocation}
            disabled={geoState === "loading"}
            style={{
              ...btnPrimary,
              background: geoState === "done"
                ? "linear-gradient(180deg, #4ade80 0%, #16a34a 100%)"
                : btnPrimary.background,
              boxShadow: geoState === "done"
                ? "0 4px 0 rgba(5,80,30,0.7)"
                : btnPrimary.boxShadow,
              opacity: geoState === "loading" ? 0.7 : 1,
              marginBottom: 4,
            }}
          >
            {geoState === "loading"
              ? t.onboardingLocDetecting
              : geoState === "done"
              ? t.onboardingLocSelected + (selectedLoc ? ` — ${selectedLoc.name}` : "")
              : t.onboardingLocDetect}
          </button>

          {geoError && (
            <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{geoError}</div>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Search city…"
            value={locSearch}
            onChange={(e) => setLocSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${border}`,
              background: card,
              color: text,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* City list */}
          <div style={{
            maxHeight: 220,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingRight: 2,
          }}>
            {filteredLocs.map((loc) => {
              const active = selectedLoc?.name === loc.name && selectedLoc?.country === loc.country;
              return (
                <button
                  key={`${loc.country}-${loc.name}`}
                  onClick={() => saveLoc(loc)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${active ? gold : border}`,
                    background: active ? goldDim : card,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? gold : text }}>{loc.name}</div>
                    <div style={{ fontSize: 11, color: muted }}>{loc.country}</div>
                  </div>
                  {active && <div style={{ color: gold, fontWeight: 900 }}>✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    /* Step 3 — Notifications */
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Reminder types preview */}
        {[
          { icon: "🕯️", label: "Shabbat candle lighting" },
          { icon: "📖", label: "Weekly Parashah" },
          { icon: "✡️", label: "Jewish holidays" },
          { icon: "⏰", label: "Prayer times (Zmanim)" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 14px",
              borderRadius: 10,
              background: card,
              border: `1px solid ${border}`,
            }}
          >
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 14, color: text, fontWeight: 500 }}>{label}</span>
          </div>
        ))}

        {/* Enable button */}
        {notifState === "idle" && (
          <button onClick={requestNotifications} style={{ ...btnPrimary, marginTop: 8 }}>
            {t.onboardingNotifEnable}
          </button>
        )}
        {notifState === "granted" && (
          <div style={{
            padding: "14px",
            borderRadius: 12,
            background: "rgba(74,222,128,0.12)",
            border: "1.5px solid rgba(74,222,128,0.4)",
            textAlign: "center",
            color: "#4ade80",
            fontWeight: 700,
            fontSize: 15,
          }}>
            {t.onboardingNotifEnabled}
          </div>
        )}
        {notifState === "denied" && (
          <div style={{
            padding: "14px",
            borderRadius: 12,
            background: "rgba(248,113,113,0.1)",
            border: "1.5px solid rgba(248,113,113,0.3)",
            textAlign: "center",
            color: "#f87171",
            fontSize: 13,
          }}>
            {t.onboardingNotifDenied}
          </div>
        )}

        {/* Skip notifications */}
        {notifState === "idle" && (
          <button onClick={finish} style={btnGhost}>{t.onboardingNotifLater}</button>
        )}
      </div>
    );
  };

  const icons = ["🌐", "📍", "🔔"];
  const stepTitles = [t.onboardingLangTitle, t.onboardingLocTitle, t.onboardingNotifTitle];
  const stepSubs = [t.onboardingLangSubtitle, t.onboardingLocSubtitle, t.onboardingNotifSubtitle];

  const canAdvance =
    step === 1 ? true :
    step === 2 ? !!selectedLoc :
    notifState !== "idle";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(4,8,20,0.88)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        transition: "opacity 0.4s ease",
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: bg,
          borderRadius: 20,
          border: `1.5px solid ${border}`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 60px rgba(212,175,55,0.06)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header gold bar ── */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.9) 35%, rgba(255,235,120,1) 50%, rgba(212,175,55,0.9) 65%, transparent)",
        }} />

        {/* ── Step indicator ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px 0",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {([1, 2, 3] as Step[]).map((s) => (
              <div key={s} style={{
                height: 4,
                width: s === step ? 28 : 16,
                borderRadius: 2,
                background: s <= step ? gold : "rgba(212,175,55,0.2)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>
          <button
            onClick={finish}
            style={{
              background: "none",
              border: "none",
              color: muted,
              fontSize: 13,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            {t.onboardingSkip}
          </button>
        </div>

        {/* ── Step icon + title ── */}
        <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
          <div style={{
            fontSize: 44,
            marginBottom: 10,
            filter: "drop-shadow(0 0 12px rgba(212,175,55,0.3))",
          }}>
            {icons[step - 1]}
          </div>
          <div style={{
            fontSize: 21,
            fontWeight: 800,
            color: text,
            marginBottom: 6,
            fontFamily: "Georgia, serif",
          }}>
            {stepTitles[step - 1]}
          </div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 20, lineHeight: 1.5 }}>
            {stepSubs[step - 1]}
          </div>
        </div>

        {/* ── Step content ── */}
        <div style={{ padding: "0 24px 4px", overflowY: "auto", maxHeight: "42vh" }}>
          {stepContent()}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Primary CTA (not shown on step 3 which manages its own buttons) */}
          {step < 3 && (
            <button
              onClick={advance}
              disabled={!canAdvance}
              style={{
                ...btnPrimary,
                opacity: canAdvance ? 1 : 0.5,
                cursor: canAdvance ? "pointer" : "not-allowed",
              }}
            >
              {step === 2 ? t.onboardingNext : t.onboardingNext}
            </button>
          )}
          {step === 3 && notifState !== "idle" && (
            <button onClick={finish} style={btnPrimary}>
              {t.onboardingGetStarted}
            </button>
          )}
          {/* Step label */}
          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(138,154,181,0.5)" }}>
            {t.onboardingStep.replace("{n}", String(step))}
          </div>
        </div>
      </div>
    </div>
  );
}
