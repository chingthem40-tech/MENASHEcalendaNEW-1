import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { MEMBER_DIR_KEY } from "../data";
import { daysUntilAnniversary } from "../utils";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface CelebEntry {
  id: string; name: string; role: string; country: string;
  whatsapp?: string; email?: string; phone?: string;
  type: "birthday" | "aliyah"; days: number;
}

/* ── CountdownChip ─────────────────────────────────────────────────────── */

function CountdownChip({ days, t }: { days: number; t: { celebToday: string; celebTomorrow: string; celebInDays: string } }) {
  if (days === 0) return (
    <span style={{
      fontSize: 10, fontWeight: 900, padding: "4px 10px", borderRadius: 99,
      background: "linear-gradient(90deg, rgba(74,222,128,0.25), rgba(74,222,128,0.12))",
      border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80",
      letterSpacing: ".04em", whiteSpace: "nowrap",
      animation: "celebPulse 1.8s ease-in-out infinite",
    }}>{t.celebToday}</span>
  );
  if (days === 1) return (
    <span style={{
      fontSize: 10, fontWeight: 900, padding: "4px 10px", borderRadius: 99,
      background: "rgba(251,191,36,0.13)", border: "1px solid rgba(251,191,36,0.35)",
      color: "#fbbf24", letterSpacing: ".04em", whiteSpace: "nowrap",
    }}>{t.celebTomorrow}</span>
  );
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 99,
      background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)",
      color: "var(--text-muted)", letterSpacing: ".04em", whiteSpace: "nowrap",
    }}>{t.celebInDays.replace("{n}", String(days))}</span>
  );
}

/* ── UpcomingCelebrations ──────────────────────────────────────────────── */

function UpcomingCelebrations({ onShowMembers }: { onShowMembers: () => void }) {
  const { t } = useLanguage();
  const [celebs, setCelebs] = useState<CelebEntry[]>([]);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(MEMBER_DIR_KEY);
        const members = raw ? JSON.parse(raw) : [];
        const found: CelebEntry[] = [];
        for (const m of members) {
          if (m.status !== "approved") continue;
          if (m.birthday) {
            const days = daysUntilAnniversary(m.birthday);
            if (days >= 0 && days <= 7) found.push({ id: m.id, name: m.name, role: m.role, country: m.country, whatsapp: m.whatsapp, email: m.email, phone: m.phone, type: "birthday", days });
          }
          if (m.aliyahDate) {
            const days = daysUntilAnniversary(m.aliyahDate);
            if (days >= 0 && days <= 7) found.push({ id: m.id + "-al", name: m.name, role: m.role, country: m.country, whatsapp: m.whatsapp, email: m.email, phone: m.phone, type: "aliyah", days });
          }
        }
        found.sort((a, b) => a.days - b.days);
        setCelebs(found);
      } catch {}
    }
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (celebs.length === 0) return null;

  return (
    <div style={{
      marginBottom: 14, borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(212,168,67,0.22)",
      background: "linear-gradient(135deg, rgba(26,16,0,0.88), rgba(10,10,20,0.94))",
    }}>
      <style>{`
        @keyframes celebPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
          50%      { box-shadow: 0 0 0 4px rgba(74,222,128,0.15); }
        }
        @keyframes celebRowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 14px 9px",
        borderBottom: "1px solid rgba(212,168,67,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 15 }}>🎉</span>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".09em", color: "#d4a843", textTransform: "uppercase" }}>
            {t.celebTitle}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
            background: "rgba(212,168,67,0.15)", color: "#d4a843", border: "1px solid rgba(212,168,67,0.25)",
          }}>{celebs.length}</span>
        </div>
        <button
          onClick={onShowMembers}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "rgba(212,168,67,0.5)", fontWeight: 700 }}
        >
          {t.celebDirLink}
        </button>
      </div>

      {/* Celebration rows */}
      <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 7 }}>
        {celebs.map((c, idx) => {
          const isBday = c.type === "birthday";
          const firstName = c.name.split(" ")[0];
          const msg = isBday
            ? `🎂 Happy Birthday ${c.name}! May Hashem bless you with a year of Torah, joy, and shalom! מזל טוב from your Bnei Menashe family! 🕍`
            : `✈️ Happy Aliyah Anniversary ${c.name}! Celebrating your sacred journey to Eretz Yisrael! May Hashem bless this year even more! 🇮🇱`;
          const waLink = c.whatsapp
            ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`
            : null;
          const mailLink = c.email
            ? `mailto:${c.email}?subject=${encodeURIComponent(isBday ? `Happy Birthday ${firstName}! 🎂` : `Happy Aliyah Anniversary ${firstName}! ✈️`)}&body=${encodeURIComponent(msg)}`
            : null;
          const accentColor = isBday ? "#d4a843" : "#60a5fa";
          const accentBg = isBday ? "rgba(212,168,67,0.09)" : "rgba(59,130,246,0.09)";
          const accentBorder = isBday ? "rgba(212,168,67,0.2)" : "rgba(59,130,246,0.2)";

          return (
            <div
              key={c.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 12,
                background: accentBg, border: `1px solid ${accentBorder}`,
                animation: `celebRowIn 0.3s ${idx * 0.06}s cubic-bezier(0.34,1.2,0.64,1) both`,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: isBday ? "rgba(212,168,67,0.14)" : "rgba(59,130,246,0.14)",
                border: `1px solid ${accentBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
              }}>
                {isBday ? "🎂" : "✈️"}
              </div>

              {/* Name + type */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 800, color: "var(--text-primary)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3,
                }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, letterSpacing: ".03em" }}>
                  {isBday ? t.celebTypeBirthday : t.celebTypeAliyah}
                </div>
              </div>

              {/* Countdown chip */}
              <CountdownChip days={c.days} t={t} />

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 2 }}>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer" title="Send WhatsApp greeting"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 9,
                      background: "rgba(37,211,102,0.13)", border: "1px solid rgba(37,211,102,0.28)",
                      fontSize: 16, textDecoration: "none",
                    }}>
                    📱
                  </a>
                )}
                {mailLink && (
                  <a href={mailLink} title="Send email greeting"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 9,
                      background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.22)",
                      fontSize: 15, textDecoration: "none",
                    }}>
                    ✉️
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── CommunityCard ─────────────────────────────────────────────────────── */

function CommunityCard({ onShowCommunity, onShowCensus, onShowMembers }: { onShowCommunity: () => void; onShowCensus: () => void; onShowMembers: () => void }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      marginBottom: 4, borderRadius: 18, overflow: "hidden",
      background: "linear-gradient(140deg, #0b1628 0%, #091320 55%, #0e1520 100%)",
      border: `1px solid ${expanded ? "rgba(99,179,237,0.35)" : "rgba(99,179,237,0.18)"}`,
      boxShadow: expanded
        ? "0 6px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(99,179,237,0.08)"
        : "0 3px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
      transition: "border-color 0.25s, box-shadow 0.25s",
    }}>
      <style>{`
        @keyframes communitySlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Collapsed / Header row (always visible, tappable) ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 13,
          textAlign: "left",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(99,179,237,0.22), rgba(59,130,246,0.1))",
          border: "1px solid rgba(99,179,237,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}>🤝</div>

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "#63b3ed", marginBottom: 2 }}>
            BNEI MENASHE
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.1 }}>Community</div>
        </div>

        {/* Badge count + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
              padding: "3px 8px", borderRadius: 99,
              background: "rgba(99,179,237,0.12)", border: "1px solid rgba(99,179,237,0.22)",
              color: "#93c5fd",
            }}>2 SERVICES</div>
          </div>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="rgba(99,179,237,0.7)" strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Divider (only when expanded) */}
      {expanded && (
        <div style={{ height: 1, background: "rgba(99,179,237,0.12)", margin: "0 16px" }} />
      )}

      {/* ── Expanded content ── */}
      {expanded && (
        <div style={{
          padding: "12px 14px 16px",
          animation: "communitySlideDown 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {/* Member Directory Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onShowMembers(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
              background: "rgba(99,179,237,0.07)", border: "1px solid rgba(99,179,237,0.2)",
              borderRadius: 13, padding: "13px 15px", cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: "rgba(99,179,237,0.14)", border: "1px solid rgba(99,179,237,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>👥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 2 }}>{t.homeMembersTitle}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>
                {t.homeMembersDesc}
              </div>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(99,179,237,0.55)" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Census & Demographics Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onShowCensus(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.2)",
              borderRadius: 13, padding: "13px 15px", cursor: "pointer", textAlign: "left",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 2 }}>{t.homeCensusTitle}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>
                {t.homeCensusDesc}
              </div>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.55)" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── CommunitySection ──────────────────────────────────────────────────── */

interface CommunitySectionProps {
  onShowMembers: () => void;
  onShowCommunity: () => void;
  onShowCensus: () => void;
}

/**
 * CommunitySection
 *
 * Fully self-contained community block for the home screen.
 * Composes UpcomingCelebrations (birthday/aliyah anniversary alerts)
 * and CommunityCard (member directory + census links).
 *
 * Owns: component ordering, spacing, all community rendering.
 * Business logic remains in useHomeCommunity hook.
 */
export default function CommunitySection({ onShowMembers, onShowCommunity, onShowCensus }: CommunitySectionProps) {
  return (
    <>
      <UpcomingCelebrations onShowMembers={onShowMembers} />
      <CommunityCard onShowCommunity={onShowCommunity} onShowCensus={onShowCensus} onShowMembers={onShowMembers} />
    </>
  );
}
