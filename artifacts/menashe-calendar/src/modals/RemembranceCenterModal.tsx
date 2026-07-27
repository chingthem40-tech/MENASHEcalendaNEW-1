import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  createRemembranceEvent,
  deleteRemembranceEvent,
  fetchRemembranceEvents,
  updateRemembranceEvent,
  type RemembranceEvent,
  type RemembranceEventInput,
  type RemembranceEventType,
} from "../lib/remembranceApi";
import { fetchCensusBranch } from "../lib/userApi";
import type {
  Branch,
  Family,
  FamilyMember,
} from "@workspace/shared-core/census";
import {
  formatRemembranceDate,
  getAllOccurrences,
  getNextRemembranceOccurrence,
  HEBREW_MONTHS,
} from "../lib/remembrance";
import { downloadICS, generateFamilyICS } from "../lib/icsExport";

interface Props {
  onClose: () => void;
}

type View = "list" | "form" | "detail";

interface FormState {
  name: string;
  relationship: string;
  eventType: RemembranceEventType;
  gregorianDate: string;
  hebrewDay: string;
  hebrewMonth: string;
  hebrewYear: string;
  usesHebrewDate: boolean;
  beforeSunset: boolean;
  notificationEnabled: boolean;
  notificationDays: number;
  notificationTime: string;
  repeatAnnually: boolean;
  location: string;
  notes: string;
  censusBranchId: string;
}

const gold = "#d4a843";
const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 11px",
  borderRadius: 9,
  background: "var(--card)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 5,
  color: "var(--text-muted)",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

function emptyForm(eventType: RemembranceEventType = "yahrzeit"): FormState {
  return {
    name: "",
    relationship: "",
    eventType,
    gregorianDate: "",
    hebrewDay: "",
    hebrewMonth: "",
    hebrewYear: "",
    usesHebrewDate: false,
    beforeSunset: true,
    notificationEnabled: true,
    notificationDays: 3,
    notificationTime: "09:00",
    repeatAnnually: true,
    location: "",
    notes: "",
    censusBranchId: "",
  };
}

function formFromEvent(event: RemembranceEvent): FormState {
  return {
    name: event.name,
    relationship: event.relationship,
    eventType: event.eventType,
    gregorianDate: event.gregorianDate ?? "",
    hebrewDay: event.hebrewDay ? String(event.hebrewDay) : "",
    hebrewMonth: event.hebrewMonth ? String(event.hebrewMonth) : "",
    hebrewYear: event.hebrewYear ? String(event.hebrewYear) : "",
    usesHebrewDate: event.usesHebrewDate,
    beforeSunset: event.beforeSunset,
    notificationEnabled: event.notificationEnabled,
    notificationDays: event.notificationDays,
    notificationTime: event.notificationTime,
    repeatAnnually: event.repeatAnnually,
    location: event.location,
    notes: event.notes,
    censusBranchId: event.censusBranchId ?? "",
  };
}

function eventFromForm(form: FormState, id: string): RemembranceEventInput {
  return {
    id,
    name: form.name.trim(),
    relationship: form.relationship.trim(),
    eventType: form.eventType,
    gregorianDate: form.gregorianDate || undefined,
    hebrewDay: form.hebrewDay ? Number(form.hebrewDay) : undefined,
    hebrewMonth: form.hebrewMonth ? Number(form.hebrewMonth) : undefined,
    hebrewYear: form.hebrewYear ? Number(form.hebrewYear) : undefined,
    usesHebrewDate: form.usesHebrewDate,
    beforeSunset: form.beforeSunset,
    notificationEnabled: form.notificationEnabled,
    notificationDays: form.notificationDays,
    notificationTime: form.notificationTime,
    repeatAnnually: form.repeatAnnually,
    location: form.location.trim(),
    notes: form.notes.trim(),
    censusBranchId: form.censusBranchId || undefined,
  };
}

function eventLabel(
  event: RemembranceEvent,
  t: ReturnType<typeof useLanguage>["t"],
) {
  if (event.eventType === "birthday") return t.remembranceBirthday;
  if (event.eventType === "anniversary") return t.remembranceAnniversary;
  return t.remembranceYahrzeit;
}

interface CensusPerson {
  id: string;
  name: string;
  relationship: string;
}

function flattenCensusPeople(branch: Branch | null): CensusPerson[] {
  if (!branch) return [];
  return branch.families
    .flatMap((family: Family) => [
      {
        id: family.id,
        name: family.headCensus.namePerPassport || family.headName,
        relationship: "",
      },
      ...family.members.map((member: FamilyMember) => ({
        id: member.id,
        name: member.namePerPassport || member.hebrewName || "",
        relationship: member.relation,
      })),
    ])
    .filter((person: CensusPerson) => person.name);
}

export default function RemembranceCenterModal({ onClose }: Props) {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<RemembranceEvent[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<RemembranceEvent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const [censusLoading, setCensusLoading] = useState(false);
  const [sharingCalendar, setSharingCalendar] = useState(false);
  const [showOccurrences, setShowOccurrences] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await fetchRemembranceEvents();
      setEvents(result);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    setCensusLoading(true);
    fetchCensusBranch()
      .then(setBranch)
      .finally(() => setCensusLoading(false));
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const people = useMemo(() => flattenCensusPeople(branch), [branch]);
  const orderedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aDate =
          getNextRemembranceOccurrence(a).date?.getTime() ??
          Number.MAX_SAFE_INTEGER;
        const bDate =
          getNextRemembranceOccurrence(b).date?.getTime() ??
          Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      }),
    [events],
  );
  const counts = useMemo(
    () => ({
      yahrzeit: events.filter((event) => event.eventType === "yahrzeit").length,
      birthday: events.filter((event) => event.eventType === "birthday").length,
      anniversary: events.filter((event) => event.eventType === "anniversary")
        .length,
    }),
    [events],
  );

  function openNew() {
    openNewWithType("yahrzeit");
  }

  function openNewWithType(type: RemembranceEventType) {
    setSelected(null);
    setForm(emptyForm(type));
    setNotice("");
    setView("form");
  }

  function openEdit(event: RemembranceEvent) {
    setSelected(event);
    setForm(formFromEvent(event));
    setNotice("");
    setView("form");
  }

  function openDetail(event: RemembranceEvent) {
    setSelected(event);
    setDeleteConfirm(false);
    setShowOccurrences(false);
    setView("detail");
  }

  async function shareCalendar() {
    setSharingCalendar(true);
    setNotice("");
    try {
      const ics = generateFamilyICS(events);
      const file = new File([ics], "family-remembrance.ics", {
        type: "text/calendar",
      });
      let shared = false;
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: t.remembranceShareFamilyCalendar, files: [file] });
          shared = true;
        } catch {
          /* fall through to download */
        }
      }
      if (!shared) downloadICS(ics);
      setNotice(t.remembranceICSDownloaded);
    } catch {
      setNotice(t.remembranceShareFailed);
    } finally {
      setSharingCalendar(false);
    }
  }

  async function save() {
    if (
      !form.name.trim() ||
      (!form.gregorianDate && !(form.hebrewDay && form.hebrewMonth))
    ) {
      setNotice(t.remembranceRequired);
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const payload = eventFromForm(
        form,
        selected?.id ?? `local-${Date.now()}`,
      );
      if (selected) {
        await updateRemembranceEvent(selected.id, payload);
      } else {
        await createRemembranceEvent(payload);
      }
      await load();
      window.dispatchEvent(new Event("menashe-remembrance-updated"));
      setNotice(t.remembranceSaved);
      setView("list");
    } catch {
      setNotice(t.remembranceLoadError);
    } finally {
      setSaving(false);
    }
  }

  async function removeSelected() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteRemembranceEvent(selected.id);
      await load();
      window.dispatchEvent(new Event("menashe-remembrance-updated"));
      setSelected(null);
      setDeleteConfirm(false);
      setView("list");
    } catch {
      setNotice(t.remembranceLoadError);
    } finally {
      setDeleting(false);
    }
  }

  async function share(event: RemembranceEvent) {
    const text = `${event.name} — ${eventLabel(event, t)}${formatRemembranceDate(event) ? `, ${formatRemembranceDate(event)}` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: t.remembranceTitle, text });
      } else {
        await navigator.clipboard.writeText(text);
        setNotice(t.remembranceCopied);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setNotice(t.remembranceCopied);
      } catch {
        setNotice(t.remembranceShareFailed);
      }
    }
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remembrance-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          maxHeight: "92vh",
          overflowY: "auto",
          outline: "none",
          paddingBottom: 18,
        }}
      >
        <div className="modal-handle" />
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              id="remembrance-title"
              style={{
                color: "var(--text-primary)",
                fontSize: 22,
                fontWeight: 850,
                lineHeight: 1.1,
              }}
            >
              {t.remembranceTitle}
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                marginTop: 5,
                maxWidth: 310,
              }}
            >
              {t.remembranceSubtitle}
            </div>
          </div>
          <button
            type="button"
            data-testid="button-close-remembrance"
            className="modal-close-btn"
            aria-label={t.remembranceClose}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {notice && (
          <div
            data-testid="status-remembrance"
            role="status"
            style={{
              marginBottom: 12,
              padding: "9px 11px",
              borderRadius: 9,
              color: gold,
              background: "rgba(212,168,67,0.09)",
              border: "1px solid rgba(212,168,67,0.24)",
              fontSize: 12,
            }}
          >
            {notice}
          </div>
        )}

        {view === "list" && (
          <>
            {/* ── Quick-add type buttons ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {(
                [
                  ["yahrzeit", "🕯", t.remembranceAddYahrzeit],
                  ["birthday", "🎂", t.remembranceAddBirthday],
                  ["anniversary", "💍", t.remembranceAddAnniversary],
                ] as const
              ).map(([type, icon, label]) => (
                <button
                  key={type}
                  type="button"
                  data-testid={`button-add-${type}`}
                  onClick={() => openNewWithType(type)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 8px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--elevated)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{icon}</span>
                  <span style={{ lineHeight: 1.2, textAlign: "center" }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Share Family Calendar ── */}
            <button
              type="button"
              data-testid="button-share-family-calendar"
              disabled={sharingCalendar || events.length === 0}
              onClick={() => void shareCalendar()}
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 11,
                border: "none",
                background:
                  events.length === 0
                    ? "rgba(212,168,67,0.25)"
                    : "linear-gradient(135deg, #d4a843 0%, #b8892e 100%)",
                color: events.length === 0 ? "rgba(255,255,255,0.4)" : "#fff",
                fontWeight: 800,
                fontSize: 14,
                cursor:
                  sharingCalendar || events.length === 0
                    ? "default"
                    : "pointer",
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: sharingCalendar ? 0.7 : 1,
              }}
            >
              <span>👨‍👩‍👧</span>
              <span>
                {sharingCalendar
                  ? "…"
                  : t.remembranceShareFamilyCalendar}
              </span>
            </button>

            {/* ── Stats row ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 7,
                marginBottom: 18,
              }}
            >
              {(
                [
                  ["yahrzeit", "🕯", t.remembranceYahrzeits, counts.yahrzeit],
                  ["birthday", "🎂", t.remembranceBirthdays, counts.birthday],
                  [
                    "anniversary",
                    "💍",
                    t.remembranceAnniversaries,
                    counts.anniversary,
                  ],
                ] as const
              ).map(([type, icon, label, count]) => (
                <div
                  key={type}
                  data-testid={`summary-${type}`}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    background: "var(--elevated)",
                    border: "1px solid var(--border)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                  <div style={{ color: gold, fontSize: 20, fontWeight: 850 }}>
                    {count}
                  </div>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 10,
                      lineHeight: 1.25,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Event list ── */}
            {loading ? (
              <div
                data-testid="status-remembrance-loading"
                style={{ display: "grid", gap: 8 }}
              >
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    style={{
                      height: 66,
                      borderRadius: 11,
                      background:
                        "linear-gradient(90deg, var(--elevated), var(--card), var(--elevated))",
                      opacity: 0.75,
                    }}
                  />
                ))}
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  {t.remembranceLoading}
                </div>
              </div>
            ) : loadError ? (
              <div
                data-testid="status-remembrance-error"
                style={{
                  padding: 18,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                <div style={{ marginBottom: 10 }}>{t.remembranceLoadError}</div>
                <button
                  type="button"
                  data-testid="button-retry-remembrance"
                  onClick={() => void load()}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--elevated)",
                    color: gold,
                    cursor: "pointer",
                  }}
                >
                  {t.remembranceRetry}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                {(
                  [
                    {
                      type: "yahrzeit" as const,
                      icon: "🕯",
                      label: t.remembranceYahrzeits,
                      empty: t.remembranceNoYahrzeits,
                    },
                    {
                      type: "birthday" as const,
                      icon: "🎂",
                      label: t.remembranceBirthdays,
                      empty: t.remembranceNoBirthdays,
                    },
                    {
                      type: "anniversary" as const,
                      icon: "💍",
                      label: t.remembranceAnniversaries,
                      empty: t.remembranceNoAnniversaries,
                    },
                  ] as const
                ).map(({ type, icon, label, empty }) => {
                  const sectionEvents = orderedEvents.filter(
                    (e) => e.eventType === type,
                  );
                  return (
                    <section key={type} aria-label={label}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{icon}</span>
                        <span
                          style={{
                            color: "var(--text-primary)",
                            fontWeight: 800,
                            fontSize: 15,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      {sectionEvents.length === 0 ? (
                        <div
                          style={{
                            padding: "18px 14px",
                            borderRadius: 11,
                            border: "1px dashed var(--border)",
                            background: "var(--elevated)",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: 12,
                          }}
                        >
                          <div style={{ fontSize: 22, marginBottom: 6, opacity: 0.4 }}>
                            {icon}
                          </div>
                          {empty}
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: 7 }}>
                          {sectionEvents.map((event) => {
                            const occurrence =
                              getNextRemembranceOccurrence(event);
                            return (
                              <button
                                type="button"
                                key={event.id}
                                data-testid={`card-remembrance-${event.id}`}
                                onClick={() => openDetail(event)}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "12px 13px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  cursor: "pointer",
                                  color: "var(--text-primary)",
                                  background: occurrence.isToday
                                    ? "rgba(212,168,67,0.11)"
                                    : "var(--elevated)",
                                  border: occurrence.isToday
                                    ? "1px solid rgba(212,168,67,0.4)"
                                    : "1px solid var(--border)",
                                  borderRadius: 11,
                                }}
                              >
                                <span style={{ minWidth: 0 }}>
                                  <span
                                    style={{
                                      display: "block",
                                      fontWeight: 800,
                                      fontSize: 14,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {event.name}
                                  </span>
                                  {event.relationship && (
                                    <span
                                      style={{
                                        display: "block",
                                        marginTop: 3,
                                        color: "var(--text-muted)",
                                        fontSize: 11,
                                      }}
                                    >
                                      {event.relationship}
                                    </span>
                                  )}
                                </span>
                                <span
                                  style={{ flexShrink: 0, textAlign: "right" }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      color: occurrence.isToday
                                        ? gold
                                        : "var(--text-secondary)",
                                      fontSize: 11,
                                      fontWeight: occurrence.isToday ? 800 : 400,
                                    }}
                                  >
                                    {occurrence.isToday
                                      ? t.remembranceToday
                                      : occurrence.isTomorrow
                                        ? t.remembranceTomorrow
                                        : occurrence.daysAway !== null
                                          ? t.remembranceInDays.replace(
                                              "{n}",
                                              String(occurrence.daysAway),
                                            )
                                          : t.remembranceNoDate}
                                  </span>
                                  <span
                                    style={{
                                      display: "block",
                                      marginTop: 3,
                                      color: "var(--text-muted)",
                                      fontSize: 10,
                                    }}
                                  >
                                    {formatRemembranceDate(event)}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === "detail" && selected && (
          <section data-testid={`detail-remembrance-${selected.id}`}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    color: gold,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                  }}
                >
                  {eventLabel(selected, t).toUpperCase()}
                </div>
                <h2
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 24,
                    margin: "5px 0 0",
                  }}
                >
                  {selected.name}
                </h2>
                {selected.relationship && (
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {selected.relationship}
                  </div>
                )}
              </div>
              <button
                type="button"
                data-testid={`button-share-remembrance-${selected.id}`}
                onClick={() => void share(selected)}
                style={{
                  border: "1px solid rgba(212,168,67,0.3)",
                  borderRadius: 8,
                  background: "transparent",
                  color: gold,
                  padding: "7px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                {t.remembranceShare}
              </button>
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 11,
                background: "var(--elevated)",
                border: "1px solid var(--border)",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                }}
              >
                {t.remembranceDate.toUpperCase()}
              </div>
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: 16,
                  fontWeight: 750,
                  marginTop: 5,
                }}
              >
                {formatRemembranceDate(selected) || t.remembranceNoDate}
              </div>
              {selected.location && (
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {selected.location}
                </div>
              )}
            </div>
            {selected.notes && (
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: "2px 2px 12px",
                }}
              >
                {selected.notes}
              </div>
            )}

            {/* ── 20-Year Schedule ── */}
            {selected.repeatAnnually && (
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowOccurrences((v) => !v)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--elevated)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <span>📅 {t.remembrance20YearSchedule}</span>
                  <span style={{ color: gold, fontSize: 11 }}>
                    {showOccurrences ? "▲" : "▼"}
                  </span>
                </button>
                {showOccurrences && (() => {
                  const rows = getAllOccurrences(selected, 20);
                  return (
                    <div
                      style={{
                        marginTop: 6,
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                        maxHeight: 320,
                        overflowY: "auto",
                      }}
                    >
                      {rows.length === 0 ? (
                        <div
                          style={{
                            padding: 14,
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: 12,
                          }}
                        >
                          {t.remembranceNoDate}
                        </div>
                      ) : (
                        rows.map((row, i) => (
                          <div
                            key={row.hebrewYear}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "9px 13px",
                              background:
                                i === 0
                                  ? "rgba(212,168,67,0.08)"
                                  : i % 2 === 0
                                    ? "var(--elevated)"
                                    : "var(--card)",
                              borderBottom:
                                i < rows.length - 1
                                  ? "1px solid var(--border)"
                                  : "none",
                            }}
                          >
                            <span
                              style={{
                                color:
                                  i === 0 ? gold : "var(--text-primary)",
                                fontSize: 12,
                                fontWeight: i === 0 ? 800 : 500,
                              }}
                            >
                              {row.gregorianDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: 11,
                                textAlign: "right",
                              }}
                            >
                              {row.hebrewDay} {row.hebrewMonthName}
                              {"\n"}
                              <span style={{ fontSize: 10 }}>
                                {row.hebrewYear}
                              </span>
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {deleteConfirm ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 750,
                  }}
                >
                  {t.remembranceDeleteConfirm}
                </div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {t.remembranceDeleteBody}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    data-testid="button-cancel-delete-remembrance"
                    onClick={() => setDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      padding: 9,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--elevated)",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {t.remembranceCancel}
                  </button>
                  <button
                    type="button"
                    data-testid="button-confirm-delete-remembrance"
                    disabled={deleting}
                    onClick={() => void removeSelected()}
                    style={{
                      flex: 1,
                      padding: 9,
                      borderRadius: 8,
                      border: "1px solid rgba(239,68,68,0.35)",
                      background: "rgba(239,68,68,0.12)",
                      color: "#ef7777",
                      cursor: "pointer",
                      fontWeight: 750,
                    }}
                  >
                    {t.remembranceConfirmDelete}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  data-testid="button-edit-remembrance"
                  onClick={() => openEdit(selected)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid rgba(212,168,67,0.3)",
                    background: "rgba(212,168,67,0.08)",
                    color: gold,
                    cursor: "pointer",
                    fontWeight: 750,
                  }}
                >
                  {t.remembranceEditEvent}
                </button>
                <button
                  type="button"
                  data-testid="button-delete-remembrance"
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    padding: "10px 13px",
                    borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.25)",
                    background: "transparent",
                    color: "#ef7777",
                    cursor: "pointer",
                  }}
                >
                  {t.remembranceDelete}
                </button>
              </div>
            )}
            <button
              type="button"
              data-testid="button-back-remembrance"
              onClick={() => setView("list")}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {t.remembranceClose}
            </button>
          </section>
        )}

        {view === "form" && (
          <section data-testid="form-remembrance">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <h2
                style={{
                  color: "var(--text-primary)",
                  margin: 0,
                  fontSize: 18,
                }}
              >
                {selected ? t.remembranceEditEvent : t.remembranceNewEvent}
              </h2>
              <button
                type="button"
                data-testid="button-cancel-form-remembrance"
                onClick={() => setView("list")}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {t.remembranceCancel}
              </button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <span style={labelStyle}>{t.remembranceName}</span>
                <input
                  data-testid="input-remembrance-name"
                  style={fieldStyle}
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  autoFocus
                />
              </label>
              <label>
                <span style={labelStyle}>{t.remembranceRelationship}</span>
                <input
                  data-testid="input-remembrance-relationship"
                  style={fieldStyle}
                  value={form.relationship}
                  onChange={(event) =>
                    update("relationship", event.target.value)
                  }
                />
              </label>
              <label>
                <span style={labelStyle}>{t.remembranceEventType}</span>
                <select
                  data-testid="select-remembrance-type"
                  style={fieldStyle}
                  value={form.eventType}
                  onChange={(event) =>
                    update(
                      "eventType",
                      event.target.value as RemembranceEventType,
                    )
                  }
                >
                  <option value="yahrzeit">{t.remembranceYahrzeit}</option>
                  <option value="birthday">{t.remembranceBirthday}</option>
                  <option value="anniversary">
                    {t.remembranceAnniversary}
                  </option>
                </select>
              </label>
              <label
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems: "center",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                }}
              >
                <input
                  data-testid="checkbox-remembrance-hebrew"
                  type="checkbox"
                  checked={form.usesHebrewDate}
                  onChange={(event) =>
                    update("usesHebrewDate", event.target.checked)
                  }
                />
                {t.remembranceUseHebrewDate}
              </label>
              {form.usesHebrewDate ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  <label>
                    <span style={labelStyle}>{t.remembranceHebrewDate}</span>
                    <input
                      data-testid="input-remembrance-hebrew-day"
                      type="number"
                      min="1"
                      max="30"
                      style={fieldStyle}
                      value={form.hebrewDay}
                      onChange={(event) =>
                        update("hebrewDay", event.target.value)
                      }
                      placeholder={t.remembranceDayLabel}
                    />
                  </label>
                  <label>
                    <span style={labelStyle}>{t.remembranceMonth}</span>
                    <select
                      data-testid="input-remembrance-hebrew-month"
                      style={fieldStyle}
                      value={form.hebrewMonth}
                      onChange={(event) =>
                        update("hebrewMonth", event.target.value)
                      }
                    >
                      <option value="">{t.remembranceMonth}</option>
                      {HEBREW_MONTHS.map((m) => (
                        <option key={m.value} value={String(m.value)}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span style={labelStyle}>{t.remembranceYear}</span>
                    <input
                      data-testid="input-remembrance-hebrew-year"
                      type="number"
                      style={fieldStyle}
                      value={form.hebrewYear}
                      onChange={(event) =>
                        update("hebrewYear", event.target.value)
                      }
                      placeholder={t.remembranceYear}
                    />
                  </label>
                </div>
              ) : (
                <label>
                  <span style={labelStyle}>{t.remembranceGregorianDate}</span>
                  <input
                    data-testid="input-remembrance-date"
                    type="date"
                    style={fieldStyle}
                    value={form.gregorianDate}
                    onChange={(event) =>
                      update("gregorianDate", event.target.value)
                    }
                  />
                </label>
              )}
              {form.eventType === "yahrzeit" && (
                <label
                  style={{
                    display: "flex",
                    gap: 9,
                    alignItems: "center",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                  }}
                >
                  <input
                    data-testid="checkbox-remembrance-sunset"
                    type="checkbox"
                    checked={form.beforeSunset}
                    onChange={(event) =>
                      update("beforeSunset", event.target.checked)
                    }
                  />
                  {t.remembranceBeforeSunset}
                </label>
              )}
              <label
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems: "center",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                }}
              >
                <input
                  data-testid="checkbox-remembrance-repeat"
                  type="checkbox"
                  checked={form.repeatAnnually}
                  onChange={(event) =>
                    update("repeatAnnually", event.target.checked)
                  }
                />
                {t.remembranceRepeatAnnually}
              </label>
              <label>
                <span style={labelStyle}>{t.remembranceLocation}</span>
                <input
                  data-testid="input-remembrance-location"
                  style={fieldStyle}
                  value={form.location}
                  onChange={(event) => update("location", event.target.value)}
                />
              </label>
              <label>
                <span style={labelStyle}>{t.remembranceNotes}</span>
                <textarea
                  data-testid="input-remembrance-notes"
                  style={{ ...fieldStyle, minHeight: 72, resize: "vertical" }}
                  value={form.notes}
                  placeholder={t.remembranceNotesPlaceholder}
                  onChange={(event) => update("notes", event.target.value)}
                />
              </label>
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "var(--elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    color: gold,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    marginBottom: 9,
                  }}
                >
                  {t.remembranceNotifications.toUpperCase()}
                </div>
                <label
                  style={{
                    display: "flex",
                    gap: 9,
                    alignItems: "center",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    marginBottom: 10,
                  }}
                >
                  <input
                    data-testid="checkbox-remembrance-notifications"
                    type="checkbox"
                    checked={form.notificationEnabled}
                    onChange={(event) =>
                      update("notificationEnabled", event.target.checked)
                    }
                  />
                  {t.remembranceEnableNotifications}
                </label>
                {form.notificationEnabled && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <label>
                      <span style={labelStyle}>{t.remembranceDaysBefore}</span>
                      <select
                        data-testid="select-remembrance-days"
                        style={fieldStyle}
                        value={form.notificationDays}
                        onChange={(event) =>
                          update("notificationDays", Number(event.target.value))
                        }
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={3}>3</option>
                        <option value={7}>7</option>
                        <option value={30}>30</option>
                      </select>
                    </label>
                    <label>
                      <span style={labelStyle}>
                        {t.remembranceNotificationTime}
                      </span>
                      <input
                        data-testid="input-remembrance-time"
                        type="time"
                        style={fieldStyle}
                        value={form.notificationTime}
                        onChange={(event) =>
                          update("notificationTime", event.target.value)
                        }
                      />
                    </label>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>{t.remembranceCensusLink}</label>
                {censusLoading ? (
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {t.remembranceCensusLoading}
                  </div>
                ) : people.length > 0 ? (
                  <select
                    data-testid="select-remembrance-census"
                    style={fieldStyle}
                    value={form.censusBranchId}
                    onChange={(event) =>
                      update("censusBranchId", event.target.value)
                    }
                  >
                    <option value="">{t.remembranceCensusNone}</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {t.remembranceCensusUnavailable}
                  </div>
                )}
              </div>
              <button
                type="button"
                data-testid="button-save-remembrance"
                disabled={saving}
                onClick={() => void save()}
                className="btn-gold"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 9,
                  fontWeight: 800,
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.65 : 1,
                }}
              >
                {t.remembranceSave}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
