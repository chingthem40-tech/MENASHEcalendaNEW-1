import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  type FormEvent,
} from "react";
import {
  fetchFamilyTimeline,
  createFamilyTimelineEvent,
  deleteFamilyTimelineEvent,
  ApiError,
  type FamilyTimelineEvent,
  type FilterKey,
  type EventType,
  type CreateEventInput,
} from "../lib/familyTimelineApi";

// ── Event type metadata ──────────────────────────────────────────────────────
const EVENT_META: Record<
  EventType,
  { icon: string; label: string; color: string; bg: string }
> = {
  birth:          { icon: "👶", label: "Birth",               color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  hebrew_birthday:{ icon: "🌟", label: "Hebrew Birthday",     color: "#d4a843", bg: "rgba(212,168,67,0.12)" },
  anniversary:    { icon: "💍", label: "Anniversary",         color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  yahrzeit:       { icon: "🕯️", label: "Yahrzeit",            color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  marriage:       { icon: "💒", label: "Marriage",            color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  aliyah:         { icon: "✈️", label: "Aliyah",             color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  milestone:      { icon: "🏆", label: "Family Milestone",    color: "#d4a843", bg: "rgba(212,168,67,0.12)" },
  achievement:    { icon: "🎖️", label: "Community Achievement",color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  document:       { icon: "📜", label: "Document Added",      color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  photo:          { icon: "📸", label: "Photo Added",         color: "#34d399", bg: "rgba(52,211,153,0.12)" },
};

// ── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "births",       label: "Births" },
  { key: "anniversaries",label: "Anniversaries" },
  { key: "yahrzeits",    label: "Yahrzeits" },
  { key: "milestones",   label: "Milestones" },
  { key: "documents",    label: "Documents" },
  { key: "photos",       label: "Photos" },
];

const EVENT_TYPES = Object.keys(EVENT_META) as EventType[];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtGregorianDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

function avatarBg(name: string): string {
  const colors = [
    "#1a3050","#2a1a40","#1a2a20","#30200a",
    "#1a1a30","#2a1030","#0f2030","#301020",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

// ── Add-event modal ──────────────────────────────────────────────────────────
const AddEventModal = memo(function AddEventModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (ev: FamilyTimelineEvent) => void;
}) {
  const [form, setForm] = useState<{
    eventType: EventType;
    title: string;
    description: string;
    memberName: string;
    gregorianDate: string;
    hebrewDate: string;
    icon: string;
  }>({
    eventType: "milestone",
    title: "",
    description: "",
    memberName: "",
    gregorianDate: "",
    hebrewDate: "",
    icon: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const meta = EVENT_META[form.eventType];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      const input: CreateEventInput = {
        eventType:     form.eventType,
        title:         form.title.trim(),
        description:   form.description.trim(),
        memberName:    form.memberName.trim(),
        gregorianDate: form.gregorianDate || null,
        hebrewDate:    form.hebrewDate.trim(),
        icon:          form.icon.trim() || meta.icon,
      };
      const created = await createFamilyTimelineEvent(input);
      onAdded(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Add family event"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-handle" />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              {meta.icon} Add Family Event
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Preserve your family's precious moments
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Event type selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Event Type
            </label>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
            }}>
              {EVENT_TYPES.map((type) => {
                const m = EVENT_META[type];
                const active = form.eventType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, eventType: type, icon: m.icon }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 12px", borderRadius: 10,
                      border: `1px solid ${active ? m.color : "var(--border)"}`,
                      background: active ? m.bg : "transparent",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: active ? m.color : "var(--text-muted)",
                    }}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Event Title *
            </label>
            <input
              type="text"
              placeholder={`e.g. ${meta.label} of Miriam Cohen`}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={300}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                background: "var(--elevated)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Family member name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Family Member Name
            </label>
            <input
              type="text"
              placeholder="Full name"
              value={form.memberName}
              onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))}
              maxLength={200}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                background: "var(--elevated)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Dates row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Gregorian Date
              </label>
              <input
                type="date"
                value={form.gregorianDate}
                onChange={(e) => setForm((f) => ({ ...f, gregorianDate: e.target.value }))}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  background: "var(--elevated)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 13,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Hebrew Date
              </label>
              <input
                type="text"
                placeholder="כ״ה אב תשפ״ו"
                value={form.hebrewDate}
                onChange={(e) => setForm((f) => ({ ...f, hebrewDate: e.target.value }))}
                maxLength={100}
                dir="rtl"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  background: "var(--elevated)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: 13,
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Short Description
            </label>
            <textarea
              placeholder="Share the story behind this moment…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={2000}
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                background: "var(--elevated)", border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 13,
                outline: "none", resize: "vertical", fontFamily: "inherit",
                lineHeight: 1.6, boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 14,
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%", padding: "13px",
              background: saving
                ? "rgba(212,168,67,0.3)"
                : "linear-gradient(135deg, #b8860b 0%, #d4a843 50%, #f0c96a 100%)",
              border: "none", borderRadius: 12, cursor: saving ? "not-allowed" : "pointer",
              color: "#000", fontSize: 14, fontWeight: 800,
              letterSpacing: "0.02em", transition: "opacity 0.15s",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "✨ Add to Family Timeline"}
          </button>
        </form>
      </div>
    </div>
  );
});

// ── Detail modal ─────────────────────────────────────────────────────────────
const DetailModal = memo(function DetailModal({
  event,
  onClose,
  onDelete,
}: {
  event: FamilyTimelineEvent;
  onClose: () => void;
  onDelete: () => void;
}) {
  const meta = EVENT_META[event.eventType] ?? EVENT_META.milestone;
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Remove this event from your family timeline?")) return;
    setDeleting(true);
    try {
      await deleteFamilyTimelineEvent(event.id);
      onDelete();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="modal-handle" />

        {/* Event type badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: meta.bg, border: `1px solid ${meta.color}44`,
          borderRadius: 20, padding: "4px 12px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 14 }}>{event.icon || meta.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.06em" }}>
            {meta.label}
          </span>
        </div>

        {/* Member avatar + name */}
        {event.memberName && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            {event.memberPhotoUrl ? (
              <img
                src={event.memberPhotoUrl}
                alt={event.memberName}
                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,168,67,0.4)" }}
              />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: avatarBg(event.memberName),
                border: "2px solid rgba(212,168,67,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#d4a843" }}>
                  {initials(event.memberName)}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                {event.memberName}
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.3 }}>
          {event.title}
        </div>

        {/* Dates */}
        {(event.gregorianDate || event.hebrewDate) && (
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16,
          }}>
            {event.gregorianDate && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--elevated)", border: "1px solid var(--border)",
                borderRadius: 20, padding: "5px 12px",
              }}>
                <span style={{ fontSize: 12 }}>📅</span>
                <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>
                  {fmtGregorianDate(event.gregorianDate)}
                </span>
              </div>
            )}
            {event.hebrewDate && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--elevated)", border: "1px solid var(--border)",
                borderRadius: 20, padding: "5px 12px",
              }}>
                <span style={{ fontSize: 12 }}>🕍</span>
                <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600, fontFamily: "serif", direction: "rtl" }}>
                  {event.hebrewDate}
                </span>
              </div>
            )}
          </div>
        )}

        {event.description && (
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "var(--elevated)", border: "1px solid var(--border)",
            fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7,
            marginBottom: 20,
          }}>
            {event.description}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {event.detailsUrl && (
            <a
              href={event.detailsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: "11px", borderRadius: 12, textAlign: "center",
                background: "linear-gradient(135deg, #b8860b 0%, #d4a843 50%, #f0c96a 100%)",
                color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              🔗 View Details
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              flex: event.detailsUrl ? "0 0 auto" : 1,
              padding: "11px 16px", borderRadius: 12,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: 13, fontWeight: 700,
              cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            {deleting ? "…" : "🗑️ Remove"}
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Timeline event card ──────────────────────────────────────────────────────
const TimelineCard = memo(function TimelineCard({
  event,
  isLast,
  onClick,
  index,
}: {
  event: FamilyTimelineEvent;
  isLast: boolean;
  onClick: () => void;
  index: number;
}) {
  const meta = EVENT_META[event.eventType] ?? EVENT_META.milestone;

  return (
    <div
      style={{
        display: "flex", gap: 0,
        animation: `cardEnter 0.3s cubic-bezier(0.34,1.56,0.64,1) ${Math.min(index * 60, 400)}ms both`,
      }}
    >
      {/* Timeline spine + icon */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 48 }}>
        {/* Icon circle */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: meta.bg,
          border: `2px solid ${meta.color}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0, zIndex: 1,
          boxShadow: `0 0 0 4px var(--card), 0 0 12px ${meta.color}22`,
          transition: "box-shadow 0.2s",
        }}>
          {event.icon || meta.icon}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 20,
            background: `linear-gradient(to bottom, ${meta.color}44 0%, var(--border) 100%)`,
            marginTop: 4,
          }} />
        )}
      </div>

      {/* Content card */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 14, paddingBottom: isLast ? 0 : 20 }}>
        <button
          type="button"
          onClick={onClick}
          style={{
            width: "100%", textAlign: "left",
            background: "var(--elevated)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "14px 16px",
            cursor: "pointer", transition: "all 0.18s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = `${meta.color}55`;
            el.style.background  = "var(--card-secondary, var(--elevated))";
            el.style.transform   = "translateY(-1px)";
            el.style.boxShadow   = `0 4px 20px ${meta.color}18`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--border)";
            el.style.background  = "var(--elevated)";
            el.style.transform   = "translateY(0)";
            el.style.boxShadow   = "none";
          }}
        >
          {/* Top row: member + date */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 8, marginBottom: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {/* Member avatar */}
              {event.memberName ? (
                event.memberPhotoUrl ? (
                  <img
                    src={event.memberPhotoUrl}
                    alt={event.memberName}
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: avatarBg(event.memberName), flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#d4a843" }}>
                      {initials(event.memberName)}
                    </span>
                  </div>
                )
              ) : null}

              {/* Member name + event type badge */}
              <div style={{ minWidth: 0 }}>
                {event.memberName && (
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: "var(--text-primary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {event.memberName}
                  </div>
                )}
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  background: meta.bg, borderRadius: 6, padding: "1px 7px",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Date */}
            {event.gregorianDate && (
              <div style={{
                fontSize: 10, color: "var(--text-muted)", flexShrink: 0,
                textAlign: "right", lineHeight: 1.4,
              }}>
                {fmtGregorianDate(event.gregorianDate)}
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
            marginBottom: event.description || event.hebrewDate ? 6 : 0,
            lineHeight: 1.4,
          }}>
            {event.title}
          </div>

          {/* Hebrew date */}
          {event.hebrewDate && (
            <div style={{
              fontSize: 12, color: "var(--text-muted)", marginBottom: event.description ? 6 : 0,
              fontFamily: "serif", direction: "rtl", textAlign: "right",
            }}>
              {event.hebrewDate}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={{
              fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}>
              {event.description}
            </div>
          )}

          {/* View details hint */}
          <div style={{
            marginTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 4,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
              View Details
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5"
              style={{ width: 12, height: 12 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
});

// ── Main FamilyTimeline component ────────────────────────────────────────────
interface FamilyTimelineProps {
  /** If false, show a sign-in prompt instead */
  isSignedIn: boolean;
}

const FamilyTimeline = memo(function FamilyTimeline({ isSignedIn }: FamilyTimelineProps) {
  const [events,         setEvents]         = useState<FamilyTimelineEvent[]>([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [error,          setError]          = useState("");
  const [needsAuth,      setNeedsAuth]      = useState(false);
  const [filter,         setFilter]         = useState<FilterKey>("all");
  const [search,         setSearch]         = useState("");
  const [searchInput,    setSearchInput]    = useState("");
  const [showAdd,        setShowAdd]        = useState(false);
  const [selectedEvent,  setSelectedEvent]  = useState<FamilyTimelineEvent | null>(null);

  const LIMIT = 20;
  const observerRef = useRef<HTMLDivElement | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(
    async (pg: number, f: FilterKey, s: string, append = false) => {
      if (pg === 1) setLoading(true); else setLoadingMore(true);
      setError("");
      setNeedsAuth(false);
      try {
        const data = await fetchFamilyTimeline({ filter: f, search: s, page: pg, limit: LIMIT });
        setEvents((prev) => append ? [...prev, ...data.events] : data.events);
        setTotal(data.total);
        setPage(pg);
        setHasMore(data.hasMore);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setNeedsAuth(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load timeline");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Initial + filter/search load
  useEffect(() => {
    if (!isSignedIn) return;
    load(1, filter, search);
  }, [isSignedIn, filter, search, load]);

  // Search debounce
  function handleSearchInput(val: string) {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val.trim()), 400);
  }

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!observerRef.current || !hasMore || loadingMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          load(page + 1, filter, search, true);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(observerRef.current);
    return () => io.disconnect();
  }, [hasMore, loadingMore, page, filter, search, load]);

  // Real-time polling (every 30 s) — stop if auth isn't configured
  useEffect(() => {
    if (!isSignedIn || needsAuth) return;
    const id = setInterval(() => load(1, filter, search), 30_000);
    return () => clearInterval(id);
  }, [isSignedIn, needsAuth, filter, search, load]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleEventAdded(ev: FamilyTimelineEvent) {
    setEvents((prev) => [ev, ...prev]);
    setTotal((t) => t + 1);
  }

  function handleEventDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    setSelectedEvent(null);
  }

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div style={{
        padding: "32px 20px", textAlign: "center",
        background: "var(--elevated)", borderRadius: 16,
        border: "1px solid var(--border)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌳</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          Family Timeline
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Sign in to preserve your family's sacred history.
        </div>
      </div>
    );
  }

  // ── Auth not configured on server (no CLERK_SECRET_KEY yet) ────────────────
  if (needsAuth) {
    return (
      <div style={{
        padding: "28px 20px", textAlign: "center",
        background: "linear-gradient(145deg, rgba(212,168,67,0.04) 0%, var(--elevated) 100%)",
        borderRadius: 16, border: "1px solid rgba(212,168,67,0.15)",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          Authentication Required
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>
          The Family Timeline needs authentication to be configured on the server before it can load.
          Once authentication is set up, your family history will appear here.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search + Add row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              width: 14, height: 14, color: "var(--text-muted)", pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search events, names…"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 14,
              paddingTop: 9, paddingBottom: 9,
              background: "var(--elevated)", border: "1px solid var(--border)",
              borderRadius: 10, color: "var(--text-primary)", fontSize: 13,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          style={{
            flexShrink: 0, padding: "9px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, #b8860b 0%, #d4a843 50%, #f0c96a 100%)",
            border: "none", cursor: "pointer",
            color: "#000", fontSize: 13, fontWeight: 800,
            display: "flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <span>+</span> Add Event
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
        marginBottom: 20, scrollbarWidth: "none",
      }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20,
              border: `1px solid ${filter === key ? "#d4a843" : "var(--border)"}`,
              background: filter === key ? "rgba(212,168,67,0.15)" : "var(--elevated)",
              color: filter === key ? "#d4a843" : "var(--text-muted)",
              fontSize: 12, fontWeight: filter === key ? 700 : 500,
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count */}
      {!loading && total > 0 && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16, paddingLeft: 2 }}>
          {total} event{total !== 1 ? "s" : ""} in your family history
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 16,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", gap: 0 }}>
              <div style={{ width: 48, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--elevated)", animation: "skeletonSweep 1.4s infinite",
                }} />
                {i < 2 && <div style={{ width: 2, flex: 1, minHeight: 20, background: "var(--border)" }} />}
              </div>
              <div style={{ flex: 1, paddingLeft: 14, paddingBottom: 20 }}>
                <div style={{
                  height: 100, borderRadius: 14,
                  background: "var(--elevated)", animation: "skeletonSweep 1.4s infinite",
                  animationDelay: `${i * 150}ms`,
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* ── Empty onboarding ── */
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "linear-gradient(145deg, rgba(212,168,67,0.04) 0%, var(--elevated) 100%)",
          border: "1px solid rgba(212,168,67,0.15)",
          borderRadius: 20,
        }}>
          {/* Gold accent top bar */}
          <div style={{
            width: 48, height: 3, borderRadius: 2, margin: "0 auto 24px",
            background: "linear-gradient(90deg, #b8860b, #d4a843, #f0c96a)",
          }} />

          <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>🌳</div>

          <div style={{
            fontSize: 18, fontWeight: 800, color: "var(--text-primary)",
            marginBottom: 8, lineHeight: 1.3,
          }}>
            Your family's story begins here
          </div>
          <div style={{
            fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7,
            maxWidth: 280, margin: "0 auto 24px",
          }}>
            {search || filter !== "all"
              ? "No events match your search. Try a different filter or search term."
              : "Add your first family event to start building a living record of births, yahrzeits, milestones, and sacred moments that will be cherished for generations."}
          </div>

          {(!search && filter === "all") && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              style={{
                padding: "12px 24px", borderRadius: 12,
                background: "linear-gradient(135deg, #b8860b 0%, #d4a843 50%, #f0c96a 100%)",
                border: "none", cursor: "pointer",
                color: "#000", fontSize: 13, fontWeight: 800,
                letterSpacing: "0.02em",
              }}
            >
              ✨ Add Your First Family Event
            </button>
          )}
        </div>
      ) : (
        /* ── Timeline ── */
        <div>
          {events.map((ev, idx) => (
            <TimelineCard
              key={ev.id}
              event={ev}
              isLast={idx === events.length - 1 && !hasMore}
              onClick={() => setSelectedEvent(ev)}
              index={idx}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={observerRef} style={{ height: 1 }} />

          {loadingMore && (
            <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Loading more events…
            </div>
          )}

          {!hasMore && events.length > 0 && (
            <div style={{
              textAlign: "center", padding: "20px 0 4px",
              fontSize: 12, color: "var(--text-muted)",
            }}>
              ✦ {total} event{total !== 1 ? "s" : ""} in your family history ✦
            </div>
          )}
        </div>
      )}

      {/* Add event modal */}
      {showAdd && (
        <AddEventModal
          onClose={() => setShowAdd(false)}
          onAdded={handleEventAdded}
        />
      )}

      {/* Detail modal */}
      {selectedEvent && (
        <DetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => handleEventDeleted(selectedEvent.id)}
        />
      )}
    </>
  );
});

export default FamilyTimeline;
