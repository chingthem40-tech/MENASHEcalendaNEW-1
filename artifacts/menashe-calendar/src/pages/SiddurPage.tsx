import { useState, useEffect, memo } from "react";
import { GOLD, GOLD_GRAD } from "../lib/theme";
import { useLanguage } from "../context/LanguageContext";

export interface Book {
  id: number;
  title: string;
  language: string;
  category: string;
  description: string;
  coverEmoji: string;
  coverColor: string;
  fileUrl: string | null;
  coverImageUrl: string | null;
  isPremium: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  "All",
  "Siddur",
  "Tehillim",
  "Torah Portions",
  "Kuki Christian Books",
  "Hebrew Learning",
  "Prayer Books",
  "Daily Study",
  "Custom Community Books",
];

const API_BASE = "/api";

interface SiddurPageProps {
  onReadBook: (book: Book) => void;
  onAdmin: () => void;
  refreshKey: number;
  isPremium: boolean;
  onShowPremium: () => void;
  isAdmin?: boolean;
}

const SiddurPage = memo(function SiddurPage({ onReadBook, onAdmin, refreshKey, isPremium, onShowPremium, isAdmin = false }: SiddurPageProps) {
  const { t } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBooks();
  }, [refreshKey]);

  async function fetchBooks() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/books`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredBooks = books.filter(book => {
    const matchCat = activeCategory === "All" || book.category === activeCategory;
    const matchSearch = !search || book.title.toLowerCase().includes(search.toLowerCase()) || book.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const recentBook = [...books].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const progressBook = (() => {
    for (const book of books) {
      const p = localStorage.getItem(`siddur-progress-${book.id}`);
      if (p) return { book, page: parseInt(p) };
    }
    return null;
  })();

  const premiumBookCount = books.filter(b => b.isPremium).length;

  return (
    <div style={{ padding: "0 0 4px" }}>
      <style>{`
        @keyframes siddurLockPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,67,0); }
          50% { box-shadow: 0 0 0 6px rgba(212,168,67,0.12); }
        }
        .library-category-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .library-category-button {
          min-height: 38px;
          padding: 7px 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          cursor: pointer;
          white-space: normal;
          text-align: center;
          font-size: 12px;
          font-weight: 650;
          line-height: 1.2;
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
        }
        .library-category-button:hover {
          transform: translateY(-1px);
        }
        .library-category-button:focus-visible {
          outline: 2px solid ${GOLD};
          outline-offset: 2px;
        }
        @media (min-width: 560px) {
          .library-category-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (min-width: 900px) {
          .library-category-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* Header */}
      <div className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="app-icon">📚</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Siddur</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: 600 }}>LIBRARY</div>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onAdmin}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
          >
            <span style={{ fontSize: 13 }}>⚙️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Admin</span>
          </button>
        )}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0f1e38, #1a2a4a)", borderRadius: 16, padding: 18, marginBottom: 14, border: "1px solid rgba(212,168,67,0.2)" }}>
          <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 22, color: GOLD, marginBottom: 4 }}>סִפְרִיַּת הַסִּדּוּר</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 6 }}>Siddur Library</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Sacred texts, prayers & community publications for Bnei Menashe</div>
        </div>

        {/* Premium upsell banner — shown only to non-premium users when premium books exist */}
        {!isPremium && premiumBookCount > 0 && (
          <button
            onClick={onShowPremium}
            style={{
              width: "100%", marginBottom: 14,
              padding: "13px 16px",
              background: "linear-gradient(135deg, rgba(212,168,67,0.11) 0%, rgba(212,168,67,0.04) 100%)",
              border: "1px solid rgba(212,168,67,0.38)",
              borderRadius: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: GOLD_GRAD,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 19, boxShadow: "0 2px 10px rgba(212,168,67,0.3)",
            }}>👑</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>
                {premiumBookCount} Premium {premiumBookCount === 1 ? "Book" : "Books"} Available
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                Unlock exclusive texts with Premium — 7-day free trial
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Continue reading */}
        {progressBook && (
          <div
            onClick={() => {
              if (progressBook.book.isPremium && !isPremium) { onShowPremium(); return; }
              onReadBook(progressBook.book);
            }}
            className="card"
            style={{ padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: "1px solid rgba(212,168,67,0.2)" }}
          >
            <div style={{ width: 44, height: 56, borderRadius: 8, background: progressBook.book.coverColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {progressBook.book.coverEmoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", marginBottom: 2 }}>CONTINUE READING</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{progressBook.book.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Page {progressBook.page}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-muted)" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search books…"
            style={{
              width: "100%", padding: "11px 14px 11px 36px", borderRadius: 10,
              background: "var(--elevated)", border: "1px solid var(--border)",
              color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category filters */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            {t.libraryBrowseCategories}
          </div>
          <div className="library-category-grid" role="group" aria-label={t.libraryBrowseCategories}>
          {CATEGORIES.filter(c => {
            if (c === "All") return true;
            return books.some(b => b.category === c);
          }).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="library-category-button"
              aria-pressed={activeCategory === cat}
              style={{
                background: activeCategory === cat ? GOLD : "var(--elevated)",
                color: activeCategory === cat ? "#1a0f00" : "var(--text-muted)",
                borderColor: activeCategory === cat ? GOLD : "var(--border)",
              }}
            >
              {cat}
            </button>
          ))}
          </div>
        </div>

        {/* Books grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
            <div style={{ fontSize: 13 }}>Loading library…</div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 13 }}>No books in this category yet</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                userIsPremium={isPremium}
                onRead={() => onReadBook(book)}
                onShowPremium={onShowPremium}
              />
            ))}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
});

export default SiddurPage;

function BookCard({
  book, userIsPremium, onRead, onShowPremium,
}: {
  book: Book;
  userIsPremium: boolean;
  onRead: () => void;
  onShowPremium: () => void;
}) {
  const locked = book.isPremium && !userIsPremium;

  return (
    <div
      className="card"
      style={{
        padding: 16, display: "flex", gap: 14, alignItems: "flex-start",
        border: locked ? "1px solid rgba(212,168,67,0.22)" : undefined,
        background: locked ? "rgba(212,168,67,0.03)" : undefined,
      }}
    >
      {/* Cover */}
      <div style={{
        width: 60, height: 80, borderRadius: 8, flexShrink: 0,
        background: locked
          ? `linear-gradient(135deg, rgba(30,20,5,0.9), rgba(20,13,3,0.95))`
          : book.coverImageUrl ? "transparent" : `linear-gradient(135deg, ${book.coverColor}, ${book.coverColor}aa)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, border: locked ? "1px solid rgba(212,168,67,0.3)" : "1px solid rgba(255,255,255,0.1)",
        boxShadow: locked ? "0 2px 12px rgba(212,168,67,0.15)" : "2px 3px 12px rgba(0,0,0,0.3)",
        position: "relative", overflow: "hidden",
        animation: locked ? "siddurLockPulse 3s ease-in-out infinite" : undefined,
      }}>
        {/* Cover image or emoji */}
        {book.coverImageUrl && !locked ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: locked ? "blur(3px)" : "none" }}
          />
        ) : (
          <span style={{ filter: locked ? "blur(3px)" : "none", opacity: locked ? 0.35 : 1, transition: "filter 0.2s" }}>
            {book.coverEmoji}
          </span>
        )}

        {/* Lock overlay for premium books */}
        {locked && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontSize: 7, fontWeight: 900, color: GOLD, letterSpacing: "0.06em" }}>PRO</span>
          </div>
        )}

        {/* Gold PRO badge (top-right) for premium books */}
        {book.isPremium && (
          <div style={{
            position: "absolute", top: -5, right: -5,
            background: "linear-gradient(135deg, #b8860b, #d4a843)",
            color: "#1a0f00", fontSize: 8, fontWeight: 900,
            padding: "2px 5px", borderRadius: 5,
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            letterSpacing: "0.04em",
          }}>👑</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, lineHeight: 1.3,
            color: locked ? GOLD : "var(--text-primary)",
          }}>
            {book.title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          <span className="tag tag-blue" style={{ fontSize: 10 }}>{book.category}</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{book.language}</span>
          {book.isPremium && (
            <span style={{
              fontSize: 9, fontWeight: 900, color: "#b8860b", letterSpacing: "0.08em",
              background: "rgba(212,168,67,0.13)", border: "1px solid rgba(212,168,67,0.28)",
              borderRadius: 4, padding: "2px 5px",
            }}>👑 PREMIUM</span>
          )}
        </div>

        <div style={{
          fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          filter: locked ? "blur(2.5px)" : "none",
          userSelect: locked ? "none" : undefined,
        }}>
          {book.description}
        </div>

        {locked ? (
          <button
            onClick={onShowPremium}
            style={{
              padding: "7px 18px", borderRadius: 8, cursor: "pointer",
              background: "linear-gradient(90deg, #6b4800, #b8860b, #d4a843, #b8860b, #6b4800)",
              backgroundSize: "200% auto",
              color: "#1a0f00", fontSize: 12, fontWeight: 800,
              border: "none", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a0f00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Unlock with Premium
          </button>
        ) : (
          <button
            onClick={onRead}
            style={{
              padding: "7px 18px", borderRadius: 8, cursor: "pointer",
              background: book.isPremium ? "linear-gradient(135deg, #b8860b, #d4a843)" : "var(--elevated)",
              color: book.isPremium ? "#1a0f00" : "var(--text-primary)",
              fontSize: 12, fontWeight: 700,
              border: book.isPremium ? "none" : "1px solid var(--border)",
            }}
          >
            {book.isPremium ? "⭐ Read (Premium)" : "📖 Read"}
          </button>
        )}
      </div>
    </div>
  );
}
