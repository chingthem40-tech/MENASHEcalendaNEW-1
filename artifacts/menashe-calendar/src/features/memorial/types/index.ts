// ── Enums ─────────────────────────────────────────────────────────────────────

export type MemorialStatus = "draft" | "published" | "archived" | "removed";

export type PrivacyLevel = "private" | "family" | "community" | "public";

export type InteractionPermission = "nobody" | "family" | "community" | "public";

export type CandleType = "yahrzeit" | "shabbat" | "memorial" | "neshama" | "shloshim";

export type TributeType = "memory" | "prayer" | "scripture" | "family" | "community";

export type TributeStatus = "pending" | "approved" | "rejected" | "removed";

export type FamilyMemberRole = "admin" | "member" | "viewer";

export type LocationType = "burial" | "birthplace" | "hometown" | "synagogue" | "other";

// ── Permission roles ──────────────────────────────────────────────────────────

export type MemorialPermissionRole =
  | "guest"
  | "authenticated"
  | "family_member"
  | "family_admin"
  | "moderator"
  | "administrator";

// ── Core domain types (mirrored from DB schema) ───────────────────────────────

export interface MemorialPerson {
  id: string;
  fullName: string;
  hebrewName: string | null;
  hebrewFatherName: string | null;
  hebrewMotherName: string | null;
  birthDate: string | null;
  birthDateHebrew: string | null;
  deathDate: string;
  deathDateHebrew: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  deathCity: string | null;
  deathCountry: string | null;
  tribeAffiliation: string | null;
  occupation: string | null;
  biography: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemorialFamily {
  id: string;
  name: string;
  primaryContactId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemorialFamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyMemberRole;
  invitedBy: string | null;
  joinedAt: string;
}

export interface MemorialPrivacy {
  id: string;
  memorialId: string;
  visibilityLevel: PrivacyLevel;
  canLightCandles: InteractionPermission;
  canLeaveTributes: InteractionPermission;
  canViewPhotos: InteractionPermission;
  requireModeration: boolean;
  allowGuestInteraction: boolean;
  updatedAt: string;
}

export interface Memorial {
  id: string;
  slug: string;
  personId: string;
  familyId: string;
  status: MemorialStatus;
  createdBy: string;
  publishedAt: string | null;
  lastActivityAt: string;
  candleCount: number;
  flowerCount: number;
  tributeCount: number;
  prayerCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemorialWithPerson extends Memorial {
  person: MemorialPerson;
  privacy: MemorialPrivacy;
}

export interface MemorialCandle {
  id: string;
  memorialId: string;
  userId: string | null;
  guestName: string | null;
  message: string | null;
  candleType: CandleType;
  isAnonymous: boolean;
  litAt: string;
  relationship: string | null;
  community: string | null;
}

export interface MemorialTribute {
  id: string;
  memorialId: string;
  userId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  title: string | null;
  body: string;
  language: string;
  tributeType: TributeType | null;
  isAnonymous: boolean;
  status: TributeStatus;
  moderatedBy: string | null;
  moderatedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemorialPhoto {
  id: string;
  memorialId: string;
  uploadedBy: string;
  photoUrl: string;
  caption: string | null;
  takenYear: number | null;
  takenLocation: string | null;
  isFeatured: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface MemorialLocation {
  id: string;
  personId: string;
  locationType: LocationType;
  label: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
  createdAt: string;
}

// ── API request/input types ───────────────────────────────────────────────────

export interface CreateMemorialInput {
  person: {
    fullName: string;
    hebrewName?: string;
    hebrewFatherName?: string;
    hebrewMotherName?: string;
    birthDate?: string;
    birthDateHebrew?: string;
    deathDate: string;
    deathDateHebrew?: string;
    birthCity?: string;
    birthCountry?: string;
    deathCity?: string;
    deathCountry?: string;
    tribeAffiliation?: string;
    occupation?: string;
    biography?: string;
  };
  family: {
    name: string;
  };
  privacy?: {
    visibilityLevel?: PrivacyLevel;
    canLightCandles?: InteractionPermission;
    canLeaveTributes?: InteractionPermission;
    canViewPhotos?: InteractionPermission;
    requireModeration?: boolean;
    allowGuestInteraction?: boolean;
  };
}

export interface UpdateMemorialInput {
  status?: "draft" | "published" | "archived";
}

export interface LightCandleInput {
  candleType?: CandleType;
  message?: string;
  guestName?: string;
  isAnonymous?: boolean;
  relationship?: string;
  community?: string;
}

export interface AddTributeInput {
  title?: string;
  body: string;
  tributeType?: TributeType;
  language?: "en" | "tk" | "he";
  guestName?: string;
  guestEmail?: string;
  isAnonymous?: boolean;
}

export interface UploadPhotoInput {
  photoUrl: string;
  caption?: string;
  takenYear?: number;
  takenLocation?: string;
}

export interface SearchMemorialParams {
  q?: string;
  tribe?: string;
  country?: string;
  page?: number;
  limit?: number;
  sort?: "recent_activity" | "most_visited" | "recently_lit" | "upcoming_yahrzeit" | "community_picks";
}

// ── API response envelope ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ── UI state types ────────────────────────────────────────────────────────────

export type MemorialLoadingState = "idle" | "loading" | "success" | "error";

export interface MemorialUIState {
  activePanel: "profile" | "gallery" | "candles" | "tributes" | "family" | null;
  isCreating: boolean;
  isEditing: boolean;
  uploadProgress: number | null;
  optimisticCandleCount: number | null;
}

// ── Form state types ──────────────────────────────────────────────────────────

export interface CreateMemorialFormState {
  step: "person" | "family" | "privacy" | "review";
  person: Partial<CreateMemorialInput["person"]>;
  family: Partial<CreateMemorialInput["family"]>;
  privacy: Partial<NonNullable<CreateMemorialInput["privacy"]>>;
}

// ── Permission resolution ─────────────────────────────────────────────────────

export interface MemorialPermissions {
  role: MemorialPermissionRole;
  canView: boolean;
  canLightCandle: boolean;
  canLeaveTribute: boolean;
  canViewPhotos: boolean;
  canUploadPhotos: boolean;
  canEditProfile: boolean;
  canManageFamily: boolean;
  canModerate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}
