import { useState, useEffect, useCallback } from "react";
import { getTributes, addTribute } from "../api/memorialApi";
import type {
  MemorialTribute,
  AddTributeInput,
  MemorialLoadingState,
  PaginatedResponse,
} from "../types";

// ── useTributes ───────────────────────────────────────────────────────────────
// Paginated tribute list + submit action.
// Pending tributes (requireModeration=true) are shown to family admins only —
// visibility filtering is done at the component level via useMemorialPermissions.

interface UseTributes {
  tributes: MemorialTribute[];
  total: number;
  hasMore: boolean;
  status: MemorialLoadingState;
  error: Error | null;
  loadMore: () => void;
  submit: (input: AddTributeInput) => Promise<MemorialTribute>;
}

export function useTributes(
  memorialId: string | null | undefined,
): UseTributes {
  const [pages, setPages] = useState<MemorialTribute[][]>([]);
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
        const res: PaginatedResponse<MemorialTribute> = await getTributes(
          memorialId,
          p,
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
    [memorialId],
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

  const submit = useCallback(
    async (input: AddTributeInput): Promise<MemorialTribute> => {
      if (!memorialId) throw new Error("No memorial ID");
      const tribute = await addTribute(memorialId, input);
      // Do not optimistically prepend — tributes may require moderation.
      // Refresh page 1 so approved tributes appear.
      await fetchPage(1);
      return tribute;
    },
    [memorialId, fetchPage],
  );

  const tributes = pages.flat();

  return { tributes, total, hasMore, status, error, loadMore, submit };
}
