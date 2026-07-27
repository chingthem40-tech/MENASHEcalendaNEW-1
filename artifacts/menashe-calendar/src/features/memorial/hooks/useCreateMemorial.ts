import { useState, useCallback } from "react";
import { createMemorial } from "../api/memorialApi";
import type {
  MemorialWithPerson,
  CreateMemorialInput,
  MemorialLoadingState,
} from "../types";

// ── useCreateMemorial ─────────────────────────────────────────────────────────
// Stateful submission wrapper for the multi-step create flow.
// Form state is owned by useCreateMemorialFormStore (stores/).
// This hook owns only the async submission lifecycle.

interface UseCreateMemorial {
  status: MemorialLoadingState;
  error: Error | null;
  created: MemorialWithPerson | null;
  submit: (input: CreateMemorialInput) => Promise<MemorialWithPerson | null>;
  reset: () => void;
}

export function useCreateMemorial(): UseCreateMemorial {
  const [status, setStatus] = useState<MemorialLoadingState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [created, setCreated] = useState<MemorialWithPerson | null>(null);

  const submit = useCallback(
    async (input: CreateMemorialInput): Promise<MemorialWithPerson | null> => {
      setStatus("loading");
      setError(null);
      try {
        const memorial = await createMemorial(input);
        setCreated(memorial);
        setStatus("success");
        return memorial;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setCreated(null);
  }, []);

  return { status, error, created, submit, reset };
}
