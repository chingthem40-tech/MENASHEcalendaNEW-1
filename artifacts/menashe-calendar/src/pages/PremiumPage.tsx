import { useState, memo } from "react";
import { GOLD, GOLD_GRAD } from "../lib/theme";

interface PremiumPageProps {
  onUpgrade: () => void;
  onBack?: () => void;
  isPremium?: boolean;
}
const DARK_CARD = "rgba(212,168,67,0.06)";
const BORDER_GOLD = "rgba(212,168,67,0.25)";

/* ── Icons ── */
function CrownIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 20h20M4 20l2-8 6 4 6-4 2 8" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="4" cy="10" r="1.5" fill={GOLD} />
      <circle cx="12" cy="6" r="1.5" fill={GOLD} />
      <circle cx="20" cy="10" r="1.5" fill={GOLD} />
    </svg>
  );
}

function CheckIcon({ color = "#4ade80", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? GOLD : "none"} stroke={GOLD} strokeWidth="1.5">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ── Data ── */
const STATS = [
  { value: "9,200+", label: "Families" },
  { value: "12", label: "Aliyah Waves" },
  { value: "40+", label: "Zmanim Daily" },
  { value: "500+", label: "Prayer Texts" },
];

const COMPARE_ROWS = [
  { feature: "Hebrew & Gregorian Calendar", free: true, premium: true },
  { feature: "Basic Zmanim (Sunrise/Sunset)", free: true, premium: true },
  { feature: "Weekly Parasha Summary", free: true, premium: true },
  { feature: "Community Announcements", free: true, premium: true },
  { feature: "Basic Prayer Library", free: true, premium: true },
  { feature: "All 15+ Daily Halachic Times", free: false, premium: true },
  { feature: "Live Zmanim Countdown", free: false, premium: true },
  { feature: "Custom Push Alerts for Zmanim", free: false, premium: true },
  { feature: "Full Daf Yomi with Commentary", free: false, premium: true },
  { feature: "Mishna Yomit & Halacha Yomit", free: false, premium: true },
  { feature: "AI Holiday Insights (Bnei Menashe)", free: false, premium: true },
  { feature: "Audio Prayers (Bnei Menashe Nusach)", free: false, premium: true },
  { feature: "Tahara & Mikveh Calculator", free: false, premium: true },
  { feature: "Multi-Year Calendar (20 yrs)", free: false, premium: true },
  { feature: "Export to PDF / iCal / Google Cal", free: false, premium: true },
  { feature: "Community Census & Family Trees", free: false, premium: true },
  { feature: "Aliyah Wave Statistics & Maps", free: false, premium: true },
  { feature: "Premium Siddur Library (PRO books)", free: false, premium: true },
];

const FEATURES = [
  {
    icon: "⏰",
    title: "All 15+ Daily Zmanim",
    badge: "Alerts",
    color: "#fbbf24",
    description: "Every halachic time, precise to your GPS location — with live countdowns and custom push alerts so you never miss Alot HaShachar, Misheyakir, Chatzot, or Tzet HaKochavim.",
    bullets: ["15+ prayer times daily", "Live countdown timer", "Custom alerts per day of week", "All Bnei Menashe locations"],
    preview: [
      { label: "Alot HaShachar", value: "5:04 AM", icon: "🌅" },
      { label: "Misheyakir", value: "5:31 AM", icon: "🌄" },
      { label: "Chatzot", value: "12:38 PM", icon: "☀️" },
      { label: "Tzet HaKochavim", value: "7:52 PM", icon: "🌟" },
    ],
  },
  {
    icon: "📖",
    title: "Daily Torah Study Tracks",
    badge: "Daily",
    color: "#4ade80",
    description: "Full Daf Yomi, Mishna Yomit, and Halacha Yomit — with Bnei Menashe commentary showing the unique spiritual journey of the Lost Tribe's return to Israel.",
    bullets: ["Daf Yomi with English translation", "Mishna Yomit daily cycle", "Halacha Yomit (practical law)", "Bnei Menashe insights on every Parasha"],
    preview: [
      { label: "Daf Yomi", value: "Bava Kamma 47b", icon: "📜" },
      { label: "Halacha", value: "Hilchot Shabbat §302", icon: "⚖️" },
      { label: "Mishna", value: "Avot 3:14", icon: "📚" },
      { label: "Streak", value: "14 days 🔥", icon: "🏆" },
    ],
  },
  {
    icon: "✨",
    title: "AI Holiday Insights",
    badge: "AI",
    color: "#a78bfa",
    description: "Every Yom Tov and fast day comes alive with deep spiritual themes, historical context, and exclusive Bnei Menashe traditions — powered by advanced AI trained on authentic sources.",
    bullets: ["Unique Bnei Menashe traditions per holiday", "Spiritual themes and kavannot", "Historical connections to Manipur & Israel", "AI-generated divrei Torah"],
    preview: [
      { label: "Next Holiday", value: "Shavuot", icon: "🌾" },
      { label: "Theme", value: "Revelation & Acceptance", icon: "⚡" },
      { label: "BM Connection", value: "The Lost Tribe's Return", icon: "✡️" },
      { label: "Special Minhag", value: "Flower-decoration tradition", icon: "🌸" },
    ],
  },
  {
    icon: "🎙",
    title: "Audio Prayer Guides",
    badge: "Audio",
    color: "#f472b6",
    description: "Complete recordings of Shacharit, Mincha, Ma'ariv, Kabbalat Shabbat, and special holiday services — in the authentic Bnei Menashe nusach so you can follow along perfectly.",
    bullets: ["Shacharit (45 min complete)", "Kabbalat Shabbat & Ma'ariv", "All Yom Tov musaf services", "Kiddush & Havdalah recordings"],
    preview: [
      { label: "Shacharit", value: "45:12", icon: "🎵" },
      { label: "Kabbalat Shabbat", value: "28:47", icon: "🕯" },
      { label: "Kol Nidre", value: "1:02:33", icon: "🎶" },
      { label: "Hallel", value: "18:24", icon: "🎼" },
    ],
  },
  {
    icon: "📅",
    title: "Multi-Year Hebrew Calendar",
    badge: "Export",
    color: GOLD,
    description: "Plan Bar Mitzvahs, weddings, community events and family milestones years ahead. Export to PDF, iCal, or Google Calendar with all Hebrew dates and holidays pre-filled.",
    bullets: ["20-year range (5780–5800)", "Export to PDF, iCal, Google Cal", "Custom event annotations", "Bar/Bat Mitzvah date calculator"],
    preview: [
      { label: "Next 3 Yom Tovs", value: "Shavuot → Rosh Hashana → Yom Kippur", icon: "📆" },
      { label: "Export", value: "PDF · iCal · Google", icon: "📤" },
      { label: "Custom Events", value: "Unlimited", icon: "✏️" },
      { label: "Range", value: "5780 – 5800", icon: "🗓" },
    ],
  },
  {
    icon: "💧",
    title: "Tahara & Mikveh Tools",
    badge: "Private",
    color: "#38bdf8",
    description: "A private, secure purity cycle calculator built on the Shulchan Aruch, with Bnei Menashe halachic guidance. Tracks dates, reminds for mikveh nights, and answers common questions.",
    bullets: ["Cycle tracking with reminders", "Shulchan Aruch based calculations", "Bnei Menashe halachic notes", "Completely private & secure"],
    preview: [
      { label: "Next Mikveh", value: "In 9 days", icon: "💧" },
      { label: "Hefsek Tahara", value: "Reminder set", icon: "🔔" },
      { label: "Cycle History", value: "Private log", icon: "🔒" },
      { label: "Halachic Q&A", value: "5 answers", icon: "❓" },
    ],
  },
  {
    icon: "📊",
    title: "Community Census & History",
    badge: "Data",
    color: "#34d399",
    description: "Explore the full demographic story of Bnei Menashe — family trees, 12 waves of aliyah, settlement patterns across Israel, and historical records of the community's journey.",
    bullets: ["9,200+ registered families", "12 aliyah waves since 1994", "City-by-city settlement maps", "Family tree builder"],
    preview: [
      { label: "Total Families", value: "9,200+ registered", icon: "👨‍👩‍👧‍👦" },
      { label: "In Israel", value: "~4,800 families", icon: "🇮🇱" },
      { label: "Aliyah Waves", value: "12 since 1994", icon: "✈️" },
      { label: "Cities", value: "Jerusalem · Haifa · Modi'in", icon: "🏙" },
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Shalom Haokip",
    location: "Churachandpur, Manipur",
    text: "The Daf Yomi feature changed my daily routine. I learn every morning with the Bnei Menashe commentary — it shows me exactly how our tradition connects to the Talmud.",
    stars: 5,
    avatar: "🧔",
  },
  {
    name: "Rivka Lhungdim",
    location: "Jerusalem, Israel",
    text: "As a mother planning my son's Bar Mitzvah, the multi-year calendar was worth every rupee. I could see the exact Hebrew date three years ahead and export it instantly.",
    stars: 5,
    avatar: "👩",
  },
  {
    name: "Menashe Kipgen",
    location: "Haifa, Israel",
    text: "The audio prayers in the Bnei Menashe nusach finally let me daven correctly. My grandfather's traditions are preserved here in a way I never thought possible.",
    stars: 5,
    avatar: "👴",
  },
];

const PLANS = [
  {
    id: "monthly",
    title: "Monthly",
    priceINR: "₹199",
    priceUSD: "$2.99",
    period: "/ month",
    perMonth: "₹199",
    perks: ["Cancel anytime", "All features unlocked", "UPI & card accepted"],
    popular: false,
    savings: null,
  },
  {
    id: "annual",
    title: "Annual",
    priceINR: "₹999",
    priceUSD: "$11.99",
    period: "/ year",
    perMonth: "₹83",
    perks: ["Best value — save 58%", "Priority support", "All features unlocked"],
    popular: true,
    savings: "Save ₹1,389/yr",
  },
];

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: GOLD, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function FeatureRow({ icon, label, hasFree, hasPremium }: { icon: string; label: string; hasFree: boolean; hasPremium: boolean }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 48px 68px",
      alignItems: "center", padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ fontSize: 12, color: hasFree ? "var(--foreground)" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 7 }}>
        <span>{icon}</span>{label}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {hasFree ? <CheckIcon color="#4ade80" size={13} /> : <XIcon />}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {hasPremium ? <CheckIcon color={GOLD} size={13} /> : <XIcon />}
      </div>
    </div>
  );
}

function FeatureCard({ feature, index, onUpgrade }: { feature: typeof FEATURES[0]; index: number; onUpgrade: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        borderRadius: 16,
        background: DARK_CARD,
        border: `1px solid ${BORDER_GOLD}`,
        overflow: "hidden",
        marginBottom: 12,
        boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
        animation: `fadeSlideUp 0.4s ease ${index * 0.05}s both`,
        cursor: "pointer",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${feature.color}18`, border: `1.5px solid ${feature.color}35`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>
          {feature.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{feature.title}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase",
              background: `${feature.color}22`, color: feature.color, border: `1px solid ${feature.color}40`,
              borderRadius: 5, padding: "2px 6px",
            }}>{feature.badge}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.45 }}>{feature.description}</div>
        </div>
        <div style={{
          flexShrink: 0, fontSize: 12, color: "var(--muted-foreground)",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s",
          marginTop: 2,
        }}>▾</div>
      </div>

      {/* Bullets */}
      {expanded && (
        <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {feature.bullets.map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: `${feature.color}10`, border: `1px solid ${feature.color}30`,
              borderRadius: 8, padding: "4px 9px",
            }}>
              <CheckIcon color={feature.color} size={11} />
              <span style={{ fontSize: 11, color: "var(--foreground)", fontWeight: 600 }}>{b}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview rows — blurred */}
      <div style={{
        margin: "0 12px 12px",
        borderRadius: 10, overflow: "hidden",
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
      }}>
        {feature.preview.map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "7px 11px",
            borderBottom: i < feature.preview.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 5 }}>
              <span>{row.icon}</span>{row.label}
            </span>
            <span style={{ fontSize: 11, color: "var(--foreground)", fontWeight: 600, filter: "blur(4px)", userSelect: "none" }}>{row.value}</span>
          </div>
        ))}
        {/* Lock overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(8,14,26,0.5)", backdropFilter: "blur(1px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 10,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: GOLD_GRAD, color: "#1a0f00",
              border: "none", borderRadius: 8, padding: "7px 16px",
              fontWeight: 800, fontSize: 12, cursor: "pointer",
              boxShadow: "0 2px 12px rgba(212,168,67,0.35)",
            }}
          >
            <LockIcon />
            Unlock Premium
          </button>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div style={{
      flexShrink: 0, width: 260, padding: "16px",
      borderRadius: 14, background: DARK_CARD, border: `1px solid ${BORDER_GOLD}`,
    }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {Array.from({ length: t.stars }).map((_, i) => <StarIcon key={i} />)}
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6, margin: "0 0 12px", fontStyle: "italic" }}>
        "{t.text}"
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(212,168,67,0.15)", border: `1px solid ${BORDER_GOLD}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>{t.avatar}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{t.name}</div>
          <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{t.location}</div>
        </div>
      </div>
    </div>
  );
}

/* ── compare row icons ── */
const COMPARE_ICONS: Record<string, string> = {
  "Hebrew & Gregorian Calendar": "🗓",
  "Basic Zmanim (Sunrise/Sunset)": "🌅",
  "Weekly Parasha Summary": "📜",
  "Community Announcements": "📢",
  "Basic Prayer Library": "📕",
  "All 15+ Daily Halachic Times": "⏰",
  "Live Zmanim Countdown": "⏱",
  "Custom Push Alerts for Zmanim": "🔔",
  "Full Daf Yomi with Commentary": "📖",
  "Mishna Yomit & Halacha Yomit": "⚖️",
  "AI Holiday Insights (Bnei Menashe)": "✨",
  "Audio Prayers (Bnei Menashe Nusach)": "🎙",
  "Tahara & Mikveh Calculator": "💧",
  "Multi-Year Calendar (20 yrs)": "📅",
  "Export to PDF / iCal / Google Cal": "📤",
  "Community Census & Family Trees": "📊",
  "Aliyah Wave Statistics & Maps": "🗺",
  "Premium Siddur Library (PRO books)": "📚",
};

const PremiumPage = memo(function PremiumPage({ onUpgrade, onBack, isPremium = false }: PremiumPageProps) {
  const [showAllCompare, setShowAllCompare] = useState(false);
  const visibleCompare = showAllCompare ? COMPARE_ROWS : COMPARE_ROWS.slice(0, 9);

  return (
    <div style={{ minHeight: "100%", overflowY: "auto", background: "var(--background)", paddingBottom: 110 }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(212,168,67,0); }
        }
        @keyframes glow-crown {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(212,168,67,0.4)); }
          50% { filter: drop-shadow(0 0 18px rgba(212,168,67,0.8)); }
        }
        .premium-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .premium-scroll::-webkit-scrollbar { display: none; }
        .upgrade-btn:active { transform: scale(0.97); }
      `}</style>

      {/* ── Sticky Header ── */}
      {onBack && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px 12px",
          borderBottom: "1px solid rgba(212,168,67,0.12)",
          background: "var(--background)",
          position: "sticky", top: 0, zIndex: 20,
          backdropFilter: "blur(12px)",
        }}>
          <button onClick={onBack} style={{
            background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)",
            borderRadius: 10, width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: GOLD, flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)" }}>Menashe Premium</div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Sacred Calendar · Complete Edition</div>
          </div>
          <div style={{ animation: "glow-crown 2.5s ease-in-out infinite" }}>
            <CrownIcon size={24} />
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{
        padding: "32px 20px 26px",
        background: "linear-gradient(180deg, rgba(212,168,67,0.14) 0%, rgba(212,168,67,0.04) 60%, transparent 100%)",
        borderBottom: "1px solid rgba(212,168,67,0.12)",
        textAlign: "center",
        animation: "fadeSlideUp 0.3s ease both",
      }}>
        {/* Crown badge */}
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: "radial-gradient(circle at 38% 30%, rgba(212,168,67,0.25) 0%, rgba(212,168,67,0.05) 100%)",
          border: "1.5px solid rgba(212,168,67,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px",
          boxShadow: "0 6px 30px rgba(212,168,67,0.2)",
          animation: "glow-crown 3s ease-in-out infinite",
        }}>
          <CrownIcon size={34} />
        </div>

        {/* Label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10,
          background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)",
          borderRadius: 99, padding: "4px 14px",
        }}>
          <StarIcon />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase" }}>
            Menashe Premium
          </span>
          <StarIcon />
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 900, margin: "0 0 10px",
          background: GOLD_GRAD,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          lineHeight: 1.15, letterSpacing: "-0.02em",
        }}>
          The Complete Sacred<br />Calendar for Bnei Menashe
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: "0 0 22px", lineHeight: 1.6, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
          Every tool your community needs — Torah learning, Zmanim alerts, audio prayers, community history, and more.
        </p>

        {/* Community stats strip */}
        <div style={{
          display: "flex", justifyContent: "space-around", marginBottom: 22,
          padding: "14px 10px",
          background: "rgba(0,0,0,0.3)", borderRadius: 14,
          border: "1px solid rgba(212,168,67,0.15)",
        }}>
          {STATS.map((s) => <StatBadge key={s.label} {...s} />)}
        </div>

        {/* Plan selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {PLANS.map((plan) => (
            <div key={plan.id} style={{
              flex: 1, borderRadius: 16, padding: "14px 10px 12px",
              background: plan.popular ? "rgba(212,168,67,0.1)" : "rgba(255,255,255,0.03)",
              border: plan.popular ? "1.5px solid rgba(212,168,67,0.55)" : "1px solid rgba(255,255,255,0.08)",
              position: "relative",
              animation: plan.popular ? "pulse-gold 2.8s ease-in-out infinite" : "none",
            }}>
              {plan.popular && (
                <div style={{
                  position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                  background: GOLD_GRAD, color: "#1a0f00",
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.08em",
                  padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap",
                }}>
                  ✦ BEST VALUE
                </div>
              )}
              <div style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{plan.title}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "center", marginBottom: 1 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: plan.popular ? GOLD : "var(--foreground)" }}>{plan.priceINR}</span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{plan.period}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginBottom: 8 }}>≈ {plan.priceUSD}{plan.period}</div>
              {plan.popular && (
                <div style={{
                  fontSize: 10, fontWeight: 800, color: "#4ade80",
                  background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
                  borderRadius: 6, padding: "2px 8px", marginBottom: 8,
                }}>
                  {plan.savings}
                </div>
              )}
              {plan.perks.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2, justifyContent: "center" }}>
                  <CheckIcon color={plan.popular ? GOLD : "#4ade80"} size={10} />
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{p}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <button
          className="upgrade-btn"
          onClick={onUpgrade}
          style={{
            width: "100%", padding: "16px 24px",
            background: GOLD_GRAD, color: "#1a0f00",
            border: "none", borderRadius: 14, cursor: "pointer",
            fontWeight: 900, fontSize: 16, letterSpacing: "0.01em",
            boxShadow: "0 6px 24px rgba(212,168,67,0.4), 0 2px 0 rgba(100,70,5,0.6)",
            transition: "transform 0.1s",
          }}
        >
          ✦ Start 7-Day Free Trial
        </button>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span>🔒 Secure</span>
          <span>·</span>
          <span>Cancel anytime</span>
          <span>·</span>
          <span>UPI & cards accepted</span>
        </div>
      </div>

      {/* ── Free vs Premium Comparison ── */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Free vs Premium
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
        </div>

        <div style={{
          borderRadius: 16, overflow: "hidden",
          border: `1px solid ${BORDER_GOLD}`,
          background: DARK_CARD,
        }}>
          {/* Column headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 48px 68px",
            padding: "10px 14px",
            background: "rgba(212,168,67,0.1)",
            borderBottom: `1px solid ${BORDER_GOLD}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Feature</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Free</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, textAlign: "center" }}>Premium</div>
          </div>

          <div style={{ padding: "4px 14px 8px" }}>
            {visibleCompare.map((row) => (
              <FeatureRow
                key={row.feature}
                icon={COMPARE_ICONS[row.feature] || "•"}
                label={row.feature}
                hasFree={row.free}
                hasPremium={row.premium}
              />
            ))}
          </div>

          {!showAllCompare && (
            <button
              onClick={() => setShowAllCompare(true)}
              style={{
                width: "100%", padding: "12px",
                background: "rgba(212,168,67,0.06)",
                border: "none", borderTop: `1px solid ${BORDER_GOLD}`,
                color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              See all {COMPARE_ROWS.length} features ▾
            </button>
          )}
        </div>
      </div>

      {/* ── Feature Deep-Dives ── */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            What's Included
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center", marginBottom: 14 }}>
          Tap any feature to expand details
        </div>
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} feature={f} index={i} onUpgrade={onUpgrade} />
        ))}
      </div>

      {/* ── Testimonials horizontal scroll ── */}
      <div style={{ paddingTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Community Reviews
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
        </div>
        <div className="premium-scroll" style={{ display: "flex", gap: 10, padding: "2px 16px 4px" }}>
          {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} t={t} />)}
        </div>
      </div>

      {/* ── Why Premium is worth it ── */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Why Upgrade?
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(212,168,67,0.15)" }} />
        </div>

        {[
          { icon: "🕍", title: "Built for Bnei Menashe", body: "Every feature is designed with the Bnei Menashe tradition in mind — from audio prayers in the authentic nusach to AI insights connecting holidays to the community's journey from Manipur to Israel." },
          { icon: "📡", title: "Always Up to Date", body: "Zmanim are calculated live for your exact GPS location. Torah content updates daily. Holiday insights are refreshed every year. You always have the right information." },
          { icon: "🔒", title: "Private & Secure", body: "Tahara tools and personal calendar data are stored privately. No tracking, no ads. Your sacred practice stays between you and HaShem." },
          { icon: "💰", title: "Less than a Cup of Coffee", body: "At ₹83/month on the annual plan, Premium costs less than a single cup of coffee — yet it powers your entire Jewish observance for the year." },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, padding: "14px 16px",
            background: DARK_CARD, border: `1px solid ${BORDER_GOLD}`,
            borderRadius: 14, marginBottom: 10,
            animation: `fadeSlideUp 0.4s ease ${i * 0.06}s both`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55 }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={{
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(212,168,67,0.12) 0%, rgba(212,168,67,0.04) 100%)",
          border: `1.5px solid ${BORDER_GOLD}`,
          padding: "22px 18px",
          textAlign: "center",
        }}>
          <div style={{ animation: "glow-crown 3s ease-in-out infinite", display: "inline-block", marginBottom: 12 }}>
            <CrownIcon size={32} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--foreground)", marginBottom: 6 }}>Ready to unlock everything?</div>
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 18, lineHeight: 1.55 }}>
            Join thousands of Bnei Menashe families who use Premium to live a fuller, more connected Jewish life.
          </div>

          <RequestAccessButton />
        </div>
      </div>
    </div>
  );
});

export default PremiumPage;

const UPI_ID = import.meta.env.VITE_UPI_ID ?? "menashepay@upi";

function RequestAccessButton() {
  const [status, setStatus] = useState<"idle" | "payment" | "form" | "submitting" | "done" | "pending" | "approved" | "denied">("idle");
  const [note, setNote] = useState("");
  const [paidViaUpi, setPaidViaUpi] = useState(false);
  const userId: string = (window as any).Clerk?.user?.id ?? "";

  // Check if a request already exists on mount
  useState(() => {
    if (!userId) return;
    (async () => {
      try {
        const token = await (window as any).Clerk?.session?.getToken();
        const res = await fetch("/api/premium/my-request", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.status === "pending") setStatus("pending");
          else if (data?.status === "approved") setStatus("approved");
          else if (data?.status === "denied") setStatus("denied");
        }
      } catch { /* silent */ }
    })();
  });

  async function submit() {
    if (!userId) return;
    setStatus("submitting");
    try {
      const token = await (window as any).Clerk?.session?.getToken();
      const res = await fetch("/api/premium/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note }),
      });
      if (res.ok) setStatus("done");
      else setStatus("form");
    } catch {
      setStatus("form");
    }
  }

  if (status === "approved") {
    return (
      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", marginBottom: 10 }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80", marginBottom: 4 }}>You have been approved!</div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Reload the app to access your Premium features.</div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 10 }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>📬</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", marginBottom: 4 }}>Request not approved</div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 10 }}>Please contact a community leader for more information.</div>
        <button
          onClick={() => setStatus("form")}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Re-submit Request
        </button>
      </div>
    );
  }

  if (status === "pending" || status === "done") {
    return (
      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)", marginBottom: 10 }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>⏳</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#d4a843", marginBottom: 4 }}>Request submitted!</div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>A community leader will review and approve your access — usually within 24 hours. You'll see your Premium unlock next time you open the app.</div>
      </div>
    );
  }

  if (status === "payment") {
    return (
      <div style={{ borderRadius: 14, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(212,168,67,0.3)", padding: "18px", marginBottom: 10, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 22 }}>💳</span>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#d4a843", letterSpacing: "0.05em" }}>PAY ₹1,000 FOR PREMIUM</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14, lineHeight: 1.7 }}>
          Send ₹1,000 via UPI to the address below. After payment, tap <strong style={{ color: "#d4a843" }}>"I've Paid"</strong> to submit your request — we'll verify and activate Premium within a few hours.
        </div>
        <div style={{
          background: "rgba(212,168,67,0.08)", border: "1px dashed rgba(212,168,67,0.35)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 14,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.06em", marginBottom: 4 }}>UPI ID</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#d4a843", letterSpacing: "0.04em", marginBottom: 8 }}>{UPI_ID}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.06em", marginBottom: 4 }}>AMOUNT</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>₹1,000</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 14, lineHeight: 1.6 }}>
          💡 Add your <strong>name + "Menashe Premium"</strong> in the payment note so we can identify your transaction.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setStatus("idle")}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >← Back</button>
          <button
            onClick={() => { setPaidViaUpi(true); setNote("Paid ₹1,000 via UPI to " + UPI_ID); setStatus("form"); }}
            style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: GOLD_GRAD, color: "#1a0f00", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
          >✓ I've Paid — Submit Request</button>
        </div>
      </div>
    );
  }

  if (status === "form" || status === "submitting") {
    return (
      <div style={{ borderRadius: 14, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(212,168,67,0.2)", padding: "14px", marginBottom: 10, textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#d4a843", letterSpacing: "0.06em", marginBottom: 8 }}>
          {paidViaUpi ? "CONFIRM PAYMENT REQUEST" : "REQUEST PREMIUM ACCESS"}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 12, lineHeight: 1.6 }}>
          {paidViaUpi
            ? "We'll verify your ₹1,000 UPI payment and activate Premium within a few hours."
            : "A community leader will review and approve your access, usually within 24 hours."}
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
          {paidViaUpi ? "PAYMENT NOTE" : "NOTE (optional) — your congregation, city, or reason"}
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Member of Churachandpur community, Manipur…"
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 9, resize: "none",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,168,67,0.25)",
            color: "var(--foreground)", fontSize: 13, outline: "none", boxSizing: "border-box" as const,
            lineHeight: 1.5,
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={() => { setStatus(paidViaUpi ? "payment" : "idle"); }}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={status === "submitting"}
            style={{
              flex: 2, padding: "11px", borderRadius: 10, border: "none", cursor: status === "submitting" ? "default" : "pointer",
              background: GOLD_GRAD, color: "#1a0f00", fontSize: 13, fontWeight: 800,
              opacity: status === "submitting" ? 0.7 : 1,
            }}
          >
            {status === "submitting" ? "Submitting…" : paidViaUpi ? "✦ Confirm Payment Request" : "✦ Submit Request"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        className="upgrade-btn"
        onClick={() => setStatus("payment")}
        style={{
          width: "100%", padding: "16px 24px",
          background: GOLD_GRAD, color: "#1a0f00",
          border: "none", borderRadius: 14, cursor: "pointer",
          fontWeight: 900, fontSize: 16,
          boxShadow: "0 6px 24px rgba(212,168,67,0.4), 0 2px 0 rgba(100,70,5,0.6)",
          transition: "transform 0.1s", marginBottom: 10,
        }}
      >
        💳 Pay ₹1,000 for Premium
      </button>
      <button
        onClick={() => setStatus("form")}
        style={{
          width: "100%", padding: "13px 24px",
          background: "transparent", color: "#d4a843",
          border: "1px solid rgba(212,168,67,0.35)", borderRadius: 14, cursor: "pointer",
          fontWeight: 700, fontSize: 14, marginBottom: 10,
        }}
      >
        ✦ Request Free Access (Owner Approval)
      </button>
      <div style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
        <span>✓ Community reviewed</span>
        <span>✓ Approved within 24hrs</span>
        <span>✓ Pay ₹1,000 or request free</span>
      </div>
    </>
  );
}
