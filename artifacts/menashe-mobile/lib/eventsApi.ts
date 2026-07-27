/**
 * Community Events API — thin fetch wrapper for /api/community/events
 */

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export type CommunityEventType = "shabbat" | "holiday" | "community" | "learning";

export interface CommunityEvent {
  id: string;
  type: CommunityEventType;
  emoji: string;
  title: string;
  titleTK: string;
  description: string;
  descriptionTK: string;
  date: string;        // "YYYY-MM-DD"
  time?: string;       // "HH:MM"
  location?: string;
  virtual?: boolean;
  recurring?: "weekly" | "monthly";
}

export async function fetchCommunityEvents(): Promise<CommunityEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/community/events`);
    if (!res.ok) throw new Error(`events ${res.status}`);
    return (await res.json()) as CommunityEvent[];
  } catch (err) {
    console.warn("[eventsApi] fetch failed:", err);
    return [];
  }
}
