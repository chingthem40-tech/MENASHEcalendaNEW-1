import {
  getBranch, saveBranch, submitBranch,
  getSubmissions, approveSubmission,
  getMemberSubmissions, submitMember, approveMember,
} from "@workspace/shared-core/census";
import type {
  Branch as CensusBranchApi,
  CensusSubmission as CensusSubmissionApi,
  CensusMemberSubmission as CensusMemberSubmissionApi,
} from "@workspace/shared-core/census";

const API_BASE = "/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const token: string | null = await (window as any).Clerk?.session?.getToken() ?? null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ── User profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  theme: "dark" | "light" | "sapphire";
  location: any | null;
  isPremium: boolean;
  candleEnabled: boolean;
  language: string;
  notifPrefs: any | null;
  leadTime: number;
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    return await apiFetch("/user/profile");
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
  try {
    await apiFetch("/user/profile", { method: "PUT", body: JSON.stringify(profile) });
  } catch {}
}

// ── Yahrzeit entries ──────────────────────────────────────────────────────────

export interface YartzeitEntryApi {
  id: string;
  name: string;
  hebrewDay: number;
  hebrewMonth: number;
  displayDate: string;
  wasAfterSunset: boolean;
}

export async function fetchYahrzeitEntries(): Promise<YartzeitEntryApi[]> {
  try {
    return await apiFetch("/user/yahrzeit");
  } catch {
    return [];
  }
}

export async function saveYahrzeitEntry(entry: YartzeitEntryApi): Promise<void> {
  await apiFetch("/user/yahrzeit", { method: "POST", body: JSON.stringify(entry) });
}

export async function deleteYahrzeitEntry(id: string): Promise<void> {
  await apiFetch(`/user/yahrzeit/${id}`, { method: "DELETE" });
}

// ── Torah tracker ─────────────────────────────────────────────────────────────

export interface StudyEntryApi {
  id: string;
  date: string;
  subject: string;
  description: string;
  duration: number;
  notes: string;
}

export async function fetchTorahTrackerEntries(): Promise<StudyEntryApi[]> {
  try {
    return await apiFetch("/user/torah-tracker");
  } catch {
    return [];
  }
}

export async function saveTorahTrackerEntry(entry: StudyEntryApi): Promise<void> {
  await apiFetch("/user/torah-tracker", { method: "POST", body: JSON.stringify(entry) });
}

export async function deleteTorahTrackerEntry(id: string): Promise<void> {
  await apiFetch(`/user/torah-tracker/${id}`, { method: "DELETE" });
}

export async function fetchTorahTrackerGoal(): Promise<number> {
  try {
    const data = await apiFetch("/user/torah-tracker/goal");
    return data.goalMins ?? 0;
  } catch {
    return 0;
  }
}

export async function saveTorahTrackerGoal(goalMins: number): Promise<void> {
  await apiFetch("/user/torah-tracker/goal", { method: "PUT", body: JSON.stringify({ goalMins }) });
}

// ── Public profile ────────────────────────────────────────────────────────────

export interface PublicProfile {
  displayName: string;
  congregation: string;
  bio: string;
  role: string;
  city: string;
  country: string;
  avatarEmoji: string;
  profilePhotoUrl?: string | null;
}

export async function fetchPublicProfile(): Promise<PublicProfile | null> {
  try {
    return await apiFetch("/user/public-profile");
  } catch {
    return null;
  }
}

export async function savePublicProfile(profile: PublicProfile): Promise<void> {
  await apiFetch("/user/public-profile", { method: "PUT", body: JSON.stringify(profile) });
}

// ── Community Yahrzeit Board ───────────────────────────────────────────────────

export interface CommunityYahrzeitEntry {
  id: string;
  userId: string;
  deceasedName: string;
  hebrewDay: number;
  hebrewMonth: number;
  displayDate: string;
  passingYear: number | null;
  message: string;
  candleLit: boolean;
  candleLitAt: string | null;
  donorDisplayName: string;
  createdAt: string;
  learners: Array<{ id: string; learnerName: string; studySubject: string }>;
}

export async function fetchCommunityYahrzeit(): Promise<CommunityYahrzeitEntry[]> {
  try {
    return await apiFetch("/community/yahrzeit");
  } catch {
    return [];
  }
}

export async function createCommunityYahrzeit(entry: {
  id: string;
  deceasedName: string;
  hebrewDay: number;
  hebrewMonth: number;
  displayDate: string;
  passingYear?: number | null;
  message?: string;
  donorDisplayName?: string;
}): Promise<void> {
  await apiFetch("/community/yahrzeit", { method: "POST", body: JSON.stringify(entry) });
}

export async function lightCommunityCandle(id: string, donorDisplayName: string): Promise<void> {
  await apiFetch(`/community/yahrzeit/${id}/light`, { method: "POST", body: JSON.stringify({ donorDisplayName }) });
}

export async function deleteCommunityYahrzeit(id: string): Promise<void> {
  await apiFetch(`/community/yahrzeit/${id}`, { method: "DELETE" });
}

export async function dedicateLearning(entryId: string, learnerName: string, studySubject: string): Promise<void> {
  await apiFetch(`/community/yahrzeit/${entryId}/dedicate`, {
    method: "POST",
    body: JSON.stringify({ learnerName, studySubject }),
  });
}

// ── Razorpay Payments ─────────────────────────────────────────────────────────

export async function createRazorpayOrder(plan: "monthly" | "annual"): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  return await apiFetch("/payment/razorpay/order", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export async function verifyRazorpayPayment(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  plan: string;
}): Promise<{ verified: boolean; isPremium: boolean }> {
  return await apiFetch("/payment/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ── Census ─────────────────────────────────────────────────────────────────
// The canonical Census client now lives in @workspace/shared-core/census.
// These are thin wrappers that supply the web app's auth-token getter so
// existing call sites (CensusModal.tsx) don't need to change. There must be
// ONE Census client — Web consumes it, it does not own it.

export type { CensusBranchApi, CensusSubmissionApi, CensusMemberSubmissionApi };

const censusConfig = {
  getAuthToken: () => (window as any).Clerk?.session?.getToken() ?? null,
};

export async function fetchCensusBranch(): Promise<CensusBranchApi | null> {
  return getBranch(censusConfig);
}

export async function saveCensusBranch(branch: CensusBranchApi): Promise<void> {
  return saveBranch(branch, censusConfig);
}

export async function fetchCensusSubmissions(): Promise<CensusSubmissionApi[]> {
  return getSubmissions(censusConfig);
}

export async function submitCensusBranchForReview(branch: CensusBranchApi): Promise<CensusSubmissionApi> {
  return submitBranch(branch, censusConfig);
}

export async function reviewCensusSubmission(id: string, status: "approved" | "rejected", reviewNote?: string): Promise<void> {
  return approveSubmission(id, status, reviewNote, censusConfig);
}

export async function fetchCensusMemberSubmissions(): Promise<CensusMemberSubmissionApi[]> {
  return getMemberSubmissions(censusConfig);
}

export async function submitCensusMemberEntry(entry: Omit<CensusMemberSubmissionApi, "id" | "submittedAt" | "status">): Promise<CensusMemberSubmissionApi> {
  return submitMember(entry, censusConfig);
}

export async function reviewCensusMemberSubmission(id: string, status: "approved" | "rejected" | "pending", reviewNote?: string): Promise<void> {
  return approveMember(id, status, reviewNote, censusConfig);
}
