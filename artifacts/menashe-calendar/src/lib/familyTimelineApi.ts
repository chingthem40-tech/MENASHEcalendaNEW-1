import { getAuthToken } from "./authToken";

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body?.error ?? `Request failed`, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export type EventType =
  | "birth"
  | "hebrew_birthday"
  | "anniversary"
  | "yahrzeit"
  | "marriage"
  | "aliyah"
  | "milestone"
  | "achievement"
  | "document"
  | "photo";

export type FilterKey =
  | "all"
  | "births"
  | "anniversaries"
  | "yahrzeits"
  | "milestones"
  | "documents"
  | "photos";

export interface FamilyTimelineEvent {
  id: string;
  userId: string;
  eventType: EventType;
  title: string;
  description: string;
  memberName: string;
  memberPhotoUrl: string | null;
  gregorianDate: string | null; // YYYY-MM-DD
  hebrewDate: string;
  icon: string;
  detailsUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineListResponse {
  events: FamilyTimelineEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateEventInput {
  eventType: EventType;
  title: string;
  description?: string;
  memberName?: string;
  memberPhotoUrl?: string | null;
  gregorianDate?: string | null;
  hebrewDate?: string;
  icon?: string;
  detailsUrl?: string | null;
}

export async function fetchFamilyTimeline(params: {
  filter?: FilterKey;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<TimelineListResponse> {
  const qs = new URLSearchParams();
  if (params.filter && params.filter !== "all") qs.set("filter", params.filter);
  if (params.search) qs.set("search", params.search);
  if (params.page)   qs.set("page",   String(params.page));
  if (params.limit)  qs.set("limit",  String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/family-timeline${query}`);
}

export async function createFamilyTimelineEvent(
  input: CreateEventInput,
): Promise<FamilyTimelineEvent> {
  return apiFetch("/family-timeline", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateFamilyTimelineEvent(
  id: string,
  input: Partial<CreateEventInput>,
): Promise<FamilyTimelineEvent> {
  return apiFetch(`/family-timeline/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteFamilyTimelineEvent(id: string): Promise<void> {
  await apiFetch(`/family-timeline/${id}`, { method: "DELETE" });
}
