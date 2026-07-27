import type {
  MemorialWithPerson,
  MemorialCandle,
  MemorialTribute,
  MemorialPhoto,
  MemorialFamily,
  MemorialFamilyMember,
  CreateMemorialInput,
  UpdateMemorialInput,
  LightCandleInput,
  AddTributeInput,
  UploadPhotoInput,
  SearchMemorialParams,
  PaginatedResponse,
} from "../types";

// ── Transport ─────────────────────────────────────────────────────────────────
// Mirrors the apiFetch pattern used throughout the app (userApi.ts).
// Always attaches a Clerk Bearer token when a session is available.

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token: string | null =
    await (window as any).Clerk?.session?.getToken() ?? null;

  const isFormData = options.body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MemorialApiError(res.status, path, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Error type ────────────────────────────────────────────────────────────────

export class MemorialApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly detail: string,
  ) {
    super(`Memorial API ${path} failed: ${status}`);
    this.name = "MemorialApiError";
  }

  get isNotFound() { return this.status === 404; }
  get isForbidden() { return this.status === 403; }
  get isConflict()  { return this.status === 409; }
  get isUnauth()    { return this.status === 401; }
}

// ── Memorial CRUD ─────────────────────────────────────────────────────────────

export async function getMemorial(slug: string): Promise<MemorialWithPerson> {
  return apiFetch<MemorialWithPerson>(`/memorials/${slug}`);
}

export async function createMemorial(
  input: CreateMemorialInput,
): Promise<MemorialWithPerson> {
  return apiFetch<MemorialWithPerson>("/memorials", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMemorial(
  id: string,
  input: UpdateMemorialInput,
): Promise<MemorialWithPerson> {
  return apiFetch<MemorialWithPerson>(`/memorials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteMemorial(id: string): Promise<void> {
  return apiFetch<void>(`/memorials/${id}`, { method: "DELETE" });
}

export async function searchMemorial(
  params: SearchMemorialParams,
): Promise<PaginatedResponse<MemorialWithPerson>> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return apiFetch<PaginatedResponse<MemorialWithPerson>>(
    `/memorials/search${qs ? `?${qs}` : ""}`,
  );
}

// ── Candles ───────────────────────────────────────────────────────────────────

export async function getCandles(
  memorialId: string,
  page = 1,
  limit = 20,
  filter?: "recent" | "today" | "community",
): Promise<PaginatedResponse<MemorialCandle>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filter) params.set("filter", filter);
  return apiFetch<PaginatedResponse<MemorialCandle>>(
    `/memorials/${memorialId}/candles?${params.toString()}`,
  );
}

export async function lightCandle(
  memorialId: string,
  input: LightCandleInput,
): Promise<MemorialCandle> {
  return apiFetch<MemorialCandle>(`/memorials/${memorialId}/candles`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ── Tributes ──────────────────────────────────────────────────────────────────

export async function getTributes(
  memorialId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<MemorialTribute>> {
  return apiFetch<PaginatedResponse<MemorialTribute>>(
    `/memorials/${memorialId}/tributes?page=${page}&limit=${limit}`,
  );
}

export async function addTribute(
  memorialId: string,
  input: AddTributeInput,
): Promise<MemorialTribute> {
  return apiFetch<MemorialTribute>(`/memorials/${memorialId}/tributes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function moderateTribute(
  memorialId: string,
  tributeId: string,
  action: "approve" | "reject",
  reason?: string,
): Promise<MemorialTribute> {
  return apiFetch<MemorialTribute>(
    `/memorials/${memorialId}/tributes/${tributeId}/moderate`,
    {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    },
  );
}

// ── Photos ────────────────────────────────────────────────────────────────────

export async function getPhotos(
  memorialId: string,
): Promise<MemorialPhoto[]> {
  return apiFetch<MemorialPhoto[]>(`/memorials/${memorialId}/photos`);
}

export async function uploadPhoto(
  memorialId: string,
  input: UploadPhotoInput,
): Promise<MemorialPhoto> {
  return apiFetch<MemorialPhoto>(`/memorials/${memorialId}/photos`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deletePhoto(
  memorialId: string,
  photoId: string,
): Promise<void> {
  return apiFetch<void>(`/memorials/${memorialId}/photos/${photoId}`, {
    method: "DELETE",
  });
}

// ── Family ────────────────────────────────────────────────────────────────────

export async function getFamily(familyId: string): Promise<MemorialFamily> {
  return apiFetch<MemorialFamily>(`/memorials/families/${familyId}`);
}

export async function getFamilyMembers(
  familyId: string,
): Promise<MemorialFamilyMember[]> {
  return apiFetch<MemorialFamilyMember[]>(
    `/memorials/families/${familyId}/members`,
  );
}

export async function inviteFamilyMember(
  familyId: string,
  userId: string,
  role: "admin" | "member" | "viewer",
): Promise<MemorialFamilyMember> {
  return apiFetch<MemorialFamilyMember>(
    `/memorials/families/${familyId}/members`,
    {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    },
  );
}

export async function updateFamilyMemberRole(
  familyId: string,
  memberId: string,
  role: "admin" | "member" | "viewer",
): Promise<MemorialFamilyMember> {
  return apiFetch<MemorialFamilyMember>(
    `/memorials/families/${familyId}/members/${memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeFamilyMember(
  familyId: string,
  memberId: string,
): Promise<void> {
  return apiFetch<void>(
    `/memorials/families/${familyId}/members/${memberId}`,
    { method: "DELETE" },
  );
}

export async function transferFamilyOwnership(
  familyId: string,
  newPrimaryContactId: string,
): Promise<MemorialFamily> {
  return apiFetch<MemorialFamily>(`/memorials/families/${familyId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ newPrimaryContactId }),
  });
}
