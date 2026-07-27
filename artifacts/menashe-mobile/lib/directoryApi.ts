const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type GetToken = () => Promise<string | null>;

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

async function authFetch(path: string, getToken: GetToken, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `API ${path} failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DirectoryMember {
  id: string;
  userId?: string;
  name: string;
  city: string;
  country: string;
  role: string;
  bio: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  otherContact?: string;
  birthday?: string;
  aliyahDate?: string;
  status: "pending" | "approved" | "hidden";
  joinedAt: string;
  avatarEmoji?: string;
  profilePhotoUrl?: string | null;
}

export type DirectoryRegistration = Omit<DirectoryMember, "id" | "userId" | "status" | "joinedAt">;

// ── Public ────────────────────────────────────────────────────────────────────

export async function fetchDirectory(): Promise<DirectoryMember[]> {
  try {
    return await apiFetch("/directory");
  } catch {
    return [];
  }
}

// ── Authenticated ─────────────────────────────────────────────────────────────

export async function fetchMyDirectoryEntry(getToken: GetToken): Promise<DirectoryMember | null> {
  return authFetch("/directory/me", getToken);
}

export async function registerDirectoryMember(
  data: DirectoryRegistration,
  getToken: GetToken,
): Promise<DirectoryMember> {
  return authFetch("/directory", getToken, { method: "POST", body: JSON.stringify(data) });
}

export async function updateDirectoryMember(
  data: DirectoryRegistration,
  getToken: GetToken,
): Promise<DirectoryMember> {
  return authFetch("/directory", getToken, { method: "PUT", body: JSON.stringify(data) });
}
