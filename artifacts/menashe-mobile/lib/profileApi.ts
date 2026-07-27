/**
 * Public Profile API — mirrors web's userApi.ts public-profile section.
 * Uses Bearer token auth (same pattern as directoryApi.ts).
 */

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type GetToken = () => Promise<string | null>;

async function authFetch(
  path: string,
  getToken: GetToken,
  options: RequestInit = {},
): Promise<any> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export interface PublicProfile {
  displayName: string;
  congregation: string;
  bio: string;
  role: string;
  city: string;
  country: string;
  avatarEmoji: string;
  profilePhotoUrl?: string | null;
}

export async function fetchPublicProfile(
  getToken: GetToken,
): Promise<PublicProfile | null> {
  try {
    return await authFetch("/user/public-profile", getToken);
  } catch {
    return null;
  }
}

export async function savePublicProfile(
  profile: PublicProfile,
  getToken: GetToken,
): Promise<void> {
  await authFetch("/user/public-profile", getToken, {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}
