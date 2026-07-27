import { useState, useEffect, useCallback } from "react";
import { getCandles, lightCandle } from "../api/memorialApi";
import type {
  MemorialCandle,
  LightCandleInput,
  MemorialLoadingState,
  PaginatedResponse,
} from "../types";

// ── useCandles ────────────────────────────────────────────────────────────────
// Paginated candle list + optimistic light action.
// Pass `filter` to fetch only today's or community candles server-side.

interface UseCandles {
  candles: MemorialCandle[];
  total: number;
  hasMore: boolean;
  status: MemorialLoadingState;
  error: Error | null;
  loadMore: () => void;
  light: (input: LightCandleInput) => Promise<MemorialCandle>;
}

export function useCandles(
  memorialId: string | null | undefined,
  filter?: "recent" | "today" | "community",
): UseCandles {
  const [pages, setPages] = useState<MemorialCandle[][]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<MemorialLoadingState>("idle");
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = useCallback(
    async (p: number) => {
      if (!memorialId) return;
      setStatus("loading");
      setError(null);
      try {
        const res: PaginatedResponse<MemorialCandle> = await getCandles(
          memorialId,
          p,
          20,
          filter,
        );
        setPages((prev) => {
          const next = [...prev];
          next[p - 1] = res.data;
          return next;
        });
        setTotal(res.total);
        setHasMore(res.hasMore);
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
    },
    [memorialId, filter],
  );

  useEffect(() => {
    setPages([]);
    setPage(1);
    fetchPage(1);
  }, [memorialId, fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || status === "loading") return;
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  }, [hasMore, status, page, fetchPage]);

  // Optimistic insert at the top of the list, then refresh page 1.
  const light = useCallback(
    async (input: LightCandleInput): Promise<MemorialCandle> => {
      if (!memorialId) throw new Error("No memorial ID");
      const candle = await lightCandle(memorialId, input);
      // Prepend optimistically
      setPages((prev) => {
        const next = [...prev];
        next[0] = [candle, ...(next[0] ?? [])];
        return next;
      });
      setTotal((t) => t + 1);
      return candle;
    },
    [memorialId],
  );

  const candles = pages.flat();

  return { candles, total, hasMore, status, error, loadMore, light };
}
