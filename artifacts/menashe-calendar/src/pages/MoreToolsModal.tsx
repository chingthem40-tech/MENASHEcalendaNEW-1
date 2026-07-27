import { GOLD, GOLD_GRAD } from "../lib/theme";

interface MoreToolsModalProps {
  onClose: () => void;
  onTahara: () => void;
  onYartzeit: () => void;
  onCommunity: () => void;
  onCensus: () => void;
  onSettings: () => void;
  onDafYomi: () => void;
  onBirthday: () => void;
  onOmer: () => void;
  onPrayers: () => void;
  onSefariaSearch: () => void;
  onHebrewDate: () => void;
  onLuach: () => void;
  onMussar: () => void;
  onAnnouncements: () => void;
  onEvents: () => void;
  onMembers: () => void;
  onPrayerBoard: () => void;
  onTorahTracker: () => void;
  isPremium: boolean;
  candleEnabled: boolean;
  onToggleCandle: () => void;
  onShowPremium: () => void;
}

function PremiumBadge() {
  return (
    <span style={{
      fontSize: 8, fontWeight: 900, letterSpacing: "0.08em",
      background: "linear-gradient(90deg, #6b4800, #d4a843)",
      color: "#1a0900", borderRadius: 4,
      padding: "2px 6px", flexShrink: 0,
      whiteSpace: "nowrap",
    }}>
      👑 PRO
    </span>
  );
}

function LockChevron() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.5)" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

export default function MoreToolsModal({
  onClose, onTahara, onYartzeit, onCommunity, onCensus, onSettings, onDafYomi, onBirthday, onOmer, onPrayers, onSefariaSearch, onHebrewDate, onLuach, onMussar, onAnnouncements, onEvents, onMembers, onPrayerBoard, onTorahTracker,
  isPremium, candleEnabled, onToggleCandle, onShowPremium,
}: MoreToolsModalProps) {
  const TOOLS: {
    emoji: string; bg: string; label: string; sub: string;
    action: () => void; premium?: boolean;
  }[] = [
    { emoji: "🕍", bg: "rgba(99,102,241,0.15)",  label: "Prayer Times",         sub: "Shacharit, Mincha & Maariv windows",       action: onPrayers,        premium: true },
    { emoji: "🌾", bg: "rgba(212,168,67,0.15)",  label: "Sefirat HaOmer",       sub: "Daily Omer count & sefirot",               action: onOmer },
    { emoji: "📿", bg: "rgba(124,58,237,0.15)",  label: "Mussar — 48 Ways",     sub: "Daily character-refinement program",        action: onMussar },
    { emoji: "💧", bg: "rgba(59,130,246,0.15)",  label: "Tahara Calculator",    sub: "Purity & Mikveh timing",                   action: onTahara,         premium: true },
    { emoji: "🕯", bg: "rgba(212,168,67,0.15)",  label: "Yahrzeit Calculator",  sub: "Anniversary of passing",                   action: onYartzeit },
    { emoji: "🎂", bg: "rgba(255,99,31,0.15)",   label: "Hebrew Birthday",      sub: "Find your Jewish birthday",                action: onBirthday },
    { emoji: "📚", bg: "rgba(139,92,246,0.15)",  label: "Daf Yomi",             sub: "Today's daily Talmud page",                action: onDafYomi,        premium: true },
    { emoji: "🔍", bg: "rgba(212,168,67,0.15)",  label: "Torah Search",         sub: "Search Sefaria — Torah, Talmud & more",    action: onSefariaSearch },
    { emoji: "📅", bg: "rgba(99,102,241,0.15)",  label: "Hebrew Date",          sub: "Convert any date to the Jewish calendar",  action: onHebrewDate },
    { emoji: "🗓", bg: "rgba(74,222,128,0.12)",  label: "Luach",                sub: "Multi-year Jewish calendar & holidays",    action: onLuach,          premium: true },
    { emoji: "🤝", bg: "rgba(255,99,31,0.15)",   label: "Community",            sub: "Connect with Bnei Menashe",                action: onCommunity },
    { emoji: "📢", bg: "rgba(212,168,67,0.15)",  label: "Announcements",        sub: "Community notices & admin broadcasts",      action: onAnnouncements },
    { emoji: "🗓", bg: "rgba(99,102,241,0.15)",  label: "Community Events",     sub: "Shabbat dinners, classes & gatherings",     action: onEvents },
    { emoji: "👥", bg: "rgba(59,130,246,0.15)",  label: "Member Directory",     sub: "Find Bnei Menashe members worldwide",       action: onMembers },
    { emoji: "🙏", bg: "rgba(212,168,67,0.12)",  label: "Prayer Board",         sub: "Community prayers, blessings & Amens",      action: onPrayerBoard },
    { emoji: "📚", bg: "rgba(139,92,246,0.15)",  label: "Torah Tracker",        sub: "Log study sessions & track your streak",    action: onTorahTracker },
    { emoji: "📊", bg: "rgba(22,163,74,0.15)",   label: "Community Census",     sub: "Demographics & Bnei Menashe statistics",    action: onCensus,         premium: true },
    { emoji: "⚙️", bg: "rgba(100,116,139,0.15)", label: "Settings",             sub: "App preferences & account",                action: onSettings },
  ];

  const premiumCount = TOOLS.filter(t => t.premium).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style>{`
        @keyframes lockWiggle {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(8deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(5deg); }
        }
        .tool-item-premium:active { background: rgba(212,168,67,0.12) !important; }
      `}</style>
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "84vh", overflowY: "auto" }}
      >
        <div className="modal-handle" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>More Tools</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              All features · <span style={{ color: GOLD, fontWeight: 700 }}>{premiumCount} Premium</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Premium upsell banner for non-premium users */}
        {!isPremium && (
          <button
            onClick={onShowPremium}
            style={{
              width: "100%", marginBottom: 14,
              padding: "12px 16px",
              background: "linear-gradient(135deg, rgba(212,168,67,0.12) 0%, rgba(212,168,67,0.05) 100%)",
              border: "1px solid rgba(212,168,67,0.35)",
              borderRadius: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: GOLD_GRAD,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>👑</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>
                Unlock {premiumCount} Premium Tools
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                Daf Yomi, Tahara, Luach, Census & more — 7-day free trial
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TOOLS.map((tool, i) => {
            const locked = tool.premium && !isPremium;
            return (
              <div
                key={i}
                className={locked ? "tool-item-premium" : "tools-item"}
                onClick={() => { locked ? onShowPremium() : tool.action(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "12px 14px", borderRadius: 13, cursor: "pointer",
                  background: locked
                    ? "rgba(212,168,67,0.04)"
                    : "var(--elevated, rgba(255,255,255,0.04))",
                  border: locked
                    ? "1px solid rgba(212,168,67,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
                  transition: "background 0.15s, border-color 0.15s",
                  opacity: locked ? 0.85 : 1,
                }}
              >
                {/* Icon */}
                <div
                  className="tools-icon"
                  style={{
                    background: tool.bg,
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  {tool.emoji}
                  {locked && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(8,14,26,0.55)",
                      borderRadius: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg
                        width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: locked ? GOLD : "var(--text-primary)" }}>
                      {tool.label}
                    </span>
                    {tool.premium && <PremiumBadge />}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{tool.sub}</div>
                </div>

                {/* Right icon */}
                {locked ? (
                  <LockChevron />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Widget Settings ── */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Home Widgets
          </div>
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 14px",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "rgba(212,168,67,0.13)", border: "1px solid rgba(212,168,67,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
              }}>🕯</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Live Candle Countdown</span>
                  <span style={{
                    fontSize: 9, fontWeight: 900, color: "#b8860b", letterSpacing: "0.1em",
                    background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)",
                    borderRadius: 4, padding: "2px 5px",
                  }}>👑 PREMIUM</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Shabbat & candle lighting timer on home</div>
              </div>
              {isPremium ? (
                <button
                  onClick={onToggleCandle}
                  style={{
                    width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                    background: candleEnabled
                      ? "linear-gradient(90deg, #b8860b, #d4a843)"
                      : "rgba(255,255,255,0.1)",
                    position: "relative", flexShrink: 0,
                    transition: "background 0.25s",
                  }}
                  aria-label={candleEnabled ? "Disable countdown" : "Enable countdown"}
                >
                  <span style={{
                    position: "absolute", top: 3,
                    left: candleEnabled ? 23 : 3,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "white", transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }} />
                </button>
              ) : (
                <button
                  onClick={onShowPremium}
                  style={{
                    fontSize: 11, fontWeight: 700, color: "#d4a843",
                    background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)",
                    borderRadius: 8, padding: "5px 10px", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  Unlock
                </button>
              )}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="btn-close-full" style={{ marginTop: 16 }}>
          Close
        </button>
      </div>
    </div>
  );
}
