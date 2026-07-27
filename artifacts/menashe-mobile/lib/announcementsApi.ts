const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export interface MobileAnnouncement {
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

export async function fetchAnnouncements(): Promise<MobileAnnouncement[]> {
  try {
    const res = await apiFetch("/announcements");
    return res.announcements ?? [];
  } catch {
    return [];
  }
}
