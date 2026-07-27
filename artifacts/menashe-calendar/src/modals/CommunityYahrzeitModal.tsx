import { useState, useEffect, useCallback, useRef } from "react";
import { HDate } from "@hebcal/core";
import BurningCandle from "../components/BurningCandle";
import yishaiMemorialBg from "@assets/YISHAI_1782279066718.webp";
import MemorialSanctuaryModal from "./MemorialSanctuaryModal";
import {
  fetchCommunityYahrzeit,
  createCommunityYahrzeit,
  deleteCommunityYahrzeit,
  dedicateLearning,
  fetchYahrzeitEntries,
  type CommunityYahrzeitEntry,
  type YartzeitEntryApi,
} from "../lib/userApi";

import sanctuaryHeroBg from "@assets/image_1782640129704.webp";

/* ── Hero images — sanctuary image is featured first ──────────────────────── */
const HERO_IMAGES = [
  sanctuaryHeroBg,
  "https://p1.hippopx.com/preview/477/140/925/israel-jerusalem-holy-city-city-royalty-free-thumbnail.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/2/2b/The_Western_Wall_and_Dome_of_the_rock_in_the_old_city_of_Jerusalem.jpg",
  "https://p1.hippopx.com/preview/626/67/758/jerusalem-holy-land-old-city-religion-royalty-free-thumbnail.jpg",
  "https://cdn.britannica.com/59/91859-004-7439A10F/Western-Wall-Old-City-of-Jerusalem-Second.jpg",
  "https://t4.ftcdn.net/jpg/02/67/24/77/360_F_267247778_tnDQ73R9yHwkDOEYZxKeGbmmPSCNFQpz.jpg",
];

const DONATION_TIERS = [
  { label: "Free / Donate later", amount: 0, tag: "" },
  { label: "₹108 — Tikkun Olam", amount: 108, tag: "💛" },
  { label: "₹360 — Zecher L'vracha", amount: 360, tag: "✡" },
  { label: "₹1080 — Eternal Light", amount: 1080, tag: "🕯" },
];

const CURRENT_YEAR = new Date().getFullYear();

function yahrzeitNumber(passingYear: number | null): number | undefined {
  if (!passingYear || passingYear >= CURRENT_YEAR) return undefined;
  return CURRENT_YEAR - passingYear;
}

function hebrewMonthName(month: number, year: number): string {
  try { return HDate.getMonthName(month, year); } catch { return `Month ${month}`; }
}

function hebrewDateStr(day: number, month: number): string {
  try {
    const curHYear = new HDate(new Date()).getFullYear();
    return `${day} ${hebrewMonthName(month, curHYear)}`;
  } catch { return `${day}/${month}`; }
}

function ordinalStr(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface Props {
  onClose: () => void;
  userName?: string | null;
}

type View = "board" | "form" | "dedicate";

/* ─────────────────────────────────────────────────────────────────────────────
   Floating particles rendered once in the hero
───────────────────────────────────────────────────────────────────────────── */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 17 + 3) % 90}%`,
  top: `${10 + (i * 23 + 7) % 80}%`,
  size: 2 + (i % 3),
  delay: `${(i * 0.41) % 4}s`,
  dur: `${4 + (i % 5)}s`,
  opacity: 0.12 + (i % 4) * 0.06,
}));

export default function CommunityYahrzeitModal({ onClose, userName }: Props) {
  /* ── existing data state ── */
  const [entries, setEntries] = useState<CommunityYahrzeitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("board");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSanctuary, setShowSanctuary] = useState(false);

  const [myEntries, setMyEntries] = useState<YartzeitEntryApi[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);

  /* ── form fields ── */
  const [deceasedName, setDeceasedName] = useState("");
  const [hebrewName, setHebrewName] = useState("");
  const [passDateStr, setPassDateStr] = useState("");
  const [donorName, setDonorName] = useState(userName ?? "");
  const [message, setMessage] = useState("");
  const [donationIdx, setDonationIdx] = useState(0);

  /* ── dedicate ── */
  const [dedicateEntryId, setDedicateEntryId] = useState<string | null>(null);
  const [dedicateName, setDedicateName] = useState(userName ?? "");
  const [dedicateSubject, setDedicateSubject] = useState("Torah");
  const [dedicateSaving, setDedicateSaving] = useState(false);
  const [dedicateDone, setDedicateDone] = useState(false);

  /* ── hero slideshow ── */
  const [heroSlot, setHeroSlot] = useState<"A" | "B">("A");
  const [slotA, setSlotA] = useState(HERO_IMAGES[0]);
  const [slotB, setSlotB] = useState(HERO_IMAGES[1]);
  const [aOpacity, setAOpacity] = useState(1);
  const [bOpacity, setBOpacity] = useState(0);
  const heroIdxRef = useRef(0);

  /* ── hero rotation ── */
  useEffect(() => {
    const preload = (src: string) => { const img = new Image(); img.src = src; };
    HERO_IMAGES.slice(0, 2).forEach(preload);

    const timer = setInterval(() => {
      heroIdxRef.current = (heroIdxRef.current + 1) % HERO_IMAGES.length;
      const next = HERO_IMAGES[heroIdxRef.current];
      const nextNext = HERO_IMAGES[(heroIdxRef.current + 1) % HERO_IMAGES.length];
      setHeroSlot(prev => {
        if (prev === "A") {
          setSlotB(next);
          requestAnimationFrame(() => { setAOpacity(0); setBOpacity(1); });
          preload(nextNext);
          return "B";
        } else {
          setSlotA(next);
          requestAnimationFrame(() => { setBOpacity(0); setAOpacity(1); });
          preload(nextNext);
          return "A";
        }
      });
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  /* ── data loading ── */
  const load = useCallback(async () => {
    const data = await fetchCommunityYahrzeit();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(load, 20000);
    return () => clearInterval(iv);
  }, [load]);

  async function loadMyEntries() {
    setLoadingMy(true);
    const data = await fetchYahrzeitEntries();
    setMyEntries(data);
    setLoadingMy(false);
  }

  function pickMyEntry(e: YartzeitEntryApi) {
    setDeceasedName(e.name);
    const yearMatch = e.displayDate.match(/\d{4}/);
    if (yearMatch) setPassDateStr(`${yearMatch[0]}-01-01`);
    setMyEntries([]);
  }

  async function handleSubmit() {
    if (!deceasedName.trim() || !passDateStr) return;
    setSaving(true);
    try {
      const passDate = new Date(passDateStr + "T12:00:00");
      const hd = new HDate(passDate);
      const id = `cy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await createCommunityYahrzeit({
        id,
        deceasedName: hebrewName.trim() ? `${deceasedName.trim()} · ${hebrewName.trim()}` : deceasedName.trim(),
        hebrewDay: hd.getDate(),
        hebrewMonth: hd.getMonth(),
        displayDate: passDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        passingYear: passDate.getFullYear(),
        message: message.trim(),
        donorDisplayName: donorName.trim(),
      });
      setSavedSuccess(true);
      await load();
      setTimeout(() => {
        setSavedSuccess(false);
        setView("board");
        setDeceasedName(""); setHebrewName(""); setPassDateStr(""); setMessage(""); setDonationIdx(0);
      }, 2800);
    } finally {
      setSaving(false);
    }
  }

  async function handleDedicate() {
    if (!dedicateEntryId || !dedicateName.trim()) return;
    setDedicateSaving(true);
    try {
      await dedicateLearning(dedicateEntryId, dedicateName.trim(), dedicateSubject.trim() || "Torah");
      setDedicateDone(true);
      await load();
      setTimeout(() => { setDedicateEntryId(null); setDedicateDone(false); }, 2000);
    } finally {
      setDedicateSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteCommunityYahrzeit(id);
    setDeleteId(null);
    await load();
  }

  const candleCount  = entries.length;
  const learnerCount = entries.reduce((s, e) => s + e.learners.length, 0);
  const weeklyCount  = entries.filter(e => e.candleLit).length;

  /* ───────────────────────────────────────────────────────────────────────── */
  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: "95dvh",
          overflowY: "auto",
          background: "#06040c",
          position: "relative",
          padding: 0,
          borderRadius: 28,
        }}
      >

        {/* ═══════════════════════════════════════════════════════════════════
            GLOBAL STYLES
        ═══════════════════════════════════════════════════════════════════ */}
        <style>{`
          @keyframes cy-hero-kb {
            0%   { transform: scale(1.04) translate(0%, 0%); }
            100% { transform: scale(1.15) translate(-2%, -1.5%); }
          }
          @keyframes cy-particle-float {
            0%   { opacity: 0; transform: translateY(0) scale(0.8); }
            30%  { opacity: 1; }
            80%  { opacity: 0.7; }
            100% { opacity: 0; transform: translateY(-60px) scale(1.2); }
          }
          @keyframes cy-sunray {
            0%   { opacity: 0; transform: rotate(-15deg) scaleY(0.6); }
            40%  { opacity: 0.08; }
            100% { opacity: 0; transform: rotate(15deg) scaleY(1.4); }
          }
          @keyframes cy-cta-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.35), 0 8px 28px rgba(0,0,0,0.55); }
            50%       { box-shadow: 0 0 40px rgba(212,175,55,0.65), 0 8px 28px rgba(0,0,0,0.55), 0 0 60px rgba(212,175,55,0.2); }
          }
          @keyframes cy-badge-glow {
            0%, 100% { opacity: 0.65; }
            50%       { opacity: 1; }
          }
          @keyframes cy-card-appear {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes cy-success-candle {
            0%   { opacity: 0; transform: scale(0.5) translateY(20px); }
            60%  { opacity: 1; transform: scale(1.15) translateY(-8px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes cy-empty-float {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-8px); }
          }
          @keyframes cy-shimmer-slide {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .cy-glass-card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(212,175,55,0.18);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 18px;
          }
          .cy-memorial-card {
            border-radius: 20px;
            padding: 16px 12px 12px;
            border: 1px solid rgba(212,175,55,0.12);
            background: rgba(212,175,55,0.03);
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
            cursor: default;
            position: relative;
            animation: cy-card-appear 0.4s ease both;
          }
          .cy-memorial-card:hover {
            border-color: rgba(212,175,55,0.35);
            box-shadow: 0 0 24px rgba(212,175,55,0.12), 0 8px 24px rgba(0,0,0,0.35);
            transform: translateY(-2px);
          }
          .cy-input {
            width: 100%; padding: 12px 14px; border-radius: 12px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.2);
            color: #fff; font-size: 14px; outline: none;
            box-sizing: border-box; font-family: inherit;
            transition: border-color 0.2s, background 0.2s;
          }
          .cy-input:focus { border-color: rgba(212,175,55,0.55); background: rgba(212,175,55,0.04); }
          .cy-input::placeholder { color: rgba(255,255,255,0.3); }
          .cy-textarea {
            width: 100%; padding: 12px 14px; border-radius: 12px;
            background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.2);
            color: #fff; font-size: 13px; outline: none;
            box-sizing: border-box; font-family: inherit;
            resize: none; min-height: 72px;
            transition: border-color 0.2s;
          }
          .cy-textarea:focus { border-color: rgba(212,175,55,0.55); }
          .cy-textarea::placeholder { color: rgba(255,255,255,0.3); }
          .cy-label {
            font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
            color: rgba(212,175,55,0.7); margin-bottom: 6px;
          }
          .cy-tier {
            display: flex; align-items: center; gap: 12px;
            padding: 11px 14px; border-radius: 12px;
            border: 1.5px solid rgba(255,255,255,0.08); cursor: pointer;
            margin-bottom: 8px; background: rgba(255,255,255,0.03);
            transition: border-color 0.15s, background 0.15s;
          }
          .cy-tier.selected {
            border-color: rgba(212,175,55,0.5);
            background: rgba(212,175,55,0.07);
          }
          .cy-tier:hover { border-color: rgba(212,175,55,0.3); }
          input[type="date"].cy-input::-webkit-calendar-picker-indicator {
            filter: invert(0.7) sepia(1) saturate(2) hue-rotate(5deg);
          }
        `}</style>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO — Rotating Jerusalem Slideshow
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: "relative", height: 290, overflow: "hidden", borderRadius: "28px 28px 0 0", flexShrink: 0 }}>

          {/* Slot A */}
          <div style={{ position: "absolute", inset: 0, opacity: aOpacity, transition: "opacity 1.1s ease-in-out", willChange: "opacity" }}>
            <img src={slotA} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", animation: "cy-hero-kb 12s ease-in-out forwards", willChange: "transform" }} />
          </div>

          {/* Slot B */}
          <div style={{ position: "absolute", inset: 0, opacity: bOpacity, transition: "opacity 1.1s ease-in-out", willChange: "opacity" }}>
            <img src={slotB} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", animation: "cy-hero-kb 12s ease-in-out forwards", willChange: "transform" }} />
          </div>

          {/* Yishai watermark */}
          <img src={yishaiMemorialBg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.07, mixBlendMode: "luminosity", pointerEvents: "none" }} />

          {/* Dark gradient overlays */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(4,2,10,0.62) 50%, rgba(6,4,12,0.88) 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

          {/* Sunlight rays */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", top: 0, left: `${25 + i * 25}%`,
              width: 1, height: "100%",
              background: "linear-gradient(to bottom, rgba(255,220,100,0.12) 0%, transparent 80%)",
              transformOrigin: "top center",
              animation: `cy-sunray ${5 + i}s ease-in-out infinite`,
              animationDelay: `${i * 1.8}s`,
              pointerEvents: "none",
            }} />
          ))}

          {/* Floating particles */}
          {PARTICLES.map(p => (
            <div key={p.id} style={{
              position: "absolute",
              left: p.left, top: p.top,
              width: p.size, height: p.size,
              borderRadius: "50%",
              background: `rgba(212,175,55,${p.opacity})`,
              animation: `cy-particle-float ${p.dur} ease-in-out infinite`,
              animationDelay: p.delay,
              pointerEvents: "none",
            }} />
          ))}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16, zIndex: 10,
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>

          {/* Hero title content */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "0 20px 24px",
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", zIndex: 2,
          }}>
            {/* Divider line */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, width: "100%", maxWidth: 280 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.35)" }} />
              <span style={{ fontSize: 16 }}>🕯</span>
              <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.35)" }} />
            </div>

            <div style={{
              fontSize: 11, fontWeight: 900, letterSpacing: "0.22em",
              color: "rgba(212,175,55,0.85)", textTransform: "uppercase", marginBottom: 6,
            }}>Community Memorial</div>

            <div style={{
              fontFamily: "'Noto Serif Hebrew', serif",
              fontSize: 26, fontWeight: 700,
              color: "#F5D982",
              textShadow: "0 0 30px rgba(212,175,55,0.6), 0 2px 12px rgba(0,0,0,0.8)",
              lineHeight: 1.2, marginBottom: 6, letterSpacing: "0.04em",
            }}>
              יהי זכרם ברוך
            </div>

            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.55)", fontStyle: "italic", letterSpacing: "0.04em",
            }}>
              May Their Memory Be A Blessing
            </div>

            {/* Bottom divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, width: "100%", maxWidth: 280 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.2)" }} />
              <span style={{ fontSize: 10, color: "rgba(212,175,55,0.5)" }}>✦</span>
              <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.2)" }} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTENT AREA
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ padding: "20px 16px 28px" }}>

          {/* ── Stats glass cards ── */}
          <div style={{ display: "flex", gap: 9, marginBottom: 22 }}>
            {[
              { value: candleCount,  label: "NAMES\nREMEMBERED", color: "#D4AF37", glow: "rgba(212,175,55,0.15)" },
              { value: weeklyCount,  label: "CANDLES\nLIT",       color: "#F5D982", glow: "rgba(245,217,130,0.15)" },
              { value: learnerCount, label: "DEDICATIONS\nMADE",  color: "#a78bfa", glow: "rgba(167,139,250,0.12)" },
            ].map((s, i) => (
              <div key={i} className="cy-glass-card" style={{ flex: 1, padding: "12px 8px", textAlign: "center", background: s.glow }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1, textShadow: `0 0 16px ${s.color}66` }}>
                  {loading ? "—" : s.value}
                </div>
                <div style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginTop: 5, lineHeight: 1.4, whiteSpace: "pre-line" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              BOARD VIEW
          ══════════════════════════════════════════════════════════════════ */}
          {view === "board" && (
            <>
              {/* CTA button — opens sanctuary */}
              <button
                onClick={() => setShowSanctuary(true)}
                style={{
                  width: "100%", padding: "0", marginBottom: 22,
                  border: "none", borderRadius: 18,
                  cursor: "pointer",
                  position: "relative", overflow: "hidden",
                  animation: "cy-cta-pulse 3s ease-in-out infinite",
                  boxShadow: "0 8px 32px rgba(212,175,55,0.35), 0 2px 8px rgba(0,0,0,0.6)",
                  display: "block",
                }}
              >
                {/* Sanctuary image backdrop */}
                <img
                  src={sanctuaryHeroBg}
                  alt=""
                  draggable={false}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "center 30%",
                    pointerEvents: "none",
                  }}
                />

                {/* Gold gradient overlay for legibility */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "linear-gradient(135deg, rgba(180,130,20,0.72) 0%, rgba(100,70,0,0.62) 50%, rgba(180,130,20,0.72) 100%)",
                }} />

                {/* Shimmer sweep */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.18) 50%, transparent 75%)",
                  backgroundSize: "200% 100%",
                  animation: "cy-shimmer-slide 3s linear infinite",
                }} />

                {/* Button label content */}
                <div style={{
                  position: "relative", zIndex: 1,
                  padding: "16px 20px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 22 }}>🕯</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "0.06em", textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}>
                    Enter Memorial Sanctuary
                  </span>
                </div>
              </button>

              {/* ── Loading ── */}
              {loading && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4AF37", opacity: 0.6, animation: `cy-badge-glow 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Empty state ── */}
              {!loading && entries.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "44px 20px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                }}>
                  <div style={{ fontSize: 52, animation: "cy-empty-float 3s ease-in-out infinite" }}>🕯</div>
                  <div style={{
                    fontSize: 16, fontWeight: 800, color: "#D4AF37",
                    textShadow: "0 0 20px rgba(212,175,55,0.4)",
                  }}>
                    Be the first to light a candle
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 260 }}>
                    Light the first candle and help build a living memorial for our community.
                  </div>
                </div>
              )}

              {/* ── Memorial wall grid ── */}
              {!loading && entries.length > 0 && (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.5)",
                    letterSpacing: "0.15em", marginBottom: 14, textAlign: "center",
                  }}>✦ MEMORIAL WALL ✦</div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: 10,
                    justifyItems: "center",
                  }}>
                    {entries.map((entry, idx) => {
                      const yNum = yahrzeitNumber(entry.passingYear);
                      const isDedicating = dedicateEntryId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className="cy-memorial-card"
                          style={{ animationDelay: `${idx * 0.04}s`, width: "100%" }}
                        >
                          {/* Candle */}
                          <BurningCandle
                            deceasedName={entry.deceasedName}
                            yahrzeitNumber={yNum}
                            donorName={entry.donorDisplayName || undefined}
                            learners={entry.learners}
                            isLit={entry.candleLit}
                            compact
                          />

                          {/* Hebrew date */}
                          <div style={{
                            fontSize: 9, color: "rgba(212,175,55,0.6)",
                            marginTop: 4, fontFamily: "'Noto Serif Hebrew', serif",
                          }}>
                            {hebrewDateStr(entry.hebrewDay, entry.hebrewMonth)}
                          </div>

                          {/* Message */}
                          {entry.message && (
                            <div style={{
                              fontSize: 9, color: "rgba(255,255,255,0.4)", fontStyle: "italic",
                              textAlign: "center", marginTop: 5, lineHeight: 1.45,
                              maxWidth: 120, overflow: "hidden",
                              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                            }}>
                              &ldquo;{entry.message}&rdquo;
                            </div>
                          )}

                          {/* Dedicate learning */}
                          {!isDedicating && (
                            <button
                              onClick={() => { setDedicateEntryId(entry.id); setDedicateDone(false); }}
                              style={{
                                marginTop: 10, padding: "5px 12px", borderRadius: 10, cursor: "pointer",
                                background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
                                fontSize: 9, fontWeight: 700, color: "#D4AF37",
                                transition: "background 0.2s",
                              }}
                            >
                              📖 Dedicate Learning
                            </button>
                          )}

                          {isDedicating && !dedicateDone && (
                            <div style={{ marginTop: 8, width: "100%", display: "flex", flexDirection: "column", gap: 5 }}>
                              <input className="cy-input" placeholder="Your name" value={dedicateName} onChange={e => setDedicateName(e.target.value)} style={{ fontSize: 10, padding: "6px 8px" }} />
                              <input className="cy-input" placeholder="What are you studying?" value={dedicateSubject} onChange={e => setDedicateSubject(e.target.value)} style={{ fontSize: 10, padding: "6px 8px" }} />
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => setDedicateEntryId(null)} style={{ flex: 1, padding: "5px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 9, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Cancel</button>
                                <button onClick={handleDedicate} disabled={dedicateSaving || !dedicateName.trim()} style={{ flex: 2, padding: "5px", borderRadius: 8, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", fontSize: 9, fontWeight: 700, color: "#D4AF37", cursor: "pointer", opacity: (!dedicateName.trim() || dedicateSaving) ? 0.5 : 1 }}>
                                  {dedicateSaving ? "…" : "🕯 Dedicate"}
                                </button>
                              </div>
                            </div>
                          )}

                          {isDedicating && dedicateDone && (
                            <div style={{ marginTop: 8, fontSize: 10, color: "#22c55e", fontWeight: 700, textAlign: "center" }}>
                              ✓ Your learning glows in the flame
                            </div>
                          )}

                          {deleteId === entry.id ? (
                            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "3px 6px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 8, cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                              <button onClick={() => handleDelete(entry.id)} style={{ flex: 1, padding: "3px 6px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 8, fontWeight: 700, color: "#ef4444", cursor: "pointer" }}>Remove</button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FORM VIEW — Light a Memorial Candle
          ══════════════════════════════════════════════════════════════════ */}
          {view === "form" && (
            <div>
              {/* Back nav */}
              <button
                onClick={() => setView("board")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "none", border: "none",
                  color: "rgba(212,175,55,0.7)", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", padding: "0 0 18px", letterSpacing: "0.04em",
                }}
              >
                ← Memorial Wall
              </button>

              {/* Form heading */}
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🕯</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#F5D982", marginBottom: 4 }}>
                  Light a Memorial Candle
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                  יהי זכרם ברוך
                </div>
              </div>

              {/* Import from saved Yahrzeits */}
              <button
                onClick={() => { if (myEntries.length === 0) loadMyEntries(); else setMyEntries([]); }}
                style={{
                  width: "100%", marginBottom: 16, padding: "11px 14px",
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>📂</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>
                  {loadingMy ? "Loading…" : "Use from My Saved Yahrzeits"}
                </span>
              </button>

              {myEntries.length > 0 && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {myEntries.map(e => (
                    <button key={e.id} onClick={() => pickMyEntry(e)} style={{ width: "100%", padding: "11px 14px", textAlign: "left", background: "rgba(255,255,255,0.03)", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{e.name}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{e.displayDate}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Form fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div className="cy-label">NAME OF THE DEPARTED *</div>
                  <input className="cy-input" placeholder="e.g. Miriam bat Avraham" value={deceasedName} onChange={e => setDeceasedName(e.target.value)} />
                </div>

                <div>
                  <div className="cy-label">HEBREW NAME (optional)</div>
                  <input className="cy-input" placeholder="e.g. מרים בת אברהם" value={hebrewName} onChange={e => setHebrewName(e.target.value)} style={{ fontFamily: "'Noto Serif Hebrew', serif", direction: hebrewName ? "rtl" : "ltr" }} />
                </div>

                <div>
                  <div className="cy-label">DATE OF PASSING *</div>
                  <input className="cy-input" type="date" value={passDateStr} onChange={e => setPassDateStr(e.target.value)} />
                  {passDateStr && (() => {
                    try {
                      const hd = new HDate(new Date(passDateStr + "T12:00:00"));
                      const curHYear = new HDate(new Date()).getFullYear();
                      const yNum = new Date(passDateStr).getFullYear();
                      return (
                        <div style={{ fontSize: 11, color: "#D4AF37", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>✡</span>
                          <span>{hd.getDate()} {HDate.getMonthName(hd.getMonth(), curHYear)}</span>
                          {CURRENT_YEAR > yNum && <span>· {ordinalStr(CURRENT_YEAR - yNum)} Yahrzeit this year</span>}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>

                <div>
                  <div className="cy-label">YOUR NAME (as donor) *</div>
                  <input className="cy-input" placeholder="Your name" value={donorName} onChange={e => setDonorName(e.target.value)} />
                </div>

                <div>
                  <div className="cy-label">MEMORIAL MESSAGE (optional)</div>
                  <textarea className="cy-textarea" placeholder="A few words in their memory… יהי זכרם ברוך" value={message} onChange={e => setMessage(e.target.value)} />
                </div>

                {/* Donation */}
                <div>
                  <div className="cy-label" style={{ marginBottom: 12 }}>DONATION</div>
                  {DONATION_TIERS.map((tier, i) => (
                    <div key={i} className={`cy-tier${donationIdx === i ? " selected" : ""}`} onClick={() => setDonationIdx(i)}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${donationIdx === i ? "#D4AF37" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {donationIdx === i && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37" }} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: donationIdx === i ? "#F5D982" : "rgba(255,255,255,0.65)" }}>
                        {tier.tag && <span style={{ marginRight: 6 }}>{tier.tag}</span>}
                        {tier.label}
                      </span>
                    </div>
                  ))}
                  {DONATION_TIERS[donationIdx].amount > 0 && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", padding: "8px 12px", background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: 10, lineHeight: 1.5 }}>
                      💳 Donation of ₹{DONATION_TIERS[donationIdx].amount} will be processed by community admin.
                    </div>
                  )}
                </div>
              </div>

              {/* Submit / success */}
              {savedSuccess ? (
                <div style={{
                  marginTop: 24, padding: "24px 20px", borderRadius: 18, textAlign: "center",
                  background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.25)",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8, animation: "cy-success-candle 0.6s ease both" }}>🕯</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#F5D982", marginBottom: 4 }}>
                    Candle lit. May their memory be a blessing.
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(212,175,55,0.6)", fontFamily: "'Noto Serif Hebrew', serif" }}>
                    יהי זכרם ברוך
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving || !deceasedName.trim() || !passDateStr || !donorName.trim()}
                  style={{
                    width: "100%", marginTop: 22, padding: "15px 20px",
                    background: (saving || !deceasedName.trim() || !passDateStr || !donorName.trim())
                      ? "rgba(212,175,55,0.15)"
                      : "linear-gradient(135deg, #D4AF37 0%, #c9a227 40%, #e8c84a 100%)",
                    border: "none", borderRadius: 16,
                    cursor: (!deceasedName.trim() || !passDateStr || !donorName.trim() || saving) ? "not-allowed" : "pointer",
                    fontSize: 15, fontWeight: 900,
                    color: (!deceasedName.trim() || !passDateStr || !donorName.trim() || saving) ? "rgba(212,175,55,0.5)" : "#1a0f00",
                    letterSpacing: "0.04em",
                    transition: "all 0.2s",
                    animation: (!deceasedName.trim() || !passDateStr || !donorName.trim() || saving) ? "none" : "cy-cta-pulse 3s ease-in-out infinite",
                  }}
                >
                  {saving ? "Lighting candle…" : "🕯 Light Memorial Candle"}
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              FOOTER
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={{
            marginTop: 32, paddingTop: 20,
            borderTop: "1px solid rgba(212,175,55,0.12)",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Noto Serif Hebrew', serif",
              fontSize: 18, color: "rgba(212,175,55,0.6)",
              marginBottom: 6,
            }}>יהי זכרם ברוך</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", marginBottom: 4 }}>
              May Their Memory Be A Blessing
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>
              Every candle represents a life remembered.
            </div>
          </div>

        </div>
      </div>

    </div>
    {/* ── Memorial Sanctuary full-screen experience ── */}
    {showSanctuary && (
      <MemorialSanctuaryModal
        onClose={() => { setShowSanctuary(false); load(); }}
        userName={userName}
        initialEntries={entries}
      />
    )}
    </>
  );
}
