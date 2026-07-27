/**
 * Prayer Board API client
 * Connects to /api/prayer-requests on the shared backend.
 * Non-admin callers receive only "approved" requests.
 */

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export interface PrayerRequest {
  id: string;
  userId: string | null;
  name: string;
  isAnonymous: boolean;
  text: string;
  category: string;
  status: "pending" | "approved" | "removed";
  pinned: boolean;
  adminResponse: string;
  amens: number;
  submittedAt: string;
}

/** Fetch approved prayer requests (public endpoint) */
export async function fetchPrayerRequests(): Promise<PrayerRequest[]> {
  try {
    return await apiFetch("/prayer-requests");
  } catch {
    return [];
  }
}

/** Submit a new prayer request (pending until admin approves) */
export async function submitPrayerRequest(data: {
  id: string;
  name?: string;
  isAnonymous?: boolean;
  text: string;
  category?: string;
}): Promise<PrayerRequest> {
  return apiFetch("/prayer-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Increment amen count on an approved request */
export async function amenPrayerRequest(id: string): Promise<{ amens: number }> {
  return apiFetch(`/prayer-requests/${id}/amen`, { method: "POST" });
}
