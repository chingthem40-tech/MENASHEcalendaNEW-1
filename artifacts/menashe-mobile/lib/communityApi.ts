const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

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
  await apiFetch("/community/yahrzeit", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function dedicateLearning(
  entryId: string,
  learnerName: string,
  studySubject: string
): Promise<void> {
  await apiFetch(`/community/yahrzeit/${entryId}/dedicate`, {
    method: "POST",
    body: JSON.stringify({ learnerName, studySubject }),
  });
}
