import { useState, useEffect, useCallback } from "react";
import {
  getFamily,
  getFamilyMembers,
  inviteFamilyMember,
  updateFamilyMemberRole,
  removeFamilyMember,
  transferFamilyOwnership,
} from "../api/memorialApi";
import type {
  MemorialFamily,
  MemorialFamilyMember,
  FamilyMemberRole,
  MemorialLoadingState,
} from "../types";

// ── useFamilyManagement ───────────────────────────────────────────────────────
// Fetches family record + members. Provides invite, updateRole, remove actions.
// Call only when canManageFamily is true.

export interface UseFamilyManagement {
  family: MemorialFamily | null;
  members: MemorialFamilyMember[];
  status: MemorialLoadingState;
  error: Error | null;
  invite: (userId: string, role: FamilyMemberRole) => Promise<void>;
  updateRole: (memberId: string, role: FamilyMemberRole) => Promise<void>;
  remove: (memberId: string) => Promise<void>;
  transferOwnership: (newPrimaryUserId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useFamilyManagement(
  familyId: string | null | undefined,
): UseFamilyManagement {
  const [family, setFamily] = useState<MemorialFamily | null>(null);
  const [members, setMembers] = useState<MemorialFamilyMember[]>([]);
  const [status, setStatus] = useState<MemorialLoadingState>("idle");
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    setStatus("loading");
    setError(null);
    try {
      const [fam, mems] = await Promise.all([
        getFamily(familyId),
        getFamilyMembers(familyId),
      ]);
      setFamily(fam);
      setMembers(mems);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus("error");
    }
  }, [familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = useCallback(
    async (userId: string, role: FamilyMemberRole) => {
      if (!familyId) throw new Error("No family ID");
      await inviteFamilyMember(familyId, userId, role);
      await load();
    },
    [familyId, load],
  );

  const updateRole = useCallback(
    async (memberId: string, role: FamilyMemberRole) => {
      if (!familyId) throw new Error("No family ID");
      await updateFamilyMemberRole(familyId, memberId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
      );
    },
    [familyId],
  );

  const remove = useCallback(
    async (memberId: string) => {
      if (!familyId) throw new Error("No family ID");
      await removeFamilyMember(familyId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    },
    [familyId],
  );

  const transferOwnership = useCallback(
    async (newPrimaryUserId: string) => {
      if (!familyId) throw new Error("No family ID");
      const updated = await transferFamilyOwnership(familyId, newPrimaryUserId);
      setFamily(updated);
    },
    [familyId],
  );

  return { family, members, status, error, invite, updateRole, remove, transferOwnership, refetch: load };
}
