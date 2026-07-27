import { useMemo } from "react";
import { useUser } from "@clerk/react";
import { resolvePermissions } from "../utils";
import type {
  MemorialWithPerson,
  MemorialPermissions,
  MemorialPermissionRole,
  MemorialFamilyMember,
} from "../types";

// ── useMemorialPermissions ────────────────────────────────────────────────────
// Derives the current user's effective permission set for a memorial.
// Role resolution order:
//   administrator  — Clerk user metadata role === "admin"
//   moderator      — Clerk user metadata role === "moderator"
//   family_admin   — familyMembers contains userId with role "admin"
//   family_member  — familyMembers contains userId with any role
//   authenticated  — signed in
//   guest          — not signed in

interface UseMemorialPermissionsInput {
  memorial: MemorialWithPerson | null;
  familyMembers?: MemorialFamilyMember[];
}

export function useMemorialPermissions({
  memorial,
  familyMembers = [],
}: UseMemorialPermissionsInput): MemorialPermissions | null {
  const { user, isLoaded } = useUser();

  return useMemo(() => {
    if (!isLoaded || !memorial) return null;

    const privacy = memorial.privacy;
    const userId = user?.id ?? null;

    // Check platform-level roles from Clerk public metadata
    const platformRole = (user?.publicMetadata as any)?.role as
      | string
      | undefined;

    let role: MemorialPermissionRole;

    if (!userId) {
      role = "guest";
    } else if (platformRole === "admin") {
      role = "administrator";
    } else if (platformRole === "moderator") {
      role = "moderator";
    } else {
      const membership = familyMembers.find((m) => m.userId === userId);
      if (membership?.role === "admin") {
        role = "family_admin";
      } else if (membership) {
        role = "family_member";
      } else {
        role = "authenticated";
      }
    }

    return resolvePermissions(role, privacy);
  }, [isLoaded, memorial, familyMembers, user]);
}
