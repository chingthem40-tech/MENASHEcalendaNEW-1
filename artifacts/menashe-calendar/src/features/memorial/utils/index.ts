import type {
  MemorialWithPerson,
  MemorialPermissions,
  MemorialPermissionRole,
  MemorialPrivacy,
  InteractionPermission,
} from "../types";

// ── Permission resolution ─────────────────────────────────────────────────────

const PERMISSION_RANK: Record<InteractionPermission, number> = {
  nobody: 0,
  family: 1,
  community: 2,
  public: 3,
};

const ROLE_RANK: Record<MemorialPermissionRole, number> = {
  guest: 0,
  authenticated: 1,
  family_member: 2,
  family_admin: 3,
  moderator: 4,
  administrator: 5,
};

function hasInteractionPermission(
  required: InteractionPermission,
  role: MemorialPermissionRole,
): boolean {
  const requiredRank = PERMISSION_RANK[required];
  if (requiredRank === 0) return false; // nobody
  if (requiredRank >= PERMISSION_RANK.public) return true;
  if (requiredRank >= PERMISSION_RANK.community)
    return ROLE_RANK[role] >= ROLE_RANK.authenticated;
  if (requiredRank >= PERMISSION_RANK.family)
    return ROLE_RANK[role] >= ROLE_RANK.family_member;
  return false;
}

export function resolvePermissions(
  role: MemorialPermissionRole,
  privacy: MemorialPrivacy,
): MemorialPermissions {
  const isModerator = ROLE_RANK[role] >= ROLE_RANK.moderator;
  const isAdmin = ROLE_RANK[role] >= ROLE_RANK.administrator;
  const isFamilyAdmin = ROLE_RANK[role] >= ROLE_RANK.family_admin;
  const isFamilyMember = ROLE_RANK[role] >= ROLE_RANK.family_member;

  return {
    role,
    canView:
      isModerator ||
      (privacy.visibilityLevel === "public") ||
      (privacy.visibilityLevel === "community" && ROLE_RANK[role] >= ROLE_RANK.authenticated) ||
      (privacy.visibilityLevel === "family" && isFamilyMember) ||
      (privacy.visibilityLevel === "private" && isFamilyAdmin),
    canLightCandle:
      isModerator ||
      (privacy.allowGuestInteraction && role === "guest") ||
      hasInteractionPermission(privacy.canLightCandles, role),
    canLeaveTribute:
      isModerator ||
      (privacy.allowGuestInteraction && role === "guest") ||
      hasInteractionPermission(privacy.canLeaveTributes, role),
    canViewPhotos:
      isModerator ||
      hasInteractionPermission(privacy.canViewPhotos, role),
    canUploadPhotos: isFamilyMember,
    canEditProfile: isFamilyAdmin,
    canManageFamily: isFamilyAdmin,
    canModerate: isModerator,
    canDelete: isAdmin,
    canPublish: isFamilyAdmin,
  };
}

// ── Date formatting helpers ───────────────────────────────────────────────────

export function formatMemorialDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function memorialAge(
  birthDate: string | null,
  deathDate: string,
): number | null {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    const age = death.getFullYear() - birth.getFullYear();
    const m = death.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) return age - 1;
    return age;
  } catch {
    return null;
  }
}

// ── Slug helpers ──────────────────────────────────────────────────────────────

export function memorialUrl(slug: string): string {
  return `/app/memorial/${slug}`;
}

// ── Display name helpers ──────────────────────────────────────────────────────

export function memorialDisplayName(memorial: MemorialWithPerson): string {
  return memorial.person.fullName;
}

export function memorialHebrewDisplay(
  memorial: MemorialWithPerson,
): string | null {
  const { hebrewName, hebrewFatherName } = memorial.person;
  if (!hebrewName) return null;
  if (!hebrewFatherName) return hebrewName;
  return `${hebrewName} בן/בת ${hebrewFatherName}`;
}

// ── Candle helpers ────────────────────────────────────────────────────────────

export function candleTypeLabel(
  type: import("../types").CandleType,
): string {
  const labels: Record<import("../types").CandleType, string> = {
    yahrzeit: "Yahrzeit",
    shabbat: "Shabbat",
    memorial: "Memorial",
    neshama: "Neshama",
    shloshim: "Shloshim",
  };
  return labels[type] ?? type;
}

// ── Tribute helpers ───────────────────────────────────────────────────────────

export function tributeAuthorLabel(
  tribute: import("../types").MemorialTribute,
): string {
  if (tribute.isAnonymous) return "Anonymous";
  return tribute.guestName ?? "Community Member";
}

// ── Upload helpers ────────────────────────────────────────────────────────────
// The app uses Replit Object Storage (lib/object-storage-web).
// Photo URLs are stored on the backend; this util extracts just the key.

export function photoStorageKey(memorialId: string, fileName: string): string {
  return `memorial/${memorialId}/photos/${Date.now()}-${fileName}`;
}
