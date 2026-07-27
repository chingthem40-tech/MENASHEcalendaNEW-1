import { useState, useEffect, useMemo, memo } from "react";
import { useUser } from "@clerk/react";
import {
  fetchPublicProfile,
  fetchTorahTrackerEntries,
  fetchYahrzeitEntries,
  fetchCommunityYahrzeit,
  fetchTorahTrackerGoal,
  type PublicProfile,
  type StudyEntryApi,
  type YartzeitEntryApi,
  type CommunityYahrzeitEntry,
} from "../lib/userApi";
import { useLanguage } from "../context/LanguageContext";

// ── Badge definitions (mirrors TorahTrackerModal — no backend dependency) ──
interface BadgeDef {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  earned: (streak: number, sessions: number, totalMins: number) => boolean;
}
const BADGES: BadgeDef[] = [
  { id: "streak3",    emoji: "🌿", label: "First Fruits",   sub: "3-day streak",    earned: (s)       => s >= 3 },
  { id: "streak7",    emoji: "⭐", label: "Sheva",          sub: "7-day streak",    earned: (s)       => s >= 7 },
  { id: "streak30",   emoji: "🏆", label: "Chodesh",        sub: "30-day streak",   earned: (s)       => s >= 30 },
  { id: "streak100",  emoji: "👑", label: "Ba'al Yisgaber", sub: "100-day streak",  earned: (s)       => s >= 100 },
  { id: "sessions10", emoji: "🎯", label: "First Steps",    sub: "10 sessions",     earned: (_s, n)   => n >= 10 },
  { id: "sessions50", emoji: "🥇", label: "Talmid",         sub: "50 sessions",     earned: (_s, n)   => n >= 50 },
  { id: "hours10",    emoji: "📖", label: "10 Hours",       sub: "600 min total",   earned: (_s,_n,m) => m >= 600 },
  { id: "hours50",    emoji: "🌟", label: "50 Hours",       sub: "3,000 min total", earned: (_s,_n,m) => m >= 3000 },
  { id: "hours100",   emoji: "🎓", label: "Torah Scholar",  sub: "6,000 min total", earned: (_s,_n,m) => m >= 6000 },
];

// ── Level thresholds (based on total study minutes) ─────────────────────────
const LEVELS = [
  { label: "Beginner",      emoji: "🌱", min: 0 },
  { label: "Learner",       emoji: "📖", min: 60 },
  { label: "Student",       emoji: "🎓", min: 300 },
  { label: "Scholar",       emoji: "⭐", min: 1000 },
  { label: "Torah Scholar", emoji: "👑", min: 3000 },
];

function getLevel(totalMins: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (totalMins >= l.min) level = l; }
  return level;
}

// ── Streak calculator (same logic as TorahTrackerModal) ──────────────────────
function calcStreak(entries: StudyEntryApi[]): number {
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yday  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yday)  return "Yesterday";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
}

function avatarBg(name: string): string {
  const colors = ["#1a3050","#2a1a40","#1a2a20","#30200a","#1a1a30","#2a1030","#0f2030","#301020"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

// ── Siddur bookmark count from localStorage ──────────────────────────────────
function countSiddurBookmarks(): number {
  try {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("siddur-bookmarks-")) {
        const val = localStorage.getItem(key);
        if (val) {
          const pages: number[] = JSON.parse(val);
          count += pages.length;
        }
      }
    }
    return count;
  } catch { return 0; }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  isPremium: boolean;
  publicProfile: PublicProfile | null;
  onNavigate: (page: string) => void;
  onShowProfile: () => void;
  onShowPremium: () => void;
  onShowTorahTracker: () => void;
  onSignOut: () => void;
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: "var(--gold)",
        letterSpacing: "0.10em", textTransform: "uppercase",
        marginBottom: 10, paddingLeft: 2,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "var(--elevated)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "14px 10px", textAlign: "center",
    }}>
      <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ── Shortcut row ─────────────────────────────────────────────────────────────
function ShortcutRow({
  emoji, label, sub, onClick, danger = false,
}: { emoji: string; label: string; sub?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        width: "100%", padding: "13px 16px",
        background: "none", border: "none", cursor: "pointer",
        textAlign: "left", borderBottom: "1px solid var(--border)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--elevated)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? "#ef4444" : "var(--text-primary)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>}
      </div>
      {!danger && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
const JourneyPage = memo(function JourneyPage({
  isPremium, publicProfile, onNavigate, onShowProfile, onShowPremium, onShowTorahTracker, onSignOut,
}: Props) {
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();

  const [studyEntries, setStudyEntries] = useState<StudyEntryApi[]>([]);
  const [yahrzeitEntries, setYahrzeitEntries] = useState<YartzeitEntryApi[]>([]);
  const [communityYahrzeit, setCommunityYahrzeit] = useState<CommunityYahrzeitEntry[]>([]);
  const [goalMins, setGoalMins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookmarkCount] = useState(() => countSiddurBookmarks());

  useEffect(() => {
    if (!isLoaded || !user) { setLoading(false); return; }
    Promise.all([
      fetchTorahTrackerEntries().catch(() => [] as StudyEntryApi[]),
      fetchYahrzeitEntries().catch(() => [] as YartzeitEntryApi[]),
      fetchCommunityYahrzeit().catch(() => [] as CommunityYahrzeitEntry[]),
      fetchTorahTrackerGoal().catch(() => 0),
    ]).then(([study, yahrzeit, community, goal]) => {
      setStudyEntries(study);
      setYahrzeitEntries(yahrzeit);
      setCommunityYahrzeit(community);
      setGoalMins(goal);
      setLoading(false);
    });
  }, [isLoaded, user?.id]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const streak      = useMemo(() => calcStreak(studyEntries), [studyEntries]);
  const totalMins   = useMemo(() => studyEntries.reduce((s, e) => s + e.duration, 0), [studyEntries]);
  const level       = useMemo(() => getLevel(totalMins), [totalMins]);
  const candlesLit  = useMemo(() => communityYahrzeit.filter((e) => e.candleLit).length, [communityYahrzeit]);

  // Weekly Torah progress
  const weekMins = useMemo(() => {
    const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay()); ws.setHours(0,0,0,0);
    return studyEntries.filter((e) => new Date(e.date + "T12:00:00") >= ws).reduce((s, e) => s + e.duration, 0);
  }, [studyEntries]);

  // Badges
  const { earned: earnedBadges, total: totalBadges } = useMemo(() => {
    const earned = BADGES.filter((b) => b.earned(streak, studyEntries.length, totalMins));
    return { earned, total: BADGES.length };
  }, [streak, studyEntries.length, totalMins]);

  // Activity timeline — last 10 study entries sorted newest first
  const recentActivity = useMemo(() =>
    [...studyEntries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8),
    [studyEntries]
  );

  // Member since
  const memberSince = useMemo(() => {
    const d = user?.createdAt;
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [user?.createdAt]);

  // Profile data
  const displayName    = publicProfile?.displayName || user?.firstName || user?.fullName || "Member";
  const congregation   = publicProfile?.congregation || "";
  const role           = publicProfile?.role || "Member";
  const city           = publicProfile?.city || "";
  const country        = publicProfile?.country || "";
  const avatarEmoji    = publicProfile?.avatarEmoji || "👤";
  const profilePhotoUrl = publicProfile?.profilePhotoUrl;
  const locationLine   = [city, country].filter(Boolean).join(", ");

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (isLoaded && !user) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 24px", gap: 16, textAlign: "center",
      }}>
        <div style={{ fontSize: 56 }}>🙏</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          {t.journeyTitle}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {t.journeyNotSignedIn}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 16px 100px", maxWidth: 600, margin: "0 auto" }}>

      {/* ── ① Profile Hero ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative", borderRadius: 20, overflow: "hidden",
        marginBottom: 24,
        background: "linear-gradient(145deg, rgba(212,168,67,0.08) 0%, var(--elevated) 100%)",
        border: "1px solid rgba(212,168,67,0.25)",
      }}>
        {/* Gold top accent */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.9) 35%, rgba(255,235,120,1) 50%, rgba(212,168,67,0.9) 65%, transparent)",
        }} />

        <div style={{ padding: "24px 20px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={displayName}
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(212,168,67,0.5)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: avatarBg(displayName),
                border: "2px solid rgba(212,168,67,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}>
                {avatarEmoji !== "👤"
                  ? <span style={{ fontSize: 32 }}>{avatarEmoji}</span>
                  : <span style={{ fontSize: 22, fontWeight: 700, color: "#d4a843" }}>{initials(displayName)}</span>
                }
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>
              {displayName}
            </div>
            {role && role !== "Member" && (
              <div style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)",
                borderRadius: 20, padding: "2px 8px", marginBottom: 4,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#d4a843", letterSpacing: "0.04em" }}>{role}</span>
              </div>
            )}
            {congregation && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>🕍 {congregation}</div>
            )}
            {locationLine && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>📍 {locationLine}</div>
            )}
            {memberSince && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.7 }}>
                {t.journeyMemberSince} {memberSince}
              </div>
            )}
          </div>
        </div>

        {/* Edit CTA */}
        <div style={{ padding: "0 20px 20px" }}>
          <button
            type="button"
            onClick={onShowProfile}
            style={{
              width: "100%", padding: "10px", borderRadius: 12,
              background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)",
              color: "#d4a843", fontSize: 13, fontWeight: 700, cursor: "pointer",
              letterSpacing: "0.02em", transition: "all 0.15s",
            }}
          >
            ✏️ {t.journeyEditProfile}
          </button>
        </div>

        {/* Level badge */}
        {!loading && (
          <div style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            border: "1px solid rgba(212,168,67,0.3)",
            borderRadius: 20, padding: "4px 10px",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{ fontSize: 14 }}>{level.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#d4a843" }}>{level.label}</span>
          </div>
        )}
      </div>

      {/* ── ② My Journey stats ─────────────────────────────────────────── */}
      <Section title={t.journeyTitle}>
        {loading ? (
          <div style={{
            background: "var(--elevated)", border: "1px solid var(--border)",
            borderRadius: 16, padding: 20, textAlign: "center",
            color: "var(--text-muted)", fontSize: 13,
          }}>
            Loading your journey…
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatCard emoji="🔥" value={streak} label={t.journeyStreak} />
            <StatCard emoji="📖" value={studyEntries.length} label="Sessions" />
            <StatCard emoji="🕯️" value={candlesLit} label={t.journeyCandles} />
            <StatCard emoji="⏱️" value={fmtMins(totalMins)} label="Studied" />
          </div>
        )}
      </Section>

      {/* ── ③ Achievements ─────────────────────────────────────────────── */}
      <Section title={t.journeyAchievements}>
        <div style={{
          background: "var(--elevated)", border: "1px solid var(--border)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {/* Header row */}
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {loading ? "—" : `${earnedBadges.length} / ${totalBadges}`} {t.journeyBadgesEarned}
            </div>
            {!loading && (
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#d4a843",
                background: "rgba(212,168,67,0.12)", borderRadius: 20, padding: "2px 8px",
              }}>
                {Math.round((earnedBadges.length / totalBadges) * 100)}%
              </div>
            )}
          </div>
          {/* Progress bar */}
          {!loading && (
            <div style={{ padding: "0 16px" }}>
              <div style={{
                height: 4, background: "var(--border)", borderRadius: 2, margin: "12px 0",
              }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${(earnedBadges.length / totalBadges) * 100}%`,
                  background: "linear-gradient(90deg, #b8860b, #d4a843, #f0c96a)",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          )}
          {/* Badge grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
            background: "var(--border)",
          }}>
            {BADGES.map((badge) => {
              const isEarned = !loading && badge.earned(streak, studyEntries.length, totalMins);
              return (
                <div
                  key={badge.id}
                  style={{
                    background: "var(--elevated)",
                    padding: "14px 8px", textAlign: "center",
                    opacity: loading ? 0.4 : isEarned ? 1 : 0.35,
                    transition: "opacity 0.3s",
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 4, filter: isEarned ? "none" : "grayscale(1)" }}>
                    {badge.emoji}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isEarned ? "var(--text-primary)" : "var(--text-muted)", marginBottom: 2 }}>
                    {badge.label}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{badge.sub}</div>
                </div>
              );
            })}
          </div>
          {/* Unlock CTA if none earned */}
          {!loading && earnedBadges.length === 0 && (
            <div style={{ padding: "14px 16px", textAlign: "center" }}>
              <button
                type="button"
                onClick={onShowTorahTracker}
                style={{
                  fontSize: 12, fontWeight: 700, color: "#d4a843",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                📖 Log a study session to earn your first badge →
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* ── ④ Activity Timeline ─────────────────────────────────────────── */}
      <Section title={t.journeyActivity}>
        <div style={{
          background: "var(--elevated)", border: "1px solid var(--border)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Loading…
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📜</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {t.journeyNoActivity}
              </div>
              <button
                type="button"
                onClick={onShowTorahTracker}
                style={{
                  marginTop: 12, fontSize: 12, fontWeight: 700, color: "#d4a843",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                Start logging Torah study →
              </button>
            </div>
          ) : (
            recentActivity.map((entry, idx) => {
              const subjectColors: Record<string, string> = {
                Parasha: "#d4a843", Gemara: "#a78bfa", Mishna: "#818cf8",
                Halacha: "#4ade80", Tanach: "#fbbf24", Mussar: "#f472b6",
                Prayer:  "#4ade80", Other: "#94a3b8",
              };
              const color = subjectColors[entry.subject] || "#94a3b8";
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 16px",
                    borderBottom: idx < recentActivity.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: color, marginTop: 6, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color,
                        background: `${color}22`, borderRadius: 6, padding: "1px 6px",
                      }}>
                        {entry.subject}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {fmtMins(entry.duration)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 1 }}>
                      {entry.description || t.journeyStudySession}
                    </div>
                    {entry.notes && (
                      <div style={{
                        fontSize: 11, color: "var(--text-muted)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {entry.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
                    {fmtDate(entry.date)}
                  </div>
                </div>
              );
            })
          )}
          {recentActivity.length > 0 && (
            <button
              type="button"
              onClick={onShowTorahTracker}
              style={{
                width: "100%", padding: "12px 16px",
                background: "none", border: "none", borderTop: "1px solid var(--border)",
                cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--gold)",
                textAlign: "center",
              }}
            >
              View full learning log →
            </button>
          )}
        </div>
      </Section>

      {/* ── ⑤ Saved Content ─────────────────────────────────────────────── */}
      <Section title={t.journeySaved}>
        <div style={{
          background: "var(--elevated)", border: "1px solid var(--border)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 22 }}>📚</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {t.journeyBookmarks}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {bookmarkCount > 0 ? `${bookmarkCount} page${bookmarkCount !== 1 ? "s" : ""} bookmarked` : "No bookmarks yet"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("siddur")}
              style={{
                padding: "6px 12px", borderRadius: 8,
                background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)",
                color: "#d4a843", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              {t.journeyOpenSiddur}
            </button>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 22 }}>🕎</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {t.journeyPersonal}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {yahrzeitEntries.length > 0
                  ? `${yahrzeitEntries.length} Yahrzeit reminder${yahrzeitEntries.length !== 1 ? "s" : ""}`
                  : "No Yahrzeit reminders set"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                Sacred Wisdom Conversations
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Available in the Community tab
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── ⑥ Goals ─────────────────────────────────────────────────────── */}
      <Section title={t.journeyGoals}>
        <div style={{
          background: "var(--elevated)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 16,
        }}>
          {/* Weekly Torah goal */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  📖 {t.journeyTorahGoal}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {t.journeyWeeklyProgress}: {fmtMins(weekMins)} {goalMins > 0 ? `/ ${fmtMins(goalMins)}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={onShowTorahTracker}
                style={{
                  fontSize: 11, fontWeight: 700, color: "#d4a843",
                  background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
                  borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                }}
              >
                {goalMins === 0 ? "Set Goal" : "Update"}
              </button>
            </div>
            {goalMins > 0 && (
              <div style={{ height: 6, background: "var(--border)", borderRadius: 3 }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${Math.min(100, (weekMins / goalMins) * 100)}%`,
                  background: weekMins >= goalMins
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #b8860b, #d4a843, #f0c96a)",
                  transition: "width 0.6s ease",
                }} />
              </div>
            )}
            {goalMins === 0 && (
              <div style={{
                height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 3, width: "100%",
                  background: "repeating-linear-gradient(90deg, rgba(212,168,67,0.15) 0px, rgba(212,168,67,0.15) 8px, transparent 8px, transparent 16px)",
                }} />
              </div>
            )}
          </div>

          {/* Daily streak goal */}
          <div style={{
            padding: "12px 14px", borderRadius: 12,
            background: streak > 0 ? "rgba(212,168,67,0.06)" : "rgba(0,0,0,0.15)",
            border: `1px solid ${streak > 0 ? "rgba(212,168,67,0.2)" : "var(--border)"}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🔥</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                Daily Learning Streak
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {streak === 0
                  ? "Log a session today to start your streak"
                  : `${streak} day${streak !== 1 ? "s" : ""} — keep it going!`}
              </div>
            </div>
            {streak > 0 && (
              <div style={{
                fontSize: 20, fontWeight: 900,
                background: "linear-gradient(135deg, #b8860b, #d4a843, #f0c96a)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {streak}
              </div>
            )}
          </div>

          {/* Premium upgrade nudge */}
          {!isPremium && (
            <button
              type="button"
              onClick={onShowPremium}
              style={{
                marginTop: 12, width: "100%", padding: "11px",
                borderRadius: 12, cursor: "pointer",
                background: "linear-gradient(135deg, rgba(184,134,11,0.15), rgba(212,168,67,0.1))",
                border: "1px dashed rgba(212,168,67,0.35)",
                color: "#d4a843", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              👑 Upgrade to Premium for advanced tracking
            </button>
          )}
        </div>
      </Section>

      {/* ── ⑦ Account Shortcuts ─────────────────────────────────────────── */}
      <Section title={t.journeyAccount}>
        <div style={{
          background: "var(--elevated)", border: "1px solid var(--border)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <ShortcutRow
            emoji="⚙️"
            label={t.journeySettings}
            sub="Theme, location, notifications"
            onClick={() => onNavigate("settings")}
          />
          <ShortcutRow
            emoji="👑"
            label={isPremium ? "Premium — Active" : t.journeyPremium}
            sub={isPremium ? "Full access enabled" : "Unlock all features"}
            onClick={onShowPremium}
          />
          <ShortcutRow
            emoji="💬"
            label={t.journeyHelp}
            sub="Report a bug or suggest a feature"
            onClick={() => {
              const btn = document.querySelector<HTMLButtonElement>(".feedback-btn");
              if (btn) btn.click();
            }}
          />
          <ShortcutRow
            emoji="🚪"
            label={t.journeySignOut}
            onClick={onSignOut}
            danger
          />
        </div>
      </Section>

    </div>
  );
});

export default JourneyPage;
