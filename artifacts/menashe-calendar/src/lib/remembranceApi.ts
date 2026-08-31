import { getAuthToken } from "./authToken";

/** Personal Remembrance Events — API client */

const API_BASE = "/api";

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
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RemembranceEventType = "yahrzeit" | "birthday" | "anniversary";

export interface RemembranceEvent {
  id: string;
  name: string;
  relationship: string;
  eventType: RemembranceEventType;
  gregorianDate?: string; // YYYY-MM-DD
  hebrewDay?: number;
  hebrewMonth?: number;
  hebrewYear?: number; // year of original event
  usesHebrewDate: boolean;
  beforeSunset: boolean;
  notificationEnabled: boolean;
  notificationDays: number; // 0 | 1 | 3 | 7 | 30
  notificationTime: string; // HH:mm
  repeatAnnually: boolean;
  location: string;
  notes: string;
  photoUrl?: string;
  censusBranchId?: string; // future family-tree link
  createdAt?: string;
  updatedAt?: string;
}

export type RemembranceEventInput = Omit<
  RemembranceEvent,
  "createdAt" | "updatedAt"
>;

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchRemembranceEvents(): Promise<RemembranceEvent[]> {
  return await apiFetch("/remembrance");
}

export async function createRemembranceEvent(
  event: RemembranceEventInput,
): Promise<void> {
  await apiFetch("/remembrance", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export async function updateRemembranceEvent(
  id: string,
  event: Partial<RemembranceEventInput>,
): Promise<void> {
  await apiFetch(`/remembrance/${id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });
}

export async function deleteRemembranceEvent(id: string): Promise<void> {
  await apiFetch(`/remembrance/${id}`, { method: "DELETE" });
}
