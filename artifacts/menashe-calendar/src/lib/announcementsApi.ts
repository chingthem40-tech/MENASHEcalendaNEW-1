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

export interface ServerAnnouncement {
  id: string;
  emoji: string;
  title: string;
  body: string;
  status: "sent" | "scheduled" | "draft";
  pinned: boolean;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export async function broadcastAnnouncement(
  data: {
    emoji: string;
    title: string;
    body: string;
    scheduledAt?: string | null;
    pinned?: boolean;
  },
): Promise<ServerAnnouncement | null> {
  try {
    const res = await apiFetch("/announcements/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.announcement ?? null;
  } catch (err) {
    console.warn("broadcastAnnouncement failed (non-fatal):", err);
    return null;
  }
}

export async function fetchAnnouncements(): Promise<ServerAnnouncement[]> {
  try {
    const res = await apiFetch("/announcements");
    return res.announcements ?? [];
  } catch {
    return [];
  }
}

export async function patchAnnouncement(
  id: string,
  patch: { sendNow?: boolean; pinned?: boolean; title?: string; body?: string; emoji?: string },
): Promise<void> {
  await apiFetch(`/announcements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteAnnouncementServer(id: string): Promise<void> {
  await apiFetch(`/announcements/${id}`, {
    method: "DELETE",
  });
}
