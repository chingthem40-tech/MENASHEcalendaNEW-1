import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import BurningCandle from "../components/BurningCandle";
import { fetchCommunityYahrzeit, type CommunityYahrzeitEntry } from "../lib/userApi";

interface LandingProps {
  onSignIn: () => void;
}

/* ─── Jerusalem skyline SVG ─────────────────────────────────────── */
function JerusalemSkyline() {
  return (
    <svg
      viewBox="0 0 1200 340"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMax slice"
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#081120" />
          <stop offset="100%" stopColor="#0d1f3c" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="340" fill="url(#skyGrad)" />

      {/* Distant hills */}
      <ellipse cx="200" cy="310" rx="320" ry="80" fill="#0e1e36" />
      <ellipse cx="1000" cy="310" rx="280" ry="75" fill="#0e1e36" />
      <ellipse cx="600" cy="310" rx="500" ry="65" fill="#101f38" />

      {/* City wall base */}
      <rect x="0" y="248" width="1200" height="92" fill="#12233e" />
      {/* Merlons (crenellations) */}
      {[60,95,130,165,200,235,270,305,340,375,410,445,480,515,550,585,620,655,690,725,760,795,830,865,900,935,970,1005,1040,1075,1110].map((x, i) => (
        <rect key={i} x={x} y={236} width={14} height={16} fill="#12233e" rx={1} />
      ))}
      {/* Wall top line with gold tint */}
      <rect x="0" y="250" width="1200" height="3" fill="rgba(212,175,55,0.12)" />

      {/* Left side buildings */}
      <rect x="60" y="205" width="55" height="48" fill="#152840" />
      <rect x="68" y="193" width="9" height="14" fill="#152840" />
      <rect x="82" y="188" width="9" height="17" fill="#152840" />
      <rect x="97" y="196" width="9" height="11" fill="#152840" />
      <rect x="125" y="192" width="45" height="61" fill="#162a42" />
      <rect x="135" y="180" width="7" height="14" fill="#162a42" />
      <rect x="152" y="184" width="7" height="10" fill="#162a42" />

      {/* Tower of David / Citadel */}
      <rect x="178" y="152" width="32" height="100" fill="#18305a" />
      <polygon points="178,152 194,130 210,152" fill="#1a3260" />
      <rect x="174" y="145" width="7" height="9" fill="#1a3260" />
      <rect x="207" y="145" width="7" height="9" fill="#1a3260" />
      <rect x="183" y="160" width="5" height="9" fill="rgba(212,175,55,0.25)" />
      <rect x="197" y="160" width="5" height="9" fill="rgba(212,175,55,0.25)" />
      <rect x="183" y="176" width="5" height="9" fill="rgba(212,175,55,0.18)" />
      <rect x="197" y="176" width="5" height="9" fill="rgba(212,175,55,0.18)" />

      <rect x="218" y="176" width="38" height="76" fill="#142540" />
      <rect x="262" y="162" width="28" height="90" fill="#172b45" />
      <rect x="268" y="175" width="7" height="11" fill="rgba(212,175,55,0.15)" />
      <rect x="278" y="175" width="7" height="11" fill="rgba(212,175,55,0.15)" />

      {/* Left minaret */}
      <rect x="298" y="142" width="16" height="110" fill="#1a3260" />
      <ellipse cx="306" cy="142" rx="11" ry="6" fill="#1a3260" />
      <ellipse cx="306" cy="137" rx="6" ry="8" fill="#1e3870" />
      <circle cx="306" cy="130" r="3" fill="#D4AF37" opacity="0.7" />

      <rect x="320" y="178" width="48" height="74" fill="#142540" />
      <rect x="330" y="168" width="9" height="12" fill="#142540" />
      <rect x="343" y="171" width="9" height="10" fill="#142540" />
      <rect x="375" y="168" width="60" height="84" fill="#162a48" />
      <rect x="382" y="180" width="9" height="13" fill="rgba(212,175,55,0.14)" />
      <rect x="398" y="180" width="9" height="13" fill="rgba(212,175,55,0.14)" />
      <rect x="414" y="180" width="9" height="13" fill="rgba(212,175,55,0.14)" />

      {/* ── DOME OF THE ROCK — centerpiece ── */}
      {/* Temple Mount platform */}
      <rect x="420" y="200" width="160" height="52" fill="#1a3360" />
      <rect x="414" y="212" width="172" height="14" fill="#1e3a70" />
      {/* Arched arcade */}
      {[428,446,464,482,500,518,536,554,572].map((x, i) => (
        <path key={i} d={`M${x},212 Q${x+9},200 ${x+18},212`} fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth="2" />
      ))}
      {/* Octagonal drum */}
      <rect x="452" y="168" rx="3" ry="3" width="96" height="44" fill="#1e3a72" />
      {/* Dome base ellipse */}
      <ellipse cx="500" cy="168" rx="58" ry="16" fill="#1e3a72" />
      {/* Dome itself */}
      <path d="M442,168 Q500,96 558,168" fill="#1a3368" />
      {/* Dome gold band */}
      <path d="M450,162 Q500,104 550,162" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="2.5" />
      {/* Dome outer glow line */}
      <path d="M444,166 Q500,98 556,166" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="6" />
      {/* Finial */}
      <line x1="500" y1="96" x2="500" y2="80" stroke="#D4AF37" strokeWidth="2.5" opacity="0.8" />
      <circle cx="500" cy="78" r="5" fill="#D4AF37" opacity="0.8" />
      <path d="M494,80 Q500,74 506,80" fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.7" />
      {/* Drum windows */}
      {[462,476,490,504,518,532].map((x, i) => (
        <rect key={i} x={x} y={175} width={7} height={10} rx={3.5} fill="rgba(212,175,55,0.22)" />
      ))}
      {/* Dome ambient glow */}
      <ellipse cx="500" cy="130" rx="70" ry="44" fill="rgba(212,175,55,0.06)" />

      {/* Al-Aqsa Mosque */}
      <rect x="568" y="196" width="80" height="56" fill="#162a4a" />
      <path d="M574,196 Q608,174 642,196" fill="#1a3060" />
      <rect x="575" y="205" width="10" height="14" fill="rgba(212,175,55,0.12)" />
      <rect x="590" y="205" width="10" height="14" fill="rgba(212,175,55,0.12)" />
      <rect x="620" y="205" width="10" height="14" fill="rgba(212,175,55,0.12)" />
      <rect x="635" y="205" width="10" height="14" fill="rgba(212,175,55,0.12)" />

      {/* Right minaret */}
      <rect x="654" y="144" width="17" height="108" fill="#1a3260" />
      <ellipse cx="662" cy="144" rx="12" ry="7" fill="#1a3260" />
      <ellipse cx="662" cy="139" rx="7" ry="9" fill="#1e3870" />
      <circle cx="662" cy="131" r="3" fill="#D4AF37" opacity="0.7" />

      {/* Right side buildings */}
      <rect x="678" y="182" width="44" height="70" fill="#142540" />
      <rect x="686" y="172" width="9" height="12" fill="#142540" />
      <rect x="698" y="174" width="9" height="10" fill="#142540" />
      <rect x="728" y="174" width="60" height="78" fill="#162a45" />
      <rect x="735" y="183" width="8" height="11" fill="rgba(212,175,55,0.14)" />
      <rect x="748" y="183" width="8" height="11" fill="rgba(212,175,55,0.14)" />
      <rect x="762" y="183" width="8" height="11" fill="rgba(212,175,55,0.14)" />
      <rect x="775" y="183" width="8" height="11" fill="rgba(212,175,55,0.14)" />

      {/* Church of Holy Sepulchre */}
      <rect x="796" y="180" width="56" height="72" fill="#162b4a" />
      <ellipse cx="824" cy="180" rx="32" ry="12" fill="#1a3060" />
      <path d="M792,180 Q824,150 856,180" fill="#162b50" />
      <line x1="824" y1="150" x2="824" y2="138" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
      <path d="M818,141 h12 M824,135 v12" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />

      {/* Bell tower */}
      <rect x="858" y="160" width="24" height="92" fill="#162a45" />
      <polygon points="858,160 870,141 882,160" fill="#172c48" />
      <rect x="864" y="168" width="9" height="11" fill="rgba(212,175,55,0.2)" rx={1} />
      <circle cx="870" cy="139" r="4" fill="#D4AF37" opacity="0.5" />

      <rect x="888" y="182" width="44" height="70" fill="#142540" />
      <rect x="936" y="170" width="34" height="82" fill="#162a48" />
      <rect x="942" y="180" width="7" height="9" fill="rgba(212,175,55,0.14)" />
      <rect x="954" y="180" width="7" height="9" fill="rgba(212,175,55,0.14)" />
      <rect x="975" y="184" width="54" height="68" fill="#142540" />
      <rect x="982" y="193" width="8" height="11" fill="rgba(212,175,55,0.1)" />
      <rect x="995" y="193" width="8" height="11" fill="rgba(212,175,55,0.1)" />
      <rect x="1008" y="193" width="8" height="11" fill="rgba(212,175,55,0.1)" />

      {/* Far right tower */}
      <rect x="1036" y="156" width="22" height="96" fill="#1a3060" />
      <polygon points="1036,156 1047,136 1058,156" fill="#1a3060" />
      <circle cx="1047" cy="134" r="3" fill="rgba(212,175,55,0.5)" />
      <rect x="1064" y="182" width="46" height="70" fill="#142540" />
      <rect x="1116" y="194" width="38" height="58" fill="#162a45" />
      <rect x="1122" y="203" width="7" height="9" fill="rgba(212,175,55,0.1)" />
      <rect x="1134" y="203" width="7" height="9" fill="rgba(212,175,55,0.1)" />

      {/* Glow on dome */}
      <radialGradient id="domeGlow" cx="50%" cy="100%" r="50%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </radialGradient>
      <ellipse cx="498" cy="240" rx="180" ry="60" fill="url(#domeGlow)" />

      {/* Ground glow */}
      <radialGradient id="groundGlow" cx="50%" cy="0%" r="80%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </radialGradient>
      <rect x="0" y="200" width="1200" height="140" fill="url(#groundGlow)" />
    </svg>
  );
}

/* ─── Animated counter ──────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        let start = 0;
        const step = Math.ceil(to / 40);
        const id = setInterval(() => {
          start = Math.min(start + step, to);
          setVal(start);
          if (start >= to) clearInterval(id);
        }, 30);
      },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Main component ─────────────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear();
function candleYahrzeitNum(passingYear: number | null): number | undefined {
  if (!passingYear || passingYear >= CURRENT_YEAR) return undefined;
  return CURRENT_YEAR - passingYear;
}

export default function Landing({ onSignIn }: LandingProps) {
  const { t, lang, setLang } = useLanguage();
  const [candleEntries, setCandleEntries] = useState<CommunityYahrzeitEntry[]>([]);

  useEffect(() => {
    fetchCommunityYahrzeit().then(setCandleEntries).catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@400;700&display=swap');

        .landing-root {
          position: fixed;
          inset: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: #081120;
          color: #F8F6F0;
          font-family: 'Inter', -apple-system, sans-serif;
          scroll-behavior: smooth;
          z-index: 999;
        }

        /* ── Stars ── */
        .stars-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: twinkle var(--dur, 3s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
          opacity: 0;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; }
          50% { opacity: var(--op, 0.6); }
        }

        /* ── Hero fade ── */
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-badge   { animation: heroFadeUp .6s ease both; animation-delay: .05s; }
        .hero-heb     { animation: heroFadeUp .6s ease both; animation-delay: .15s; }
        .hero-h1      { animation: heroFadeUp .6s ease both; animation-delay: .25s; }
        .hero-sub     { animation: heroFadeUp .6s ease both; animation-delay: .35s; }
        .hero-btn     { animation: heroFadeUp .6s ease both; animation-delay: .45s; }
        .hero-scroll  { animation: heroFadeUp .6s ease both; animation-delay: .55s; }

        /* ── Skyline rise ── */
        @keyframes skylineRise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .skyline-wrap {
          animation: skylineRise .8s ease both;
          animation-delay: .1s;
        }

        /* ── Scroll hint bounce ── */
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: .4; }
          50%       { transform: translateY(6px); opacity: .7; }
        }
        .scroll-hint { animation: scrollBounce 2s ease-in-out infinite; }

        /* ── Feature cards ── */
        .feature-card {
          background: #101B2D;
          border: 1px solid rgba(212,175,55,0.12);
          border-radius: 20px;
          padding: 32px 28px;
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.25);
          border-color: rgba(212,175,55,0.3);
        }

        /* ── Gold shimmer button ── */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .btn-gold {
          background: linear-gradient(90deg, #b8860b 0%, #D4AF37 40%, #f0c94a 50%, #D4AF37 60%, #b8860b 100%);
          background-size: 200% auto;
          color: #1a0d00;
          border: none;
          padding: 16px 48px;
          border-radius: 99px;
          font-weight: 700;
          font-size: 17px;
          cursor: pointer;
          letter-spacing: .03em;
          box-shadow: 0 4px 30px rgba(212,175,55,.35), 0 0 60px rgba(212,175,55,.1);
          transition: transform .2s ease, box-shadow .2s ease;
          animation: shimmer 3s linear infinite;
        }
        .btn-gold:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 40px rgba(212,175,55,.5), 0 0 80px rgba(212,175,55,.15);
        }
        .btn-gold:active { transform: scale(.98); }

        /* ── Outline button ── */
        .btn-outline {
          background: transparent;
          color: #D4AF37;
          border: 1.5px solid #D4AF37;
          padding: 14px 42px;
          border-radius: 99px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          letter-spacing: .03em;
          transition: background .2s ease, color .2s ease, transform .2s ease;
        }
        .btn-outline:hover {
          background: rgba(212,175,55,.1);
          transform: scale(1.03);
        }

        /* ── Section reveal ── */
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal { opacity: 0; }
        .reveal.visible { animation: revealUp .7s ease both; }

        /* ── Gold divider ── */
        .gold-line {
          width: 60px; height: 2px;
          background: linear-gradient(90deg, transparent, #D4AF37, transparent);
          margin: 0 auto;
        }

        /* ── Stat ring glow ── */
        .stat-num {
          font-size: clamp(36px, 6vw, 52px);
          font-weight: 800;
          color: #D4AF37;
          letter-spacing: -.03em;
          line-height: 1;
        }

        /* ── Icon circle ── */
        .icon-circle {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: rgba(212,175,55,.1);
          border: 1px solid rgba(212,175,55,.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          margin-bottom: 20px;
          transition: background .25s ease, border-color .25s ease;
        }
        .feature-card:hover .icon-circle {
          background: rgba(212,175,55,.18);
          border-color: rgba(212,175,55,.35);
        }

        /* Responsive grid */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 640px) {
          .features-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }

        /* ── Nav bar ── */
        .landing-nav {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 28px;
          background: rgba(8,17,32,.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(212,175,55,.08);
        }

        /* ── Hero section ── */
        .hero-section {
          position: relative;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 120px 24px 260px;
          text-align: center;
          overflow: hidden;
        }

        /* ── Ambient orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        /* ── Saipikhup textile band ── */
        .saipikhup-band {
          position: absolute;
          left: 0; right: 0;
          height: 72px;
          background: linear-gradient(180deg, #143d24 0%, #1d5c38 50%, #143d24 100%);
          overflow: hidden;
        }
        .saipikhup-band::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('/saipikhup-light.svg');
          background-repeat: repeat;
          background-size: 64px 64px;
          opacity: 0.32;
        }
        .saipikhup-band::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(8,17,32,0.9) 0%,
            transparent 25%,
            transparent 75%,
            rgba(8,17,32,0.9) 100%
          );
        }
        .saipikhup-border-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent);
        }
        .saipikhup-border-bottom {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent);
        }
      `}</style>

      <div className="landing-root">
        {/* Stars */}
        <Stars />

        {/* Full-page saipikhup background — ultra-faint */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: "url('/saipikhup-light.svg')",
            backgroundRepeat: "repeat",
            backgroundSize: "80px 80px",
            opacity: 0.03,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Sticky nav */}
        <nav className="landing-nav">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Logo */}
            <img src="/logo-benei-menashe.png" alt="Benei Menashe Calendar" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(212,175,55,0.35)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#D4AF37", letterSpacing: ".08em" }}>{t.landingBadge}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 99, padding: "5px 12px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: lang === "en" ? "#D4AF37" : "rgba(212,175,55,0.4)", cursor: "pointer", transition: "color 0.2s" }} onClick={() => setLang("en")}>EN</span>
              <span style={{ fontSize: 11, color: "rgba(212,175,55,0.3)" }}>|</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: lang === "tk" ? "#D4AF37" : "rgba(212,175,55,0.4)", cursor: "pointer", transition: "color 0.2s" }} onClick={() => setLang("tk")}>TK</span>
            </div>
            <button className="btn-gold" style={{ padding: "10px 28px", fontSize: 14 }} onClick={onSignIn}>
              {t.landingSignIn}
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero-section">
          {/* Ambient orbs */}
          <div className="orb" style={{ width: 600, height: 600, background: "rgba(212,175,55,0.06)", top: "10%", left: "50%", transform: "translateX(-50%)" }} />
          <div className="orb" style={{ width: 300, height: 300, background: "rgba(255,99,31,0.04)", top: "20%", right: "-5%" }} />

          {/* Logo */}
          <div className="hero-badge" style={{ marginBottom: 32 }}>
            <img
              src="/logo-benei-menashe.png"
              alt="Benei Menashe Calendar"
              style={{
                width: "clamp(220px, 42vw, 340px)",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 32px rgba(212,175,55,0.35))",
                borderRadius: 16,
              }}
            />
          </div>

          {/* H1 */}
          <h1 className="hero-h1" style={{ fontSize: "clamp(32px,6vw,56px)", fontWeight: 800, color: "#F8F6F0", lineHeight: 1.12, letterSpacing: "-.03em", marginBottom: 24, maxWidth: 680 }}>
            {t.landingHero.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
          </h1>

          {/* Subtitle */}
          <p className="hero-sub" style={{ fontSize: "clamp(15px,2vw,18px)", color: "#8fa8c8", lineHeight: 1.7, maxWidth: 440, marginBottom: 44 }}>
            {t.landingSubtitle}
          </p>

          {/* CTA */}
          <div className="hero-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <button className="btn-gold" onClick={onSignIn}>{t.landingSignIn}</button>
            <span style={{ fontSize: 13, color: "#475569" }}>{t.landingFree}</span>
          </div>

          {/* Scroll hint */}
          <div className="hero-scroll scroll-hint" style={{ marginTop: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: .5 }}>
            <span style={{ fontSize: 10, letterSpacing: ".15em", color: "#F8F6F0" }}>{t.landingScroll}</span>
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path d="M8 0 v12 M2 8 l6 6 6-6" stroke="#F8F6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* ── Saipikhup textile band — sits above the Jerusalem skyline ── */}
          <div className="saipikhup-band" style={{ bottom: 236, zIndex: 3 }}>
            <div className="saipikhup-border-top" />
            <div className="saipikhup-border-bottom" />
          </div>

          {/* Jerusalem skyline at bottom of hero */}
          <div className="skyline-wrap" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 240, overflow: "hidden" }}>
            {/* Dark overlay gradient above skyline */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 100, background: "linear-gradient(to bottom, #081120, transparent)", zIndex: 2, pointerEvents: "none" }} />
            <JerusalemSkyline />
            {/* Ground fade */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to bottom, transparent, #081120)", zIndex: 2, pointerEvents: "none" }} />
          </div>

          {/* ── Saipikhup textile band — at the very bottom edge ── */}
          <div className="saipikhup-band" style={{ bottom: 0, zIndex: 3, height: 20, opacity: 0.7 }}>
            <div className="saipikhup-border-top" />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <RevealSection>
          <section style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="gold-line" style={{ marginBottom: 20 }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37", letterSpacing: ".14em", marginBottom: 12 }}>EVERYTHING YOU NEED</p>
              <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: "#F8F6F0", letterSpacing: "-.02em", lineHeight: 1.2 }}>
                Your complete Jewish<br />spiritual companion
              </h2>
            </div>

            <div className="features-grid">
              <FeatureCard
                emoji="🌙"
                title={t.featureZmanimTitle}
                description={t.featureZmanimDesc}
                delay=".1s"
              />
              <FeatureCard
                emoji="📖"
                title={t.featureTorahTitle}
                description={t.featureTorahDesc}
                delay=".2s"
              />
              <FeatureCard
                emoji="🕍"
                title={t.featureCommunityTitle}
                description={t.featureCommunityDesc}
                delay=".3s"
              />
            </div>
          </section>
        </RevealSection>

        {/* ── STATS ── */}
        <RevealSection>
          <section style={{ borderTop: "1px solid rgba(212,175,55,0.1)", borderBottom: "1px solid rgba(212,175,55,0.1)", background: "#0a1628" }}>
            <div className="stats-grid" style={{ maxWidth: 860, margin: "0 auto" }}>
              <StatItem number={54} suffix="" label="Weekly Parashot" />
              <StatItem number={100} suffix="+" label="Holiday Resources" divider />
              <StatItem number={365} suffix="" label="Daily Learning" />
            </div>
          </section>
        </RevealSection>

        {/* ── COMMUNITY MEMORIAL CANDLES ── */}
        {candleEntries.length > 0 && (
          <RevealSection>
            <section style={{ padding: "80px 0 60px", overflow: "hidden" }}>
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div className="gold-line" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", letterSpacing: ".14em", marginBottom: 8 }}>COMMUNITY MEMORIAL</p>
                    <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, color: "#F8F6F0", letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 12 }}>
                      Eternal Flames<br />Burning Together
                    </h2>
                    <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 380 }}>
                      Community members light memorial candles in honour of their loved ones.
                      Torah learners dedicate their study — their names rise in the flame.
                    </p>
                  </div>
                  <button
                    className="btn-gold"
                    style={{ fontSize: 14, padding: "11px 28px", whiteSpace: "nowrap" }}
                    onClick={onSignIn}
                  >
                    🕯 Light a Candle
                  </button>
                </div>
              </div>

              {/* Horizontal scrollable candle row */}
              <div style={{ overflowX: "auto", paddingBottom: 12, WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" }}>
                <div style={{ display: "flex", gap: 14, padding: "0 24px 4px", width: "max-content" }}>
                  {candleEntries.slice(0, 8).map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 20,
                        border: "1px solid rgba(212,175,55,0.12)",
                        padding: "12px 8px 8px",
                      }}
                    >
                      <BurningCandle
                        deceasedName={entry.deceasedName}
                        yahrzeitNumber={candleYahrzeitNum(entry.passingYear)}
                        donorName={entry.donorDisplayName || undefined}
                        learners={entry.learners}
                        isLit={entry.candleLit}
                      />
                    </div>
                  ))}

                  {/* Add candle CTA card */}
                  <div
                    onClick={onSignIn}
                    style={{
                      width: 140, minHeight: 260,
                      borderRadius: 20,
                      border: "1.5px dashed rgba(212,175,55,0.3)",
                      background: "rgba(212,175,55,0.025)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 12, cursor: "pointer", padding: "16px",
                    }}
                  >
                    <div style={{ fontSize: 36 }}>🕯</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37", textAlign: "center", lineHeight: 1.5 }}>
                      Light a Memorial Candle
                    </div>
                    <div style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>Sign in to join</div>
                  </div>
                </div>
              </div>
            </section>
          </RevealSection>
        )}

        {/* ── SIDDUR LIBRARY HIGHLIGHT ── */}
        <RevealSection>
          <section style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ background: "#101B2D", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 24, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
              <div style={{ padding: "48px 40px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 99, padding: "5px 14px", marginBottom: 24 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", letterSpacing: ".1em" }}>NEW · SIDDUR LIBRARY</span>
                </div>
                <h3 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, color: "#F8F6F0", letterSpacing: "-.02em", marginBottom: 16, lineHeight: 1.25 }}>
                  Sacred texts at your<br />fingertips
                </h3>
                <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, maxWidth: 440, marginBottom: 32 }}>
                  Browse our growing library of Siddurim, Tehillim, Torah Portions, and Bnei Menashe prayer books. Read in-app with progress tracking and bookmarks.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
                  {["Siddur", "Tehillim", "Torah Portions", "Kuki Books", "Hebrew Learning"].map(tag => (
                    <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: "#D4AF37", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 99, padding: "5px 14px" }}>{tag}</span>
                  ))}
                </div>
                <button className="btn-gold" style={{ fontSize: 15, padding: "14px 36px" }} onClick={onSignIn}>
                  Explore Library →
                </button>
              </div>
              {/* Book shelf visual */}
              <div style={{ background: "linear-gradient(135deg, #0d1e38 0%, #0a1528 100%)", padding: "40px 40px 0", display: "flex", gap: 12, alignItems: "flex-end", justifyContent: "center", minHeight: 180 }}>
                {[
                  { emoji: "📿", color: "#1a3050", label: "Siddur" },
                  { emoji: "📜", color: "#1e2840", label: "Tehillim" },
                  { emoji: "✡", color: "#152035", label: "Torah" },
                  { emoji: "📚", color: "#1a2a40", label: "Kuki" },
                  { emoji: "🕍", color: "#101e34", label: "Prayers" },
                ].map((b, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: `heroFadeUp .6s ease both`, animationDelay: `${.8 + i * .1}s` }}>
                    <div style={{ width: 48, height: 68, borderRadius: "4px 4px 6px 6px", background: b.color, border: "1px solid rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "3px 4px 16px rgba(0,0,0,0.5)", transform: `rotate(${(i - 2) * 3}deg)` }}>
                      {b.emoji}
                    </div>
                    <span style={{ fontSize: 9, color: "#475569", fontWeight: 600, letterSpacing: ".06em" }}>{b.label.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </RevealSection>

        {/* ── BOTTOM CTA ── */}
        <RevealSection>
          <section style={{ padding: "100px 24px 120px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            {/* Glow */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div className="gold-line" style={{ marginBottom: 24 }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37", letterSpacing: ".14em", marginBottom: 16 }}>START TODAY</p>
            <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, color: "#F8F6F0", letterSpacing: "-.03em", lineHeight: 1.15, marginBottom: 20 }}>
              Begin Your<br />Jewish Journey
            </h2>
            <p style={{ fontSize: 16, color: "#64748b", marginBottom: 44, maxWidth: 380, margin: "0 auto 44px" }}>
              Join the Bnei Menashe community and access every feature — completely free.
            </p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <button className="btn-gold" style={{ fontSize: 18, padding: "18px 56px" }} onClick={onSignIn}>
                Open Calendar
              </button>
              <span style={{ fontSize: 12, color: "#334155" }}>✡ Serving the Bnei Menashe community worldwide</span>
            </div>
          </section>
        </RevealSection>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(212,175,55,0.08)", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#1e3050", fontWeight: 700, letterSpacing: ".1em", marginBottom: 8 }}>✡ BNEI MENASHE</div>
          <div style={{ fontSize: 11, color: "#334155" }}>The Sacred Calendar · לוח השנה</div>
        </footer>
      </div>
    </>
  );
}

/* ─── Stars component ──────────────────────────────────────────── */
function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    top: Math.random() * 60,
    left: Math.random() * 100,
    size: Math.random() > 0.75 ? 2.5 : 1.5,
    dur: 2 + Math.random() * 4,
    delay: Math.random() * 5,
    op: 0.3 + Math.random() * 0.5,
  }));

  return (
    <div className="stars-layer" style={{ height: "100vh", position: "fixed", top: 0, left: 0, right: 0, zIndex: 0, pointerEvents: "none" }}>
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            "--dur": `${s.dur}s`,
            "--delay": `${s.delay}s`,
            "--op": s.op,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Feature card ──────────────────────────────────────────────── */
function FeatureCard({ emoji, title, description, delay }: { emoji: string; title: string; description: string; delay: string }) {
  return (
    <div className="feature-card reveal-child" style={{ animationDelay: delay }}>
      <div className="icon-circle">{emoji}</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F8F6F0", marginBottom: 12, letterSpacing: "-.01em" }}>{title}</h3>
      <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{description}</p>
    </div>
  );
}

/* ─── Stat item ──────────────────────────────────────────────────── */
function StatItem({ number, suffix, label, divider }: { number: number; suffix: string; label: string; divider?: boolean }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", position: "relative", borderLeft: divider ? "1px solid rgba(212,175,55,0.1)" : undefined, borderRight: divider ? "1px solid rgba(212,175,55,0.1)" : undefined }}>
      <div className="stat-num"><Counter to={number} suffix={suffix} /></div>
      <div style={{ fontSize: 13, color: "#475569", fontWeight: 600, marginTop: 8, letterSpacing: ".04em" }}>{label}</div>
    </div>
  );
}

/* ─── Reveal section (IntersectionObserver) ─────────────────────── */
function RevealSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  );
}
