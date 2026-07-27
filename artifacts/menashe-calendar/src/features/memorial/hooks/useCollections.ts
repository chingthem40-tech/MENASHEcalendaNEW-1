import { useState, useEffect, useCallback } from "react";
import { searchMemorial } from "../api/memorialApi";
import type { MemorialWithPerson, MemorialLoadingState } from "../types";

// ── useCollections ────────────────────────────────────────────────────────────
// Provides 5 curated memorial collections for the Sanctuary home page.
// Each collection fetches 8 items from the search API with a sort hint.
// The server may not yet honour the sort param — results will improve
// as the API evolves, but the UI structure is ready now.

export type CollectionKey =
  | "recentlyRemembered"
  | "mostVisited"
  | "recentlyLit"
  | "upcomingYahrzeit"
  | "communityPicks";

interface CollectionState {
  items: MemorialWithPerson[];
  status: MemorialLoadingState;
  error: Error | null;
}

export interface UseCollections {
  recentlyRemembered: CollectionState;
  mostVisited: CollectionState;
  recentlyLit: CollectionState;
  upcomingYahrzeit: CollectionState;
  communityPicks: CollectionState;
  refresh: () => void;
}

const COLLECTION_SORTS: Record<CollectionKey, string> = {
  recentlyRemembered: "recent_activity",
  mostVisited: "most_visited",
  recentlyLit: "recently_lit",
  upcomingYahrzeit: "upcoming_yahrzeit",
  communityPicks: "community_picks",
};

const INITIAL_STATE: CollectionState = {
  items: [],
  status: "idle",
  error: null,
};

async function fetchCollection(sort: string): Promise<MemorialWithPerson[]> {
  const res = await searchMemorial({ q: "", limit: 8, page: 1, sort } as any);
  return res.data;
}

export function useCollections(): UseCollections {
  const [states, setStates] = useState<Record<CollectionKey, CollectionState>>(
    {
      recentlyRemembered: INITIAL_STATE,
      mostVisited: INITIAL_STATE,
      recentlyLit: INITIAL_STATE,
      upcomingYahrzeit: INITIAL_STATE,
      communityPicks: INITIAL_STATE,
    },
  );

  const setCollection = useCallback(
    (key: CollectionKey, patch: Partial<CollectionState>) => {
      setStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...patch },
      }));
    },
    [],
  );

  const loadAll = useCallback(async () => {
    const keys = Object.keys(COLLECTION_SORTS) as CollectionKey[];

    for (const key of keys) {
      setCollection(key, { status: "loading", error: null });
    }

    await Promise.all(
      keys.map(async (key) => {
        try {
          const items = await fetchCollection(COLLECTION_SORTS[key]);
          setCollection(key, { items, status: "success" });
        } catch (err) {
          setCollection(key, {
            status: "error",
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }),
    );
  }, [setCollection]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    recentlyRemembered: states.recentlyRemembered,
    mostVisited: states.mostVisited,
    recentlyLit: states.recentlyLit,
    upcomingYahrzeit: states.upcomingYahrzeit,
    communityPicks: states.communityPicks,
    refresh: loadAll,
  };
}
