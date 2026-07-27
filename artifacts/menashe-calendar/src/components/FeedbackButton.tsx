import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

type Category = "bug" | "ux" | "content" | "perf" | "suggest";
type Priority = "critical" | "high" | "medium" | "low";

const CATEGORY_ICONS: Record<Category, string> = {
  bug: "🐛",
  ux: "🤔",
  content: "📄",
  perf: "⚡",
  suggest: "💡",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22c55e",
};

export default function FeedbackButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("bug");
  const [priority, setPriority] = useState<Priority>("medium");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const categories: { value: Category; label: string }[] = [
    { value: "bug",     label: t.feedbackCategoryBug },
    { value: "ux",      label: t.feedbackCategoryUx },
    { value: "content", label: t.feedbackCategoryContent },
    { value: "perf",    label: t.feedbackCategoryPerf },
    { value: "suggest", label: t.feedbackCategorySuggest },
  ];

  const priorities: { value: Priority; label: string }[] = [
    { value: "critical", label: t.feedbackPriorityCritical },
    { value: "high",     label: t.feedbackPriorityHigh },
    { value: "medium",   label: t.feedbackPriorityMedium },
    { value: "low",      label: t.feedbackPriorityLow },
  ];

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("menashe:open-feedback", handler);
    return () => window.removeEventListener("menashe:open-feedback", handler);
  }, []);

  const reset = () => {
    setCategory("bug");
    setPriority("medium");
    setMessage("");
    setState("idle");
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setState("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          priority,
          message: message.trim(),
          page: window.location.pathname,
          device: navigator.userAgent.slice(0, 200),
        }),
      });
      if (!res.ok) throw new Error("non-200");
      setState("success");
    } catch {
      setState("error");
    }
  };

  return (
    <>
      {/* Overlay + modal */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9001,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "0 0 0 0",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#0F1829",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "16px 16px 0 0",
              padding: "24px 20px 32px",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
              maxHeight: "90dvh",
              overflowY: "auto",
            }}
          >
            {state === "success" ? (
              /* ── Success state ── */
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h2 style={{ margin: "0 0 8px", color: "#D4AF37", fontSize: 20, fontWeight: 700 }}>
                  {t.feedbackSuccess}
                </h2>
                <p style={{ margin: "0 0 24px", color: "rgba(232,213,163,0.7)", fontSize: 14, lineHeight: 1.6 }}>
                  {t.feedbackSuccessDetail}
                </p>
                <button onClick={handleClose} style={btnPrimary}>
                  {t.feedbackClose}
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <h2 style={{ margin: 0, color: "#D4AF37", fontSize: 18, fontWeight: 700 }}>
                      ✦ {t.feedbackTitle}
                    </h2>
                    <p style={{ margin: "4px 0 0", color: "rgba(232,213,163,0.6)", fontSize: 12 }}>
                      {t.feedbackSubtitle}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    style={{ background: "none", border: "none", color: "rgba(232,213,163,0.5)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 0 0 8px" }}
                  >
                    ×
                  </button>
                </div>

                {/* Category chips */}
                <label style={labelStyle}>{t.feedbackCategory}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        border: category === c.value
                          ? "1.5px solid #D4AF37"
                          : "1.5px solid rgba(212,175,55,0.2)",
                        background: category === c.value
                          ? "rgba(212,175,55,0.15)"
                          : "transparent",
                        color: category === c.value ? "#D4AF37" : "rgba(232,213,163,0.6)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {CATEGORY_ICONS[c.value]} {c.label}
                    </button>
                  ))}
                </div>

                {/* Priority */}
                <label style={labelStyle}>{t.feedbackPriority}</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: priority === p.value
                          ? `1.5px solid ${PRIORITY_COLORS[p.value]}`
                          : "1.5px solid rgba(255,255,255,0.08)",
                        background: priority === p.value
                          ? `${PRIORITY_COLORS[p.value]}18`
                          : "transparent",
                        color: priority === p.value ? PRIORITY_COLORS[p.value] : "rgba(232,213,163,0.55)",
                        fontSize: 12,
                        fontWeight: priority === p.value ? 600 : 400,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Message textarea */}
                <label style={labelStyle}>{t.feedbackMessage}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.feedbackMessagePlaceholder}
                  rows={4}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(212,175,55,0.2)",
                    borderRadius: 8,
                    color: "#e8d5a3",
                    fontSize: 13,
                    padding: "10px 12px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: 16,
                  }}
                />

                {state === "error" && (
                  <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 12px" }}>
                    {t.feedbackError}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || state === "submitting"}
                  style={{
                    ...btnPrimary,
                    opacity: !message.trim() || state === "submitting" ? 0.5 : 1,
                    cursor: !message.trim() || state === "submitting" ? "not-allowed" : "pointer",
                    width: "100%",
                  }}
                >
                  {state === "submitting" ? t.feedbackSubmitting : t.feedbackSubmit}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "rgba(212,175,55,0.7)",
  textTransform: "uppercase",
  marginBottom: 8,
};

const btnPrimary: React.CSSProperties = {
  padding: "11px 24px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg,#D4AF37,#A0821A)",
  color: "#0F1829",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
