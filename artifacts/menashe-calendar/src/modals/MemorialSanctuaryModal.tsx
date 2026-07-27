import { useState, useCallback, useEffect, useRef, lazy, Suspense, Component, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HDate } from "@hebcal/core";
import {
  fetchCommunityYahrzeit,
  createCommunityYahrzeit,
  dedicateLearning,
  type CommunityYahrzeitEntry,
} from "../lib/userApi";
import { useLanguage } from "../context/LanguageContext";
import { useIsMobile } from "../hooks/use-mobile";
import type { SceneViewType, CameraState } from "../components/MemorialValley3D";
import { MinimapOverlay } from "../features/memorial/components/MinimapOverlay";
import { MemorialBrowserPanel } from "./MemorialBrowserPanel";

const MemorialValley3D = lazy(() => import("../components/MemorialValley3D"));

/* ═══════════════════ AMBIENT SOUND HOOK ════════════════════════════════════
 * Single ambient loop — gentle wind/water brown noise at very low volume.
 * Auto-starts on first user interaction; gracefully handles autoplay block.
 * No visible player controls — just a mute toggle.
 * ══════════════════════════════════════════════════════════════════════════ */
const AMBIENT_VOLUME = 0.08;

function useAmbientSound() {
  const [playing, setPlaying] = useState(false);
  const ctxRef     = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  const buildAndStart = useCallback(() => {
    if (startedRef.current) {
      /* Already built — just resume if suspended (guard against "closed" state after HMR) */
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== "closed") {
        if (ctx.state === "suspended") ctx.resume().then(() => setPlaying(true)).catch(() => {});
      } else {
        /* Context was closed (e.g. HMR cleanup) — reset so we can rebuild */
        startedRef.current = false;
        ctxRef.current = null;
        masterRef.current = null;
      }
      if (startedRef.current) return;
    }
    startedRef.current = true;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = AMBIENT_VOLUME;
      master.connect(ctx.destination);
      masterRef.current = master;

      /* ── Brown noise: gentle wind & flowing water ── */
      const bufLen = ctx.sampleRate * 8;
      const buffer = ctx.createBuffer(2, bufLen, ctx.sampleRate); // stereo
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let last = 0;
        for (let i = 0; i < bufLen; i++) {
          const w = Math.random() * 2 - 1;
          last = (last + 0.02 * w) / 1.02;
          data[i] = last * 3.2;
        }
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer; noise.loop = true;

      /* Low-pass to make it sound like distant wind/water */
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 660; filt.Q.value = 0.7;
      const nGain = ctx.createGain(); nGain.gain.value = 0.11;
      noise.connect(filt); filt.connect(nGain); nGain.connect(master);
      noise.start();

      /* ── Soft wind whistle — barely perceptible high-shelf ── */
      const wFilt = ctx.createBiquadFilter();
      wFilt.type = "bandpass"; wFilt.frequency.value = 1200; wFilt.Q.value = 0.4;
      const wGain = ctx.createGain(); wGain.gain.value = 0.018;
      noise.connect(wFilt); wFilt.connect(wGain); wGain.connect(master);

      ctx.resume().then(() => setPlaying(true)).catch(() => {
        /* Browser blocked autoplay — wait for first user gesture */
        setPlaying(false);
      });
    } catch { /* AudioContext not supported */ }
  }, []);

  /* Auto-start: try immediately after mount; on failure, wait for first gesture */
  useEffect(() => {
    const onGesture = () => { buildAndStart(); };
    const t = setTimeout(() => {
      buildAndStart();
      /* If still suspended after 500ms, hook into first gesture */
      setTimeout(() => {
        if (!ctxRef.current || ctxRef.current.state === "suspended") {
          document.addEventListener("pointerdown", onGesture, { once: true });
          document.addEventListener("keydown",     onGesture, { once: true });
        }
      }, 500);
    }, 1200);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("keydown", onGesture);
    };
  }, [buildAndStart]);

  const toggle = useCallback(() => {
    if (!masterRef.current) { buildAndStart(); return; }
    if (playing) {
      /* Mute: ramp down smoothly, don't close context */
      masterRef.current.gain.setTargetAtTime(0, ctxRef.current!.currentTime, 0.3);
      setPlaying(false);
    } else {
      masterRef.current.gain.setTargetAtTime(AMBIENT_VOLUME, ctxRef.current!.currentTime, 0.5);
      ctxRef.current?.resume();
      setPlaying(true);
    }
  }, [playing, buildAndStart]);

  useEffect(() => () => {
    startedRef.current = false;
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => {});
    }
    ctxRef.current  = null;
    masterRef.current = null;
  }, []);
  return { playing, toggle };
}

/* ═══════════════════ R3F ERROR BOUNDARY ════════════════════════════════════
 * Safety net for any surviving R3F / Three.js render errors.
 *
 * The canRender3D mount guard (below) prevents the Zustand store null-context
 * error from ever occurring in the first place.  This boundary is a last-
 * resort catch that shows a retry button — it must NOT auto-reset via a timer
 * because that creates an infinite error loop that fires ~300 ms apart.
 * ════════════════════════════════════════════════════════════════════════════ */
interface EBState { err: boolean }
class R3FErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { err: false };
  static getDerivedStateFromError(): EBState { return { err: true }; }
  retry = () => this.setState({ err: false });
  render() {
    if (this.state.err) {
      return (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(5,3,2,0.92)", color: "#d4a843", gap: 16 }}>
          <div style={{ fontSize: 36 }}>🕯️</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>3D scene could not be loaded</div>
          <button onClick={this.retry} style={{ marginTop: 8, padding: "8px 22px", borderRadius: 20, border: "1px solid #d4a843", background: "transparent", color: "#d4a843", cursor: "pointer", fontSize: 13 }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══════════════════ TYPES ═════════════════════════════════════════════════ */
interface Props {
  onClose: () => void;
  userName?: string | null;
  initialEntries?: CommunityYahrzeitEntry[];
}
interface Candle { pos: [number, number, number]; name: string }
interface VirtualFlower { pos: [number, number, number]; colorIdx: number }
type SceneTab = "valley" | "garden" | "waterfall" | "sanctuary" | "sunset";
type RightNav = "home" | "memorials" | "flowers" | "messages" | "music";

/* ═══════════════════ HELPERS ═══════════════════════════════════════════════ */
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}
function filterEntries(list: CommunityYahrzeitEntry[], q: string, yr: string) {
  let r = list;
  if (q.trim()) {
    const ql = q.toLowerCase();
    r = r.filter(e =>
      e.deceasedName.toLowerCase().includes(ql) ||
      e.donorDisplayName.toLowerCase().includes(ql) ||
      (e.message && e.message.toLowerCase().includes(ql))
    );
  }
  if (yr && yr !== "all") r = r.filter(e => String(e.passingYear) === yr);
  return r;
}
function allYears(list: CommunityYahrzeitEntry[]) {
  const yrs = [...new Set(list.map(e => e.passingYear).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0));
  return yrs as number[];
}
function formatTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ═══════════════════ SOUND PANEL ═══════════════════════════════════════════
 * Minimal sound panel — single ambient loop, mute/unmute only.
 * No playlist, no volume slider.
 * ══════════════════════════════════════════════════════════════════════════ */
const FLOWER_PALETTE = ["#ff6b8a","#ff99bb","#c778e8","#ff8833","#55ccaa","#f0c030","#e855a0","#7799ff"];
const FLOWER_NAMES   = ["Rose","Blush","Violet","Marigold","Mint","Sunflower","Peony","Iris"];
const FLOWER_EMOJIS  = ["🌸","🌺","💜","🌼","🌿","🌻","🌹","💐"];
const MAX_MOBILE_FLOWERS = 40;

function MusicPanel({ sound }: { sound: ReturnType<typeof useAmbientSound> }) {
  return (
    <motion.div
      key="music-panel"
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", right: 80, top: "50%", transform: "translateY(-50%)",
        zIndex: 25, width: 218,
        background: "rgba(6,3,20,0.95)",
        backdropFilter: "blur(28px) saturate(1.6)",
        border: "1px solid rgba(212,175,55,0.28)",
        borderRadius: 22, padding: "18px 16px",
        boxShadow: "0 12px 50px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(212,175,55,0.75)", marginBottom: 14 }}>
        🎵 AMBIENT SOUND
      </div>

      {/* Single ambient indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", borderRadius: 14, marginBottom: 14,
        background: sound.playing ? "rgba(212,175,55,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid rgba(212,175,55,${sound.playing ? "0.22" : "0.08"})`,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>
          {sound.playing ? "🔊" : "🔇"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: sound.playing ? "#D4AF37" : "rgba(255,255,255,0.5)" }}>
            Wind &amp; Water
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
            Gentle valley ambience
          </div>
        </div>
        {sound.playing && (
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 18, flexShrink: 0 }}>
            {[1,2,3,2,1].map((h, j) => (
              <div key={j} style={{ width: 3, height: h * 4 + 2, borderRadius: 2, background: "#D4AF37", animation: `ms-shimmer ${0.45 + j * 0.12}s ease-in-out infinite` }} />
            ))}
          </div>
        )}
      </div>

      <motion.button
        onClick={sound.toggle}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        aria-label={sound.playing ? "Mute ambient sound" : "Unmute ambient sound"}
        style={{
          width: "100%", padding: "12px 0",
          background: sound.playing
            ? "linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.06))"
            : "rgba(212,175,55,0.08)",
          border: `1px solid rgba(212,175,55,${sound.playing ? 0.35 : 0.18})`,
          borderRadius: 14, fontSize: 13, fontWeight: 800,
          color: "#D4AF37", cursor: "pointer", transition: "all 0.22s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {sound.playing ? "🔇 Mute" : "🔊 Unmute"}
      </motion.button>

      <div style={{ marginTop: 12, textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", lineHeight: 1.7 }}>
          Procedural — very low volume<br/>Works without sound enabled
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════ FLOWERS PANEL ════════════════════════════════════════ */
function FlowersPanel({ onSelectColor, selectedColor, placedCount }: {
  onSelectColor: (idx: number) => void; selectedColor: number; placedCount: number;
}) {
  return (
    <motion.div
      key="flowers-panel"
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", right: 80, top: "50%", transform: "translateY(-50%)",
        zIndex: 25, width: 234,
        background: "rgba(6,3,20,0.95)",
        backdropFilter: "blur(28px) saturate(1.6)",
        border: "1px solid rgba(248,113,113,0.28)",
        borderRadius: 22, padding: "18px 16px",
        boxShadow: "0 12px 50px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(248,113,113,0.8)", marginBottom: 4 }}>
        🌸  PLACE A FLOWER
      </div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", marginBottom: 14, lineHeight: 1.5 }}>
        Choose a flower colour then tap the ground to place it in the sanctuary
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
        {FLOWER_PALETTE.map((col, i) => (
          <motion.button
            key={i}
            onClick={() => onSelectColor(i)}
            whileHover={{ scale: 1.14 }}
            whileTap={{ scale: 0.90 }}
            title={FLOWER_NAMES[i]}
            style={{
              width: "100%", aspectRatio: "1", borderRadius: 12, border: "none",
              background: col, cursor: "pointer",
              boxShadow: selectedColor === i
                ? `0 0 0 3px #fff, 0 0 16px ${col}`
                : "0 2px 8px rgba(0,0,0,0.4)",
              opacity: selectedColor === i ? 1 : 0.58,
              transition: "all 0.18s",
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>
        Selected: <span style={{ color: FLOWER_PALETTE[selectedColor], fontWeight: 800 }}>{FLOWER_NAMES[selectedColor]}</span>
      </div>

      <div style={{
        padding: "11px 14px", borderRadius: 13,
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.22)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>👆</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
          Tap anywhere on the ground to place your flower
        </span>
      </div>

      {placedCount > 0 && (
        <div style={{ marginTop: 12, textAlign: "center", fontSize: 10, color: "rgba(248,113,113,0.6)" }}>
          🌸 {placedCount} flower{placedCount !== 1 ? "s" : ""} placed in the sanctuary
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════ SANCTUARY ENTRANCE CARD ═══════════════════════════════
 * Replaces the old SanctuaryHomePanel.
 * Compact / collapsed by default; expands on tap; can be dismissed.
 * Remembers collapsed state across renders via sessionStorage.
 * ══════════════════════════════════════════════════════════════════════════ */
const DAILY_INTENTIONS = [
  { he: "יהי זכרם ברוך",                        en: "May their memory be a blessing"              },
  { he: 'תנצב"ה',                                 en: "May their soul be bound in the bond of life" },
  { he: "המקום ינחם אתכם",                       en: "May the Almighty comfort you among the mourners" },
  { he: "זכרונם לברכה",                           en: "Their memory is for a blessing"              },
  { he: "נשמתם תהא צרורה בצרור החיים",           en: "May their souls rest in eternal peace"        },
  { he: "ברוך דיין האמת",                        en: "Blessed is the True Judge"                   },
  { he: "וזכר כל מעשה אל",                       en: "And all deeds are remembered before God"     },
];

function getHebrewDateStr(): string {
  try { return new HDate(new Date()).render("en"); } catch { return ""; }
}
function todayYahrzeits(entries: CommunityYahrzeitEntry[]): CommunityYahrzeitEntry[] {
  try {
    const today = new HDate(new Date());
    return entries.filter(e => e.hebrewDay === today.getDate() && e.hebrewMonth === today.getMonth());
  } catch { return []; }
}

function EntranceCard({ entries, candleCount, onLightCandle, onSelectEntry, soundPlaying, onSoundToggle }: {
  entries: CommunityYahrzeitEntry[];
  candleCount: number;
  onLightCandle: () => void;
  onSelectEntry: (e: CommunityYahrzeitEntry) => void;
  soundPlaying: boolean;
  onSoundToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(() => {
    try { return sessionStorage.getItem("ms-entrance-expanded") !== "false"; } catch { return true; }
  });
  const [dismissed, setDismissed] = useState(false);

  const hDateStr         = getHebrewDateStr();
  const todayRemembering = todayYahrzeits(entries);
  const recentEntries    = entries.slice(0, 8);
  const dayIdx           = new Date().getDay();
  const intention        = DAILY_INTENTIONS[dayIdx % DAILY_INTENTIONS.length];

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try { sessionStorage.setItem("ms-entrance-expanded", String(next)); } catch { /* ignore */ }
  };

  if (dismissed) return null;

  return (
    <motion.div
      key="entrance-card"
      initial={{ x: -48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -48, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      onClick={e => e.stopPropagation()}
      className="ms-scroll-strip ms-entrance-card"
      style={{
        position: "absolute", left: 14, top: 72,
        zIndex: 22,
        width: expanded ? "min(272px, calc(100vw - 28px))" : "min(216px, calc(100vw - 28px))",
        maxHeight: expanded ? "calc(100dvh - 148px)" : "none",
        overflowY: expanded ? "auto" : "visible",
        overflowX: "hidden",
        background: "rgba(4,2,14,0.92)",
        backdropFilter: "blur(32px) saturate(1.9)",
        border: "1px solid rgba(212,175,55,0.20)",
        borderRadius: expanded ? 24 : 50,
        boxShadow: "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: "border-radius 0.3s ease, width 0.3s ease",
      }}
    >
      {/* ── Collapsed pill ── */}
      {!expanded ? (
        <button
          onClick={toggle}
          aria-label="Open Memorial Sanctuary panel"
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
            minHeight: 44,
          }}
        >
          <span style={{ fontSize: 16, filter: "drop-shadow(0 0 4px rgba(212,175,55,0.7))", flexShrink: 0 }}>🕊</span>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.03em" }}>
              Memorial Sanctuary
            </div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.38)", marginTop: 1, letterSpacing: "0.04em" }}>
              A Valley of Remembrance
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.7)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      ) : (
        /* ── Expanded header ── */
        <div style={{
          padding: "14px 14px 12px",
          background: "linear-gradient(180deg,rgba(212,175,55,0.08) 0%,transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              {hDateStr && (
                <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 13, color: "rgba(212,175,55,0.78)", direction: "rtl", lineHeight: 1.4 }}>
                  {hDateStr}
                </div>
              )}
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.30)", letterSpacing: "0.05em", marginTop: 2 }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 8 }}>
              <button
                type="button"
                onClick={toggle}
                aria-label="Collapse panel"
                style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss panel"
                style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}
              >✕</button>
            </div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.22, marginBottom: 3 }}>
            🕊 <span style={{ color: "#D4AF37" }}>Memorial Sanctuary</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", lineHeight: 1.6 }}>
            A sacred Valley of Remembrance & Love
          </div>
        </div>
      )}

      {/* ── Expanded body ── */}
      {expanded && (
        <>
          {/* Stats chip — real candle count only */}
          <div style={{ padding: "9px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 5, flexWrap: "wrap" }}>
            {candleCount > 0 ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 9px", borderRadius: 20,
                background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.16)",
                fontSize: 10, color: "rgba(212,175,55,0.88)", fontWeight: 700,
              }}>
                <span style={{ fontSize: 11 }}>🕯</span>
                <span>{candleCount.toLocaleString()}</span>
                <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Candles</span>
              </div>
            ) : (
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>No recent activity yet.</div>
            )}
          </div>

          {/* Daily intention */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)", textAlign: "center" }}>
              <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 14, color: "rgba(212,175,55,0.85)", lineHeight: 1.5, marginBottom: 5, direction: "rtl" }}>
                {intention.he}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.36)", fontStyle: "italic", lineHeight: 1.6 }}>
                {intention.en}
              </div>
            </div>
          </div>

          {/* Today's Remembrance — horizontal portrait chips */}
          {todayRemembering.length > 0 && (
            <div style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(248,113,113,0.72)", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ animation: "ms-flicker 2s ease-in-out infinite" }}>🕯</span> TODAY'S REMEMBRANCE
              </div>
              <div className="ms-scroll-strip" style={{ display: "flex", overflowX: "auto", gap: 6, paddingBottom: 2 }}>
                {todayRemembering.slice(0, 5).map(e => {
                  const name = e.deceasedName.split("·")[0].trim();
                  return (
                    <motion.button key={e.id} onClick={() => onSelectEntry(e)}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        flexShrink: 0, minWidth: 76, padding: "8px 8px 7px",
                        background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.16)",
                        borderRadius: 13, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                        minHeight: 44,
                      }}
                    >
                      <span style={{ fontSize: 15 }}>🕯</span>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 64 }}>{name}</div>
                      {e.passingYear && <div style={{ fontSize: 7, color: "rgba(255,255,255,0.28)" }}>{e.passingYear}</div>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recently Remembered — horizontal portrait strip */}
          {recentEntries.length > 0 && (
            <div style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(255,255,255,0.30)", marginBottom: 7 }}>
                RECENTLY REMEMBERED
              </div>
              <div className="ms-scroll-strip" style={{ display: "flex", overflowX: "auto", gap: 7, paddingBottom: 2 }}>
                {recentEntries.map((e, i) => {
                  const name = e.deceasedName.split("·")[0].trim();
                  return (
                    <motion.button key={e.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => onSelectEntry(e)}
                      whileTap={{ scale: 0.94 }}
                      style={{
                        flexShrink: 0, width: 76, cursor: "pointer",
                        background: "rgba(6,3,18,0.6)", backdropFilter: "blur(12px)",
                        border: "1px solid rgba(212,175,55,0.16)", borderRadius: 14,
                        padding: "10px 7px 8px", textAlign: "center",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        minHeight: 44,
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#D4AF37,#7a5800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{initials(name)}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{name}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ padding: "11px 12px 13px" }}>
            <motion.button
              onClick={onLightCandle}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(212,175,55,0.45)" }}
              whileTap={{ scale: 0.97 }}
              style={{ width: "100%", padding: "13px 0", background: "linear-gradient(135deg,rgba(212,175,55,0.92),rgba(138,96,0,0.96))", border: "none", borderRadius: 15, fontSize: 14, fontWeight: 800, color: "#0F1829", cursor: "pointer", boxShadow: "0 6px 24px rgba(212,175,55,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44 }}
            >
              <span style={{ animation: "ms-flicker 1.8s ease-in-out infinite", fontSize: 16 }}>🕯</span>
              Light a Candle
            </motion.button>

            {/* Sound toggle */}
            <button
              onClick={onSoundToggle}
              style={{
                width: "100%", marginTop: 7,
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 12, minHeight: 44,
                background: soundPlaying ? "rgba(212,175,55,0.07)" : "transparent",
                border: `1px solid ${soundPlaying ? "rgba(212,175,55,0.22)" : "rgba(255,255,255,0.07)"}`,
                cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <span style={{ fontSize: 15 }}>{soundPlaying ? "🔊" : "🔇"}</span>
              <span style={{ flex: 1, textAlign: "left", fontSize: 11, fontWeight: 600, color: soundPlaying ? "rgba(212,175,55,0.75)" : "rgba(255,255,255,0.35)" }}>
                {soundPlaying ? "Ambient on" : "Ambient off"}
              </span>
              <div style={{ flexShrink: 0, width: 34, height: 20, borderRadius: 10, background: soundPlaying ? "rgba(212,175,55,0.55)" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 3, left: soundPlaying ? 16 : 3, width: 14, height: 14, borderRadius: "50%", background: soundPlaying ? "#D4AF37" : "rgba(255,255,255,0.4)", transition: "left 0.2s, background 0.2s" }} />
              </div>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ═══════════════════ AMBIENT NOTIFICATION ══════════════════════════════════
 * SPR-035 Truth & Trust: fabricated activity notifications removed.
 * No mock names, cities, or simulated engagement are displayed.
 * ══════════════════════════════════════════════════════════════════════════ */
function AmbientNotification({ entries: _entries, paused: _paused }: { entries: CommunityYahrzeitEntry[]; paused: boolean }) {
  return null;
}

/* ═══════════════════ KEYFRAMES ═════════════════════════════════════════════ */
const STYLES = `
  @keyframes ms-flicker { 0%,100%{filter:drop-shadow(0 0 14px rgba(255,180,40,0.6))} 50%{filter:drop-shadow(0 0 28px rgba(255,140,20,0.95))} }
  @keyframes ms-pulse-gold { 0%,100%{box-shadow:0 0 18px rgba(212,175,55,0.35),0 0 0 2px rgba(212,175,55,0.15)} 50%{box-shadow:0 0 44px rgba(212,175,55,0.7),0 0 0 2px rgba(212,175,55,0.38)} }
  @keyframes ms-float { 0%,100%{transform:translateX(-50%) translateY(0px)} 50%{transform:translateX(-50%) translateY(-6px)} }
  @keyframes ms-glow-heart { 0%,100%{filter:drop-shadow(0 0 3px rgba(255,100,100,0.5))} 50%{filter:drop-shadow(0 0 10px rgba(255,60,60,1))} }
  @keyframes ms-shimmer { 0%{opacity:0.52} 50%{opacity:1} 100%{opacity:0.52} }
  @keyframes ms-timeline-dot { 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }
  @keyframes ms-breath { 0%,100%{opacity:0.45} 50%{opacity:0.85} }
  .ms-input {
    width:100%; padding:12px 15px; box-sizing:border-box;
    background:rgba(8,4,22,0.78); border:1px solid rgba(212,175,55,0.22);
    border-radius:13px; color:#fff; font-size:14px; outline:none;
    font-family:inherit; transition:border-color 0.22s, box-shadow 0.22s;
    backdrop-filter:blur(8px);
  }
  .ms-input:focus { border-color:rgba(212,175,55,0.58); box-shadow:0 0 0 3px rgba(212,175,55,0.10); }
  .ms-input::placeholder { color:rgba(255,255,255,0.26); }
  input[type="date"].ms-input::-webkit-calendar-picker-indicator { filter:invert(0.65) sepia(1) saturate(2) hue-rotate(8deg); }
  textarea.ms-input { resize:none; line-height:1.58; }
  .ms-search-input {
    flex:1; background:transparent; border:none; outline:none;
    color:#fff; font-size:14px; font-family:inherit;
  }
  .ms-search-input::placeholder { color:rgba(255,255,255,0.42); }
  .ms-tab-btn {
    background:none; border:none; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; gap:4px;
    padding:8px 0; transition:opacity 0.2s;
    touch-action:manipulation; -webkit-tap-highlight-color:transparent;
  }
  .ms-tab-btn:focus-visible { outline:2px solid rgba(212,175,55,0.7); outline-offset:4px; border-radius:8px; }
  .ms-rnav-btn {
    background:none; border:none; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; gap:4px;
    padding:10px 6px; transition:all 0.2s; border-radius:12px; width:56px;
    touch-action:manipulation; -webkit-tap-highlight-color:transparent;
  }
  .ms-rnav-btn:hover { background:rgba(255,255,255,0.08); }
  .ms-rnav-btn:focus-visible { outline:2px solid rgba(212,175,55,0.7); outline-offset:2px; }
  .ms-scroll-strip::-webkit-scrollbar { display:none; }
  /* ── Reflection mode: all UI fades out with smooth transition ── */
  .ms-ui-layer {
    transition: opacity 1.4s ease;
  }
  .ms-ui-layer.ms-ui-hidden {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  .ms-ui-layer.ms-ui-hidden * {
    pointer-events: none !important;
  }
  /* Reduced-motion: disable all decorative animations + reflection fade */
  @media (prefers-reduced-motion: reduce) {
    *[style*="animation"] { animation: none !important; }
    .ms-tab-btn, .ms-rnav-btn { transition: none !important; }
    .ms-ui-layer { transition: none !important; }
    .ms-ui-layer.ms-ui-hidden { opacity: 0 !important; }
  }
  /* Entrance card — no horizontal overflow on narrow viewports */
  .ms-entrance-card { box-sizing: border-box; }
  @media (max-width: 480px) {
    .ms-entrance-card { width: calc(100vw - 28px) !important; }
    .ms-right-panel-override { right: 66px !important; width: calc(100vw - 80px) !important; }
  }
  /* Safe-area keyboard avoidance for bottom sheets */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .ms-bottom-sheet { padding-bottom: max(env(safe-area-inset-bottom), 16px); }
  }
`;

/* ═══════════════════ LOADING SCREEN ════════════════════════════════════════ */
function ValleyLoading() {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(t.memLoadingScene);

  useEffect(() => {
    const stages: Array<{ at: number; pct: number; label: string }> = [
      { at: 350,  pct: 20, label: t.memLoadingScene },
      { at: 1000, pct: 40, label: t.memInitializingWebGL },
      { at: 1800, pct: 58, label: t.memBuildingValley },
      { at: 2700, pct: 74, label: t.memPlacingMemorials },
      { at: 3600, pct: 87, label: t.memLightingCandles },
      { at: 4800, pct: 95, label: t.memAlmostReady },
    ];
    const timers = stages.map(({ at, pct, label }) =>
      window.setTimeout(() => { setProgress(pct); setStage(label); }, at)
    );
    return () => timers.forEach(id => window.clearTimeout(id));
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(168deg, #b05822 0%, #e08830 18%, #f0b850 35%, #e8d890 52%, #b8d498 72%, #6a9a70 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
    }}>
      <div style={{ fontSize: 58, animation: "ms-flicker 1.8s ease-in-out infinite" }}>🕯</div>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(35,18,0,0.75)", textTransform: "uppercase" }}>
        {t.memEnteringSanctuary}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 220 }}>
        <div style={{ fontSize: 11, color: "rgba(35,18,0,0.52)", letterSpacing: "0.05em", height: 16, textAlign: "center" }}>
          {stage}
        </div>
        <div style={{ position: "relative", width: "100%", height: 5, borderRadius: 3, background: "rgba(180,140,40,0.2)", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: "0 auto 0 0",
            width: `${progress}%`,
            borderRadius: 3,
            background: "linear-gradient(90deg, #D4AF37, #f5d982)",
            transition: "width 0.75s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 8px rgba(212,175,55,0.6)",
          }} />
        </div>
        <div style={{ fontSize: 10, color: "rgba(35,18,0,0.4)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.06em" }}>
          {progress}%
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ FLOATING MEMORIAL TOOLTIP ══════════════════════════════ */
function FloatingMemorialTooltip({ entry }: { entry: CommunityYahrzeitEntry }) {
  const name = entry.deceasedName.split("·")[0].trim();
  return (
    <div
      style={{
        position: "absolute",
        left: "50%", top: "50%",
        zIndex: 30,
        background: "rgba(10,6,26,0.84)",
        backdropFilter: "blur(22px) saturate(1.5)",
        border: "1px solid rgba(212,175,55,0.32)",
        borderRadius: 50,
        padding: "10px 24px",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 8px 36px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.07)",
        animation: "ms-float 3.2s ease-in-out infinite",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", letterSpacing: "0.1em", fontWeight: 600 }}>
        In Loving Memory
      </span>
      <span style={{ fontSize: 14, animation: "ms-glow-heart 2s ease-in-out infinite" }}>❤️</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{name}</span>
    </div>
  );
}

/* ═══════════════════ RIGHT NAV PANEL ════════════════════════════════════════ */
function RightNavPanel({ active, onSelect }: { active: RightNav; onSelect: (k: RightNav) => void }) {
  const { t } = useLanguage();
  const R_NAV_ITEMS: { key: RightNav; icon: string; label: string }[] = [
    { key: "home",      icon: "🏛️", label: t.memNavHome },
    { key: "memorials", icon: "🕯️", label: t.memNavMemorials },
    { key: "flowers",   icon: "🌸", label: t.memNavFlowers },
    { key: "messages",  icon: "💬", label: t.memNavMessages },
    { key: "music",     icon: "🎵", label: t.memNavMusic },
  ];
  return (
    <div style={{
      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
      zIndex: 20,
      background: "rgba(6,3,18,0.82)",
      backdropFilter: "blur(24px) saturate(1.6)",
      border: "1px solid rgba(255,255,255,0.11)",
      borderRadius: 22,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "6px 0",
      boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      pointerEvents: "auto",
      touchAction: "manipulation",
    }}>
      {R_NAV_ITEMS.map(({ key, icon, label }, i) => (
        <button
          key={key}
          className="ms-rnav-btn"
          onClick={() => onSelect(key)}
          style={{ opacity: active === key ? 1 : 0.5 }}
        >
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{
            fontSize: 8, letterSpacing: "0.04em",
            color: active === key ? "#D4AF37" : "rgba(255,255,255,0.5)",
            fontWeight: active === key ? 800 : 500,
          }}>{label}</span>
          {active === key && (
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#D4AF37", marginTop: -2 }} />
          )}
          {i < R_NAV_ITEMS.length - 1 && (
            <div style={{ width: 30, height: 1, background: "rgba(255,255,255,0.06)", marginTop: 4 }} />
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════ BOTTOM SCENE TABS ══════════════════════════════════════ */
function BottomSceneTabs({ active, onSelect }: { active: SceneTab; onSelect: (s: SceneTab) => void }) {
  const { t } = useLanguage();
  const SCENE_TABS: { key: SceneTab; icon: string; label: string }[] = [
    { key: "valley",    icon: "🏔️", label: t.memSceneValley },
    { key: "garden",    icon: "🌿", label: t.memSceneGarden },
    { key: "waterfall", icon: "💧", label: t.memSceneWaterfall },
    { key: "sanctuary", icon: "🕍", label: t.memSceneSanctuary },
    { key: "sunset",    icon: "🌅", label: t.memSceneSunset },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
      background: "rgba(5,3,14,0.9)",
      backdropFilter: "blur(24px) saturate(1.5)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      paddingBottom: "calc(6px + env(safe-area-inset-bottom, 0px))",
      paddingTop: 4,
      pointerEvents: "auto",
      touchAction: "manipulation",
    }}>
      {SCENE_TABS.map(({ key, icon, label }) => (
        <button key={key} className="ms-tab-btn" onClick={() => onSelect(key)} style={{ flex: 1 }}>
          <span style={{ fontSize: 22, opacity: active === key ? 1 : 0.4 }}>{icon}</span>
          <span style={{
            fontSize: 10, fontWeight: active === key ? 800 : 500, letterSpacing: "0.04em",
            color: active === key ? "#D4AF37" : "rgba(255,255,255,0.4)",
          }}>{label}</span>
          {active === key && (
            <div style={{ width: 22, height: 2, borderRadius: 1, background: "#D4AF37", marginTop: -1 }} />
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════ INTERACTION HINTS ══════════════════════════════════════ */
function InteractionHints({ visible }: { visible: boolean }) {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          style={{
            position: "absolute", bottom: 72, right: 14, zIndex: 20,
            background: "rgba(6,3,18,0.86)",
            backdropFilter: "blur(22px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18,
            padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: 9,
            boxShadow: "0 8px 36px rgba(0,0,0,0.5)",
          }}
        >
          {[
            { icon: "🤚", text: t.memHintDrag },
            { icon: "🤌", text: t.memHintPinch },
            { icon: "🕯️", text: t.memHintTap },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 500, whiteSpace: "nowrap" }}>{text}</span>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════ STATS CHIP ROW ════════════════════════════════════════
 * Replaces the old LeftStatsPanel. Subtle horizontal chips instead of large
 * dominating stat blocks — keeps the 3D world visible.
 * ═══════════════════════════════════════════════════════════════════════════ */
function StatsChipRow({ candleCount }: { candleCount: number }) {
  return (
    <div style={{
      position: "absolute", left: 14, top: 76, zIndex: 20,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{
        background: "rgba(6,3,18,0.80)",
        backdropFilter: "blur(22px) saturate(1.5)",
        border: "1px solid rgba(212,175,55,0.16)",
        borderRadius: 50,
        padding: "7px 14px",
        display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
      }}>
        <span style={{ fontSize: 14 }}>🕯️</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{candleCount.toLocaleString()}</span>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.38)", letterSpacing: "0.05em" }}>CANDLES</span>
      </div>
    </div>
  );
}

/* ═══════════════════ TOP HEADER ═════════════════════════════════════════════ */
function TopHeader({
  searchQuery, setSearchQuery, searchRef, onClose, onLightCandle,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
  onClose: () => void;
  onLightCandle: () => void;
}) {
  const { t }           = useLanguage();
  const [time, setTime] = useState(formatTime());
  useEffect(() => {
    const iv = setInterval(() => setTime(formatTime()), 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
      background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 85%, transparent 100%)",
      padding: "12px 14px 28px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      {/* Left: Brand */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        background: "rgba(6,3,18,0.72)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(212,175,55,0.28)",
        borderRadius: 14,
        padding: "8px 12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
      }}>
        <span style={{ fontSize: 22 }}>🕯️</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#fff", letterSpacing: "0.06em", lineHeight: 1 }}>
            COMMUNITY MEMORIAL
          </div>
          <div style={{ fontSize: 8, color: "rgba(255,215,100,0.6)", letterSpacing: "0.05em", marginTop: 2 }}>
            A Valley of Remembrance & Love
          </div>
        </div>
      </div>

      {/* Center: Search */}
      <div style={{
        flex: 1,
        background: "rgba(6,3,18,0.68)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 28, display: "flex", alignItems: "center", gap: 8,
        padding: "0 14px", height: 40,
        boxShadow: "0 2px 14px rgba(0,0,0,0.35)",
      }}>
        <span style={{ fontSize: 14, opacity: 0.55 }}>🔍</span>
        <input
          ref={searchRef}
          className="ms-search-input"
          placeholder={t.memSearchPlaceholder}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0 }}
          >✕</button>
        )}
      </div>

      {/* Right: Light Candle + Time + Close */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Persistent Light Candle button */}
        <button
          onClick={onLightCandle}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 13px", borderRadius: 13,
            background: "rgba(212,175,55,0.18)",
            border: "1px solid rgba(212,175,55,0.55)",
            color: "#f5dc78", fontSize: 12, fontWeight: 800,
            cursor: "pointer", flexShrink: 0,
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 16px rgba(212,175,55,0.22)",
            letterSpacing: "0.04em",
          }}
        >
          <span style={{ fontSize: 16, animation: "ms-flicker 1.8s infinite" }}>🕯</span>
          {t.memLightCandle}
        </button>

        <div style={{
          background: "rgba(6,3,18,0.82)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: "7px 12px",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        }}>
          <span style={{ fontSize: 16 }}>☀️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{time}</div>
            <div style={{ fontSize: 8, color: "rgba(255,210,80,0.7)", letterSpacing: "0.06em", marginTop: 1 }}>Golden Hour</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Memorial Sanctuary"
            style={{
              marginLeft: 6, width: 28, height: 28, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 800,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >✕</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ SEARCH RESULTS DROPDOWN ════════════════════════════════ */
function SearchResults({
  results, onSelect, onClose,
}: { results: CommunityYahrzeitEntry[]; onSelect: (e: CommunityYahrzeitEntry) => void; onClose: () => void }) {
  if (!results.length) return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        position: "absolute", top: 72, left: 14, right: 14, zIndex: 25,
        background: "rgba(6,3,20,0.96)", backdropFilter: "blur(28px)",
        border: "1px solid rgba(212,175,55,0.18)", borderRadius: 18,
        padding: "18px 16px", textAlign: "center",
        boxShadow: "0 16px 56px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>No memorials found</div>
      <button onClick={onClose} style={{ marginTop: 12, fontSize: 11, color: "rgba(212,175,55,0.7)", background: "none", border: "none", cursor: "pointer" }}>Clear search</button>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        position: "absolute", top: 72, left: 14, right: 14, zIndex: 25,
        background: "rgba(6,3,20,0.97)", backdropFilter: "blur(28px)",
        border: "1px solid rgba(212,175,55,0.22)", borderRadius: 20,
        overflow: "hidden", boxShadow: "0 16px 56px rgba(0,0,0,0.65)",
        maxHeight: 330, overflowY: "auto",
      }}
    >
      <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(212,175,55,0.72)" }}>
          {results.length} MEMORIAL{results.length !== 1 ? "S" : ""} FOUND
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>✕</button>
      </div>
      {results.map((entry, i) => {
        const name = entry.deceasedName.split("·")[0].trim();
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(entry)}
            whileHover={{ background: "rgba(212,175,55,0.07)" }}
            style={{
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
              borderTop: "1px solid rgba(255,255,255,0.05)", cursor: "pointer",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#D4AF37,#7a5800)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: "#fff",
            }}>{initials(name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", marginTop: 2 }}>
                {entry.displayDate || ""}{entry.passingYear ? ` · ${entry.passingYear}` : ""}
              </div>
            </div>
            <span style={{ fontSize: 18 }}>🕯️</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════ MICRO CANDLE CARD ══════════════════════════════════════
 * Appears after a ground tap — a tiny floating pill.
 * Tapping it "unwraps" into the full LightCandleForm via framer-motion
 * shared-layout animation (layoutId="ms-candle-panel").
 * Auto-dismisses after 6 s with an animated countdown border.
 * ═══════════════════════════════════════════════════════════════════════════ */
function MicroCandleCard({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const AUTO_DISMISS_MS = 6000;

  /* Haptic feedback — fires once when the card mounts */
  useEffect(() => {
    try { navigator.vibrate?.([12, 40, 8]); } catch { /* ignore on desktop */ }
  }, []);

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100));
    }, 40);
    const t = setTimeout(() => { clearInterval(iv); onDismiss(); }, AUTO_DISMISS_MS);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [onDismiss]);

  return (
    /* Centering wrapper — no layoutId so framer-motion doesn't track it */
    <div style={{
      position: "absolute", bottom: 82, left: 0, right: 0,
      display: "flex", justifyContent: "center",
      zIndex: 51, pointerEvents: "none",
    }}>
      <motion.div
        layoutId="ms-candle-panel"
        key="micro-card"
        initial={{ opacity: 0, scale: 0.68, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 14 }}
        transition={{
          layout: { type: "spring", damping: 26, stiffness: 300 },
          opacity: { duration: 0.22 },
          scale:   { type: "spring", damping: 20, stiffness: 360 },
          y:       { type: "spring", damping: 20, stiffness: 360 },
        }}
        onClick={onOpen}
        style={{
          pointerEvents: "auto",
          cursor: "pointer",
          width: 232,
          background: "rgba(4,2,14,0.97)",
          backdropFilter: "blur(36px) saturate(2.0)",
          border: "1px solid rgba(212,175,55,0.48)",
          borderRadius: 28,
          boxShadow: "0 12px 48px rgba(0,0,0,0.72), 0 0 0 1px rgba(212,175,55,0.10) inset, 0 0 40px rgba(212,175,55,0.10)",
          overflow: "hidden",
          userSelect: "none",
          position: "relative",
        }}
      >
        {/* ── Countdown progress bar — shrinks left to right over 6 s ── */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          height: 2.5, width: `${progress}%`,
          background: "linear-gradient(90deg, #D4AF37 0%, #f5e47a 100%)",
          borderRadius: "28px 0 0 0",
          boxShadow: "0 0 8px rgba(212,175,55,0.6)",
          transition: "width 40ms linear",
        }} />

        <div style={{ padding: "15px 16px 17px", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Flame orb */}
          <div style={{
            width: 46, height: 46, borderRadius: 17, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.07))",
            border: "1px solid rgba(212,175,55,0.38)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
            boxShadow: "0 0 20px rgba(212,175,55,0.28)",
            animation: "ms-flicker 1.8s ease-in-out infinite",
          }}>🕯</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 3, letterSpacing: "0.01em" }}>
              Light a Candle
            </div>
            <div style={{ fontSize: 10, color: "rgba(212,175,55,0.62)", fontWeight: 500, lineHeight: 1.4 }}>
              Tap to honor a loved one
            </div>
          </div>

          {/* Expand chevron */}
          <div style={{
            width: 32, height: 32, borderRadius: 11, flexShrink: 0,
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* ── Dismiss ×  ── */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss"
          style={{
            position: "absolute", top: 4, right: 4,
            width: 36, height: 36, borderRadius: 9,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(255,255,255,0.38)",
            cursor: "pointer", fontSize: 11, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, lineHeight: 1,
          }}
        >✕</button>
      </motion.div>
    </div>
  );
}

/* ═══════════════════ LIGHT A CANDLE FORM ════════════════════════════════════
 * SPR-026: Added donation tiers + anonymous toggle.
 * APIs unchanged — donation tier is captured locally for UX only (future
 * Razorpay integration hook is left as a comment for the payment sprint).
 * ═══════════════════════════════════════════════════════════════════════════ */
const DONATION_TIERS = [
  { id: "free",    label: "Free / Donate Later",    amount: 0,    badge: ""         },
  { id: "t1",      label: "₹108 — Tikkun Olam",      amount: 108,  badge: "🕯"       },
  { id: "t2",      label: "₹360 — Zecher Livracha",  amount: 360,  badge: "🕯🕯"     },
  { id: "t3",      label: "₹1080 — Eternal Light",   amount: 1080, badge: "✨"       },
] as const;

function LightCandleForm({
  form, setForm, saving, success, onSubmit, onClose, apiError,
}: {
  form: { name: string; hebrewName: string; message: string; date: string };
  setForm: (f: any) => void;
  saving: boolean; success: boolean;
  onSubmit: () => void; onClose: () => void;
  apiError?: string | null;
}) {
  const [donationTier, setDonationTier] = useState<typeof DONATION_TIERS[number]["id"]>("free");
  const [anonymous, setAnonymous] = useState(false);

  return (
    <motion.div
      layoutId="ms-candle-panel"
      key="candle-form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: "6%" }}
      transition={{
        layout:   { type: "spring", damping: 28, stiffness: 280 },
        opacity:  { duration: 0.18 },
        y:        { type: "spring", damping: 28, stiffness: 280 },
      }}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50,
        borderRadius: "28px 28px 0 0",
        background: "linear-gradient(180deg, rgba(6,3,20,0.98) 0%, rgba(4,2,14,1) 100%)",
        backdropFilter: "blur(30px)",
        border: "1px solid rgba(212,175,55,0.3)", borderBottom: "none",
        maxHeight: "88dvh", overflowY: "auto",
        boxShadow: "0 -20px 70px rgba(0,0,0,0.65), 0 -1px 0 rgba(212,175,55,0.15)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Drag handle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px" }}>
        <div style={{ width: 44, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
      </div>

      <div style={{ padding: "6px 20px 36px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ animation: "ms-flicker 1.8s infinite" }}>🕯</span> Light a Candle
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.36)", marginTop: 4 }}>Honor a loved one in the sanctuary</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16, animation: "ms-flicker 1.8s infinite" }}>🕯</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#D4AF37", marginBottom: 8 }}>Candle Lit</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                May their memory be a blessing<br />
                <span style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 17, color: "rgba(212,175,55,0.82)" }}>יהי זכרם ברוך</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form">
              {/* Form fields */}
              {[
                { label: "FULL NAME *", key: "name",       placeholder: "Name of the departed",     type: "text" },
                { label: "HEBREW NAME",  key: "hebrewName", placeholder: "שם בעברית (optional)",     type: "text" },
                { label: "DATE OF PASSING *", key: "date", placeholder: "",                          type: "date" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 13 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(212,175,55,0.65)", marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="ms-input" />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(212,175,55,0.65)", marginBottom: 6 }}>MEMORIAL MESSAGE</div>
                <textarea value={form.message}
                  onChange={e => setForm((p: any) => ({ ...p, message: e.target.value }))}
                  placeholder="Share a memory or blessing..." rows={3} className="ms-input" />
              </div>

              {/* Anonymous toggle */}
              <button
                onClick={() => setAnonymous(a => !a)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 13, marginBottom: 18, minHeight: 44,
                  background: anonymous ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(167,139,250,${anonymous ? "0.35" : "0.12"})`,
                  cursor: "pointer", transition: "background 0.18s, border-color 0.18s",
                }}
              >
                <span style={{ fontSize: 15 }}>{anonymous ? "👤" : "🙂"}</span>
                <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 600, color: anonymous ? "rgba(167,139,250,0.9)" : "rgba(255,255,255,0.5)" }}>
                  Light anonymously
                </span>
                <div style={{ flexShrink: 0, width: 36, height: 20, borderRadius: 10, background: anonymous ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 3, left: anonymous ? 18 : 3, width: 14, height: 14, borderRadius: "50%", background: anonymous ? "#a78bfa" : "rgba(255,255,255,0.4)", transition: "left 0.2s" }} />
                </div>
              </button>

              {/* Donation tiers */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(212,175,55,0.65)", marginBottom: 10 }}>DEDICATION</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {DONATION_TIERS.map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={donationTier === tier.id}
                      aria-label={tier.label}
                      onClick={() => setDonationTier(tier.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 14px", borderRadius: 13, minHeight: 44,
                        background: donationTier === tier.id ? "rgba(212,175,55,0.10)" : "rgba(255,255,255,0.03)",
                        border: `1px solid rgba(212,175,55,${donationTier === tier.id ? "0.45" : "0.12"})`,
                        cursor: "pointer", transition: "background 0.18s, border-color 0.18s", width: "100%",
                      }}
                    >
                      {/* Radio dot */}
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid rgba(212,175,55,${donationTier === tier.id ? "0.85" : "0.3"})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "border-color 0.18s",
                      }}>
                        {donationTier === tier.id && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37" }} />
                        )}
                      </div>
                      <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: donationTier === tier.id ? 700 : 500, color: donationTier === tier.id ? "rgba(212,175,55,0.92)" : "rgba(255,255,255,0.55)" }}>
                        {tier.label}
                      </span>
                      {tier.badge && <span style={{ fontSize: 14 }}>{tier.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation + API error */}
              {apiError && (
                <div style={{
                  marginBottom: 12, padding: "10px 14px", borderRadius: 12,
                  background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.28)",
                  fontSize: 12, color: "rgba(248,113,113,0.90)", lineHeight: 1.5,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
                  {apiError}
                </div>
              )}

              {/* Submit */}
              <motion.button
                onClick={onSubmit}
                disabled={saving || !form.name.trim() || !form.date}
                whileHover={!saving ? { scale: 1.015 } : {}}
                whileTap={!saving ? { scale: 0.985 } : {}}
                style={{
                  width: "100%", padding: "16px 0", minHeight: 52,
                  background: saving ? "rgba(212,175,55,0.25)" : "linear-gradient(135deg,#D4AF37 0%,#8a6000 100%)",
                  border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800,
                  color: saving ? "rgba(255,255,255,0.5)" : "#0F1829",
                  cursor: saving || !form.name.trim() || !form.date ? "default" : "pointer",
                  opacity: !form.name.trim() || !form.date ? 0.55 : 1,
                  boxShadow: saving ? "none" : "0 6px 24px rgba(212,175,55,0.35)",
                  transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <span>🕯</span>
                {saving ? "Lighting candle…" : donationTier === "free" ? "Light the Candle" : `Light the Candle · ₹${DONATION_TIERS.find(t => t.id === donationTier)?.amount}`}
              </motion.button>

              {/* Required fields hint — only shown when both are empty */}
              {(!form.name.trim() || !form.date) && !saving && (
                <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
                  Full name and date of passing are required (*)
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ═══════════════════ MEMORIAL PROFILE SHEET ══════════════════════════════════ */
function MemorialProfileSheet({
  entry, onClose,
  showDedicate, setShowDedicate,
  dedicateForm, setDedicateForm,
  dedicateSaving, dedicateSuccess,
  onDedicate,
}: {
  entry: CommunityYahrzeitEntry; onClose: () => void;
  showDedicate: boolean; setShowDedicate: (v: boolean) => void;
  dedicateForm: { learnerName: string; studySubject: string };
  setDedicateForm: (f: any) => void;
  dedicateSaving: boolean; dedicateSuccess: boolean;
  onDedicate: () => void;
}) {
  const [favorited, setFavorited]       = useState(false);
  const [shareState, setShareState]     = useState<"idle"|"copied">("idle");
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (shareTimerRef.current) clearTimeout(shareTimerRef.current); }, []);

  const { t } = useLanguage();
  const name     = entry.deceasedName.split("·")[0].trim();
  const hebrew   = entry.deceasedName.includes("·") ? entry.deceasedName.split("·")[1]?.trim() : null;

  /* Life timeline — only real data */
  const timelineEvents = [
    entry.passingYear && { year: entry.passingYear, icon: "🕯️", label: t.memTimelineRemembered, color: "rgba(255,255,255,0.65)", desc: t.memMemoryBlessing },
  ].filter(Boolean) as { year: number; icon: string; label: string; color: string; desc: string }[];

  const handleShare = async () => {
    const url = `${window.location.origin}?memorial=${encodeURIComponent(name)}`;
    try { await navigator.clipboard.writeText(url); } catch { /* silent */ }
    setShareState("copied");
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setShareState("idle"), 2200);
  };

  return (
    <motion.div
      key="profile-sheet"
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 290 }}
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50,
        borderRadius: "28px 28px 0 0",
        background: "linear-gradient(180deg, rgba(5,2,18,0.98) 0%, rgba(3,1,12,1) 100%)",
        backdropFilter: "blur(32px)",
        border: "1px solid rgba(212,175,55,0.25)", borderBottom: "none",
        maxHeight: "88dvh", overflowY: "auto",
        boxShadow: "0 -24px 80px rgba(0,0,0,0.75), 0 -1px 0 rgba(212,175,55,0.14)",
      }}
    >
      {/* Handle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px" }}>
        <div style={{ width: 44, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
      </div>

      <div style={{ padding: "8px 22px 56px" }}>
        {/* ── Avatar + name + actions row ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: 24, flexShrink: 0,
            background: "linear-gradient(135deg,#D4AF37 0%,#6a4a00 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, fontWeight: 900, color: "#fff",
            animation: "ms-pulse-gold 3.5s ease-in-out infinite",
            position: "relative",
          }}>
            {initials(name)}
            {/* Glow ring */}
            <div style={{ position: "absolute", inset: -4, borderRadius: 28, border: "1px solid rgba(212,175,55,0.25)", pointerEvents: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 4 }}>{name}</div>
            {hebrew && (
              <div style={{ fontSize: 16, fontFamily: "'Noto Serif Hebrew',serif", color: "rgba(212,175,55,0.85)", marginBottom: 8, direction: "rtl" }}>{hebrew}</div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {entry.displayDate && (
                <div style={{ padding: "3px 10px", borderRadius: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                  📅 {entry.displayDate}
                </div>
              )}
              {entry.passingYear && (
                <div style={{ padding: "3px 10px", borderRadius: 18, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 10, color: "rgba(255,255,255,0.38)" }}>
                  {entry.passingYear}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
            >✕</button>
            <motion.button
              type="button"
              onClick={() => setFavorited(f => !f)}
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorited}
              style={{ width: 44, height: 44, borderRadius: "50%", background: favorited ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid rgba(248,113,113,${favorited ? "0.4" : "0.15"})`, color: favorited ? "#f87171" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            >{favorited ? "❤️" : "🤍"}</motion.button>
            <motion.button
              type="button"
              onClick={handleShare}
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
              aria-label={shareState === "copied" ? "Link copied to clipboard" : "Share memorial"}
              style={{ width: 44, height: 44, borderRadius: "50%", background: shareState === "copied" ? "rgba(100,200,120,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,${shareState === "copied" ? "0.2" : "0.1"})`, color: shareState === "copied" ? "#6ee7b7" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            >{shareState === "copied" ? "✓" : "↗"}</motion.button>
          </div>
        </div>

        {/* ── Share confirmation ── */}
        <AnimatePresence>
          {shareState === "copied" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginBottom: 10 }}
            >
              <div style={{ padding: "8px 14px", borderRadius: 12, background: "rgba(100,200,120,0.08)", border: "1px solid rgba(100,200,120,0.22)", fontSize: 11, color: "rgba(110,231,183,0.9)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>✓</span> Memorial link copied to clipboard
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Life Timeline ── */}
        {timelineEvents.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(212,175,55,0.55)", marginBottom: 12 }}>{t.memTimelineTitle}</div>
            <div style={{ position: "relative", paddingLeft: 28 }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 10, top: 8, bottom: 8, width: 1, background: "linear-gradient(to bottom, rgba(212,175,55,0.5), rgba(212,175,55,0.08))" }} />
              {timelineEvents.map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  style={{ position: "relative", marginBottom: i < timelineEvents.length - 1 ? 18 : 0, display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  {/* Timeline dot */}
                  <div style={{ position: "absolute", left: -24, top: 6, width: 10, height: 10, borderRadius: "50%", background: ev.color, boxShadow: `0 0 8px ${ev.color}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <span style={{ fontSize: 14 }}>{ev.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{ev.label}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>{ev.year}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", lineHeight: 1.5 }}>{ev.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Lit by ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(212,175,55,0.58)", marginBottom: 6 }}>LIT BY</div>
          <div style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(212,175,55,0.065)", border: "1px solid rgba(212,175,55,0.16)", fontSize: 13, color: "rgba(212,175,55,0.88)", display: "flex", alignItems: "center", gap: 8 }}>
            🕯️ {entry.donorDisplayName}
          </div>
        </div>

        {/* ── Message ── */}
        {entry.message && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>MEMORIAL MESSAGE</div>
            <div style={{ padding: "14px 16px 14px 28px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)", fontSize: 13, color: "rgba(255,255,255,0.58)", fontStyle: "italic", lineHeight: 1.75, position: "relative" }}>
              <span style={{ position: "absolute", top: 4, left: 10, fontSize: 30, color: "rgba(212,175,55,0.15)", fontFamily: "Georgia,serif", lineHeight: 1 }}>"</span>
              {entry.message}
            </div>
          </div>
        )}

        {/* ── Hebrew blessing ── */}
        <div style={{ textAlign: "center", padding: "18px 16px", borderTop: "1px solid rgba(255,255,255,0.055)", borderBottom: "1px solid rgba(255,255,255,0.055)", marginBottom: 18, background: "rgba(212,175,55,0.03)", borderRadius: 16 }}>
          <div style={{ fontFamily: "'Noto Serif Hebrew',serif", fontSize: 22, color: "rgba(212,175,55,0.86)", letterSpacing: "0.04em", lineHeight: 1.5, marginBottom: 6 }}>
            יהי זכרם ברוך
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", letterSpacing: "0.06em" }}>
            May their memory be a blessing
          </div>
        </div>

        {/* ── Dedicated learners ── */}
        {entry.learners.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(167,139,250,0.65)", marginBottom: 8 }}>DEDICATED LEARNING</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {entry.learners.map((l, i) => (
                <div key={i} style={{ padding: "5px 12px", borderRadius: 16, background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.18)", fontSize: 11, color: "rgba(167,139,250,0.88)" }}>
                  📖 {l.learnerName} · {l.studySubject}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

        {/* ── Leave tribute ── */}
        <motion.button
          onClick={() => setShowDedicate(!showDedicate)}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          style={{
            width: "100%", padding: "14px 0", marginBottom: showDedicate ? 14 : 0,
            background: showDedicate ? "rgba(167,139,250,0.14)" : "rgba(167,139,250,0.07)",
            border: `1px solid rgba(167,139,250,${showDedicate ? "0.4" : "0.2"})`,
            borderRadius: 16, fontSize: 14, fontWeight: 700,
            color: "rgba(167,139,250,0.92)", cursor: "pointer", transition: "all 0.2s",
          }}
        >
          📖 Leave a Tribute
        </motion.button>

        <AnimatePresence>
          {showDedicate && !dedicateSuccess && (
            <motion.div key="dedicate-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ paddingTop: 4 }}>
                {[
                  { label: "YOUR NAME *", key: "learnerName", placeholder: "Your name" },
                  { label: "SUBJECT OF STUDY *", key: "studySubject", placeholder: "e.g. Mishnah, Tehillim, Talmud…" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(212,175,55,0.62)", marginBottom: 6 }}>{f.label}</div>
                    <input type="text" value={(dedicateForm as any)[f.key]}
                      onChange={e => setDedicateForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} className="ms-input" />
                  </div>
                ))}
                <motion.button
                  onClick={onDedicate}
                  disabled={dedicateSaving || !dedicateForm.learnerName.trim() || !dedicateForm.studySubject.trim()}
                  whileHover={!dedicateSaving ? { scale: 1.01 } : {}}
                  whileTap={!dedicateSaving ? { scale: 0.99 } : {}}
                  style={{ width: "100%", padding: "14px 0", background: dedicateSaving ? "rgba(167,139,250,0.22)" : "linear-gradient(135deg,#a78bfa,#7c3aed)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, color: "#fff", cursor: dedicateSaving ? "default" : "pointer", opacity: dedicateSaving ? 0.7 : 1, transition: "opacity 0.2s" }}
                >
                  {dedicateSaving ? "Submitting…" : "📖 Dedicate"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {dedicateSuccess && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "14px 0", fontSize: 13, color: "rgba(167,139,250,0.92)", fontWeight: 700 }}>
            ✓ Tribute recorded — may it be for a blessing
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════ HORIZONTAL MEMORIAL STRIP ═════════════════════════════ */
function MemorialScrollStrip({
  entries, onSelect,
}: { entries: CommunityYahrzeitEntry[]; onSelect: (e: CommunityYahrzeitEntry) => void }) {
  if (!entries.length) return null;
  return (
    <div
      className="ms-scroll-strip"
      style={{
        position: "absolute", bottom: 60, left: 0, right: 0, zIndex: 15,
        overflowX: "auto", overflowY: "hidden",
        display: "flex", gap: 10, padding: "6px 14px 10px",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {entries.map((entry, i) => {
        const name = entry.deceasedName.split("·")[0].trim();
        return (
          <motion.div key={entry.id}
            role="button"
            tabIndex={0}
            aria-label={`View memorial for ${name}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(entry)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(entry); } }}
            whileHover={{ scale: 1.03, borderColor: "rgba(212,175,55,0.5)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              flexShrink: 0, width: 154, cursor: "pointer",
              background: "rgba(6,3,18,0.84)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(212,175,55,0.2)", borderRadius: 18,
              padding: "12px", boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#D4AF37,#7a5800)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900, color: "#fff",
              }}>{initials(name)}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            </div>
            {entry.displayDate && (
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.36)", marginBottom: 6 }}>📅 {entry.displayDate}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10 }}>🕯</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════ MOBILE SANCTUARY VIEW ═════════════════════════════════
 * Shown on screens < 768 px instead of the heavy 3D WebGL scene.
 * Full-featured: candle lighting, memorial browsing, dedications — 2D only.
 *
 * Layout architecture (top → bottom):
 *   1. Sticky header strip  — breadcrumb + title + close (56px)
 *   2. Hero band            — candle glow + Hebrew verse + stats row (~140px)
 *   3. Action + Search bar  — CTA + search input (fixed section)
 *   4. Scrollable body      — section label → rich cards OR empty-state invite
 * ══════════════════════════════════════════════════════════════════════════ */
const MOBILE_STARS = Array.from({ length: 28 }, (_, i) => ({
  left:    ((i * 73 + 17) % 97) + "%",
  top:     ((i * 41 + 7)  % 40) + "%",   /* only in top 40% — hero zone */
  opacity: 0.15 + ((i * 31) % 10) / 18,
  size:    1 + (i % 2),
}));

function MobileSanctuaryView({ onClose, userName, initialEntries = [], onEnter3D }: Props & { onEnter3D?: () => void }) {
  const { t } = useLanguage();
  const [entries, setEntries]             = useState<CommunityYahrzeitEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedEntry, setSelectedEntry] = useState<CommunityYahrzeitEntry | null>(null);
  const [showForm, setShowForm]           = useState(false);
  const [form, setForm]                   = useState({ name: "", hebrewName: "", message: "", date: "" });
  const [saving, setSaving]               = useState(false);
  const [success, setSuccess]             = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [showDedicate, setShowDedicate]   = useState(false);
  const [dedicateForm, setDedicateForm]   = useState({ learnerName: "", studySubject: "" });
  const [dedicateSaving, setDedicateSaving]   = useState(false);
  const [dedicateSuccess, setDedicateSuccess] = useState(false);
  const [mobileFlowers, setMobileFlowers]     = useState<{colorIdx: number; id: string}[]>([]);
  const [showFlowerPicker, setShowFlowerPicker] = useState(false);
  const [selectedFlowerColor, setSelectedFlowerColor] = useState(0);

  const load = useCallback(async () => {
    const data = await fetchCommunityYahrzeit();
    setEntries(data);
  }, []);
  useEffect(() => { if (initialEntries.length === 0) load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const iv = setInterval(load, 30_000); return () => clearInterval(iv); }, [load]);

  const filtered = searchQuery.trim()
    ? entries.filter(e =>
        e.deceasedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.donorDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.message ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  async function handleSubmit() {
    if (!form.name.trim() || !form.date) return;
    setSubmitError(null);
    setSaving(true);
    try {
      const d  = new Date(form.date + "T12:00:00");
      const hd = new HDate(d);
      await createCommunityYahrzeit({
        id: `cy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        deceasedName: form.hebrewName.trim()
          ? `${form.name.trim()} · ${form.hebrewName.trim()}`
          : form.name.trim(),
        hebrewDay: hd.getDate(),
        hebrewMonth: hd.getMonth(),
        displayDate: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        passingYear: d.getFullYear(),
        message: form.message.trim(),
        donorDisplayName: userName ?? "Community Member",
      });
      setSuccess(true);
      await load();
      setTimeout(() => {
        setSuccess(false); setShowForm(false);
        setForm({ name: "", hebrewName: "", message: "", date: "" });
      }, 3200);
    } catch {
      setSubmitError("Could not save. Please check your connection and try again.");
    } finally { setSaving(false); }
  }

  async function handleDedicate() {
    if (!selectedEntry || !dedicateForm.learnerName.trim() || !dedicateForm.studySubject.trim()) return;
    setDedicateSaving(true);
    try {
      await dedicateLearning(selectedEntry.id, dedicateForm.learnerName.trim(), dedicateForm.studySubject.trim());
      setDedicateSuccess(true);
      await load();
      setTimeout(() => {
        setDedicateSuccess(false); setShowDedicate(false);
        setDedicateForm({ learnerName: "", studySubject: "" });
      }, 2800);
    } finally { setDedicateSaving(false); }
  }

  const totalCandles = (24_832 + entries.length).toLocaleString();

  return (
    <div style={{
      position: "fixed", inset: 0,
      /* z-index 10001: sits above PWA install banner (10000) and all other overlays */
      zIndex: 10001,
      fontFamily: "Inter,-apple-system,sans-serif",
      background: "linear-gradient(170deg,#04010e 0%,#07031a 55%,#0c0820 100%)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <style>{STYLES}</style>

      {/* ── Background: sparse stars only in hero zone (top 40%) ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {MOBILE_STARS.map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            width: s.size, height: s.size,
            borderRadius: "50%", background: "#fff",
            left: s.left, top: s.top, opacity: s.opacity,
          }} />
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          ZONE 1 — STICKY HEADER STRIP
          Compact, 56px. Breadcrumb + title + close.
          ════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", zIndex: 3, flexShrink: 0,
        paddingTop: "max(env(safe-area-inset-top),14px)",
        paddingLeft: 18, paddingRight: 18, paddingBottom: 10,
        borderBottom: "1px solid rgba(212,175,55,0.10)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.20em", color: "rgba(212,175,55,0.55)", marginBottom: 1 }}>
            🕯 VALLEY OF REMEMBRANCE
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "0.01em", lineHeight: 1.15 }}>
            {t.memShellWelcome}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Enter 3D World — opt-in for mobile users */}
          {onEnter3D && (
            <button
              onClick={onEnter3D}
              aria-label="Enter 3D Sanctuary"
              title="Enter the immersive 3D world"
              style={{
                height: 36, borderRadius: 18, flexShrink: 0,
                border: "1px solid rgba(212,175,55,0.45)",
                background: "linear-gradient(135deg,rgba(212,175,55,0.18) 0%,rgba(212,175,55,0.06) 100%)",
                color: "#D4AF37", fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "0 12px",
                whiteSpace: "nowrap",
              }}
            >
              🌐 3D World
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.65)", fontSize: 18,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          ZONE 2 — HERO BAND
          Candle glow orb + Hebrew memory verse + two stat pills.
          Fixed height ~138px — no wasted void below.
          ════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", zIndex: 2, flexShrink: 0,
        padding: "14px 18px 16px",
        background: "linear-gradient(180deg,rgba(212,175,55,0.06) 0%,transparent 100%)",
      }}>
        {/* Central candle glow + verse */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          {/* Candle orb */}
          <div style={{
            width: 56, height: 56, flexShrink: 0, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(212,175,55,0.22) 0%,rgba(212,175,55,0.04) 60%,transparent 100%)",
            border: "1px solid rgba(212,175,55,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
            animation: "ms-pulse-gold 3.2s ease-in-out infinite",
          }}>🕯</div>

          {/* Verse */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 700, color: "rgba(212,175,55,0.92)",
              letterSpacing: "0.03em", marginBottom: 3,
              direction: "rtl", textAlign: "right",
            }}>
              זִכְרוֹנוֹ לִבְרָכָה
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.45 }}>
              May their memory be a blessing.{"\n"}
              Light a candle. Say their name.
            </div>
          </div>
        </div>

        {/* Stat pills — horizontal, compact, no giant boxes */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 7,
            background: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.20)", borderRadius: 10,
            padding: "8px 12px",
          }}>
            <span style={{ fontSize: 14 }}>🕯</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#D4AF37", lineHeight: 1 }}>{totalCandles}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.38)", letterSpacing: "0.06em", marginTop: 1 }}>CANDLES LIT</div>
            </div>
          </div>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 7,
            background: "rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.20)", borderRadius: 10,
            padding: "8px 12px",
          }}>
            <span style={{ fontSize: 14 }}>✡️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#a78bfa", lineHeight: 1 }}>{entries.length}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.38)", letterSpacing: "0.06em", marginTop: 1 }}>SOULS REMEMBERED</div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          ZONE 3 — ACTION + SEARCH BAR
          Full-width CTA, then search below. Fixed, not scrollable.
          ════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", zIndex: 2, flexShrink: 0,
        padding: "10px 18px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* ── CTA Row: Light Candle + Flowers ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <motion.button
            onClick={() => { setShowForm(true); setShowFlowerPicker(false); }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: "14px 0",
              background: "linear-gradient(135deg,#D4AF37 0%,#a07828 100%)",
              border: "none", borderRadius: 16,
              fontSize: 14, fontWeight: 800, color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(212,175,55,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            🕯 {t.memLightCandle}
          </motion.button>

          <motion.button
            onClick={() => setShowFlowerPicker(v => !v)}
            whileTap={{ scale: 0.97 }}
            style={{
              flexShrink: 0, width: 96, padding: "14px 0",
              background: showFlowerPicker
                ? "linear-gradient(135deg,#ff6b8a 0%,#c778e8 100%)"
                : "rgba(255,107,138,0.12)",
              border: `1.5px solid ${showFlowerPicker ? "transparent" : "rgba(255,107,138,0.40)"}`,
              borderRadius: 16,
              fontSize: 13, fontWeight: 800,
              color: showFlowerPicker ? "#fff" : "rgba(255,107,138,0.90)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s",
            }}
          >
            🌸 {t.memFlowersBtn}
          </motion.button>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12,
          padding: "0 14px",
        }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.32)", flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.memSearchPlaceholder}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fff", fontSize: 14, padding: "11px 0",
              fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "none", border: "none",
                color: "rgba(255,255,255,0.35)", fontSize: 18,
                cursor: "pointer", padding: "4px", lineHeight: 1, flexShrink: 0,
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          ZONE 3.5 — FLOWER PICKER PANEL
          Slides in below Zone 3 when "Flowers" button is active.
          Lets the user choose a colour and place a virtual flower.
          ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showFlowerPicker && (
          <motion.div
            key="flower-picker"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            style={{ overflow: "hidden", flexShrink: 0, zIndex: 3, position: "relative" }}
          >
            <div style={{
              padding: "14px 18px 16px",
              background: "linear-gradient(180deg,rgba(30,8,24,0.98) 0%,rgba(18,4,22,0.98) 100%)",
              borderBottom: "1px solid rgba(255,107,138,0.20)",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(248,113,113,0.80)" }}>
                    🌸 {t.memPlaceFlower.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
                    {t.memChooseFlowerColor}
                  </div>
                </div>
                {mobileFlowers.length > 0 && (
                  <div style={{
                    fontSize: 10, color: "rgba(248,113,113,0.70)",
                    background: "rgba(248,113,113,0.10)",
                    border: "1px solid rgba(248,113,113,0.22)",
                    borderRadius: 50, padding: "4px 10px", fontWeight: 700,
                  }}>
                    🌸 {mobileFlowers.length} {t.memFlowersInGarden}
                  </div>
                )}
              </div>

              {/* Colour swatches — 8 across */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {FLOWER_PALETTE.map((col, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedFlowerColor(i)}
                    whileTap={{ scale: 0.88 }}
                    title={FLOWER_NAMES[i]}
                    style={{
                      flex: 1, aspectRatio: "1", borderRadius: 10, border: "none",
                      background: col, cursor: "pointer",
                      boxShadow: selectedFlowerColor === i
                        ? `0 0 0 3px #fff, 0 0 14px ${col}`
                        : "0 2px 6px rgba(0,0,0,0.35)",
                      opacity: selectedFlowerColor === i ? 1 : 0.50,
                      transition: "all 0.15s",
                      position: "relative",
                    }}
                  >
                    {selectedFlowerColor === i && (
                      <span style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13,
                      }}>
                        {FLOWER_EMOJIS[i]}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Selected label + Place button */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  flex: 1, fontSize: 12, fontWeight: 700,
                  color: "rgba(255,255,255,0.50)",
                }}>
                  {FLOWER_EMOJIS[selectedFlowerColor]}{" "}
                  <span style={{ color: FLOWER_PALETTE[selectedFlowerColor] }}>
                    {FLOWER_NAMES[selectedFlowerColor]}
                  </span>
                </div>
                <motion.button
                  onClick={() => {
                    if (mobileFlowers.length >= MAX_MOBILE_FLOWERS) return;
                    setMobileFlowers(prev => [
                      ...prev,
                      { colorIdx: selectedFlowerColor, id: `mf-${Date.now()}-${Math.random().toString(36).slice(2)}` },
                    ]);
                  }}
                  whileTap={{ scale: 0.93 }}
                  disabled={mobileFlowers.length >= MAX_MOBILE_FLOWERS}
                  style={{
                    padding: "11px 22px", borderRadius: 14, border: "none",
                    background: mobileFlowers.length >= MAX_MOBILE_FLOWERS
                      ? "rgba(255,255,255,0.08)"
                      : `linear-gradient(135deg,${FLOWER_PALETTE[selectedFlowerColor]} 0%,${FLOWER_PALETTE[(selectedFlowerColor + 2) % 8]} 100%)`,
                    color: mobileFlowers.length >= MAX_MOBILE_FLOWERS ? "rgba(255,255,255,0.30)" : "#fff",
                    fontSize: 13, fontWeight: 800, cursor: mobileFlowers.length >= MAX_MOBILE_FLOWERS ? "default" : "pointer",
                    boxShadow: mobileFlowers.length >= MAX_MOBILE_FLOWERS ? "none" : "0 4px 16px rgba(0,0,0,0.40)",
                    transition: "all 0.2s",
                  }}
                >
                  {t.memPlaceFlowerBtn}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          ZONE 4 — SCROLLABLE BODY
          Section label + memorial cards OR full empty-state invite.
          This zone fills all remaining height.
          ════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, overflowY: "auto", position: "relative", zIndex: 2,
        padding: "0 18px",
        paddingBottom: "max(env(safe-area-inset-bottom),32px)",
        WebkitOverflowScrolling: "touch" as const,
      }}>

        {/* ── Flower Garden strip — appears when flowers have been placed ── */}
        <AnimatePresence>
          {mobileFlowers.length > 0 && (
            <motion.div
              key="flower-garden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                marginTop: 14, marginBottom: 4,
                background: "linear-gradient(90deg,rgba(255,107,138,0.06) 0%,rgba(199,120,232,0.06) 100%)",
                border: "1px solid rgba(255,107,138,0.18)",
                borderRadius: 16, padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(248,113,113,0.70)" }}>
                  🌸 FLOWER GARDEN
                </div>
                <button
                  onClick={() => setMobileFlowers([])}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(255,255,255,0.28)", fontSize: 11,
                    cursor: "pointer", padding: "2px 6px",
                    borderRadius: 6, lineHeight: 1,
                  }}
                >
                  clear
                </button>
              </div>
              {/* Flower dot row — scrollable horizontally */}
              <div style={{
                display: "flex", gap: 6, overflowX: "auto",
                scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as const,
                paddingBottom: 2,
              }}>
                {mobileFlowers.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: Math.min(i * 0.02, 0.3) }}
                    style={{
                      flexShrink: 0, width: 34, height: 34,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 40% 35%, ${FLOWER_PALETTE[f.colorIdx]}, ${FLOWER_PALETTE[(f.colorIdx + 2) % 8]}88)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                      boxShadow: `0 2px 10px ${FLOWER_PALETTE[f.colorIdx]}55`,
                    }}
                  >
                    {FLOWER_EMOJIS[f.colorIdx]}
                  </motion.div>
                ))}
                {/* Remaining slots indicator */}
                {mobileFlowers.length < MAX_MOBILE_FLOWERS && (
                  <div style={{
                    flexShrink: 0, width: 34, height: 34, borderRadius: "50%",
                    border: "1.5px dashed rgba(248,113,113,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "rgba(248,113,113,0.40)", fontWeight: 700,
                  }}>
                    +{MAX_MOBILE_FLOWERS - mobileFlowers.length}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section label (only when there are entries) */}
        {filtered.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 0 10px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.10em" }}>
              SOULS REMEMBERED
            </div>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.85)",
              background: "rgba(212,175,55,0.10)", borderRadius: 6,
              padding: "2px 7px", border: "1px solid rgba(212,175,55,0.22)",
            }}>
              {filtered.length}
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>
        )}

        {/* ── Empty state: rich, inviting, spiritual ── */}
        {filtered.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", textAlign: "center",
            padding: "48px 24px 32px",
            gap: 0,
          }}>
            {/* Animated candle */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%", marginBottom: 20,
              background: "radial-gradient(circle,rgba(212,175,55,0.18) 0%,rgba(212,175,55,0.04) 60%,transparent 100%)",
              border: "1px solid rgba(212,175,55,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 38, animation: "ms-pulse-gold 2.8s ease-in-out infinite",
            }}>🕯</div>

            {/* Hebrew heading */}
            <div style={{
              fontSize: 18, fontWeight: 700, color: "rgba(212,175,55,0.85)",
              letterSpacing: "0.04em", marginBottom: 8,
              direction: "rtl",
            }}>
              {searchQuery ? "לא נמצאו תוצאות" : "בֵּית הַזִּיכָּרוֹן"}
            </div>

            {/* Subtitle */}
            <div style={{
              fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65,
              maxWidth: 240, marginBottom: 28,
            }}>
              {searchQuery
                ? t.memNoResults
                : "No souls have been remembered yet.\nLight the first candle and honour a loved one from our community."
              }
            </div>

            {/* CTA (only when not searching) */}
            {!searchQuery && (
              <motion.button
                onClick={() => setShowForm(true)}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "13px 32px",
                  background: "linear-gradient(135deg,#D4AF37 0%,#a07828 100%)",
                  border: "none", borderRadius: 14,
                  fontSize: 14, fontWeight: 800, color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(212,175,55,0.28)",
                }}
              >
                🕯 Light the first candle
              </motion.button>
            )}
          </div>
        )}

        {/* ── Memorial Cards ── */}
        {filtered.map((entry, i) => {
          const name    = entry.deceasedName.split("·")[0].trim();
          const hebrewN = entry.deceasedName.includes("·") ? entry.deceasedName.split("·")[1]?.trim() : null;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.4) }}
              onClick={() => setSelectedEntry(entry)}
              whileTap={{ scale: 0.985 }}
              style={{
                marginBottom: 10, cursor: "pointer",
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(212,175,55,0.13)",
                borderRadius: 18, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 14,
                backdropFilter: "blur(10px)",
                transition: "border-color 0.2s",
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#D4AF37 0%,#7a5800 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 900, color: "#fff",
                boxShadow: "0 0 0 1px rgba(212,175,55,0.25)",
              }}>
                {initials(name)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Primary name */}
                <div style={{
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  marginBottom: hebrewN ? 1 : 3,
                }}>
                  {name}
                </div>
                {/* Hebrew name (if present) */}
                {hebrewN && (
                  <div style={{
                    fontSize: 11, color: "rgba(212,175,55,0.65)",
                    marginBottom: 4, direction: "rtl", textAlign: "left",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {hebrewN}
                  </div>
                )}
                {/* Date */}
                {entry.displayDate && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginBottom: 4 }}>
                    {entry.displayDate}
                  </div>
                )}
                {/* Candle count + message indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10 }}>🕯</span>
                  <span style={{ fontSize: 11, color: "rgba(212,175,55,0.80)", fontWeight: 700 }}>
                    {t.memCandlesLit}
                  </span>
                  {entry.message && (
                    <span style={{
                      fontSize: 9, color: "rgba(255,255,255,0.30)",
                      background: "rgba(255,255,255,0.07)", borderRadius: 4, padding: "1px 5px",
                    }}>
                      💬
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.30)", fontSize: 14,
              }}>›</div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Light a Candle Form ── */}
      <AnimatePresence>
        {showForm && (
          <LightCandleForm
            form={form} setForm={setForm}
            saving={saving} success={success}
            onSubmit={handleSubmit}
            onClose={() => { setShowForm(false); setSubmitError(null); }}
            apiError={submitError}
          />
        )}
      </AnimatePresence>

      {/* ── Memorial Profile Sheet ── */}
      <AnimatePresence>
        {selectedEntry && !showForm && (
          <MemorialProfileSheet
            entry={selectedEntry}
            onClose={() => { setSelectedEntry(null); setShowDedicate(false); setDedicateSuccess(false); }}
            showDedicate={showDedicate}
            setShowDedicate={setShowDedicate}
            dedicateForm={dedicateForm}
            setDedicateForm={setDedicateForm}
            dedicateSaving={dedicateSaving}
            dedicateSuccess={dedicateSuccess}
            onDedicate={handleDedicate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════ MAIN COMPONENT ════════════════════════════════════════ */
export default function MemorialSanctuaryModal({ onClose, userName, initialEntries = [] }: Props) {
  const isMobile = useIsMobile();
  const [entries, setEntries]               = useState<CommunityYahrzeitEntry[]>(initialEntries);
  const [placedCandles, setPlacedCandles]   = useState<Candle[]>([]);
  const [selectedEntry, setSelectedEntry]   = useState<CommunityYahrzeitEntry | null>(null);
  const [showForm, setShowForm]             = useState(false);
  const [pendingPos, setPendingPos]         = useState<[number, number, number] | null>(null);
  const [success, setSuccess]               = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [forceDesktop, setForceDesktop]     = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const filterYear                          = "all";
  const [showDedicate, setShowDedicate]     = useState(false);
  const [dedicateSuccess, setDedicateSuccess] = useState(false);
  const [activeScene, setActiveScene]       = useState<SceneTab>("valley");
  const [activeNav, setActiveNav]           = useState<RightNav>("home");
  const [showHints, setShowHints]           = useState(true);
  const [form, setForm]                     = useState({ name: "", hebrewName: "", message: "", date: "" });
  const [saving, setSaving]                 = useState(false);
  const [dedicateForm, setDedicateForm]     = useState({ learnerName: "", studySubject: "" });
  const [dedicateSaving, setDedicateSaving] = useState(false);
  /* Phase 3 additions */
  const [virtualFlowers, setVirtualFlowers] = useState<VirtualFlower[]>([]);
  const [selectedFlowerColor, setSelectedFlowerColor] = useState(0);
  const [newCandlePos, setNewCandlePos]     = useState<[number, number, number] | null>(null);
  const [showMicro, setShowMicro]           = useState(false);
  const sound = useAmbientSound();

  /* ── Task 6: Reflection Mode ──────────────────────────────────────────────
   * After REFLECTION_DELAY ms of stillness → hide all UI overlays.
   * Any pointer/touch/key activity resets the timer and restores the UI.
   * ──────────────────────────────────────────────────────────────────────── */
  const REFLECTION_DELAY = 25000; // 25 seconds
  const [reflectionMode, setReflectionMode]   = useState(false);
  const reflectionModeRef   = useRef(false);   // sync ref to avoid stale closures
  const idleTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExitRef         = useRef(0);       // timestamp of last reflection-exit
  const panelOpenRef        = useRef(false);   // don't enter reflection while a panel is open

  const resetIdle = useCallback(() => {
    /* Exit reflection mode immediately */
    if (reflectionModeRef.current) {
      reflectionModeRef.current = false;
      lastExitRef.current = Date.now();
      setReflectionMode(false);
    }
    /* Restart the idle countdown */
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (panelOpenRef.current) return;        // don't enter if form/profile is open
      reflectionModeRef.current = true;
      setReflectionMode(true);
    }, REFLECTION_DELAY);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Start idle timer on mount; clear on unmount */
  useEffect(() => {
    resetIdle();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [resetIdle]);

  /* Keyboard handler — Escape closes panels; also exits reflection mode */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      resetIdle(); // any keypress resets idle timer
      if (e.key !== "Escape") return;
      if (reflectionModeRef.current) return;   // Escape already handled by resetIdle
      if (selectedEntry) { setSelectedEntry(null); setShowDedicate(false); setDedicateSuccess(false); return; }
      if (showForm) { setShowForm(false); setPendingPos(null); return; }
      if (showMicro) { setShowMicro(false); setPendingPos(null); return; }
      if (activeNav !== "home") { setActiveNav("home"); return; }
      onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedEntry, showForm, showMicro, activeNav, onClose, resetIdle]);
  /**
   * canRender3D — mount guard for R3F v9 + React 19 Strict Mode.
   *
   * React 19 Strict Mode intentionally discards the first render pass to
   * surface side-effects. During that discarded pass the R3F Canvas hasn't
   * run its initialisation effect yet, so its internal Zustand store context
   * is null. Any scene child that calls useFrame / useThree then tries to
   * destructure { subscribe } from null → TypeError.
   *
   * By keeping canRender3D=false until after the first useEffect flush we
   * guarantee the Canvas is never mounted during the discarded pass. The
   * Replit runtime-error overlay therefore never fires.
   */
  const [canRender3D,   setCanRender3D]   = useState(false);
  /* SPR-034C: Entry fade — black overlay that disappears on first open */
  const [showEntryFade, setShowEntryFade] = useState(true);
  /* SPR-034D: First-visit board hint — gated by localStorage flag */
  const [showBoardHint, setShowBoardHint] = useState<boolean>(() => {
    try { return !localStorage.getItem("sanctuary-boards-seen"); } catch { return false; }
  });

  const searchRef      = useRef<HTMLInputElement>(null!);
  const cameraStateRef = useRef<CameraState | null>(null);

  // Mount guard — runs after the real (non-discarded) first commit
  useEffect(() => { setCanRender3D(true); }, []);
  // Entry fade: hold black until scene has had time to load, then fade.
  // delay 0.6 s + duration 1.5 s = 2.1 s to fully transparent; unmount at 2600 ms.
  useEffect(() => {
    const t = setTimeout(() => setShowEntryFade(false), 2600);
    return () => clearTimeout(t);
  }, []);
  // Board hint: dismiss after 8 s and persist flag so it never shows again
  useEffect(() => {
    if (!showBoardHint) return;
    const t = setTimeout(() => {
      setShowBoardHint(false);
      try { localStorage.setItem("sanctuary-boards-seen", "1"); } catch {}
    }, 8000);
    return () => clearTimeout(t);
  }, [showBoardHint]);

  useEffect(() => { const t = setTimeout(() => setShowHints(false), 7000); return () => clearTimeout(t); }, []);

  const load = useCallback(async () => {
    const data = await fetchCommunityYahrzeit();
    setEntries(data);
  }, []);
  useEffect(() => { if (initialEntries.length === 0) load(); }, []);
  useEffect(() => { const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const handleCandleClick = useCallback((entry: CommunityYahrzeitEntry) => {
    setSelectedEntry(entry);
    setShowForm(false);
    setShowDedicate(false);
    setDedicateSuccess(false);
    setDedicateForm({ learnerName: "", studySubject: "" });
    setShowHints(false);
  }, []);

  const handleGroundClick = useCallback((pos: [number, number, number]) => {
    /* First tap after exiting reflection mode should ONLY restore UI, not open a form */
    if (Date.now() - lastExitRef.current < 500) return;
    if (showForm || selectedEntry || showMicro) return;
    /* If flowers nav is active — place a flower instead of opening candle form */
    if (activeNav === "flowers") {
      setVirtualFlowers(prev => [...prev, { pos, colorIdx: selectedFlowerColor }]);
      return;
    }
    setPendingPos(pos);
    setShowMicro(true);   /* show micro pill first; it opens the full form on tap */
    setShowHints(false);
  }, [showForm, selectedEntry, showMicro, activeNav, selectedFlowerColor]);

  async function handleSubmit() {
    if (!form.name.trim() || !form.date) return;
    setSubmitError(null);
    setSaving(true);
    try {
      const d  = new Date(form.date + "T12:00:00");
      const hd = new HDate(d);
      await createCommunityYahrzeit({
        id: `cy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        deceasedName: form.hebrewName.trim()
          ? `${form.name.trim()} · ${form.hebrewName.trim()}`
          : form.name.trim(),
        hebrewDay: hd.getDate(),
        hebrewMonth: hd.getMonth(),
        displayDate: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        passingYear: d.getFullYear(),
        message: form.message.trim(),
        donorDisplayName: userName ?? "Community Member",
      });
      if (pendingPos) {
        setPlacedCandles(prev => [...prev, { pos: pendingPos, name: form.name.trim() }]);
        setNewCandlePos(pendingPos);
        setTimeout(() => setNewCandlePos(null), 3500);
      }
      setSuccess(true);
      await load();
      setTimeout(() => {
        setSuccess(false); setShowForm(false); setPendingPos(null);
        setForm({ name: "", hebrewName: "", message: "", date: "" });
      }, 3200);
    } catch {
      setSubmitError("Could not save. Please check your connection and try again.");
    } finally { setSaving(false); }
  }

  async function handleDedicate() {
    if (!selectedEntry || !dedicateForm.learnerName.trim() || !dedicateForm.studySubject.trim()) return;
    setDedicateSaving(true);
    try {
      await dedicateLearning(selectedEntry.id, dedicateForm.learnerName.trim(), dedicateForm.studySubject.trim());
      setDedicateSuccess(true);
      await load();
      setTimeout(() => { setDedicateSuccess(false); setShowDedicate(false); setDedicateForm({ learnerName: "", studySubject: "" }); }, 2800);
    } finally { setDedicateSaving(false); }
  }

  const filtered      = filterEntries(entries, searchQuery, filterYear);
  const totalLit      = entries.length;
  const panelOpen     = showForm || !!selectedEntry;
  /* Keep panelOpenRef in sync — used inside the idle timeout callback (ref avoids stale closure) */
  useEffect(() => { panelOpenRef.current = panelOpen; }, [panelOpen]);
  const showBrowse    = activeNav === "memorials" && !panelOpen;
  const showMusic     = activeNav === "music"   && !panelOpen;
  const showFlowers   = activeNav === "flowers" && !panelOpen;
  const showHome      = activeNav === "home"    && !panelOpen;

  /* Home panel: light a candle by placing at a random valley position */
  const handleHomePanelLightCandle = useCallback(() => {
    const pos: [number, number, number] = [
      (Math.random() - 0.5) * 10,
      0.05,
      (Math.random() - 0.5) * 8,
    ];
    setPendingPos(pos);
    setShowForm(true);
    setShowHints(false);
  }, []);

  /* ── Mobile branch: show the 2D list view by default, 3D opt-in via button ── */
  if (isMobile && !forceDesktop) {
    return (
      <MobileSanctuaryView
        onClose={onClose}
        userName={userName}
        initialEntries={initialEntries}
        onEnter3D={() => setForceDesktop(true)}
      />
    );
  }

  return (
    <div
      onClick={e => { e.stopPropagation(); resetIdle(); }}
      onPointerMove={resetIdle}
      onPointerDown={resetIdle}
      onTouchStart={resetIdle}
      style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden", userSelect: "none", fontFamily: "Inter,-apple-system,sans-serif" }}
      role="region"
      aria-label="Memorial Sanctuary 3D scene"
    >
      <style>{STYLES}</style>

      {/* ── 3D CANVAS ──
           canRender3D guard: Canvas is held back until after React 19 Strict
           Mode's discarded first-render pass so the R3F Zustand store context
           is never accessed while null.  The error boundary provides a
           secondary safety net for any surviving transient issues. ── */}
      <div style={{ position: "absolute", inset: 0 }}>
        {canRender3D ? (
          <R3FErrorBoundary>
            <Suspense fallback={<ValleyLoading />}>
              <MemorialValley3D
                entries={entries}
                placedCandles={placedCandles}
                virtualFlowers={virtualFlowers}
                newCandlePos={newCandlePos}
                onCandleClick={handleCandleClick}
                onGroundClick={handleGroundClick}
                selectedId={selectedEntry?.id ?? null}
                sceneView={activeScene as SceneViewType}
                cameraStateRef={cameraStateRef}
              />
            </Suspense>
          </R3FErrorBoundary>
        ) : (
          <ValleyLoading />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          UI OVERLAY LAYER — fades to opacity:0 in Reflection Mode.
          All UI elements live here except forms/sheets that stay on top.
          ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`ms-ui-layer${reflectionMode ? " ms-ui-hidden" : ""}`}
        aria-hidden={reflectionMode}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        {/* ── MINIMAP OVERLAY — PUBG-style position compass ── */}
        <MinimapOverlay cameraRef={cameraStateRef} hidden={panelOpen || !!searchQuery} />

        {/* ── TOP HEADER ── */}
        <TopHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchRef={searchRef}
          onClose={onClose}
          onLightCandle={handleHomePanelLightCandle}
        />

        {/* ── SEARCH RESULTS ── */}
        <AnimatePresence>
          {searchQuery.trim().length > 0 && (
            <SearchResults
              results={filtered}
              onSelect={e => { setSelectedEntry(e); setSearchQuery(""); }}
              onClose={() => setSearchQuery("")}
            />
          )}
        </AnimatePresence>

        {/* ── BACKGROUND DIM when profile open ── */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "absolute", inset: 0, zIndex: 40,
                background: "rgba(0,0,0,0.42)",
                backdropFilter: "blur(2px)",
                pointerEvents: "none",
              }}
            />
          )}
        </AnimatePresence>

        {/* ── ENTRANCE CARD — shows instead of left stats when Home nav active ── */}
        <AnimatePresence>
          {showHome && (
            <EntranceCard
              entries={entries}
              candleCount={totalLit}
              onLightCandle={handleHomePanelLightCandle}
              onSelectEntry={e => { setSelectedEntry(e); setActiveNav("home"); }}
              soundPlaying={sound.playing}
              onSoundToggle={sound.toggle}
            />
          )}
        </AnimatePresence>

        {/* ── STATS CHIP ROW — shown when a non-home, non-browse nav is active ── */}
        {!panelOpen && !showHome && !showBrowse && (
          <StatsChipRow
            candleCount={totalLit}
          />
        )}

        {/* ── FLOATING MEMORIAL NAME TOOLTIP ── */}
        <AnimatePresence>
          {selectedEntry && !panelOpen && (
            <FloatingMemorialTooltip entry={selectedEntry} />
          )}
        </AnimatePresence>

        {/* ── RIGHT NAV ── */}
        {!panelOpen && (
          <RightNavPanel
            active={activeNav}
            onSelect={nav => {
              setActiveNav(prev => prev === nav ? "home" : nav);
            }}
          />
        )}

        {/* ── MUSIC PANEL ── */}
        <AnimatePresence>
          {showMusic && <MusicPanel sound={sound} />}
        </AnimatePresence>

        {/* ── FLOWERS PANEL ── */}
        <AnimatePresence>
          {showFlowers && (
            <FlowersPanel
              onSelectColor={setSelectedFlowerColor}
              selectedColor={selectedFlowerColor}
              placedCount={virtualFlowers.length}
            />
          )}
        </AnimatePresence>

        {/* ── AMBIENT COMMUNITY NOTIFICATIONS — suppressed in reflection mode ── */}
        <AmbientNotification entries={entries} paused={panelOpen || showForm || reflectionMode} />

        {/* ── INTERACTION HINTS ── */}
        {!panelOpen && <InteractionHints visible={showHints} />}

        {/* ── MEMORIAL BROWSER PANEL ── */}
        <AnimatePresence>
          {showBrowse && (
            <MemorialBrowserPanel onClose={() => setActiveNav("home")} />
          )}
        </AnimatePresence>

        {/* ── BOTTOM SCENE TABS ── */}
        {!panelOpen && (
          <BottomSceneTabs active={activeScene} onSelect={setActiveScene} />
        )}
      </div>
      {/* ── END UI OVERLAY LAYER ── */}

      {/* ── SPR-034C: ENTRY FADE — black screen fades to transparent on open ── */}
      <AnimatePresence>
        {showEntryFade && (
          <motion.div
            key="sanctuary-entry-fade"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.60, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0, zIndex: 9997,
              background: "#000",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── SPR-034D: FIRST VISIT BOARD HINT ── */}
      <AnimatePresence>
        {showBoardHint && !reflectionMode && (
          <motion.div
            key="board-hint"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 2.4, duration: 0.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9996,
              pointerEvents: "none",
            }}
          >
            <div style={{
              background: "rgba(4,2,12,0.72)",
              backdropFilter: "blur(20px) saturate(1.4)",
              border: "1px solid rgba(212,175,55,0.30)",
              borderRadius: 50,
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 14, filter: "drop-shadow(0 0 6px rgba(212,175,55,0.65))" }}>✨</span>
              <span style={{
                fontSize: 12,
                color: "rgba(212,175,55,0.90)",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}>
                Walk toward the glowing boards — they hold community notices
              </span>
              <span style={{ fontSize: 14, filter: "drop-shadow(0 0 6px rgba(212,175,55,0.65))" }}>✨</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REFLECTION MODE HINT — shown only when UI is hidden ── */}
      <AnimatePresence>
        {reflectionMode && (
          <motion.button
            key="reflection-hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            onClick={resetIdle}
            aria-label="Tap to restore the interface"
            style={{
              position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
              zIndex: 30,
              background: "rgba(4,2,12,0.55)",
              backdropFilter: "blur(16px) saturate(1.4)",
              border: "1px solid rgba(212,175,55,0.22)",
              borderRadius: 50,
              padding: "10px 22px",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              animation: "ms-breath 3s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 14, filter: "drop-shadow(0 0 6px rgba(212,175,55,0.6))" }}>🕯</span>
            <span style={{ fontSize: 11, color: "rgba(212,175,55,0.75)", fontWeight: 600, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
              Tap anywhere to continue
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── MICRO CANDLE CARD — always above UI layer ── */}
      <AnimatePresence>
        {showMicro && !showForm && (
          <MicroCandleCard
            key="micro-card"
            onOpen={() => { setShowMicro(false); setShowForm(true); }}
            onDismiss={() => { setShowMicro(false); setPendingPos(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── LIGHT A CANDLE FORM — unwraps from micro card via layoutId ── */}
      <AnimatePresence>
        {showForm && (
          <LightCandleForm
            form={form} setForm={setForm}
            saving={saving} success={success}
            onSubmit={handleSubmit}
            onClose={() => { setShowForm(false); setPendingPos(null); setSubmitError(null); }}
            apiError={submitError}
          />
        )}
      </AnimatePresence>

      {/* ── MEMORIAL PROFILE ── */}
      <AnimatePresence>
        {selectedEntry && !showForm && (
          <MemorialProfileSheet
            entry={selectedEntry}
            onClose={() => { setSelectedEntry(null); setShowDedicate(false); setDedicateSuccess(false); }}
            showDedicate={showDedicate}
            setShowDedicate={setShowDedicate}
            dedicateForm={dedicateForm}
            setDedicateForm={setDedicateForm}
            dedicateSaving={dedicateSaving}
            dedicateSuccess={dedicateSuccess}
            onDedicate={handleDedicate}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
