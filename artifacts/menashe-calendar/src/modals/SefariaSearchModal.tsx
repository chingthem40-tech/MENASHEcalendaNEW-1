import { useState, useEffect, useRef } from "react";

interface Props { onClose: () => void; }

const SEFARIA = "https://www.sefaria.org";

interface SearchHit {
  ref: string;
  title: string;
  category: string;
  text: string;
  url: string;
}

interface NameResult {
  key: string;
  primary_title: { en: string; he: string };
  type: string;
  category: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

const SUGGESTED = [
  { label: "Shabbat", q: "Shabbat" },
  { label: "Prayer", q: "prayer" },
  { label: "Teshuvah", q: "repentance" },
  { label: "Torah", q: "Torah" },
  { label: "Mitzvot", q: "commandment" },
  { label: "Exile", q: "exile" },
  { label: "Redemption", q: "redemption" },
  { label: "Jerusalem", q: "Jerusalem" },
];

export default function SefariaSearchModal({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<NameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${SEFARIA}/api/name/${encodeURIComponent(query.trim())}?limit=6`);
        const data = await res.json();
        const items: NameResult[] = (data.completions_objects ?? [])
          .filter((o: NameResult) => o.type === "ref" || o.type === "Topic" || o.category)
          .slice(0, 5);
        setSuggestions(items);
      } catch { setSuggestions([]); }
    }, 280);
  }, [query]);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(false);
    setSearched(true);
    setSuggestions([]);
    try {
      const res = await fetch(
        `${SEFARIA}/api/search-wrapper/texts?query=${encodeURIComponent(q)}&size=10&field=naive_lemmatizer&sort_type=score`
      );
      const data = await res.json();
      const raw: SearchHit[] = (data.hits?.hits ?? []).map((h: {
        _source?: { ref?: string; title?: string; path?: string; naive_lemmatizer?: string; exact?: string };
      }) => ({
        ref: h._source?.ref ?? "",
        title: h._source?.title ?? h._source?.ref ?? "",
        category: (h._source?.path ?? "").split(".").slice(-1)[0] ?? "",
        text: stripHtml(h._source?.naive_lemmatizer ?? h._source?.exact ?? "").slice(0, 240),
        url: `${SEFARIA}/${(h._source?.ref ?? "").replace(/ /g, ".")}`,
      })).filter((h: SearchHit) => h.ref);
      setHits(raw);
    } catch {
      setError(true);
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") doSearch(query);
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-card"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "92vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}
      >
        {/* ── Header ── */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Torah Search</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Search the entire Sefaria library</div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Search box */}
          <div style={{ position: "relative", marginBottom: 4 }}>
            <div style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", pointerEvents: "none",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search Torah, Talmud, Midrash…"
              style={{
                width: "100%", padding: "13px 50px 13px 40px",
                borderRadius: 14, border: "1px solid rgba(212,168,67,0.35)",
                background: "rgba(212,168,67,0.06)", color: "var(--text-primary)",
                fontSize: 15, outline: "none", boxSizing: "border-box",
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setHits([]); setSuggestions([]); setSearched(false); inputRef.current?.focus(); }}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: 16, lineHeight: 1,
                }}
              >✕</button>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              borderRadius: 12, border: "1px solid rgba(212,168,67,0.2)",
              background: "var(--elevated)", overflow: "hidden", marginBottom: 6,
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s.primary_title?.en ?? s.key); doSearch(s.primary_title?.en ?? s.key); }}
                  style={{
                    width: "100%", padding: "10px 14px", textAlign: "left",
                    background: "none", border: "none", borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontSize: 14 }}>📜</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.primary_title?.en ?? s.key}</div>
                    {s.category && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.category}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search button */}
          <button
            onClick={() => doSearch(query)}
            disabled={!query.trim() || loading}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 12, marginBottom: 12,
              background: query.trim()
                ? "linear-gradient(90deg, #6b4800, #d4a843)"
                : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(212,168,67,0.3)",
              color: query.trim() ? "#1a0900" : "var(--text-muted)",
              fontSize: 14, fontWeight: 700, cursor: query.trim() ? "pointer" : "default",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* ── Scrollable results area ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>

          {/* Quick chips (before any search) */}
          {!searched && !loading && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 10 }}>
                SUGGESTED TOPICS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                {SUGGESTED.map(s => (
                  <button
                    key={s.q}
                    onClick={() => { setQuery(s.q); doSearch(s.q); }}
                    style={{
                      padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                      background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.25)",
                      color: "var(--text-secondary)", cursor: "pointer",
                    }}
                  >{s.label}</button>
                ))}
              </div>
            </>
          )}

          {/* Loading spinner */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
              <div style={{ fontSize: 14 }}>Searching Sefaria…</div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Could not reach Sefaria. Please check your connection and try again.
              </div>
            </div>
          )}

          {/* No results */}
          {searched && !loading && !error && hits.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No results found for "{query}"</div>
            </div>
          )}

          {/* Results */}
          {!loading && hits.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 10 }}>
                {hits.length} RESULTS FOR "{query.toUpperCase()}"
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {hits.map((hit, i) => (
                  <a
                    key={i}
                    href={hit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block", padding: "14px 14px",
                      borderRadius: 14, textDecoration: "none",
                      background: "rgba(212,168,67,0.05)",
                      border: "1px solid rgba(212,168,67,0.15)",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: hit.text ? 8 : 0 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 3 }}>
                          {hit.title || hit.ref}
                        </div>
                        <div style={{ fontSize: 11, color: "#d4a843", fontWeight: 600, letterSpacing: "0.04em" }}>
                          {hit.ref}
                          {hit.category ? ` · ${hit.category}` : ""}
                        </div>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.5)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </div>
                    {hit.text && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65 }}>
                        {hit.text}
                      </div>
                    )}
                  </a>
                ))}
              </div>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <a
                  href={`${SEFARIA}/search#query=${encodeURIComponent(query)}&tab=text`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#d4a843", fontWeight: 600, textDecoration: "none" }}
                >
                  See all results on Sefaria →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
