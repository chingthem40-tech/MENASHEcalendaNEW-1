import { useState, useCallback, useEffect } from "react";
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

type Step = 0 | 1 | 2 | 3;
type GeoState = "idle" | "loading" | "done" | "error";
type NotifState = "idle" | "granted" | "denied";

/* ── Design tokens ─────────────────────────────────────── */
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F0C840";
const GOLD_DIM = "rgba(212,175,55,0.15)";
const DARK_BASE = "#060c18";
const CARD_BG = "rgba(8,14,28,0.82)";
const BORDER = "rgba(212,175,55,0.28)";
const TEXT = "#F5F0E8";
const MUTED = "#8a9ab5";
const MUTED_DIM = "rgba(138,154,181,0.55)";

/* ── Per-step background images ────────────────────────── */
const STEP_BG: Record<Step, string> = {
  0: "/onboarding/lost-tribe-jerusalem.png",
  1: "/onboarding/lost-tribe-stars.png",
  2: "/onboarding/journey-bridge-logo.png",
  3: "/onboarding/bnei-menashe-info.png",
};

/* ── Step metadata ─────────────────────────────────────── */
const STEP_META: Record<Step, { icon: string; label: string }> = {
  0: { icon: "✡", label: "Welcome" },
  1: { icon: "🌐", label: "Language" },
  2: { icon: "📍", label: "Location" },
  3: { icon: "🔔", label: "Alerts" },
};

export default function OnboardingFlow({ onFinished }: Props) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem("menashe-language") as Lang) || "en"; }
    catch { return "en"; }
  });
  const t = translations[lang];

  const [step, setStep] = useState<Step>(0);
  const [visible, setVisible] = useState(true);
  const [fadeKey, setFadeKey] = useState(0);

  /* Location */
  const [selectedLoc, setSelectedLoc] = useState<Location | null>(() => {
    try { const s = localStorage.getItem("menashe-location"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [geoError, setGeoError] = useState("");
  const [locSearch, setLocSearch] = useState("");

  /* Notifications */
  const [notifState, setNotifState] = useState<NotifState>("idle");

  /* Preload all BG images */
  useEffect(() => {
    Object.values(STEP_BG).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  /* ─── helpers ─── */
  function saveLang(l: Lang) {
    setLangState(l);
    try { localStorage.setItem("menashe-language", l); } catch {}
  }

  function saveLoc(loc: Location) {
    setSelectedLoc(loc);
    try { localStorage.setItem("menashe-location", JSON.stringify(loc)); } catch {}
  }

  function detectLocation() {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported"); setGeoState("error"); return; }
    setGeoState("loading");
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let name = "My Location", country = "Custom";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "Accept-Language": "en" } });
          if (res.ok) { const d = await res.json(); const a = d.address || {}; name = a.city || a.town || a.village || a.county || a.state || "My Location"; country = a.country || "Custom"; }
        } catch {}
        saveLoc({ name, country, lat, lng, tz, candleLightingMinutes: 18 });
        setGeoState("done");
      },
      (err) => { setGeoState("error"); setGeoError(err.code === 1 ? "Location access denied. Select a city below." : "Could not detect location. Select a city below."); },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  async function requestNotifications() {
    if (!("Notification" in window)) { setNotifState("denied"); return; }
    const perm = await Notification.requestPermission();
    setNotifState(perm === "granted" ? "granted" : "denied");
  }

  const goToStep = useCallback((s: Step) => {
    setFadeKey((k) => k + 1);
    setStep(s);
  }, []);

  const advance = useCallback(() => {
    if (step < 3) goToStep((step + 1) as Step);
    else finish();
  }, [step]);

  const finish = useCallback(() => {
    markOnboardingSeen();
    setVisible(false);
    setTimeout(onFinished, 500);
  }, [onFinished]);

  const filteredLocs = LOCATIONS.filter(
    (l) => l.name.toLowerCase().includes(locSearch.toLowerCase()) || l.country.toLowerCase().includes(locSearch.toLowerCase())
  );

  const canAdvance =
    step === 0 ? true :
    step === 1 ? true :
    step === 2 ? !!selectedLoc :
    notifState !== "idle";

  /* ─── step content ─── */
  const renderContent = () => {
    /* ── Step 0: Welcome splash ── */
    if (step === 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {/* Circular badge */}
          <div style={{
            width: 130, height: 130, borderRadius: "50%",
            border: `3px solid ${GOLD}`,
            boxShadow: `0 0 0 6px rgba(212,175,55,0.12), 0 0 40px rgba(212,175,55,0.25)`,
            overflow: "hidden", marginBottom: 24, flexShrink: 0,
          }}>
            <img src="/onboarding/journey-bridge-logo.png" alt="Bnei Menashe" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, textAlign: "center", maxWidth: 320, margin: "0 auto 20px" }}>
            A sacred digital home for the Bnei Menashe community — connecting you to the Hebrew calendar, prayer times, Torah, and your people.
          </p>

          {/* Pillar list */}
          {[
            { icon: "✡️", title: "Rooted in Heritage", sub: "Ancient identity, living tradition" },
            { icon: "📖", title: "Guided by Torah", sub: "Daily learning & sacred calendar" },
            { icon: "🕍", title: "United as One People", sub: "Community, prayer & remembrance" },
          ].map(({ icon, title, sub }) => (
            <div key={title} style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%",
              padding: "11px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{title}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    /* ── Step 1: Language ── */
    if (step === 1) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(["en", "tk"] as Lang[]).map((l) => {
            const active = lang === l;
            return (
              <button key={l} onClick={() => saveLang(l)} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 18px", borderRadius: 14, width: "100%", textAlign: "left",
                border: `2px solid ${active ? GOLD : BORDER}`,
                background: active ? GOLD_DIM : "rgba(255,255,255,0.04)",
                cursor: "pointer", transition: "all 0.18s",
              }}>
                <div style={{ fontSize: 34 }}>{l === "en" ? "🇮🇱" : "🇮🇳"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: active ? GOLD : TEXT }}>
                    {l === "en" ? "English" : "Thadou Kuki"}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                    {l === "en" ? "Standard English interface" : "Thadou Kuki interface — mipil thu"}
                  </div>
                </div>
                {active && <span style={{ color: GOLD, fontSize: 20, fontWeight: 900 }}>✓</span>}
              </button>
            );
          })}
        </div>
      );
    }

    /* ── Step 2: Location ── */
    if (step === 2) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={detectLocation} disabled={geoState === "loading"} style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 14, letterSpacing: "0.02em",
            background: geoState === "done"
              ? "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)"
              : `linear-gradient(180deg,${GOLD_LIGHT} 0%,#C49A20 100%)`,
            color: "#0a0800", opacity: geoState === "loading" ? 0.7 : 1,
            boxShadow: geoState === "done"
              ? "0 4px 0 rgba(5,80,30,0.7)"
              : "0 4px 0 rgba(100,70,5,0.8), 0 6px 20px rgba(212,175,55,0.2)",
            transition: "all 0.2s",
          }}>
            {geoState === "loading" ? t.onboardingLocDetecting : geoState === "done" ? `✓ ${selectedLoc?.name ?? "Location set"}` : t.onboardingLocDetect}
          </button>

          {geoError && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{geoError}</div>}

          <input type="text" placeholder="Search city…" value={locSearch} onChange={(e) => setLocSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, outline: "none", boxSizing: "border-box",
              border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.06)", color: TEXT, fontSize: 14,
            }} />

          <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, paddingRight: 2 }}>
            {filteredLocs.map((loc) => {
              const active = selectedLoc?.name === loc.name && selectedLoc?.country === loc.country;
              return (
                <button key={`${loc.country}-${loc.name}`} onClick={() => saveLoc(loc)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left", flexShrink: 0,
                  border: `1.5px solid ${active ? GOLD : BORDER}`,
                  background: active ? GOLD_DIM : "rgba(255,255,255,0.04)",
                  transition: "all 0.15s",
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? GOLD : TEXT }}>{loc.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{loc.country}</div>
                  </div>
                  {active && <div style={{ color: GOLD, fontWeight: 900 }}>✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    /* ── Step 3: Notifications ── */
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: "🕯️", label: "Shabbat candle lighting times" },
          { icon: "📖", label: "Weekly Parashah reminder" },
          { icon: "✡️", label: "Jewish holidays & festivals" },
          { icon: "⏰", label: "Daily prayer times (Zmanim)" },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "11px 16px",
            borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 14, color: TEXT, fontWeight: 500 }}>{label}</span>
          </div>
        ))}

        {notifState === "idle" && (
          <button onClick={requestNotifications} style={{
            marginTop: 6, width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
            background: `linear-gradient(180deg,${GOLD_LIGHT} 0%,#C49A20 100%)`,
            color: "#0a0800", fontWeight: 800, fontSize: 15, cursor: "pointer",
            boxShadow: "0 4px 0 rgba(100,70,5,0.8), 0 6px 20px rgba(212,175,55,0.2)",
          }}>
            {t.onboardingNotifEnable}
          </button>
        )}
        {notifState === "granted" && (
          <div style={{
            padding: 14, borderRadius: 12, textAlign: "center", fontWeight: 700, fontSize: 15,
            background: "rgba(74,222,128,0.12)", border: "1.5px solid rgba(74,222,128,0.4)", color: "#4ade80",
          }}>
            {t.onboardingNotifEnabled}
          </div>
        )}
        {notifState === "denied" && (
          <div style={{
            padding: 14, borderRadius: 12, textAlign: "center", fontSize: 13,
            background: "rgba(248,113,113,0.1)", border: "1.5px solid rgba(248,113,113,0.3)", color: "#f87171",
          }}>
            {t.onboardingNotifDenied}
          </div>
        )}
        {notifState === "idle" && (
          <button onClick={finish} style={{
            background: "transparent", border: `1px solid ${BORDER}`, color: MUTED,
            padding: "12px 0", width: "100%", borderRadius: 12, fontSize: 14, cursor: "pointer", fontWeight: 500,
          }}>
            {t.onboardingNotifLater}
          </button>
        )}
      </div>
    );
  };

  /* ─── step header copy ─── */
  const HEADER: Record<Step, { title: string; sub: string }> = {
    0: { title: "Welcome, Bnei Menashe", sub: "One People. One Path. One Destiny." },
    1: { title: t.onboardingLangTitle, sub: t.onboardingLangSubtitle },
    2: { title: t.onboardingLocTitle, sub: t.onboardingLocSubtitle },
    3: { title: t.onboardingNotifTitle, sub: t.onboardingNotifSubtitle },
  };

  const SETUP_STEPS = [1, 2, 3] as Step[];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "opacity 0.5s ease",
      opacity: visible ? 1 : 0,
    }}>
      {/* ── Full-bleed background layer ── */}
      <div
        key={`bg-${step}`}
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("${STEP_BG[step]}")`,
          backgroundSize: "cover",
          backgroundPosition: step === 2 ? "center center" : "center 30%",
          opacity: 0.22,
          transition: "opacity 0.6s ease",
          animation: "bgFadeIn 0.7s ease forwards", animationFillMode: "forwards",
        }}
      />
      {/* Dark gradient overlay for contrast */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 60%, rgba(6,12,24,0.72) 0%, ${DARK_BASE} 80%)`,
      }} />
      {/* Gold vignette top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 180,
        background: "linear-gradient(to bottom, rgba(212,175,55,0.06) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Main card ── */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 440, margin: "0 16px",
        background: CARD_BG,
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        borderRadius: 22,
        border: `1.5px solid ${BORDER}`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Top gold bar */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.6) 25%, #F0C840 50%, rgba(212,175,55,0.6) 75%, transparent 100%)",
        }} />

        {/* ── Top nav row ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px 0",
        }}>
          {/* Step pills — only show for setup steps */}
          <div style={{ display: "flex", gap: 5 }}>
            {SETUP_STEPS.map((s) => (
              <div key={s} style={{
                height: 4,
                width: s === step ? 26 : 14,
                borderRadius: 2,
                background: s <= step ? GOLD : "rgba(212,175,55,0.18)",
                transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                opacity: step === 0 ? 0 : 1,
              }} />
            ))}
          </div>
          <button onClick={finish} style={{
            background: "none", border: "none", color: MUTED_DIM, fontSize: 12,
            cursor: "pointer", padding: "4px 8px", letterSpacing: "0.04em", fontWeight: 500,
          }}>
            {t.onboardingSkip}
          </button>
        </div>

        {/* ── Step header ── */}
        <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
          <div style={{
            fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
            color: GOLD, marginBottom: 8, opacity: 0.9,
          }}>
            {STEP_META[step].label}
          </div>
          <h2 style={{
            fontSize: step === 0 ? 26 : 22,
            fontWeight: 800, color: TEXT, margin: "0 0 8px",
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: "-0.01em", lineHeight: 1.2,
          }}>
            {HEADER[step].title}
          </h2>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.55, margin: "0 0 20px" }}>
            {HEADER[step].sub}
          </p>
          {/* Gold divider */}
          <div style={{
            height: 1, margin: "0 auto 20px",
            background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.35) 50%, transparent)",
            width: "60%",
          }} />
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ padding: "0 24px 8px", overflowY: "auto", maxHeight: "46vh" }}>
          {renderContent()}
        </div>

        {/* ── Footer CTA ── */}
        <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Primary button — shown on welcome + lang + loc steps */}
          {(step === 0 || step === 1 || (step === 2 && !!selectedLoc)) && (
            <button onClick={advance} style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
              background: `linear-gradient(180deg,${GOLD_LIGHT} 0%,#C49A20 100%)`,
              color: "#0a0800", fontWeight: 800, fontSize: 15, cursor: "pointer",
              letterSpacing: "0.02em",
              boxShadow: "0 4px 0 rgba(100,70,5,0.8), 0 6px 20px rgba(212,175,55,0.25)",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}>
              {step === 0 ? "Begin Your Journey →" : step < 3 ? t.onboardingNext : t.onboardingGetStarted}
            </button>
          )}
          {/* Step 2 — no location yet shows a softer prompt */}
          {step === 2 && !selectedLoc && (
            <button onClick={advance} style={{
              background: "transparent", border: `1px solid ${BORDER}`, color: MUTED,
              padding: "12px 0", width: "100%", borderRadius: 12, fontSize: 14, cursor: "pointer", fontWeight: 500,
            }}>
              Skip for now
            </button>
          )}
          {/* Step 3 — after choice */}
          {step === 3 && notifState !== "idle" && (
            <button onClick={finish} style={{
              width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
              background: `linear-gradient(180deg,${GOLD_LIGHT} 0%,#C49A20 100%)`,
              color: "#0a0800", fontWeight: 800, fontSize: 15, cursor: "pointer",
              boxShadow: "0 4px 0 rgba(100,70,5,0.8), 0 6px 20px rgba(212,175,55,0.25)",
            }}>
              {t.onboardingGetStarted}
            </button>
          )}
          {/* Breadcrumb */}
          {step > 0 && (
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(138,154,181,0.4)", letterSpacing: "0.06em" }}>
              STEP {step} OF 3
            </div>
          )}
        </div>
      </div>

      {/* ── Keyframe for bg fade ── */}
      <style>{`
        @keyframes bgFadeIn {
          from { opacity: 0; }
          to   { opacity: 0.22; }
        }
      `}</style>
    </div>
  );
}
