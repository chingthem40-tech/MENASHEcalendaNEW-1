import { useState, useEffect } from "react";
import type { Book } from "../pages/SiddurPage";

interface Props {
  book: Book;
  onClose: () => void;
}

export default function BookReaderModal({ book, onClose }: Props) {
  const storageKey = `siddur-progress-${book.id}`;
  const bookmarkKey = `siddur-bookmarks-${book.id}`;

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved) : 1;
  });
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(bookmarkKey) || "[]"); } catch { return []; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
  }, [bookmarks]);

  function toggleBookmark() {
    setBookmarks(prev =>
      prev.includes(currentPage) ? prev.filter(p => p !== currentPage) : [...prev, currentPage].sort((a, b) => a - b)
    );
  }

  const isBookmarked = bookmarks.includes(currentPage);
  const hasFile = !!book.fileUrl;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--background)", zIndex: 200, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--background)", flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{book.language}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowSearch(s => !s)}
            style={{ width: 32, height: 32, borderRadius: 8, background: showSearch ? "rgba(212,168,67,0.15)" : "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >🔍</button>
          <button
            onClick={toggleBookmark}
            style={{ width: 32, height: 32, borderRadius: 8, background: isBookmarked ? "rgba(212,168,67,0.15)" : "var(--elevated)", border: `1px solid ${isBookmarked ? "rgba(212,168,67,0.4)" : "var(--border)"}`, cursor: "pointer", color: isBookmarked ? "#d4a843" : "var(--text-muted)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >🔖</button>
          {bookmarks.length > 0 && (
            <button
              onClick={() => setShowBookmarks(s => !s)}
              style={{ width: 32, height: 32, borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
            >{bookmarks.length}</button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--elevated)", flexShrink: 0 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search in book…"
            autoFocus
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      )}

      {/* Bookmarks panel */}
      {showBookmarks && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--card)", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: 8 }}>BOOKMARKS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {bookmarks.map(p => (
              <button
                key={p}
                onClick={() => { setCurrentPage(p); setShowBookmarks(false); }}
                style={{ padding: "4px 10px", borderRadius: 6, background: p === currentPage ? "#d4a843" : "var(--elevated)", color: p === currentPage ? "#1a0f00" : "var(--text-primary)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                p.{p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {hasFile ? (
          <iframe
            src={book.fileUrl!}
            style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
            title={book.title}
          />
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>
            {/* Cover page */}
            {currentPage === 1 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ width: 100, height: 140, borderRadius: 12, background: book.coverImageUrl ? "transparent" : `linear-gradient(135deg, ${book.coverColor}, ${book.coverColor}bb)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, margin: "0 auto 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    book.coverEmoji
                  )}
                </div>
                <div style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 28, color: "#d4a843", marginBottom: 12 }}>{book.title}</div>
                <div style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 8 }}>{book.language}</div>
                <span className="tag tag-blue">{book.category}</span>
                <div style={{ marginTop: 24, padding: 16, background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", textAlign: "left" }}>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{book.description}</div>
                </div>
                {book.isPremium && (
                  <div style={{ marginTop: 16, padding: 12, background: "rgba(212,168,67,0.1)", borderRadius: 10, border: "1px solid rgba(212,168,67,0.25)" }}>
                    <div style={{ fontSize: 13, color: "#d4a843" }}>⭐ Premium Content — Upgrade to access full text</div>
                  </div>
                )}
                <div style={{ marginTop: 24, padding: 14, background: "var(--elevated)", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
                  📥 This book's full text will be available when the admin uploads a PDF or EPUB file. Tap the page navigator below to continue.
                </div>
              </div>
            )}
            {currentPage > 1 && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 15, marginBottom: 8, color: "var(--text-secondary)" }}>Page {currentPage}</div>
                <div style={{ fontSize: 13 }}>Full book content will appear here once a PDF is uploaded by the admin.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar — page navigation */}
      {!hasFile && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--background)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{ width: 36, height: 36, borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", cursor: currentPage <= 1 ? "not-allowed" : "pointer", color: currentPage <= 1 ? "var(--text-muted)" : "var(--text-primary)", fontSize: 16, opacity: currentPage <= 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ‹
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <input
              type="number"
              min={1}
              value={currentPage}
              onChange={e => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1) setCurrentPage(v);
              }}
              style={{ width: 64, padding: "6px 8px", borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 15, fontWeight: 700, textAlign: "center", outline: "none" }}
            />
            <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }}>/ —</span>
          </div>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ width: 36, height: 36, borderRadius: 8, background: "var(--elevated)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-primary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
