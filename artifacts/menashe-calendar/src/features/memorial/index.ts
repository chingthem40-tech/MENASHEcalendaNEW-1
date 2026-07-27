// ── Memorial Feature Module ───────────────────────────────────────────────────
// Public API surface for src/features/memorial.
// Import everything consumers need from here — never reach into sub-folders
// directly from outside this module.

// Components (shared UI primitives)
export {
  SectionTitle,
  GlassPanel,
  EmptyState,
} from "./components";

// Types
export type {
  // Enums
  MemorialStatus,
  PrivacyLevel,
  InteractionPermission,
  CandleType,
  TributeStatus,
  FamilyMemberRole,
  LocationType,
  MemorialPermissionRole,
  // Domain
  Memorial,
  MemorialWithPerson,
  MemorialPerson,
  MemorialFamily,
  MemorialFamilyMember,
  MemorialPrivacy,
  MemorialCandle,
  MemorialTribute,
  MemorialPhoto,
  MemorialLocation,
  // Inputs
  CreateMemorialInput,
  UpdateMemorialInput,
  LightCandleInput,
  AddTributeInput,
  UploadPhotoInput,
  SearchMemorialParams,
  PaginatedResponse,
  // UI
  MemorialLoadingState,
  MemorialUIState,
  CreateMemorialFormState,
  MemorialPermissions,
} from "./types";

// API client (use directly only when hooks don't cover the use case)
export {
  MemorialApiError,
  getMemorial,
  createMemorial,
  updateMemorial,
  deleteMemorial,
  searchMemorial,
  getCandles,
  lightCandle,
  getTributes,
  addTribute,
  moderateTribute,
  getPhotos,
  uploadPhoto,
  deletePhoto,
  getFamily,
  getFamilyMembers,
  inviteFamilyMember,
  updateFamilyMemberRole,
  removeFamilyMember,
} from "./api/memorialApi";

// Hooks
export {
  useMemorial,
  useCandles,
  useTributes,
  useSearch,
  useCreateMemorial,
  useUploadPhoto,
  useMemorialPermissions,
} from "./hooks";

// Stores
export {
  useMemorialUIStore,
} from "./stores/memorialStore";

// Utils
export {
  resolvePermissions,
  formatMemorialDate,
  memorialAge,
  memorialUrl,
  memorialDisplayName,
  memorialHebrewDisplay,
  candleTypeLabel,
  tributeAuthorLabel,
  photoStorageKey,
} from "./utils";
