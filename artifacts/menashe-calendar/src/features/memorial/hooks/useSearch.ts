import { useState, useCallback, useRef } from "react";
import { searchMemorial } from "../api/memorialApi";
import type {
  MemorialWithPerson,
  SearchMemorialParams,
  MemorialLoadingState,
} from "../types";

// ── useSearch ─────────────────────────────────────────────────────────────────
// Debounced memorial search with pagination support.
// Aborts in-flight requests when query changes.

const DEBOUNCE_MS = 300;

interface UseSearch {
  results: MemorialWithPerson[];
  total: number;
  hasMore: boolean;
  status: MemorialLoadingState;
  error: Error | null;
  query: string;
  setQuery: (q: string) => void;
  loadMore: () => void;
  reset: () => void;
}

export function useSearch(): UseSearch {
  const [results, setResults] = useState<MemorialWithPerson[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<MemorialLoadingState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [query, setQueryState] = useState("");
  const [page, setPage] = useState(1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQueryRef = useRef("");

  const runSearch = useCallback(
    async (params: SearchMemorialParams, append = false) => {
      const localQuery = params.q ?? "";
      setStatus("loading");
      setError(null);
      try {
        const res = await searchMemorial(params);
        // Guard stale responses — drop if query changed while in flight
        if (currentQueryRef.current !== localQuery) return;
        if (append) {
          setResults((prev) => [...prev, ...res.data]);
        } else {
          setResults(res.data);
        }
        setTotal(res.total);
        setHasMore(res.hasMore);
        setStatus("success");
      } catch (err) {
        if (currentQueryRef.current !== localQuery) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
    },
    [],
  );

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      currentQueryRef.current = q;
      setPage(1);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q.trim()) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
        setStatus("idle");
        return;
      }

      debounceRef.current = setTimeout(() => {
        runSearch({ q, page: 1, limit: 20 });
      }, DEBOUNCE_MS);
    },
    [runSearch],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || status === "loading" || !query.trim()) return;
    const next = page + 1;
    setPage(next);
    runSearch({ q: query, page: next, limit: 20 }, true);
  }, [hasMore, status, query, page, runSearch]);

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    currentQueryRef.current = "";
    setQueryState("");
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setStatus("idle");
    setError(null);
    setPage(1);
  }, []);

  return { results, total, hasMore, status, error, query, setQuery, loadMore, reset };
}
