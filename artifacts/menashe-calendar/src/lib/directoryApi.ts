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
  if (!res.ok) {
    let message = `API ${path} failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

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

export async function fetchDirectory(): Promise<DirectoryMember[]> {
  return apiFetch("/directory");
}

export async function fetchMyDirectoryEntry(): Promise<DirectoryMember | null> {
  return apiFetch("/directory/me");
}

export async function registerDirectoryMember(data: DirectoryRegistration): Promise<DirectoryMember> {
  return apiFetch("/directory", { method: "POST", body: JSON.stringify(data) });
}

export async function updateDirectoryMember(data: DirectoryRegistration): Promise<DirectoryMember> {
  return apiFetch("/directory", { method: "PUT", body: JSON.stringify(data) });
}

export async function fetchAllDirectoryMembers(): Promise<DirectoryMember[]> {
  return apiFetch("/directory/admin/all");
}

export async function approveDirectoryMember(id: string): Promise<DirectoryMember> {
  return apiFetch(`/directory/${id}/approve`, { method: "PATCH" });
}

export async function hideDirectoryMember(id: string): Promise<DirectoryMember> {
  return apiFetch(`/directory/${id}/hide`, { method: "PATCH" });
}

export async function deleteDirectoryMember(id: string): Promise<void> {
  await apiFetch(`/directory/${id}`, { method: "DELETE" });
}
