import { useLanguage } from "../context/LanguageContext";

interface Props { onClose: () => void; }

export { APP_VERSION, VERSION_KEY } from "./whatsNewVersion";

interface ReleaseItem {
  icon: string;
  en: string;
  tk: string;
}

interface ReleaseSection {
  headingEn: string;
  headingTk: string;
  items: ReleaseItem[];
}

const SECTIONS: ReleaseSection[] = [
  {
    headingEn: "Sacred Calendar",
    headingTk: "Thu Thianghlim Ni Sawi",
    items: [
      { icon: "📆", en: "Hebrew & Gregorian calendar — full month view with holidays marked", tk: "Hebrew leh Gregorian ni sawi — holiday zawng zawng mark a ni" },
      { icon: "🕍", en: "Parashah of the week with deep commentary and Bnei Menashe insights", tk: "Khin Parashah — commentary leh Bnei Menashe insights nena" },
      { icon: "📖", en: "Daf Yomi — today's Talmud page tracked automatically", tk: "Daf Yomi — nitin Talmud page automatic in zirchhuak" },
      { icon: "🕎", en: "All Jewish holidays with candle lighting & Havdalah times", tk: "Jewish holiday zawng zawng — kerhi khawng leh Havdalah hun nena" },
    ],
  },
  {
    headingEn: "Zmanim — Prayer Times",
    headingTk: "Zmanim — Thupha Hun",
    items: [
      { icon: "🌅", en: "Precise prayer times calculated for your exact location", tk: "Na hmun takah thupha hun man tak tak lo siam" },
      { icon: "📍", en: "Location picker — choose from 170+ cities worldwide", tk: "Hmun thlang — ram tinah mipil khua 170+ atangin thlang theih" },
      { icon: "🌙", en: "Shabbat mode — candle lighting and Havdalah countdown", tk: "Shabbat mode — kerhi khawng leh Havdalah hun zawng zawng" },
    ],
  },
  {
    headingEn: "Rav Menashe AI",
    headingTk: "Rav Menashe AI",
    items: [
      { icon: "🤖", en: "AI scholar with deep knowledge of Torah, halacha, and Bnei Menashe history", tk: "AI hrilhriat tur — Torah, halacha leh Bnei Menashe history hriat" },
      { icon: "⚡", en: "Streaming answers — responses appear word by word in real time", tk: "Streaming — chhanna zawng zawng real time-ah lang" },
      { icon: "🔄", en: "Triple-provider fallback — always available via OpenAI, Gemini, or Grok", tk: "Provider thumna — OpenAI, Gemini, Grok atangin a awlsam" },
      { icon: "🌐", en: "Answers in both English and Thadou Kuki", tk: "English leh Thadou Kuki-ah chhanna pek" },
    ],
  },
  {
    headingEn: "Memorial Sanctuary",
    headingTk: "Thi Ni Hmang Lam",
    items: [
      { icon: "🕯️", en: "3D Memorial Sanctuary — walk through a living world of remembrance", tk: "3D Sanctuary — thi ni hmang lam-ah zawng zawng kal theih" },
      { icon: "🌸", en: "Light virtual candles and leave tributes for loved ones", tk: "Virtual kerhi kan rawh leh ngaih thlak thu sawi theih" },
      { icon: "👨‍👩‍👧", en: "Family trees and memorial profiles for every member", tk: "Hnam khaw leh member pakhat pakhat memorial profile" },
      { icon: "🔍", en: "Memorial browser — search and discover the community's remembrance", tk: "Memorial browser — mipil thi ni hmang zawng zawng en theih" },
    ],
  },
  {
    headingEn: "Community Tools",
    headingTk: "Mipil Thil",
    items: [
      { icon: "📣", en: "Community announcements — pinned and broadcast messages", tk: "Mipil thupek — pin leh broadcast zawng zawng" },
      { icon: "🙏", en: "Prayer Board — share and upvote prayer requests", tk: "Thu Dawt Hmang — thu dawt pe leh support pek" },
      { icon: "👥", en: "Member directory — browse community members", tk: "Member lehkhabu — mipil zawng zawng en theih" },
      { icon: "📊", en: "Community census for registration and outreach", tk: "Mipil census — registration leh outreach" },
    ],
  },
  {
    headingEn: "Siddur Library",
    headingTk: "Siddur Lehkhabu",
    items: [
      { icon: "📚", en: "Sacred texts, prayer books, and Bnei Menashe community publications", tk: "Thu thianghlim, thupha lehkhabu leh Bnei Menashe lehkhabu" },
      { icon: "🔎", en: "Search and filter by category — find any text instantly", tk: "Zawn leh sort — text zawng zawng chiang taka zawn theih" },
      { icon: "👑", en: "Premium library — unlock exclusive texts with a 7-day free trial", tk: "Premium lehkhabu — 7 ni free trial nena hawng theih" },
    ],
  },
  {
    headingEn: "App & Platform",
    headingTk: "App leh Platform",
    items: [
      { icon: "📲", en: "Install to home screen — works like a native app on any device", tk: "Home screen-ah chhuang — device dang tinah native app ang in hman theih" },
      { icon: "📴", en: "Offline mode — calendar, Zmanim, and Siddur work without internet", tk: "Internet boh nge'n — calendar, Zmanim leh Siddur hman theih" },
      { icon: "🌐", en: "Fully bilingual — English and Thadou Kuki throughout the entire app", tk: "Bilingual chanvo — English leh Thadou Kuki app zawng zawng-ah" },
      { icon: "🌗", en: "Light and dark themes — comfortable in any light", tk: "Light leh dark theme — hun tinah comfortable" },
    ],
  },
];

export default function WhatsNewModal({ onClose }: Props) {
  const { t, lang } = useLanguage();

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9200,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "min(92vw, 700px)",
          maxHeight: "88dvh",
          borderRadius: "24px 24px 0 0",
          background: "linear-gradient(180deg, #111827 0%, #0d1320 100%)",
          border: "1.5px solid rgba(212,175,55,0.35)",
          borderBottom: "none",
          boxShadow: "0 -12px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.08)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Gold accent bar */}
        <div style={{ height: 3, flexShrink: 0, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.9) 30%, rgba(255,235,120,1) 50%, rgba(212,175,55,0.9) 70%, transparent)" }} />

        {/* Header */}
        <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: "linear-gradient(135deg, #1e2e10, #0f1e12)",
            border: "1.5px solid rgba(212,175,55,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 23,
          }}>✨</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#F5D982", lineHeight: 1.2 }}>
                {t.whatsNewTitle}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                padding: "2px 8px", borderRadius: 20,
                background: "linear-gradient(135deg, #b8860b, #d4a843)",
                color: "#1a0f00",
              }}>
                v1.0
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(245,240,232,0.5)", marginTop: 2 }}>
              {lang === "tk"
                ? "Thoklang public launch — thar zawng zawng"
                : "First public launch — everything that's here"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)", border: "none",
              color: "rgba(245,240,232,0.5)", fontSize: 18, lineHeight: 1,
              borderRadius: 8, padding: "6px 9px", cursor: "pointer", flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable sections */}
        <div style={{ overflowY: "auto", padding: "0 22px 8px", display: "flex", flexDirection: "column", gap: 20 }}>
          {SECTIONS.map((section, si) => (
            <div key={si}>
              {/* Section heading */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "rgba(212,175,55,0.7)",
                }}>
                  {lang === "tk" ? section.headingTk : section.headingEn}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.12)" }} />
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {section.items.map((item, ii) => (
                  <div key={ii} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <span style={{
                      fontSize: 16, lineHeight: 1,
                      width: 26, flexShrink: 0, textAlign: "center",
                      marginTop: 1,
                    }}>
                      {item.icon}
                    </span>
                    <span style={{
                      fontSize: 13, lineHeight: 1.5,
                      color: "rgba(245,240,232,0.85)",
                    }}>
                      {lang === "tk" ? item.tk : item.en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom padding so last section isn't flush against CTA */}
          <div style={{ height: 4 }} />
        </div>

        {/* CTA */}
        <div style={{ padding: "12px 22px 28px", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #b8860b, #d4a843, #f0c96a)",
              color: "#1a0f00", fontSize: 15, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(212,168,67,0.35)",
            }}
          >
            {t.whatsNewGotIt}
          </button>
        </div>
      </div>
    </div>
  );
}
