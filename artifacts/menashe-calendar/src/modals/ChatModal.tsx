import { useState, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { HDate } from "@hebcal/core";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  timestamp: number;
}

interface Props {
  onClose: () => void;
}

type AiProvider = "openai" | "gemini" | "grok" | null;

const PROVIDER_LABEL: Record<NonNullable<AiProvider>, string> = {
  openai: "OpenAI",
  gemini: "Gemini",
  grok:   "Grok",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_BASE = "/api";

async function getAuthToken(): Promise<string | null> {
  return (await (window as any).Clerk?.session?.getToken()) ?? null;
}

function getHebrewDateStr(): string {
  try {
    return new HDate(new Date()).render("en");
  } catch {
    return "";
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

// ─── Question groups ──────────────────────────────────────────────────────────

const QUESTION_GROUPS: Array<{
  category: string;
  icon: string;
  questions: string[];
}> = [
  {
    category: "Prayer",
    icon: "🕯️",
    questions: [
      "What are the Zmanim for prayer today?",
      "How do I recite the Amidah properly?",
    ],
  },
  {
    category: "Torah",
    icon: "📜",
    questions: [
      "What is this week's Parasha about?",
      "Explain today's Daf Yomi simply",
    ],
  },
  {
    category: "Family",
    icon: "🏠",
    questions: [
      "How do I make Shabbat special for my family?",
      "Jewish blessings I can teach my children",
    ],
  },
  {
    category: "Community",
    icon: "🌿",
    questions: [
      "Tell me about the Bnei Menashe community",
      "Our journey back to the Land of Israel",
    ],
  },
  {
    category: "Jewish Life",
    icon: "✡️",
    questions: [
      "When is Shabbat this week?",
      "What Jewish holidays are coming up?",
    ],
  },
  {
    category: "Learning",
    icon: "📚",
    questions: [
      "Explain Mussar and character refinement",
      "What are the 48 Ways to Torah Wisdom?",
    ],
  },
];

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 7, height: 7,
            borderRadius: "50%",
            background: "#D4AF37",
            animation: `swTypingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ─── Empty state (conversation hero) ─────────────────────────────────────────

function EmptyState({ onAsk }: { onAsk: (q: string) => void }) {
  const hebrewDate = useMemo(() => getHebrewDateStr(), []);

  return (
    <div style={{ padding: "20px 20px 32px" }}>
      {/* Avatar + Identity */}
      <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 8 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(145deg, #1A2A4A 0%, #0F1829 100%)",
            border: "1.5px solid rgba(212,175,55,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: "0 0 32px rgba(212,175,55,0.12), 0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src="/rav-menashe-ai.png"
            alt="Rav Menashe"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling!.removeAttribute("hidden"); }}
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
          />
          <span hidden style={{ fontSize: 32 }}>✡️</span>
        </div>

        <div
          style={{
            fontSize: 26, fontWeight: 700, color: "#EDE8DC",
            letterSpacing: "-0.5px", lineHeight: 1.1, marginBottom: 6,
          }}
        >
          Rav Menashe
        </div>
        <div style={{ fontSize: 13, color: "#8A7A5A", marginBottom: hebrewDate ? 14 : 0, lineHeight: 1.5 }}>
          Your trusted Torah companion
        </div>

        {hebrewDate && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 24, padding: "5px 14px",
              fontSize: 11, color: "#C8A84B", letterSpacing: 0.3,
            }}
          >
            <span style={{ fontSize: 12 }}>☀</span>
            {hebrewDate}
          </div>
        )}
      </div>

      {/* Warm invitation */}
      <div
        style={{
          background: "rgba(212,175,55,0.05)",
          border: "1px solid rgba(212,175,55,0.14)",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 28,
          borderLeft: "3px solid rgba(212,175,55,0.4)",
        }}
      >
        <div style={{ fontSize: 13, color: "#C4B48A", lineHeight: 1.75, fontStyle: "italic" }}>
          "Ask me anything about Torah, prayer, the Jewish calendar, or the traditions of Bnei Menashe. I am here to guide, not to replace your rabbi."
        </div>
      </div>

      {/* Grouped question cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {QUESTION_GROUPS.map((group) => (
          <div key={group.category}>
            {/* Category header */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 7,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 13 }}>{group.icon}</span>
              <span
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
                  color: "#7A6A4A", textTransform: "uppercase",
                }}
              >
                {group.category}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.1)" }} />
            </div>

            {/* Question cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.questions.map((q) => (
                <button
                  key={q}
                  onClick={() => onAsk(q)}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(212,175,55,0.14)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    color: "#C4B896",
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                    lineHeight: 1.5,
                    transition: "background 0.15s, border-color 0.15s",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                  onMouseOver={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(212,175,55,0.08)";
                    el.style.borderColor = "rgba(212,175,55,0.3)";
                  }}
                  onMouseOut={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(255,255,255,0.03)";
                    el.style.borderColor = "rgba(212,175,55,0.14)";
                  }}
                >
                  <span style={{ color: "#D4AF37", fontSize: 14, flexShrink: 0 }}>›</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, provider, isLast }: {
  msg: Message;
  provider: AiProvider;
  isLast: boolean;
}) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 0,
      }}
    >
      {/* Sender label */}
      <div
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.9,
          color: isUser ? "#A89070" : "#8A9AB8",
          textTransform: "uppercase",
          marginBottom: 6,
          paddingLeft: isUser ? 0 : 2,
          paddingRight: isUser ? 2 : 0,
        }}
      >
        {isUser ? "You" : "Rav Menashe"}
      </div>

      {/* Bubble row */}
      <div
        style={{
          display: "flex",
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: 10,
          maxWidth: "88%",
        }}
      >
        {/* Avatar (assistant only) */}
        {!isUser && (
          <div
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg,#1A2A4A,#0F1829)",
              border: "1px solid rgba(212,175,55,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, flexShrink: 0,
            }}
          >
            ✡
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: isUser ? "11px 16px" : "13px 18px",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background: isUser
              ? "linear-gradient(135deg, #D4AF37 0%, #A47E1B 100%)"
              : "rgba(255,255,255,0.05)",
            border: isUser ? "none" : "1px solid rgba(212,175,55,0.12)",
            color: isUser ? "#0D1520" : "#E2D9C8",
            fontSize: 14,
            lineHeight: 1.7,
            fontWeight: isUser ? 500 : 400,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: isUser
              ? "0 2px 12px rgba(212,175,55,0.2)"
              : "0 1px 6px rgba(0,0,0,0.15)",
          }}
        >
          {msg.streaming && msg.content === "" ? (
            <TypingDots />
          ) : (
            <>
              {msg.content}
              {msg.streaming && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2, height: 15,
                    background: "#D4AF37",
                    marginLeft: 3,
                    borderRadius: 1,
                    verticalAlign: "middle",
                    animation: "swBlink 1s step-start infinite",
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer: timestamp + provider */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          marginTop: 5,
          paddingLeft: isUser ? 0 : 38,
          paddingRight: isUser ? 2 : 0,
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(138,122,90,0.6)" }}>
          {formatTime(msg.timestamp)}
        </span>
        {!isUser && !msg.streaming && provider && isLast && (
          <span
            style={{
              fontSize: 9, color: "#4A5A7A",
              background: "rgba(74,90,122,0.12)",
              border: "1px solid rgba(74,90,122,0.2)",
              borderRadius: 6, padding: "1px 6px",
            }}
          >
            via {PROVIDER_LABEL[provider]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function ChatModal({ onClose }: Props) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<AiProvider>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Streaming send (unchanged logic) ──────────────────────────────────────
  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim(), timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setProvider(null);

    const assistantMsg: Message = { role: "assistant", content: "", streaming: true, timestamp: Date.now() };
    setMessages([...nextMessages, assistantMsg]);

    const token = await getAuthToken();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.provider) {
              setProvider(parsed.provider as AiProvider);
            } else if (parsed.error) {
              accumulated = parsed.error;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated, streaming: true };
                return updated;
              });
            } else if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulated, streaming: true };
                return updated;
              });
            }
          } catch {}
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: accumulated || t.chatError,
          streaming: false,
        };
        return updated;
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: t.chatError, streaming: false };
        return updated;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setLoading(false);
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.streaming) updated[updated.length - 1] = { ...last, streaming: false };
      return updated;
    });
  }

  const isEmpty = messages.length === 0;

  // Find last assistant index for provider badge
  const lastAssistantIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  }, [messages]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 580,
          height: "92dvh",
          background: "linear-gradient(180deg, #090F1D 0%, #060C18 100%)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(212,175,55,0.2)",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(212,175,55,0.1)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "18px 20px 16px",
            borderBottom: "1px solid rgba(212,175,55,0.1)",
            background: "rgba(212,175,55,0.03)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 13,
          }}
        >
          <div
            style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(145deg,#1A2A4A,#0F1829)",
              border: "1.5px solid rgba(212,175,55,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
              boxShadow: "0 0 16px rgba(212,175,55,0.15)",
            }}
          >
            <img
              src="/rav-menashe-ai.png"
              alt="Rav Menashe"
              style={{ width: 42, height: 42, objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement!;
                parent.innerHTML = "✡";
                parent.style.fontSize = "18px";
                parent.style.color = "#D4AF37";
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: "#EDE8DC", fontWeight: 700, fontSize: 16, letterSpacing: "-0.2px" }}>
              {t.chatTitle}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: loading ? "#D4AF37" : "#4A9A6A",
                  boxShadow: loading ? "0 0 6px rgba(212,175,55,0.6)" : "0 0 6px rgba(74,154,106,0.6)",
                  animation: loading ? "swPulse 1.4s ease-in-out infinite" : "none",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#6A7A9A", fontSize: 11 }}>
                {loading ? "Composing wisdom…" : t.chatSubtitle}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: "#6A7A9A",
              width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 15, flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            ✕
          </button>
        </div>

        {/* ── Messages / Empty state ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isEmpty ? (
            <EmptyState onAsk={sendMessage} />
          ) : (
            <div
              style={{
                padding: "24px 20px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  provider={provider}
                  isLast={i === lastAssistantIdx}
                />
              ))}
              <div ref={bottomRef} style={{ height: 8 }} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div
          style={{
            padding: "14px 18px 18px",
            borderTop: "1px solid rgba(212,175,55,0.1)",
            background: "rgba(0,0,0,0.25)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 18,
              padding: "10px 14px",
              transition: "border-color 0.2s",
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)")}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chatPlaceholder}
              rows={1}
              disabled={loading}
              aria-label="Ask Rav Menashe"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#EDE8DC",
                fontSize: 14,
                lineHeight: 1.6,
                resize: "none",
                maxHeight: 110,
                overflowY: "auto",
                fontFamily: "inherit",
              }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 110) + "px";
              }}
            />
            {loading ? (
              <button
                onClick={handleStop}
                aria-label="Stop generating"
                style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  background: "rgba(220,60,60,0.18)",
                  border: "1px solid rgba(220,60,60,0.35)",
                  color: "#E06060",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, flexShrink: 0,
                }}
              >
                ◼
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                aria-label="Send message"
                style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  background: input.trim()
                    ? "linear-gradient(135deg,#D4AF37,#A47E1B)"
                    : "rgba(212,175,55,0.08)",
                  border: "none",
                  color: input.trim() ? "#0D1520" : "#4A3A1A",
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                  transition: "background 0.15s, box-shadow 0.15s",
                  boxShadow: input.trim() ? "0 2px 12px rgba(212,175,55,0.3)" : "none",
                }}
              >
                ↑
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <div style={{ color: "#3A2E1E", fontSize: 10, textAlign: "center" }}>
              {t.chatDisclaimer}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes swBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes swTypingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes swPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
