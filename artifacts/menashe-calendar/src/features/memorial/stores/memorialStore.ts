import { useState, useCallback } from "react";
import type {
  MemorialUIState,
  CreateMemorialFormState,
  PrivacyLevel,
  InteractionPermission,
} from "../types";

// ── UI State ──────────────────────────────────────────────────────────────────
// Lightweight hook-based store for ephemeral UI state.
// Server state (memorials, candles, tributes) is owned by the fetch hooks —
// never duplicated here.

const defaultUIState: MemorialUIState = {
  activePanel: null,
  isCreating: false,
  isEditing: false,
  uploadProgress: null,
  optimisticCandleCount: null,
};

export function useMemorialUIStore() {
  const [state, setState] = useState<MemorialUIState>(defaultUIState);

  const setActivePanel = useCallback(
    (panel: MemorialUIState["activePanel"]) =>
      setState((s) => ({ ...s, activePanel: panel })),
    [],
  );

  const setIsCreating = useCallback(
    (isCreating: boolean) => setState((s) => ({ ...s, isCreating })),
    [],
  );

  const setIsEditing = useCallback(
    (isEditing: boolean) => setState((s) => ({ ...s, isEditing })),
    [],
  );

  const setUploadProgress = useCallback(
    (uploadProgress: number | null) =>
      setState((s) => ({ ...s, uploadProgress })),
    [],
  );

  // Optimistic candle increment — applied immediately, cleared once server
  // state reloads with the real count.
  const applyOptimisticCandle = useCallback(
    (currentCount: number) =>
      setState((s) => ({
        ...s,
        optimisticCandleCount: currentCount + 1,
      })),
    [],
  );

  const clearOptimisticCandle = useCallback(
    () => setState((s) => ({ ...s, optimisticCandleCount: null })),
    [],
  );

  const reset = useCallback(() => setState(defaultUIState), []);

  return {
    ...state,
    setActivePanel,
    setIsCreating,
    setIsEditing,
    setUploadProgress,
    applyOptimisticCandle,
    clearOptimisticCandle,
    reset,
  };
}

// ── Create Memorial Form State ────────────────────────────────────────────────
// Multi-step wizard state kept local to the create flow.
// Never persisted to localStorage — cleared on unmount.

const defaultFormState: CreateMemorialFormState = {
  step: "person",
  person: {},
  family: {},
  privacy: {
    visibilityLevel: "family" as PrivacyLevel,
    canLightCandles: "community" as InteractionPermission,
    canLeaveTributes: "family" as InteractionPermission,
    canViewPhotos: "family" as InteractionPermission,
    requireModeration: true,
    allowGuestInteraction: false,
  },
};

export function useCreateMemorialFormStore() {
  const [form, setForm] = useState<CreateMemorialFormState>(defaultFormState);

  const setStep = useCallback(
    (step: CreateMemorialFormState["step"]) =>
      setForm((f) => ({ ...f, step })),
    [],
  );

  const updatePerson = useCallback(
    (patch: Partial<CreateMemorialFormState["person"]>) =>
      setForm((f) => ({ ...f, person: { ...f.person, ...patch } })),
    [],
  );

  const updateFamily = useCallback(
    (patch: Partial<CreateMemorialFormState["family"]>) =>
      setForm((f) => ({ ...f, family: { ...f.family, ...patch } })),
    [],
  );

  const updatePrivacy = useCallback(
    (patch: Partial<CreateMemorialFormState["privacy"]>) =>
      setForm((f) => ({ ...f, privacy: { ...f.privacy, ...patch } })),
    [],
  );

  const goBack = useCallback(() => {
    setForm((f) => {
      const order: CreateMemorialFormState["step"][] = [
        "person",
        "family",
        "privacy",
        "review",
      ];
      const idx = order.indexOf(f.step);
      return { ...f, step: order[Math.max(0, idx - 1)] };
    });
  }, []);

  const goNext = useCallback(() => {
    setForm((f) => {
      const order: CreateMemorialFormState["step"][] = [
        "person",
        "family",
        "privacy",
        "review",
      ];
      const idx = order.indexOf(f.step);
      return { ...f, step: order[Math.min(order.length - 1, idx + 1)] };
    });
  }, []);

  const reset = useCallback(() => setForm(defaultFormState), []);

  return {
    form,
    setStep,
    updatePerson,
    updateFamily,
    updatePrivacy,
    goBack,
    goNext,
    reset,
  };
}
