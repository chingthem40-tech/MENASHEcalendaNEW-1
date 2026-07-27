import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HDate } from "@hebcal/core";
import { useSearch } from "../features/memorial/hooks/useSearch";
import { useCollections } from "../features/memorial/hooks/useCollections";
import { useMemorial } from "../features/memorial/hooks/useMemorial";
import { useCandles } from "../features/memorial/hooks/useCandles";
import { useTributes } from "../features/memorial/hooks/useTributes";
import type {
  MemorialWithPerson,
  MemorialCandle,
  MemorialTribute,
  CandleType,
  TributeType,
} from "../features/memorial/types";

/* ════════════════════════════════════════════════════════════════════════════
   MemorialBrowserPanel — Browse memorials + rich in-modal profile
   ============================================================================
   Two responsibilities:
     1. MemorialBrowserPanel  — left-side browse hub (search + curated strips)
     2. FullMemorialProfile   — full-screen overlay showing biography, candles,
                                tributes, family, upcoming yahrzeit

   Both live inside MemorialSanctuaryModal's fixed container so they share the
   same stacking context (z-index 9999) without additional portals.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function initials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function calcAge(
  birthDate: string | null,
  deathDate: string,
): number | null {
  if (!birthDate) return null;
  try {
    const b = new Date(birthDate);
    const d = new Date(deathDate);
    let age = d.getFullYear() - b.getFullYear();
    const m = d.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

interface YahrzeitInfo {
  hebrewDate: string;
  gregorianDate: Date;
  daysAway: number;
}

function nextYahrzeit(deathDate: string): YahrzeitInfo | null {
  try {
    const d = new Date(deathDate + "T12:00:00");
    const hDeath = new HDate(d);
    const today = new HDate(new Date());
    let year = today.getFullYear();
    let yahrzeit = new HDate(hDeath.getDate(), hDeath.getMonth(), year);
    if (yahrzeit.abs() < today.abs()) {
      year++;
      yahrzeit = new HDate(hDeath.getDate(), hDeath.getMonth(), year);
    }
    const gDate = yahrzeit.greg();
    const daysAway = Math.round(
      (gDate.getTime() - new Date().setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24),
    );
    return { hebrewDate: yahrzeit.toString(), gregorianDate: gDate, daysAway };
  } catch {
    return null;
  }
}

/* ── Constants ──────────────────────────────────────────────────────────────── */

const CANDLE_TYPES: { value: CandleType; label: string; emoji: string }[] = [
  { value: "memorial", label: "Memorial", emoji: "🕯" },
  { value: "yahrzeit", label: "Yahrzeit", emoji: "🕎" },
  { value: "neshama",  label: "Neshama",  emoji: "✨" },
  { value: "shabbat",  label: "Shabbat",  emoji: "🕍" },
  { value: "shloshim", label: "Shloshim", emoji: "🤍" },
];

const TRIBUTE_TYPES: { value: TributeType; label: string; emoji: string }[] = [
  { value: "memory",    label: "Memory",    emoji: "💭" },
  { value: "prayer",    label: "Prayer",    emoji: "🙏" },
  { value: "scripture", label: "Scripture", emoji: "📜" },
  { value: "family",    label: "Family",    emoji: "👪" },
  { value: "community", label: "Community", emoji: "✡" },
];

/* ── Shared micro-components ────────────────────────────────────────────────── */

function GlassSection({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div
      style={{
        background: gold ? "rgba(212,168,67,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${gold ? "rgba(212,168,67,0.22)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16,
        padding: "14px",
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}

function FamilyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          flexShrink: 0,
          minWidth: 72,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
        {value}
      </span>
    </div>
  );
}

/* ── Browse strip cards ─────────────────────────────────────────────────────── */

function ShimmerCard() {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 126,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }}
      />
      <div
        style={{
          width: 78,
          height: 10,
          borderRadius: 5,
          background: "rgba(255,255,255,0.05)",
        }}
      />
      <div
        style={{
          width: 58,
          height: 8,
          borderRadius: 4,
          background: "rgba(255,255,255,0.04)",
        }}
      />
    </div>
  );
}

function PortraitMiniCard({
  item,
  onSelect,
}: {
  item: MemorialWithPerson;
  onSelect: (slug: string) => void;
}) {
  const name = item.person.fullName;
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`View memorial for ${name}`}
      whileHover={{ scale: 1.03, borderColor: "rgba(212,175,55,0.5)" }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(item.slug)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(item.slug); } }}
      style={{
        flexShrink: 0,
        width: 126,
        cursor: "pointer",
        background: "rgba(6,3,18,0.84)",
        border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: 16,
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        transition: "border-color 0.2s",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#D4AF37,#7a5800)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 900,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {initials(name)}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          lineHeight: 1.35,
          maxWidth: "100%",
        } as React.CSSProperties}
      >
        {name}
      </div>
      {item.person.hebrewName && (
        <div
          style={{
            fontSize: 9,
            color: "rgba(212,175,55,0.75)",
            fontFamily: "'Noto Serif Hebrew',serif",
            direction: "rtl",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
          }}
        >
          {item.person.hebrewName}
        </div>
      )}
      {item.person.deathDate && (
        <div
          style={{
            fontSize: 8,
            color: "rgba(255,255,255,0.32)",
            textAlign: "center",
          }}
        >
          🕯 {new Date(item.person.deathDate).getFullYear()}
        </div>
      )}
      {(item.candleCount ?? 0) > 0 && (
        <div
          style={{ fontSize: 8, color: "rgba(212,175,55,0.6)", fontWeight: 700 }}
        >
          🕯 {item.candleCount}
        </div>
      )}
    </motion.div>
  );
}

function CollectionStrip({
  title,
  icon,
  items,
  status,
  onSelect,
}: {
  title: string;
  icon: string;
  items: MemorialWithPerson[];
  status: "idle" | "loading" | "success" | "error";
  onSelect: (slug: string) => void;
}) {
  if (status === "error") return null;
  if (status === "success" && items.length === 0) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(212,175,55,0.55)",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {icon} {title.toUpperCase()}
      </div>
      <div
        className="ms-scroll-strip"
        style={
          {
            display: "flex",
            gap: 8,
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: 4,
            scrollbarWidth: "none",
          } as React.CSSProperties
        }
      >
        {status === "loading"
          ? Array.from({ length: 3 }).map((_, i) => <ShimmerCard key={i} />)
          : items
              .slice(0, 8)
              .map((m) => (
                <PortraitMiniCard key={m.id} item={m} onSelect={onSelect} />
              ))}
      </div>
    </div>
  );
}

function SearchResultRow({
  item,
  onSelect,
}: {
  item: MemorialWithPerson;
  onSelect: (slug: string) => void;
}) {
  const name = item.person.fullName;
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`View memorial for ${name}`}
      whileHover={{ background: "rgba(212,175,55,0.07)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item.slug)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(item.slug); } }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 11px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          flexShrink: 0,
          background: "linear-gradient(135deg,#D4AF37,#7a5800)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 900,
          color: "#fff",
        }}
      >
        {initials(name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        {item.person.hebrewName && (
          <div
            style={{
              fontSize: 9,
              color: "rgba(212,175,55,0.65)",
              fontFamily: "'Noto Serif Hebrew',serif",
              direction: "rtl",
              marginTop: 1,
            }}
          >
            {item.person.hebrewName}
          </div>
        )}
        {item.person.deathDate && (
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.32)",
              marginTop: 1,
            }}
          >
            🕯 {formatDate(item.person.deathDate)}
          </div>
        )}
      </div>
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(212,175,55,0.5)"
        strokeWidth="2.5"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.div>
  );
}

/* ── Candle / Tribute display rows ──────────────────────────────────────────── */

function CandleRow({ candle }: { candle: MemorialCandle }) {
  const ct =
    CANDLE_TYPES.find((c) => c.value === candle.candleType) ?? CANDLE_TYPES[0];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        paddingBottom: 10,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
        {ct.emoji}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(212,175,55,0.9)",
            marginBottom: 2,
          }}
        >
          {candle.isAnonymous
            ? "Anonymous"
            : (candle.guestName ?? "Community member")}
          {candle.relationship && (
            <span
              style={{
                fontWeight: 400,
                color: "rgba(255,255,255,0.38)",
                marginLeft: 6,
              }}
            >
              · {candle.relationship}
            </span>
          )}
        </div>
        {candle.message && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              fontStyle: "italic",
            }}
          >
            &ldquo;{candle.message}&rdquo;
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.2)",
          flexShrink: 0,
        }}
      >
        {new Date(candle.litAt).toLocaleDateString()}
      </div>
    </div>
  );
}

function TributeRow({ tribute }: { tribute: MemorialTribute }) {
  const tt = tribute.tributeType
    ? TRIBUTE_TYPES.find((t) => t.value === tribute.tributeType)
    : null;
  return (
    <div
      style={{
        paddingBottom: 12,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {tt && (
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: "rgba(212,175,55,0.7)",
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}
        >
          {tt.emoji} {tt.label.toUpperCase()}
        </div>
      )}
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6,
          fontStyle: "italic",
        }}
      >
        &ldquo;{tribute.body}&rdquo;
      </div>
      <div
        style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}
      >
        —{" "}
        {tribute.isAnonymous
          ? "Anonymous"
          : (tribute.guestName ?? "Community member")}
        {" · "}
        {new Date(tribute.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

/* ── Full Memorial Profile ───────────────────────────────────────────────────── */

function FullMemorialProfile({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const { memorial, status, error, refetch } = useMemorial(slug);
  const memId = memorial?.id ?? null;
  const {
    candles,
    total: candleTotal,
    hasMore: candleHasMore,
    loadMore: loadMoreCandles,
    light,
  } = useCandles(memId);
  const {
    tributes,
    hasMore: tributeHasMore,
    loadMore: loadMoreTributes,
    submit,
  } = useTributes(memId);

  const [showCandleForm, setShowCandleForm] = useState(false);
  const [showTributeForm, setShowTributeForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [candleType, setCandleType] = useState<CandleType>("memorial");
  const [candleMsg, setCandleMsg] = useState("");
  const [candleGuestName, setCandleGuestName] = useState("");
  const [candleAnon, setCandleAnon] = useState(false);
  const [candleSaving, setCandleSaving] = useState(false);
  const [candleDone, setCandleDone] = useState(false);
  const [candleErr, setCandleErr] = useState<string | null>(null);

  const [tributeType, setTributeType] = useState<TributeType>("memory");
  const [tributeBody, setTributeBody] = useState("");
  const [tributeGuestName, setTributeGuestName] = useState("");
  const [tributeAnon, setTributeAnon] = useState(false);
  const [tributeSaving, setTributeSaving] = useState(false);
  const [tributeDone, setTributeDone] = useState(false);
  const [tributeErr, setTributeErr] = useState<string | null>(null);

  const handleLight = useCallback(async () => {
    setCandleSaving(true);
    setCandleErr(null);
    try {
      await light({
        candleType,
        message: candleMsg.trim() || undefined,
        guestName: candleGuestName.trim() || undefined,
        isAnonymous: candleAnon,
      });
      setCandleDone(true);
      setTimeout(() => {
        setCandleDone(false);
        setShowCandleForm(false);
        setCandleMsg("");
        setCandleGuestName("");
        setCandleAnon(false);
      }, 2500);
    } catch (e) {
      setCandleErr(
        e instanceof Error ? e.message : "Failed to light candle",
      );
    } finally {
      setCandleSaving(false);
    }
  }, [light, candleType, candleMsg, candleGuestName, candleAnon]);

  const handleTribute = useCallback(async () => {
    if (!tributeBody.trim()) {
      setTributeErr("Please write your tribute.");
      return;
    }
    setTributeSaving(true);
    setTributeErr(null);
    try {
      await submit({
        tributeType,
        body: tributeBody.trim(),
        guestName: tributeGuestName.trim() || undefined,
        isAnonymous: tributeAnon,
      });
      setTributeDone(true);
      setTimeout(() => {
        setTributeDone(false);
        setShowTributeForm(false);
        setTributeBody("");
        setTributeGuestName("");
        setTributeAnon(false);
      }, 2500);
    } catch (e) {
      setTributeErr(
        e instanceof Error ? e.message : "Failed to submit tribute",
      );
    } finally {
      setTributeSaving(false);
    }
  }, [submit, tributeType, tributeBody, tributeGuestName, tributeAnon]);

  const handleShare = useCallback(async () => {
    if (!memorial) return;
    const url = `${window.location.origin}?memorial=${encodeURIComponent(memorial.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* silent */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [memorial]);

  const inputSt: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const headerBar = (title: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Go back"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          width: 44,
          height: 44,
          cursor: "pointer",
          color: "rgba(255,255,255,0.6)",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        ←
      </button>
      <div
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 800,
          color: "#fff",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          width: 44,
          height: 44,
          cursor: "pointer",
          color: "rgba(255,255,255,0.5)",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 60,
    background:
      "linear-gradient(180deg, rgba(5,3,18,0.98) 0%, rgba(3,1,12,1) 100%)",
    backdropFilter: "blur(28px)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter,-apple-system,sans-serif",
  };

  if (status === "loading" || status === "idle") {
    return (
      <motion.div
        key="profile-loading"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        style={wrapperStyle}
      >
        {headerBar("Loading…")}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#D4AF37",
                  opacity: 0.6,
                  animation: `ms-badge-glow 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (status === "error" || !memorial) {
    return (
      <motion.div
        key="profile-error"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        style={wrapperStyle}
      >
        {headerBar("Not found")}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 36 }}>🕊</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Memorial not found
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            {error?.message}
          </div>
          <button
            onClick={refetch}
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#D4AF37",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  const { person } = memorial;
  const age = calcAge(person.birthDate, person.deathDate);
  const yahrzeit = nextYahrzeit(person.deathDate);
  const isYahrzeitSoon =
    yahrzeit !== null && yahrzeit.daysAway >= 0 && yahrzeit.daysAway <= 7;
  const approvedTributes = tributes.filter((tr) => tr.status === "approved");

  return (
    <motion.div
      key="full-profile"
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 280 }}
      onClick={(e) => e.stopPropagation()}
      style={wrapperStyle}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Go back"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            width: 44,
            height: 44,
            cursor: "pointer",
            color: "rgba(255,255,255,0.6)",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {person.fullName}
          </div>
          {person.hebrewName && (
            <div
              style={{
                fontSize: 11,
                color: "rgba(212,175,55,0.7)",
                fontFamily: "'Noto Serif Hebrew',serif",
                direction: "rtl",
              }}
            >
              {person.hebrewName}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleShare}
          aria-label={copied ? "Link copied" : "Share memorial"}
          style={{
            background: copied
              ? "rgba(100,200,120,0.15)"
              : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            width: 44,
            height: 44,
            cursor: "pointer",
            color: copied ? "#6ee7b7" : "rgba(255,255,255,0.5)",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          {copied ? "✓" : "↗"}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            width: 44,
            height: 44,
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="ms-scroll-strip"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: 40,
        }}
      >
        {/* ── Hero ── */}
        <div
          style={{
            padding: "20px 16px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                flexShrink: 0,
                background:
                  "linear-gradient(135deg,#D4AF37 0%,#6a4a00 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 900,
                color: "#fff",
                border: "1.5px solid rgba(212,175,55,0.4)",
                boxShadow: "0 0 24px rgba(212,175,55,0.15)",
              }}
            >
              {initials(person.fullName)}
            </div>
            <div
              style={{ flex: 1, minWidth: 0, paddingTop: 4 }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {person.fullName}
              </div>
              {person.hebrewName && (
                <div
                  style={{
                    fontSize: 15,
                    fontFamily: "'Noto Serif Hebrew',serif",
                    color: "rgba(212,175,55,0.85)",
                    direction: "rtl",
                    marginBottom: 8,
                  }}
                >
                  {person.hebrewName}
                </div>
              )}
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
              >
                {person.birthDate && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.45)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 20,
                      padding: "3px 10px",
                    }}
                  >
                    🌱 {formatDate(person.birthDate)}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.45)",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20,
                    padding: "3px 10px",
                  }}
                >
                  🕯 {formatDate(person.deathDate)}
                </div>
                {age !== null && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 20,
                      padding: "3px 10px",
                    }}
                  >
                    📅 {age} years
                  </div>
                )}
              </div>
            </div>
          </div>
          {candleTotal > 0 && (
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: "rgba(212,175,55,0.65)",
                fontWeight: 600,
              }}
            >
              🕯 {candleTotal} candle{candleTotal !== 1 ? "s" : ""} lit in
              memory
            </div>
          )}
        </div>

        {/* ── Yahrzeit Alert ── */}
        {isYahrzeitSoon && yahrzeit && (
          <div
            style={{
              margin: "12px 16px 0",
              borderRadius: 14,
              background:
                yahrzeit.daysAway === 0
                  ? "linear-gradient(135deg,rgba(212,168,67,0.18),rgba(212,168,67,0.08))"
                  : "rgba(212,168,67,0.07)",
              border: `1px solid rgba(212,168,67,${yahrzeit.daysAway === 0 ? "0.5" : "0.25"})`,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>🕎</span>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#D4AF37",
                }}
              >
                {yahrzeit.daysAway === 0
                  ? "Yahrzeit Today — יהי זכרם ברוך"
                  : `Yahrzeit in ${yahrzeit.daysAway} day${yahrzeit.daysAway !== 1 ? "s" : ""}`}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(212,175,55,0.55)",
                  marginTop: 2,
                }}
              >
                {yahrzeit.hebrewDate} ·{" "}
                {yahrzeit.gregorianDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Action row ── */}
        <div
          style={{
            padding: "14px 16px 0",
            display: "flex",
            gap: 8,
          }}
        >
          {[
            {
              icon: "🕯",
              label: "LIGHT",
              active: showCandleForm,
              color: "#D4AF37",
              bg: "rgba(212,175,55,",
              ariaLabel: showCandleForm ? "Close candle form" : "Light a candle",
              onClick: () => {
                setShowCandleForm((f) => !f);
                setShowTributeForm(false);
              },
            },
            {
              icon: "📝",
              label: "TRIBUTE",
              active: showTributeForm,
              color: "rgba(167,139,250,0.95)",
              bg: "rgba(167,139,250,",
              ariaLabel: showTributeForm ? "Close tribute form" : "Leave a tribute",
              onClick: () => {
                setShowTributeForm((f) => !f);
                setShowCandleForm(false);
              },
            },
            {
              icon: copied ? "✅" : "🔗",
              label: copied ? "COPIED" : "SHARE",
              active: copied,
              color: "rgba(255,255,255,0.55)",
              bg: "rgba(255,255,255,",
              ariaLabel: copied ? "Link copied to clipboard" : "Share this memorial",
              onClick: handleShare,
            },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label={btn.ariaLabel}
              aria-pressed={btn.active}
              onClick={btn.onClick}
              style={{
                flex: 1,
                padding: "11px 6px",
                background: btn.active
                  ? `${btn.bg}0.18)`
                  : `${btn.bg}0.04)`,
                border: `1px solid ${btn.active ? `${btn.bg}0.5)` : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 18 }}>{btn.icon}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: btn.active ? btn.color : "rgba(255,255,255,0.45)",
                  letterSpacing: "0.04em",
                }}
              >
                {btn.label}
              </span>
            </motion.button>
          ))}
        </div>

        <div style={{ padding: "14px 16px 0" }}>
          {/* ── Light Candle Form ── */}
          <AnimatePresence>
            {showCandleForm && (
              <motion.div
                key="candle-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", marginBottom: 4 }}
              >
                <GlassSection>
                  <SectionHeader icon="🕯" title="Light a Candle" />
                  {candleDone ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "14px 0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 30,
                          marginBottom: 8,
                          animation: "ms-flicker 1.8s infinite",
                        }}
                      >
                        🕯
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#D4AF37",
                        }}
                      >
                        Candle Lit
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          marginTop: 4,
                        }}
                      >
                        May their memory be a blessing
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          flexWrap: "wrap",
                          marginBottom: 10,
                        }}
                      >
                        {CANDLE_TYPES.map((ct) => (
                          <button
                            key={ct.value}
                            type="button"
                            onClick={() => setCandleType(ct.value)}
                            aria-pressed={candleType === ct.value}
                            aria-label={`Candle type: ${ct.label}`}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              background:
                                candleType === ct.value
                                  ? "rgba(212,175,55,0.2)"
                                  : "rgba(255,255,255,0.04)",
                              border:
                                candleType === ct.value
                                  ? "1px solid #D4AF37"
                                  : "1px solid rgba(255,255,255,0.08)",
                              color:
                                candleType === ct.value
                                  ? "#D4AF37"
                                  : "rgba(255,255,255,0.45)",
                            }}
                          >
                            {ct.emoji} {ct.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={candleMsg}
                        onChange={(e) => setCandleMsg(e.target.value)}
                        placeholder="A few words in their memory…"
                        aria-label="Memorial message"
                        rows={2}
                        style={{
                          ...inputSt,
                          resize: "none",
                          fontFamily: "inherit",
                          marginBottom: 8,
                        }}
                      />
                      {!candleAnon && (
                        <input
                          value={candleGuestName}
                          onChange={(e) =>
                            setCandleGuestName(e.target.value)
                          }
                          placeholder="Your name (optional)"
                          aria-label="Your name (optional)"
                          style={{ ...inputSt, marginBottom: 8 }}
                        />
                      )}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 10,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={candleAnon}
                          onChange={(e) =>
                            setCandleAnon(e.target.checked)
                          }
                          style={{ accentColor: "#D4AF37" }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.45)",
                          }}
                        >
                          Light anonymously
                        </span>
                      </label>
                      {candleErr && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#f87171",
                            marginBottom: 8,
                          }}
                        >
                          {candleErr}
                        </div>
                      )}
                      <motion.button
                        onClick={handleLight}
                        disabled={candleSaving}
                        whileHover={!candleSaving ? { scale: 1.01 } : {}}
                        style={{
                          width: "100%",
                          padding: "12px 0",
                          background: candleSaving
                            ? "rgba(212,175,55,0.2)"
                            : "linear-gradient(135deg,#D4AF37,#8a6000)",
                          border: "none",
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 800,
                          color: candleSaving
                            ? "rgba(212,175,55,0.5)"
                            : "#0F1829",
                          cursor: candleSaving ? "default" : "pointer",
                        }}
                      >
                        {candleSaving ? "Lighting…" : "🕯 Light the Candle"}
                      </motion.button>
                    </>
                  )}
                </GlassSection>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tribute Form ── */}
          <AnimatePresence>
            {showTributeForm && (
              <motion.div
                key="tribute-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", marginBottom: 4 }}
              >
                <GlassSection>
                  <SectionHeader icon="📝" title="Leave a Tribute" />
                  {tributeDone ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "14px 0",
                      }}
                    >
                      <div
                        style={{ fontSize: 30, marginBottom: 8 }}
                      >
                        🕊
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#D4AF37",
                        }}
                      >
                        Tribute Submitted
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          marginTop: 4,
                        }}
                      >
                        May it be for a blessing
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          flexWrap: "wrap",
                          marginBottom: 10,
                        }}
                      >
                        {TRIBUTE_TYPES.map((tt) => (
                          <button
                            key={tt.value}
                            type="button"
                            onClick={() => setTributeType(tt.value)}
                            aria-pressed={tributeType === tt.value}
                            aria-label={`Tribute type: ${tt.label}`}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              background:
                                tributeType === tt.value
                                  ? "rgba(167,139,250,0.2)"
                                  : "rgba(255,255,255,0.04)",
                              border:
                                tributeType === tt.value
                                  ? "1px solid rgba(167,139,250,0.8)"
                                  : "1px solid rgba(255,255,255,0.08)",
                              color:
                                tributeType === tt.value
                                  ? "rgba(167,139,250,0.95)"
                                  : "rgba(255,255,255,0.45)",
                            }}
                          >
                            {tt.emoji} {tt.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={tributeBody}
                        onChange={(e) => setTributeBody(e.target.value)}
                        placeholder="Share a memory, prayer, or blessing…"
                        aria-label="Tribute message"
                        rows={3}
                        style={{
                          ...inputSt,
                          resize: "none",
                          fontFamily: "inherit",
                          marginBottom: 8,
                        }}
                      />
                      {!tributeAnon && (
                        <input
                          value={tributeGuestName}
                          onChange={(e) =>
                            setTributeGuestName(e.target.value)
                          }
                          placeholder="Your name (optional)"
                          aria-label="Your name (optional)"
                          style={{ ...inputSt, marginBottom: 8 }}
                        />
                      )}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 10,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={tributeAnon}
                          onChange={(e) =>
                            setTributeAnon(e.target.checked)
                          }
                          style={{ accentColor: "#D4AF37" }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.45)",
                          }}
                        >
                          Submit anonymously
                        </span>
                      </label>
                      {tributeErr && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#f87171",
                            marginBottom: 8,
                          }}
                        >
                          {tributeErr}
                        </div>
                      )}
                      <motion.button
                        onClick={handleTribute}
                        disabled={tributeSaving || !tributeBody.trim()}
                        whileHover={!tributeSaving ? { scale: 1.01 } : {}}
                        style={{
                          width: "100%",
                          padding: "12px 0",
                          background:
                            tributeSaving || !tributeBody.trim()
                              ? "rgba(167,139,250,0.15)"
                              : "linear-gradient(135deg,#a78bfa,#7c3aed)",
                          border: "none",
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 800,
                          color:
                            tributeSaving || !tributeBody.trim()
                              ? "rgba(167,139,250,0.5)"
                              : "#fff",
                          cursor:
                            tributeSaving || !tributeBody.trim()
                              ? "default"
                              : "pointer",
                        }}
                      >
                        {tributeSaving ? "Submitting…" : "📝 Submit Tribute"}
                      </motion.button>
                    </>
                  )}
                </GlassSection>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Biography ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionHeader icon="📖" title="Biography" />
            <GlassSection>
              {person.biography ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {person.biography}
                </p>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  No biography yet
                </div>
              )}
            </GlassSection>
          </div>

          {/* ── Candles ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionHeader
              icon="🕯"
              title={`Candles${candleTotal > 0 ? ` (${candleTotal})` : ""}`}
              action={
                <button
                  onClick={() => {
                    setShowCandleForm((f) => !f);
                    setShowTributeForm(false);
                  }}
                  style={{
                    fontSize: 10,
                    color: "#D4AF37",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  + Light
                </button>
              }
            />
            <GlassSection>
              {candles.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  No candles yet — be the first
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {candles.slice(0, 8).map((c) => (
                    <CandleRow key={c.id} candle={c} />
                  ))}
                </div>
              )}
              {candleHasMore && (
                <button
                  onClick={loadMoreCandles}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Load more candles
                </button>
              )}
            </GlassSection>
          </div>

          {/* ── Tributes ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionHeader
              icon="📝"
              title={`Tributes${approvedTributes.length > 0 ? ` (${approvedTributes.length})` : ""}`}
              action={
                <button
                  onClick={() => {
                    setShowTributeForm((f) => !f);
                    setShowCandleForm(false);
                  }}
                  style={{
                    fontSize: 10,
                    color: "rgba(167,139,250,0.9)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  + Add
                </button>
              }
            />
            <GlassSection>
              {approvedTributes.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  No tributes yet
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {approvedTributes.slice(0, 8).map((tr) => (
                    <TributeRow key={tr.id} tribute={tr} />
                  ))}
                </div>
              )}
              {tributeHasMore && (
                <button
                  onClick={loadMoreTributes}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Load more tributes
                </button>
              )}
            </GlassSection>
          </div>

          {/* ── Family ── */}
          {(person.hebrewFatherName ||
            person.hebrewMotherName ||
            person.tribeAffiliation ||
            person.occupation) && (
            <div style={{ marginBottom: 2 }}>
              <SectionHeader icon="👪" title="Family" />
              <GlassSection>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {person.hebrewFatherName && (
                    <FamilyRow
                      label="Father"
                      value={person.hebrewFatherName}
                    />
                  )}
                  {person.hebrewMotherName && (
                    <FamilyRow
                      label="Mother"
                      value={person.hebrewMotherName}
                    />
                  )}
                  {person.tribeAffiliation && (
                    <FamilyRow
                      label="Tribe"
                      value={person.tribeAffiliation}
                    />
                  )}
                  {person.occupation && (
                    <FamilyRow
                      label="Occupation"
                      value={person.occupation}
                    />
                  )}
                </div>
              </GlassSection>
            </div>
          )}

          {/* ── Location ── */}
          {(person.birthCity ||
            person.birthCountry ||
            person.deathCity ||
            person.deathCountry) && (
            <div style={{ marginBottom: 2 }}>
              <SectionHeader icon="📍" title="Location" />
              <GlassSection>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {(person.birthCity || person.birthCountry) && (
                    <FamilyRow
                      label="Born"
                      value={[person.birthCity, person.birthCountry]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  )}
                  {(person.deathCity || person.deathCountry) && (
                    <FamilyRow
                      label="Died"
                      value={[person.deathCity, person.deathCountry]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  )}
                </div>
              </GlassSection>
            </div>
          )}

          {/* ── Upcoming Yahrzeit ── */}
          {yahrzeit && (
            <div style={{ marginBottom: 2 }}>
              <SectionHeader icon="🕎" title="Upcoming Yahrzeit" />
              <GlassSection gold>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(212,168,67,0.1)",
                      border: "1px solid rgba(212,168,67,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    🕎
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#D4AF37",
                      }}
                    >
                      {yahrzeit.daysAway === 0
                        ? "Today!"
                        : yahrzeit.gregorianDate.toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(212,175,55,0.55)",
                        marginTop: 3,
                      }}
                    >
                      {yahrzeit.hebrewDate}
                      {yahrzeit.daysAway > 0 &&
                        ` · ${yahrzeit.daysAway} day${yahrzeit.daysAway !== 1 ? "s" : ""} away`}
                    </div>
                  </div>
                </div>
              </GlassSection>
            </div>
          )}

          {/* ── Hebrew blessing footer ── */}
          <div
            style={{ textAlign: "center", padding: "16px 0 8px" }}
          >
            <div
              style={{
                fontFamily: "'Noto Serif Hebrew',serif",
                fontSize: 18,
                color: "rgba(212,175,55,0.6)",
              }}
            >
              יהי זכרם ברוך
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.28)",
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              May their memory be a blessing
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MemorialBrowserPanel — the main exported component
   ════════════════════════════════════════════════════════════════════════════ */

export function MemorialBrowserPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [browseSlug, setBrowseSlug] = useState<string | null>(null);
  const [minimised, setMinimised] = useState(false);
  const search = useSearch();
  const collections = useCollections();
  const isSearching = search.query.trim().length > 0;

  return (
    <>
      {/* ── Browse Panel (left side) ── */}
      <motion.div
        key="browse-panel"
        initial={{ x: -48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -48, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className={
          minimised ? undefined : "ms-scroll-strip ms-home-panel-override"
        }
        style={{
          position: "absolute",
          left: 14,
          top: 72,
          zIndex: 22,
          width: minimised ? 220 : 270,
          maxHeight: minimised ? "none" : "calc(100dvh - 148px)",
          overflowY: minimised ? "visible" : "auto",
          overflowX: "hidden",
          background: "rgba(4,2,14,0.94)",
          backdropFilter: "blur(32px) saturate(1.9)",
          border: "1px solid rgba(212,175,55,0.20)",
          borderRadius: minimised ? 16 : 24,
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)",
          fontFamily: "Inter,-apple-system,sans-serif",
        }}
      >
        {/* ── Panel header ── */}
        <div
          style={{
            padding: minimised ? "10px 14px" : "14px 16px 10px",
            background:
              "linear-gradient(180deg,rgba(212,175,55,0.08) 0%,transparent 100%)",
            borderBottom: minimised
              ? "none"
              : "1px solid rgba(255,255,255,0.055)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {minimised ? (
            <>
              <span
                style={{
                  fontSize: 16,
                  filter: "drop-shadow(0 0 4px rgba(212,175,55,0.7))",
                  flexShrink: 0,
                }}
              >
                🔍
              </span>
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#D4AF37",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Browse Memorials
              </div>
              <button
                onClick={() => setMinimised(false)}
                aria-label="Expand"
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.28)",
                  color: "#D4AF37",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#D4AF37",
                    marginBottom: 2,
                  }}
                >
                  Browse Memorials
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.32)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Sacred memorial profiles
                </div>
              </div>
              <button
                onClick={() => setMinimised(true)}
                aria-label="Minimise"
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* ── Panel body (hidden when minimised) ── */}
        {!minimised && (
          <div style={{ padding: "12px 14px" }}>
            {/* Search bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 12px",
                height: 38,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.45 }}>🔍</span>
              <input
                className="ms-search-input"
                placeholder="Search memorials…"
                value={search.query}
                onChange={(e) => search.setQuery(e.target.value)}
                style={{ flex: 1, fontSize: 12 }}
              />
              {search.query && (
                <button
                  onClick={search.reset}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search results */}
            {isSearching && (
              <>
                {search.status === "loading" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "14px 0",
                    }}
                  >
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#D4AF37",
                            opacity: 0.6,
                            animation: `ms-badge-glow 1.2s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {search.status === "success" &&
                  search.results.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "14px 0",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      No memorials found
                    </div>
                  )}
                {search.status === "success" &&
                  search.results.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          letterSpacing: "0.12em",
                          color: "rgba(212,175,55,0.55)",
                          marginBottom: 4,
                        }}
                      >
                        {search.total} RESULT
                        {search.total !== 1 ? "S" : ""}
                      </div>
                      {search.results.map((m) => (
                        <SearchResultRow
                          key={m.id}
                          item={m}
                          onSelect={setBrowseSlug}
                        />
                      ))}
                      {search.hasMore && (
                        <button
                          onClick={search.loadMore}
                          style={{
                            padding: "8px",
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.03)",
                            border:
                              "1px solid rgba(255,255,255,0.07)",
                            color: "rgba(255,255,255,0.4)",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Load more
                        </button>
                      )}
                    </div>
                  )}
              </>
            )}

            {/* Collections (non-search) */}
            {!isSearching && (
              <>
                <CollectionStrip
                  title="Recently Remembered"
                  icon="✨"
                  items={collections.recentlyRemembered.items}
                  status={collections.recentlyRemembered.status}
                  onSelect={setBrowseSlug}
                />
                <CollectionStrip
                  title="Recently Lit"
                  icon="🔥"
                  items={collections.recentlyLit.items}
                  status={collections.recentlyLit.status}
                  onSelect={setBrowseSlug}
                />
                <CollectionStrip
                  title="Upcoming Yahrzeit"
                  icon="🕎"
                  items={collections.upcomingYahrzeit.items}
                  status={collections.upcomingYahrzeit.status}
                  onSelect={setBrowseSlug}
                />
                <CollectionStrip
                  title="Most Visited"
                  icon="👁"
                  items={collections.mostVisited.items}
                  status={collections.mostVisited.status}
                  onSelect={setBrowseSlug}
                />
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Full Profile Panel (full-screen overlay, z-60) ── */}
      <AnimatePresence>
        {browseSlug && (
          <FullMemorialProfile
            slug={browseSlug}
            onClose={() => setBrowseSlug(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
