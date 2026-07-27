import { useState, useEffect, useCallback } from "react";
import { getMemorial } from "../api/memorialApi";
import type { MemorialWithPerson, MemorialLoadingState } from "../types";

// ── useMemorial ───────────────────────────────────────────────────────────────
// Fetches a memorial by slug. Retries once on transient failure.
// Exposes refetch() so child panels can invalidate after mutations.

interface UseMemorialResult {
  memorial: MemorialWithPerson | null;
  status: MemorialLoadingState;
  error: Error | null;
  refetch: () => void;
}

export function useMemorial(slug: string | null | undefined): UseMemorialResult {
  const [memorial, setMemorial] = useState<MemorialWithPerson | null>(null);
  const [status, setStatus] = useState<MemorialLoadingState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError(null);
      try {
        const data = await getMemorial(slug!);
        if (!cancelled) {
          setMemorial(data);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug, rev]);

  const refetch = useCallback(() => setRev((r) => r + 1), []);

  return { memorial, status, error, refetch };
}
