import { useState, useEffect } from "react";

interface Props { onClose: () => void; }

interface CommunityLink {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  url: string;
  category: string;
}

const DEFAULT_LINKS: CommunityLink[] = [
  { id: "shavei", emoji: "🏛", title: "Shavei Israel", sub: "Organization supporting Bnei Menashe aliyah", url: "https://www.shavei.org", category: "Organizations" },
  { id: "hotline", emoji: "📞", title: "Community Hotline", sub: "For halachic and community questions", url: "", category: "Support" },
  { id: "newsletter", emoji: "📰", title: "Bnei Menashe Newsletter", sub: "Monthly community updates", url: "", category: "Media" },
  { id: "torah", emoji: "🎓", title: "Torah Classes", sub: "Online shiurim for Bnei Menashe communities", url: "", category: "Learning" },
  { id: "connect", emoji: "🤝", title: "Connect with Members", sub: "Find community near you", url: "", category: "Community" },
];

const STORAGE_KEY = "menashe-community-links";

const CATEGORY_OPTIONS = ["Organizations", "Support", "Media", "Learning", "Community", "Resources", "Other"];
const EMOJI_OPTIONS = ["🏛","📞","📰","🎓","🤝","✡","🕍","🌟","📚","🙏","🌿","💎","🔗","📱","🗺","🎵","📜","🕎","🏠","🌐","📡","🔔","💬","📣","🎯","🫂"];

function loadLinks(): CommunityLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CommunityLink[];
  } catch {}
  return DEFAULT_LINKS;
}

function saveLinks(links: CommunityLink[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); } catch {}
}

const emptyForm = (): Omit<CommunityLink, "id"> => ({
  emoji: "🔗", title: "", sub: "", url: "", category: "Organizations",
});

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  background: "var(--elevated)", border: "1px solid var(--border)",
  color: "var(--text-primary)", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
  letterSpacing: "0.06em", marginBottom: 5, display: "block",
};

// Group links by category
function groupByCategory(links: CommunityLink[]): Record<string, CommunityLink[]> {
  return links.reduce<Record<string, CommunityLink[]>>((acc, link) => {
    const cat = link.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {});
}

export default function CommunityModal({ onClose, isAdmin = false }: Props & { isAdmin?: boolean }) {
  const [links, setLinks] = useState<CommunityLink[]>(loadLinks);
  const [view, setView] = useState<"main" | "admin" | "form">("main");
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { saveLinks(links); }, [links]);

  function openForm(link?: CommunityLink) {
    if (link) {
      setForm({ emoji: link.emoji, title: link.title, sub: link.sub, url: link.url, category: link.category });
      setEditId(link.id);
    } else {
      setForm(emptyForm());
      setEditId(null);
    }
    setView("form");
  }

  function saveForm() {
    if (!form.title.trim()) return;
    setSaving(true);
    const updated = editId
      ? links.map(l => l.id === editId ? { ...form, id: editId } : l)
      : [...links, { ...form, id: `link-${Date.now()}` }];
    setLinks(updated);
    setSaving(false);
    setView("admin");
    setEditId(null);
  }

  function deleteLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id));
    setDeleteConfirm(null);
  }

  function openLink(url: string) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const grouped = groupByCategory(links);

  // ── Add / Edit form ──
  if (view === "form") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
          <div className="modal-handle" />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <button
              onClick={() => setView("admin")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}
            >
              ← Back
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
              {editId ? "✏️ Edit Link" : "➕ Add Link"}
            </div>
            <button
              className="btn-gold"
              style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 10, opacity: saving ? 0.6 : 1 }}
              onClick={saveForm}
              disabled={saving || !form.title.trim()}
            >
              Save
            </button>
          </div>

          {/* Emoji picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>ICON</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{
                    width: 38, height: 38, borderRadius: 9, fontSize: 18, cursor: "pointer",
                    background: form.emoji === e ? "rgba(212,168,67,0.2)" : "var(--elevated)",
                    border: form.emoji === e ? "2px solid #d4a843" : "1px solid var(--border)",
                    transition: "all 0.15s",
                  }}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>TITLE <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={inputStyle} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Shavei Israel"
            />
          </div>

          {/* Subtitle */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>DESCRIPTION</label>
            <input
              style={inputStyle} value={form.sub}
              onChange={e => setForm(f => ({ ...f, sub: e.target.value }))}
              placeholder="Short description of this resource"
            />
          </div>

          {/* URL */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>WEBSITE URL</label>
            <input
              style={inputStyle} value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://example.com"
              type="url"
            />
            {form.url && (
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, color: "#4ade80" }}>✓</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", wordBreak: "break-all" }}>{form.url}</span>
              </div>
            )}
          </div>

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>CATEGORY</label>
            <select
              style={{ ...inputStyle, appearance: "none" }}
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Preview */}
          <div style={{ marginBottom: 20, padding: 14, borderRadius: 14, background: "var(--card)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".08em", marginBottom: 10 }}>PREVIEW</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>{form.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{form.title || "Link Title"}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{form.sub || "Description"}</div>
                {form.url && <div style={{ fontSize: 10, color: "#d4a843", marginTop: 2 }}>🔗 {form.url}</div>}
              </div>
            </div>
          </div>

          <button onClick={() => setView("admin")} className="btn-close-full">Cancel</button>
        </div>
      </div>
    );
  }

  // ── Admin list view ──
  if (view === "admin") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
          <div className="modal-handle" />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button
              onClick={() => setView("main")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}
            >
              ← Back
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>🛠 Manage Links</div>
            <button
              className="btn-gold"
              style={{ padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 10 }}
              onClick={() => openForm()}
            >
              + Add
            </button>
          </div>

          <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)" }}>
            <div style={{ fontSize: 12, color: "#d4a843", fontWeight: 600 }}>⚡ Admin Mode — {links.length} link{links.length !== 1 ? "s" : ""} saved</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Changes are saved instantly to the app</div>
          </div>

          {links.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🌱</div>
              <div style={{ fontSize: 13 }}>No community links yet.<br />Tap + Add to create the first one.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {links.map(link => (
                <div
                  key={link.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: 12, borderRadius: 14,
                    background: "var(--card)", border: "1px solid var(--border)",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>{link.emoji}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{link.category}</div>
                    {link.url && <div style={{ fontSize: 10, color: "#d4a843", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>🔗 {link.url}</div>}
                  </div>

                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={() => openForm(link)}
                      style={{ padding: "5px 9px", borderRadius: 7, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}
                    >
                      EDIT
                    </button>
                    {deleteConfirm === link.id ? (
                      <button
                        onClick={() => deleteLink(link.id)}
                        style={{ padding: "5px 9px", borderRadius: 7, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 11, color: "#ef4444", fontWeight: 700 }}
                      >
                        CONFIRM
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(link.id)}
                        style={{ padding: "5px 9px", borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", fontWeight: 700 }}
                      >
                        DEL
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setLinks(DEFAULT_LINKS);
            }}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 12, marginBottom: 8,
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            ↺ Reset to Defaults
          </button>
          <button onClick={() => setView("main")} className="btn-close-full">Done</button>
        </div>
      </div>
    );
  }

  // ── Main community view ──
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto", padding: 0 }}>
        <div className="modal-handle" style={{ marginTop: 10 }} />

        {/* ── Hero banner with background image ── */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "0 0 0 0", marginBottom: 0 }}>
          {/* Background photo */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url('/bnei-menashe-community-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: "brightness(0.28) saturate(0.8)",
          }} />
          {/* Gradient overlay — dark bottom for readability */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(8,14,28,0.45) 0%, rgba(8,14,28,0.72) 60%, rgba(8,14,28,0.97) 100%)",
          }} />
          {/* Gold top accent line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, #d4a843, #f0c94a, #d4a843, transparent)",
          }} />

          {/* Close button inside hero */}
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}
          >✕</button>

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, padding: "28px 20px 24px", textAlign: "center" }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(212,168,67,0.12)", border: "1px solid rgba(212,168,67,0.3)",
              borderRadius: 99, padding: "4px 14px", marginBottom: 14,
            }}>
              <span style={{ fontSize: 12 }}>✡</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#d4a843", letterSpacing: ".1em" }}>BNEI MENASHE WORLDWIDE</span>
            </div>

            {/* Hebrew title */}
            <div style={{
              fontFamily: "'Noto Serif Hebrew', serif", fontSize: 30, color: "#f0c94a",
              marginBottom: 10, lineHeight: 1.2, fontWeight: 700,
              textShadow: "0 2px 20px rgba(212,168,67,0.4)",
            }}>בְּנֵי מְנַשֶּׁה</div>

            {/* Tagline */}
            <div style={{
              fontSize: 13, color: "rgba(248,246,240,0.82)", lineHeight: 1.65,
              maxWidth: 300, margin: "0 auto 20px",
            }}>
              A community from northeastern India who trace their ancestry to the lost tribe of Menashe — returning to Zion.
            </div>

            {/* Stats row */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 0,
              background: "rgba(0,0,0,0.35)", borderRadius: 14,
              border: "1px solid rgba(212,168,67,0.18)",
              overflow: "hidden", margin: "0 4px",
            }}>
              {[
                { val: "10,000+", label: "TOTAL POPULATION" },
                { val: "5,000+", label: "MADE ALIYAH" },
                { val: "54", label: "PARSHIYOT" },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: "12px 4px", textAlign: "center",
                  borderRight: i < 2 ? "1px solid rgba(212,168,67,0.15)" : "none",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#f0c94a", letterSpacing: "-.02em" }}>{s.val}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(212,168,67,0.6)", letterSpacing: ".07em", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Isaiah quote */}
            <div style={{
              marginTop: 16, padding: "10px 16px",
              borderLeft: "2px solid rgba(212,168,67,0.4)",
              textAlign: "left", marginLeft: 4,
            }}>
              <div style={{ fontSize: 12, color: "rgba(248,246,240,0.6)", fontStyle: "italic", lineHeight: 1.6 }}>
                "I will bring the remnant of my people from the East, and gather them from the West."
              </div>
              <div style={{ fontSize: 10, color: "rgba(212,168,67,0.5)", marginTop: 4, fontWeight: 600 }}>— Isaiah 43:5</div>
            </div>
          </div>
        </div>

        {/* ── Body content ── */}
        <div style={{ padding: "20px 16px 8px" }}>

          {/* Links grouped by category */}
          {Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
              No community links yet.
            </div>
          ) : (
            Object.entries(grouped).map(([category, catLinks]) => (
              <div key={category} style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                  letterSpacing: ".1em", marginBottom: 8, paddingLeft: 2,
                }}>
                  {category.toUpperCase()}
                </div>
                <div style={{
                  borderRadius: 16, border: "1px solid var(--border)",
                  overflow: "hidden", background: "var(--card)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                }}>
                  {catLinks.map((link, i) => (
                    <div
                      key={link.id}
                      onClick={() => link.url && openLink(link.url)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                        borderBottom: i < catLinks.length - 1 ? "1px solid var(--border)" : "none",
                        cursor: link.url ? "pointer" : "default",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (link.url) (e.currentTarget as HTMLElement).style.background = "rgba(212,168,67,0.04)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                      }}>
                        {link.emoji}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{link.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{link.sub}</div>
                        {link.url && (
                          <div style={{ fontSize: 10, color: "#d4a843", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                            <span>🔗</span>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                              {link.url.replace(/^https?:\/\//, "")}
                            </span>
                          </div>
                        )}
                      </div>

                      {link.url ? (
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 10 L10 2 M5 2 L10 2 L10 7" stroke="#d4a843" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 16, flexShrink: 0 }}>›</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Footer admin */}
          {isAdmin && (
            <div style={{ textAlign: "center", marginTop: 4, marginBottom: 12 }}>
              <button
                onClick={() => setView("admin")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, color: "var(--text-muted)", padding: "6px 12px",
                  opacity: 0.5,
                }}
              >
                ⚙ Admin
              </button>
            </div>
          )}

          <button onClick={onClose} className="btn-close-full">Close</button>
        </div>
      </div>
    </div>
  );
}
