import { useState, useEffect, useCallback } from "react";
import { useUser, useOrganization } from "../auth";
import { useLanguage } from "@/context/LanguageContext";
import { getAuthToken } from "../lib/authToken";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD        = "#d4a843";
const GOLD_DIM    = "rgba(212,168,67,0.15)";
const GOLD_BORDER = "rgba(212,168,67,0.3)";
const CARD_HOVER  = "rgba(212,168,67,0.06)";

type FcView =
  | "home" | "bug" | "feature" | "appreciation"
  | "help" | "rating" | "my-feedback" | "admin";

type Status = "new" | "reviewed" | "in_progress" | "planned" | "completed" | "closed";

interface FeedbackItem {
  id: number;
  referenceNumber: string;
  type: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  adminNote: string;
  rating: number | null;
  emojiReaction: string;
  platform: string;
  appVersion: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  // extras
  expectedBehaviour?: string;
  actualBehaviour?: string;
  stepsToReproduce?: string;
  browser?: string;
  deviceModel?: string;
  problemSolved?: string;
  whoBenefits?: string;
  importance?: string;
  wouldRecommend?: string;
}

// ── Auth fetch helper ─────────────────────────────────────────────────────────
async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
const labelCss: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "var(--text-muted)", letterSpacing: "0.07em",
  textTransform: "uppercase", marginBottom: 6,
};
const inputCss: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};
const textareaCss: React.CSSProperties = {
  ...inputCss, resize: "vertical", minHeight: 80, lineHeight: 1.55,
};
const btnPrimary: React.CSSProperties = {
  padding: "12px 24px", borderRadius: 10,
  background: `linear-gradient(135deg, ${GOLD}, #A0821A)`,
  color: "#0F1829", fontWeight: 700, fontSize: 14,
  border: "none", cursor: "pointer", width: "100%",
  transition: "opacity 0.15s",
};
const btnSecondary: React.CSSProperties = {
  padding: "11px 24px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontWeight: 600, fontSize: 14,
  cursor: "pointer", width: "100%",
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelCss}>{label}</label>
      {children}
    </div>
  );
}

function ChipGroup<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            padding: "7px 14px", borderRadius: 20,
            border: value === o.value ? `1.5px solid ${GOLD}` : "1.5px solid var(--border)",
            background: value === o.value ? GOLD_DIM : "transparent",
            color: value === o.value ? GOLD : "var(--text-muted)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all 0.12s",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    new:         { label: "New",         color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
    reviewed:    { label: "Reviewed",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
    in_progress: { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    planned:     { label: "Planned",     color: "#34d399", bg: "rgba(52,211,153,0.12)" },
    completed:   { label: "Completed",   color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    closed:      { label: "Closed",      color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
    open:        { label: "Open",        color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
    resolved:    { label: "Resolved",    color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
    wont_fix:    { label: "Won't Fix",   color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  };
  const s = map[status] ?? { label: status, color: "var(--text-muted)", bg: "var(--elevated)" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
      color: s.color, background: s.bg, letterSpacing: "0.04em",
    }}>
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const icons: Record<string, string> = {
    bug_report: "🐞", feature_request: "💡", appreciation: "❤️",
    help_request: "❓", app_rating: "⭐", general: "💬",
  };
  const labels: Record<string, string> = {
    bug_report: "Bug", feature_request: "Feature", appreciation: "Appreciation",
    help_request: "Help", app_rating: "Rating", general: "General",
  };
  return (
    <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
      <span>{icons[type] ?? "💬"}</span>
      <span>{labels[type] ?? type}</span>
    </span>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function ModalShell({
  title, onClose, onBack, children,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed", inset: 0, zIndex: 9200,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--card)",
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${GOLD_BORDER}`,
          boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
          maxHeight: "92dvh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", fontSize: 20, padding: "2px 6px 2px 0",
                display: "flex", alignItems: "center",
              }}
            >
              ←
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
              {title}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 22, lineHeight: 1,
              padding: "2px 0 2px 8px",
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 20px 32px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({
  refNum, onClose, onNewSubmission,
}: {
  refNum: string;
  onClose: () => void;
  onNewSubmission: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>✓</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: GOLD, marginBottom: 6 }}>
        Thank You
      </div>
      <div style={{
        fontFamily: "'Noto Serif Hebrew', serif", fontSize: 18,
        color: "var(--text-primary)", marginBottom: 16,
      }}>
        Shalom!
      </div>
      <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 20px" }}>
        Your message has been safely received.
      </p>

      {/* Reference number card */}
      <div style={{
        background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
        borderRadius: 14, padding: "16px 20px", marginBottom: 20,
        display: "inline-block", minWidth: 200,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 6 }}>
          REFERENCE NUMBER
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, letterSpacing: "0.05em", fontFamily: "monospace" }}>
          {refNum}
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 24px" }}>
        We'll carefully review your feedback.<br />
        Thank you for helping improve the Menashe Platform.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onNewSubmission} style={btnSecondary}>
          Submit Another
        </button>
        <button onClick={onClose} style={btnPrimary}>
          Return Home
        </button>
      </div>
    </div>
  );
}

// ── Home dashboard ────────────────────────────────────────────────────────────
const HOME_CARDS = [
  { view: "feature"      as FcView, icon: "💡", label: "Suggest a Feature",  sub: "Help us build what matters" },
  { view: "bug"          as FcView, icon: "🐞", label: "Report a Bug",        sub: "Something not working right?" },
  { view: "appreciation" as FcView, icon: "❤️", label: "Share Appreciation", sub: "Tell us what touched your heart" },
  { view: "help"         as FcView, icon: "❓", label: "Ask for Help",        sub: "We're here to assist you" },
  { view: "rating"       as FcView, icon: "⭐", label: "Rate the App",        sub: "How are we doing?" },
];

function HomeView({
  setView, isAdmin, isSignedIn,
}: {
  setView: (v: FcView) => void;
  isAdmin?: boolean;
  isSignedIn: boolean;
}) {
  return (
    <div>
      {/* Subtitle */}
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Your voice shapes the Menashe Platform. Every submission is read by the development team.
      </p>

      {/* Primary action cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {HOME_CARDS.map((c) => (
          <button
            key={c.view}
            onClick={() => setView(c.view)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 16px", borderRadius: 14,
              background: "var(--elevated)",
              border: "1px solid var(--border)",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD_BORDER; (e.currentTarget as HTMLButtonElement).style.background = CARD_HOVER; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--elevated)"; }}
          >
            <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                {c.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.sub}</div>
            </div>
            <span style={{ color: GOLD, fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0 16px" }} />

      {/* Secondary rows */}
      {[
        { icon: "📢", label: "Release Notes",  sub: "See what's new",         onClick: () => window.dispatchEvent(new Event("menashe:open-whats-new")) },
        { icon: "📚", label: "Help Center",    sub: "Guides and tutorials",    onClick: undefined },
        { icon: "📧", label: "Contact Support",sub: "Reach our team directly", onClick: () => setView("help") },
      ].map((r) => (
        <button
          key={r.label}
          onClick={r.onClick ?? undefined}
          disabled={!r.onClick}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 4px", width: "100%",
            background: "none", border: "none", cursor: r.onClick ? "pointer" : "default",
            textAlign: "left", borderBottom: "1px solid var(--border)",
            opacity: r.onClick ? 1 : 0.45,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{r.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{r.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.sub}</div>
          </div>
          {r.onClick && <span style={{ color: GOLD, fontSize: 16 }}>›</span>}
          {!r.onClick && <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Coming soon</span>}
        </button>
      ))}

      {/* My Feedback (signed-in only) */}
      {isSignedIn && (
        <button
          onClick={() => setView("my-feedback")}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 4px", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            textAlign: "left", borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>My Submissions</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Track your feedback</div>
          </div>
          <span style={{ color: GOLD, fontSize: 16 }}>›</span>
        </button>
      )}

      {/* Admin panel shortcut */}
      {isAdmin && (
        <button
          onClick={() => setView("admin")}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 4px", width: "100%",
            background: "none", border: "none", cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>🔐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: GOLD }}>Admin — Manage Feedback</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Review, update, export submissions</div>
          </div>
          <span style={{ color: GOLD, fontSize: 16 }}>›</span>
        </button>
      )}
    </div>
  );
}

// ── Bug Report ────────────────────────────────────────────────────────────────
function BugForm({ onSuccess }: { onSuccess: (ref: string) => void }) {
  const [category, setCategory]     = useState("ui");
  const [priority, setPriority]     = useState("medium");
  const [subject, setSubject]       = useState("");
  const [description, setDesc]      = useState("");
  const [expected, setExpected]     = useState("");
  const [actual, setActual]         = useState("");
  const [steps, setSteps]           = useState("");
  const [platform, setPlatform]     = useState("web");
  const [browser, setBrowser]       = useState("");
  const [deviceModel, setDevice]    = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const bugCategories = [
    { value: "ui",          label: "UI / Display" },
    { value: "calendar",    label: "Calendar / Zmanim" },
    { value: "auth",        label: "Sign In / Account" },
    { value: "performance", label: "Performance" },
    { value: "data",        label: "Wrong Data" },
    { value: "other",       label: "Other" },
  ];
  const priorities = [
    { value: "critical", label: "🔴 Critical — can't use the app" },
    { value: "high",     label: "🟠 High — major feature broken" },
    { value: "medium",   label: "🟡 Medium — works but frustrating" },
    { value: "low",      label: "🟢 Low — minor polish" },
  ];
  const platforms = [
    { value: "web",     label: "🌐 Web" },
    { value: "android", label: "🤖 Android" },
    { value: "ios",     label: "🍎 iPhone" },
  ];

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) { setError("Subject and Description are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await authedFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: "bug_report", category, priority, subject: subject.trim(),
          message: description.trim(), expectedBehaviour: expected.trim(),
          actualBehaviour: actual.trim(), stepsToReproduce: steps.trim(),
          platform, browser: browser.trim(), deviceModel: deviceModel.trim(),
          appVersion: "1.2", page: window.location.pathname,
          device: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      onSuccess(data.referenceNumber);
    } catch {
      setError("Could not submit — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <FieldRow label="Bug Category">
        <ChipGroup value={category} onChange={setCategory} options={bugCategories} />
      </FieldRow>
      <FieldRow label="Severity / Priority">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {priorities.map((p) => (
            <button key={p.value} type="button" onClick={() => setPriority(p.value)} style={{
              padding: "10px 14px", borderRadius: 10, textAlign: "left", fontSize: 13,
              border: priority === p.value ? `1.5px solid ${GOLD}` : "1px solid var(--border)",
              background: priority === p.value ? GOLD_DIM : "var(--elevated)",
              color: priority === p.value ? GOLD : "var(--text-muted)",
              fontWeight: priority === p.value ? 700 : 400, cursor: "pointer",
            }}>{p.label}</button>
          ))}
        </div>
      </FieldRow>
      <FieldRow label="Subject *">
        <input value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief title for the bug" style={inputCss} maxLength={200} />
      </FieldRow>
      <FieldRow label="Description *">
        <textarea value={description} onChange={(e) => setDesc(e.target.value)}
          placeholder="What went wrong?" style={{ ...textareaCss, minHeight: 90 }} maxLength={2000} />
      </FieldRow>
      <FieldRow label="Expected Behaviour">
        <textarea value={expected} onChange={(e) => setExpected(e.target.value)}
          placeholder="What should have happened?" style={textareaCss} maxLength={2000} />
      </FieldRow>
      <FieldRow label="Actual Behaviour">
        <textarea value={actual} onChange={(e) => setActual(e.target.value)}
          placeholder="What actually happened?" style={textareaCss} maxLength={2000} />
      </FieldRow>
      <FieldRow label="Steps to Reproduce">
        <textarea value={steps} onChange={(e) => setSteps(e.target.value)}
          placeholder={"1. Go to…\n2. Tap on…\n3. See error"} style={{ ...textareaCss, minHeight: 90 }} maxLength={2000} />
      </FieldRow>
      <FieldRow label="Platform">
        <ChipGroup value={platform} onChange={setPlatform} options={platforms} />
      </FieldRow>
      <FieldRow label="Browser (optional)">
        <input value={browser} onChange={(e) => setBrowser(e.target.value)}
          placeholder="e.g. Chrome 124, Safari 17" style={inputCss} maxLength={200} />
      </FieldRow>
      <FieldRow label="Device Model (optional)">
        <input value={deviceModel} onChange={(e) => setDevice(e.target.value)}
          placeholder="e.g. iPhone 15, Samsung S24" style={inputCss} maxLength={200} />
      </FieldRow>

      {/* Attachment — future */}
      <div style={{
        padding: "12px 14px", borderRadius: 10,
        background: "var(--elevated)", border: "1px dashed var(--border)",
        marginBottom: 20, opacity: 0.5,
      }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
          <span>📎</span>
          <span>Attach Screenshot — coming soon</span>
        </div>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading || !subject.trim() || !description.trim()}
        style={{ ...btnPrimary, opacity: loading || !subject.trim() || !description.trim() ? 0.5 : 1 }}>
        {loading ? "Submitting…" : "Submit Bug Report"}
      </button>
    </div>
  );
}

// ── Feature Request ───────────────────────────────────────────────────────────
function FeatureForm({ onSuccess }: { onSuccess: (ref: string) => void }) {
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [problem, setProblem]       = useState("");
  const [who, setWho]               = useState("");
  const [importance, setImportance] = useState("medium");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const importanceOptions = [
    { value: "low",    label: "💚 Nice to have" },
    { value: "medium", label: "💛 Would improve my experience" },
    { value: "high",   label: "❤️ I really need this" },
  ];

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) { setError("Title and Description are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await authedFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: "feature_request", category: "suggest", priority: importance === "high" ? "high" : importance === "low" ? "low" : "medium",
          subject: title.trim(), message: description.trim(),
          problemSolved: problem.trim(), whoBenefits: who.trim(), importance,
          page: window.location.pathname, device: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      onSuccess(data.referenceNumber);
    } catch {
      setError("Could not submit — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <FieldRow label="Feature Title *">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="What would you like to see?" style={inputCss} maxLength={200} />
      </FieldRow>
      <FieldRow label="Description *">
        <textarea value={description} onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe the feature in detail…" style={{ ...textareaCss, minHeight: 100 }} maxLength={2000} />
      </FieldRow>
      <FieldRow label="Problem it Solves">
        <textarea value={problem} onChange={(e) => setProblem(e.target.value)}
          placeholder="What pain does this address?" style={textareaCss} maxLength={2000} />
      </FieldRow>
      <FieldRow label="Who Benefits">
        <input value={who} onChange={(e) => setWho(e.target.value)}
          placeholder="Who would use this most?" style={inputCss} maxLength={300} />
      </FieldRow>
      <FieldRow label="Importance">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {importanceOptions.map((o) => (
            <button key={o.value} type="button" onClick={() => setImportance(o.value)} style={{
              padding: "11px 14px", borderRadius: 10, textAlign: "left", fontSize: 14,
              border: importance === o.value ? `1.5px solid ${GOLD}` : "1px solid var(--border)",
              background: importance === o.value ? GOLD_DIM : "var(--elevated)",
              color: importance === o.value ? GOLD : "var(--text-primary)",
              fontWeight: importance === o.value ? 700 : 400, cursor: "pointer",
            }}>{o.label}</button>
          ))}
        </div>
      </FieldRow>
      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading || !title.trim() || !description.trim()}
        style={{ ...btnPrimary, opacity: loading || !title.trim() || !description.trim() ? 0.5 : 1 }}>
        {loading ? "Submitting…" : "Submit Feature Request"}
      </button>
    </div>
  );
}

// ── Appreciation ──────────────────────────────────────────────────────────────
const APPRECIATE_EMOJIS = ["🙏","❤️","✨","🕍","📖","🌟","💎","🕯","🫂","🌿","🎉","💬"];

function AppreciationForm({ onSuccess }: { onSuccess: (ref: string) => void }) {
  const [emoji, setEmoji]     = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit() {
    setLoading(true); setError("");
    try {
      const res = await authedFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: "appreciation", category: "content", priority: "low",
          subject: "Appreciation", message: message.trim() || "❤️",
          emojiReaction: emoji,
          page: window.location.pathname, device: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      onSuccess(data.referenceNumber);
    } catch {
      setError("Could not submit — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>
        "What made your experience meaningful?"
      </p>

      <FieldRow label="How are you feeling?">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {APPRECIATE_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setEmoji(emoji === e ? "" : e)} style={{
              fontSize: 24, padding: "8px 10px", borderRadius: 12,
              border: emoji === e ? `2px solid ${GOLD}` : "1.5px solid var(--border)",
              background: emoji === e ? GOLD_DIM : "var(--elevated)",
              cursor: "pointer", transition: "all 0.12s",
              transform: emoji === e ? "scale(1.15)" : "scale(1)",
            }}>{e}</button>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Share Your Message (optional)">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Share what touched your heart…"
          style={{ ...textareaCss, minHeight: 110 }} maxLength={2000} />
      </FieldRow>

      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading && !emoji && !message.trim()}
        style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Sending…" : "Send Appreciation ❤️"}
      </button>
    </div>
  );
}

// ── Help Request ──────────────────────────────────────────────────────────────
function HelpForm({ onSuccess }: { onSuccess: (ref: string) => void }) {
  const [subject, setSubject]   = useState("");
  const [description, setDesc]  = useState("");
  const [category, setCategory] = useState("other");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const categories = [
    { value: "account",   label: "Account" },
    { value: "calendar",  label: "Calendar" },
    { value: "prayer",    label: "Prayer" },
    { value: "premium",   label: "Premium" },
    { value: "payments",  label: "Payments" },
    { value: "community", label: "Community" },
    { value: "other",     label: "Other" },
  ];

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) { setError("Subject and Description are required."); return; }
    setLoading(true); setError("");
    try {
      const res = await authedFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: "help_request", category, priority: "medium",
          subject: subject.trim(), message: description.trim(),
          page: window.location.pathname, device: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      onSuccess(data.referenceNumber);
    } catch {
      setError("Could not submit — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <FieldRow label="Category">
        <ChipGroup value={category} onChange={setCategory} options={categories} />
      </FieldRow>
      <FieldRow label="Subject *">
        <input value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="What do you need help with?" style={inputCss} maxLength={200} />
      </FieldRow>
      <FieldRow label="Describe Your Issue *">
        <textarea value={description} onChange={(e) => setDesc(e.target.value)}
          placeholder="Please describe in detail what you need help with…"
          style={{ ...textareaCss, minHeight: 120 }} maxLength={2000} />
      </FieldRow>
      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading || !subject.trim() || !description.trim()}
        style={{ ...btnPrimary, opacity: loading || !subject.trim() || !description.trim() ? 0.5 : 1 }}>
        {loading ? "Submitting…" : "Submit Help Request"}
      </button>
    </div>
  );
}

// ── App Rating ────────────────────────────────────────────────────────────────
function RatingForm({ onSuccess }: { onSuccess: (ref: string) => void }) {
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [comment, setComment]     = useState("");
  const [recommend, setRecommend] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit() {
    if (!rating) { setError("Please choose a star rating."); return; }
    setLoading(true); setError("");
    try {
      const res = await authedFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: "app_rating", category: "ux", priority: "low",
          subject: `${rating}-star rating`,
          message: comment.trim() || `${rating} stars`,
          rating, wouldRecommend: recommend,
          page: window.location.pathname, device: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      onSuccess(data.referenceNumber);
    } catch {
      setError("Could not submit — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const display = hovered || rating;

  return (
    <div>
      <FieldRow label="Your Rating">
        <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "8px 0" }}>
          {[1,2,3,4,5].map((n) => (
            <button
              key={n} type="button"
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
              style={{
                fontSize: 38, background: "none", border: "none", cursor: "pointer",
                transition: "transform 0.1s",
                transform: display >= n ? "scale(1.1)" : "scale(1)",
                filter: display >= n ? "none" : "grayscale(1) opacity(0.35)",
              }}
            >
              ⭐
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p style={{ textAlign: "center", color: GOLD, fontSize: 14, fontWeight: 700, margin: "4px 0 0" }}>
            {["","Poor","Fair","Good","Great","Excellent!"][rating]}
          </p>
        )}
      </FieldRow>

      <FieldRow label="Additional Comments (optional)">
        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more…" style={textareaCss} maxLength={1000} />
      </FieldRow>

      <FieldRow label="Would you recommend this app?">
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { value: "yes",   label: "👍 Yes" },
            { value: "maybe", label: "🤔 Maybe" },
            { value: "no",    label: "👎 Not yet" },
          ].map((o) => (
            <button key={o.value} type="button" onClick={() => setRecommend(o.value)} style={{
              flex: 1, padding: "11px 8px", borderRadius: 10, fontSize: 14,
              border: recommend === o.value ? `1.5px solid ${GOLD}` : "1px solid var(--border)",
              background: recommend === o.value ? GOLD_DIM : "var(--elevated)",
              color: recommend === o.value ? GOLD : "var(--text-primary)",
              fontWeight: recommend === o.value ? 700 : 400, cursor: "pointer",
            }}>{o.label}</button>
          ))}
        </div>
      </FieldRow>

      {error && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={loading || !rating}
        style={{ ...btnPrimary, opacity: loading || !rating ? 0.5 : 1 }}>
        {loading ? "Submitting…" : "Submit Rating"}
      </button>
    </div>
  );
}

// ── My Feedback ───────────────────────────────────────────────────────────────
function MyFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    authedFetch("/feedback/my")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: FeedbackItem[]) => { setItems(data); setLoading(false); })
      .catch(() => { setError("Could not load submissions."); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
      Loading…
    </div>
  );
  if (error) return <p style={{ color: "#ef4444", padding: 20 }}>{error}</p>;
  if (!items.length) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        No submissions yet
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Your feedback helps improve the platform for everyone.
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => (
        <div key={item.id} style={{
          padding: "14px 16px", borderRadius: 14,
          background: "var(--elevated)", border: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <div>
              <TypeBadge type={item.type} />
              {item.subject && (
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                  {item.subject}
                </div>
              )}
              {!item.subject && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.message}
                </div>
              )}
            </div>
            <StatusBadge status={item.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: GOLD, fontWeight: 700 }}>
              {item.referenceNumber || `FB-${String(item.id).padStart(6,"0")}`}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          {item.adminNote && (
            <div style={{
              marginTop: 10, padding: "10px 12px", borderRadius: 8,
              background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 4, letterSpacing: "0.06em" }}>
                DEVELOPER RESPONSE
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.55 }}>{item.adminNote}</div>
            </div>
          )}
          {!item.adminNote && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              Under review — no response yet
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
const ADMIN_STATUSES: Status[] = ["new","reviewed","in_progress","planned","completed","closed"];

function AdminPanel() {
  const [items, setItems]         = useState<FeedbackItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [filterType, setFType]    = useState("");
  const [filterStatus, setFStatus]= useState("");
  const [filterPriority, setFPri] = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<Record<number, Status>>({});
  const [editNote, setEditNote]   = useState<Record<number, string>>({});
  const [saving, setSaving]       = useState<number | null>(null);
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Status>("reviewed");
  const [offset, setOffset]       = useState(0);
  const LIMIT = 30;

  const load = useCallback(async (off = 0) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
    if (search)        params.set("search", search);
    if (filterType)    params.set("type", filterType);
    if (filterStatus)  params.set("status", filterStatus);
    if (filterPriority)params.set("priority", filterPriority);
    try {
      const res = await authedFetch(`/feedback?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.rows);
      setTotal(data.total);
      setOffset(off);
    } catch {
      setError("Could not load feedback.");
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus, filterPriority]);

  useEffect(() => { load(0); }, [load]);

  async function saveItem(id: number) {
    setSaving(id);
    try {
      const res = await authedFetch(`/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(editStatus[id] ? { status: editStatus[id] } : {}),
          ...(editNote[id] !== undefined ? { adminNote: editNote[id] } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setExpanded(null);
    } catch {
      alert("Failed to save.");
    } finally {
      setSaving(null);
    }
  }

  async function handleBulkUpdate() {
    if (!selected.size) return;
    try {
      const res = await authedFetch("/feedback/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
      });
      if (!res.ok) throw new Error();
      setSelected(new Set());
      load(offset);
    } catch { alert("Bulk update failed."); }
  }

  function exportCSV() {
    window.open("/api/feedback/export", "_blank");
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "bug_report", label: "🐞 Bug" },
    { value: "feature_request", label: "💡 Feature" },
    { value: "appreciation", label: "❤️ Appreciation" },
    { value: "help_request", label: "❓ Help" },
    { value: "app_rating", label: "⭐ Rating" },
  ];
  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...ADMIN_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") })),
  ];
  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const selectStyle: React.CSSProperties = {
    padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    background: "var(--elevated)", border: "1px solid var(--border)",
    color: "var(--text-primary)", cursor: "pointer", outline: "none",
  };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages…"
          style={{ ...inputCss, flex: "1 1 160px" }}
          onKeyDown={(e) => e.key === "Enter" && load(0)}
        />
        <select value={filterType} onChange={(e) => setFType(e.target.value)} style={selectStyle}>
          {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFStatus(e.target.value)} style={selectStyle}>
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFPri(e.target.value)} style={selectStyle}>
          {priorityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          borderRadius: 10, background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, marginBottom: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{selected.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as Status)} style={{ ...selectStyle, flex: 1 }}>
            {ADMIN_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <button onClick={handleBulkUpdate} style={{ ...btnPrimary, width: "auto", padding: "8px 16px", fontSize: 13 }}>
            Update
          </button>
          <button onClick={() => setSelected(new Set())} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Stats + export */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{total} submissions</span>
        <button onClick={exportCSV} style={{
          background: "none", border: "1px solid var(--border)", borderRadius: 8,
          padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
          color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6,
        }}>
          📥 Export CSV
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Loading…</div>}
      {error && <p style={{ color: "#ef4444" }}>{error}</p>}
      {!loading && !items.length && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 14 }}>
          No feedback found
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const isExpanded = expanded === item.id;
          return (
            <div key={item.id} style={{
              borderRadius: 12, border: `1px solid ${isExpanded ? GOLD_BORDER : "var(--border)"}`,
              background: isExpanded ? GOLD_DIM.replace("0.15","0.06") : "var(--elevated)",
              overflow: "hidden",
            }}>
              {/* Row */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}
                onClick={() => setExpanded(isExpanded ? null : item.id)}
              >
                <input
                  type="checkbox" checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <TypeBadge type={item.type} />
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: GOLD, fontWeight: 700 }}>
                      {item.referenceNumber || `FB-${String(item.id).padStart(6,"0")}`}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.subject || item.message.slice(0, 80)}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, textAlign: "right" }}>
                  <div>{new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  <div style={{ marginTop: 2, textTransform: "capitalize" }}>{item.priority}</div>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: 14, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: "0 14px 16px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
                    {item.subject && <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{item.subject}</div>}
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 8 }}>{item.message}</div>
                    {item.expectedBehaviour && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}><strong>Expected:</strong> {item.expectedBehaviour}</div>}
                    {item.actualBehaviour && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}><strong>Actual:</strong> {item.actualBehaviour}</div>}
                    {item.stepsToReproduce && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}><strong>Steps:</strong> {item.stepsToReproduce}</div>}
                    {item.platform && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}><strong>Platform:</strong> {item.platform} {item.browser && `· ${item.browser}`} {item.deviceModel && `· ${item.deviceModel}`}</div>}
                    {item.problemSolved && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}><strong>Problem:</strong> {item.problemSolved}</div>}
                    {item.rating && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}><strong>Rating:</strong> {"⭐".repeat(item.rating)} {item.wouldRecommend && `· Recommend: ${item.wouldRecommend}`}</div>}
                    {item.emojiReaction && <div style={{ fontSize: 20, marginBottom: 4 }}>{item.emojiReaction}</div>}
                    {item.userId && <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>User: {item.userId}</div>}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <select
                      value={editStatus[item.id] ?? item.status}
                      onChange={(e) => setEditStatus((prev) => ({ ...prev, [item.id]: e.target.value as Status }))}
                      style={{ ...selectStyle, flex: 1 }}
                    >
                      {ADMIN_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={labelCss}>Admin Note</label>
                    <textarea
                      value={editNote[item.id] ?? item.adminNote}
                      onChange={(e) => setEditNote((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Add a note or developer response…"
                      style={{ ...textareaCss, minHeight: 70 }}
                      maxLength={1000}
                    />
                  </div>

                  <button
                    onClick={() => saveItem(item.id)}
                    disabled={saving === item.id}
                    style={{ ...btnPrimary, opacity: saving === item.id ? 0.6 : 1 }}
                  >
                    {saving === item.id ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
          <button
            onClick={() => load(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            style={{ ...btnSecondary, width: "auto", padding: "8px 18px", opacity: offset === 0 ? 0.4 : 1 }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <button
            onClick={() => load(offset + LIMIT)}
            disabled={offset + LIMIT >= total}
            style={{ ...btnSecondary, width: "auto", padding: "8px 18px", opacity: offset + LIMIT >= total ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface FeedbackCenterModalProps {
  onClose: () => void;
  isAdmin?: boolean;
}

const VIEW_TITLES: Record<FcView, string> = {
  home:         "✦ Feedback Center",
  bug:          "🐞 Report a Bug",
  feature:      "💡 Suggest a Feature",
  appreciation: "❤️ Share Appreciation",
  help:         "❓ Ask for Help",
  rating:       "⭐ Rate the App",
  "my-feedback":"📋 My Submissions",
  admin:        "🔐 Feedback Management",
};

export default function FeedbackCenterModal({ onClose, isAdmin }: FeedbackCenterModalProps) {
  const { user } = useUser();
  const [view, setView]           = useState<FcView>("home");
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const handleSuccess = useCallback((ref: string) => {
    setSuccessRef(ref);
  }, []);

  const backToHome = useCallback(() => {
    setView("home");
    setSuccessRef(null);
  }, []);

  const title = VIEW_TITLES[view];

  return (
    <ModalShell
      title={successRef ? "✓ Thank You" : title}
      onClose={onClose}
      onBack={view !== "home" && !successRef ? backToHome : undefined}
    >
      {successRef ? (
        <SuccessScreen
          refNum={successRef}
          onClose={onClose}
          onNewSubmission={backToHome}
        />
      ) : (
        <>
          {view === "home"         && <HomeView setView={setView} isAdmin={isAdmin} isSignedIn={!!user} />}
          {view === "bug"          && <BugForm onSuccess={handleSuccess} />}
          {view === "feature"      && <FeatureForm onSuccess={handleSuccess} />}
          {view === "appreciation" && <AppreciationForm onSuccess={handleSuccess} />}
          {view === "help"         && <HelpForm onSuccess={handleSuccess} />}
          {view === "rating"       && <RatingForm onSuccess={handleSuccess} />}
          {view === "my-feedback"  && <MyFeedback />}
          {view === "admin"        && isAdmin && <AdminPanel />}
        </>
      )}
    </ModalShell>
  );
}
